import { supabase } from '@/integrations/supabase/client';
import type { AppData, Ingredient, Product, Recipe, FairEvent, Transaction, Sale, PaymentMethod, EventCost, ProductionGoal, RecipeIngredient, PriceType, ShoppingListItem } from "@/types";

// Cast supabase to any to bypass generated types that haven't been updated yet
const db = supabase as any;

// Helper to ensure we don't try to load data before user is set
let isInitialLoading = false;

let currentUserId: string | null = null;

const defaultData: AppData = {
  ingredients: [],
  products: [],
  recipes: [],
  events: [],
  transactions: [],
  productionGoals: [],
  shoppingList: [],
};

type Listener = () => void;
let listeners: Listener[] = [];
let data: AppData = { ...defaultData };

export function setCurrentUser(userId: string | null) {
  if (currentUserId === userId && userId !== null) return;
  
  currentUserId = userId;
  if (userId) {
    loadDataFromSupabase(userId);
  } else {
    data = { ...defaultData };
    notify();
  }
}

export function subscribe(listener: Listener) {
  listeners.push(listener);
  return () => { listeners = listeners.filter(l => l !== listener); };
}

function notify() {
  listeners.forEach(l => l());
}

export function getData(): AppData {
  return data;
}

// ---- LOAD FROM SUPABASE ----

async function loadDataFromSupabase(userId: string) {
  try {
    const [ingRes, prodRes, recRes, riRes, evtRes, salesRes, txRes, pgRes, slRes] = await Promise.all([
      db.from('ingredients').select('*').eq('user_id', userId),
      db.from('products').select('*').eq('user_id', userId),
      db.from('recipes').select('*').eq('user_id', userId),
      db.from('recipe_ingredients').select('*'),
      db.from('events').select('*').eq('user_id', userId),
      db.from('sales').select('*').eq('user_id', userId),
      db.from('transactions').select('*').eq('user_id', userId),
      db.from('production_goals').select('*').eq('user_id', userId),
      db.from('shopping_list').select('*').eq('user_id', userId),
    ]);

    const ingredients: Ingredient[] = (ingRes.data || []).map((r: any) => ({
      id: r.id, name: r.name, unit: r.unit, quantity: Number(r.quantity),
      costPerUnit: Number(r.cost_per_unit), lowStockThreshold: Number(r.low_stock_threshold),
    }));

    const products: Product[] = (prodRes.data || []).map((r: any) => ({
      id: r.id, name: r.name, unit: r.unit, price: Number(r.price),
      resalePrice: r.resale_price != null ? Number(r.resale_price) : undefined,
      quantity: Number(r.quantity), recipeId: r.recipe_id || undefined, category: r.category || undefined,
    }));

    const recipeIngredients = riRes.data || [];
    const recipes: Recipe[] = (recRes.data || []).map((r: any) => ({
      id: r.id, productId: r.product_id, productName: r.product_name,
      yieldsQuantity: Number(r.yields_quantity),
      ingredients: recipeIngredients
        .filter((ri: any) => ri.recipe_id === r.id)
        .map((ri: any) => ({ ingredientId: ri.ingredient_id, quantity: Number(ri.quantity), unit: ri.unit })),
    }));

    const salesData = salesRes.data || [];
    const events: FairEvent[] = (evtRes.data || []).map((r: any) => ({
      id: r.id, name: r.name, date: r.date,
      durationDays: r.duration_days, currentDay: r.current_day,
      completedDays: r.completed_days || [],
      products: r.products || [], productGoals: r.product_goals || [],
      dayGoals: r.day_goals || [], salesGoal: r.sales_goal != null ? Number(r.sales_goal) : undefined,
      priceType: (r.price_type as PriceType) || 'local',
      isActive: r.is_active, isCompleted: r.is_completed,
      preparationCosts: r.preparation_costs || [],
      sales: salesData.filter((s: any) => s.event_id === r.id).map((s: any) => ({
        id: s.id, eventId: s.event_id, productId: s.product_id,
        quantity: Number(s.quantity), unitPrice: Number(s.unit_price),
        total: Number(s.total), paymentMethod: s.payment_method,
        timestamp: s.sold_at, day: s.day,
      })),
    }));

    const transactions: Transaction[] = (txRes.data || []).map((r: any) => ({
      id: r.id, type: r.type, amount: Number(r.amount),
      description: r.description, category: r.category, date: r.date,
      eventId: r.event_id || undefined, ingredientId: r.ingredient_id || undefined,
      products: r.products || undefined,
    }));

    const productionGoals: ProductionGoal[] = (pgRes.data || []).map((r: any) => ({
      id: r.id, productId: r.product_id, recipeId: r.recipe_id,
      targetQuantity: Number(r.target_quantity), producedQuantity: Number(r.produced_quantity), date: r.date,
    }));

    const shoppingList: ShoppingListItem[] = (slRes.data || []).map((r: any) => ({
      id: r.id, 
      recipeId: r.recipe_id || undefined, 
      productName: r.product_name || undefined, 
      quantity: Number(r.quantity),
      manualItemName: r.manual_item_name || undefined,
      manualUnit: r.manual_unit || undefined,
    }));

    data = { ingredients, products, recipes, events, transactions, productionGoals, shoppingList };

    // Migrate localStorage data if exists
    await migrateLocalStorage(userId);

    notify();
  } catch (err) {
    console.error('Error loading data from Supabase:', err);
  }
}

async function migrateLocalStorage(userId: string) {
  const key = `feira-facil-data-${userId}`;
  const raw = localStorage.getItem(key);
  if (!raw) return;

  try {
    const old = JSON.parse(raw);
    if (!old) return;

    // Only migrate if Supabase is empty and localStorage has data
    const hasLocalData = (old.ingredients?.length || 0) + (old.products?.length || 0) + (old.recipes?.length || 0) + (old.events?.length || 0) + (old.transactions?.length || 0) > 0;
    const hasCloudData = data.ingredients.length + data.products.length + data.recipes.length + data.events.length + data.transactions.length > 0;

    if (!hasLocalData || hasCloudData) {
      localStorage.removeItem(key);
      return;
    }

    // Migrate ingredients
    const ingMap = new Map<string, string>();
    for (const ing of old.ingredients || []) {
      const { data: inserted } = await db.from('ingredients').insert({
        user_id: userId, name: ing.name, unit: ing.unit, quantity: ing.quantity,
        cost_per_unit: ing.costPerUnit, low_stock_threshold: ing.lowStockThreshold,
      }).select('id').single();
      if (inserted) ingMap.set(ing.id, inserted.id);
    }

    // Migrate products
    const prodMap = new Map<string, string>();
    for (const prod of old.products || []) {
      const { data: inserted } = await db.from('products').insert({
        user_id: userId, name: prod.name, unit: prod.unit, price: prod.price,
        resale_price: prod.resalePrice, quantity: prod.quantity, category: prod.category,
      }).select('id').single();
      if (inserted) prodMap.set(prod.id, inserted.id);
    }

    // Migrate recipes
    const recMap = new Map<string, string>();
    for (const rec of old.recipes || []) {
      const newProductId = prodMap.get(rec.productId);
      if (!newProductId) continue;
      const { data: inserted } = await db.from('recipes').insert({
        user_id: userId, product_id: newProductId, product_name: rec.productName,
        yields_quantity: rec.yieldsQuantity,
      }).select('id').single();
      if (inserted) {
        recMap.set(rec.id, inserted.id);
        for (const ri of rec.ingredients || []) {
          const newIngId = ingMap.get(ri.ingredientId);
          if (newIngId) {
            await db.from('recipe_ingredients').insert({
              recipe_id: inserted.id, ingredient_id: newIngId, quantity: ri.quantity, unit: ri.unit,
            });
          }
        }
        // Update product recipe_id
        await db.from('products').update({ recipe_id: inserted.id }).eq('id', newProductId);
      }
    }

    // Migrate events & sales
    const evtMap = new Map<string, string>();
    for (const evt of old.events || []) {
      const mappedProducts = (evt.products || []).map((ep: any) => ({
        ...ep, productId: prodMap.get(ep.productId) || ep.productId,
      }));
      const { data: inserted } = await db.from('events').insert({
        user_id: userId, name: evt.name, date: evt.date, duration_days: evt.durationDays || 1,
        current_day: evt.currentDay || 0, completed_days: evt.completedDays || [],
        is_active: evt.isActive, is_completed: evt.isCompleted,
        sales_goal: evt.salesGoal, products: mappedProducts,
        product_goals: evt.productGoals || [], day_goals: evt.dayGoals || [],
        preparation_costs: evt.preparationCosts || [],
        price_type: evt.priceType || 'local',
      }).select('id').single();
      if (inserted) {
        evtMap.set(evt.id, inserted.id);
        for (const sale of evt.sales || []) {
          await db.from('sales').insert({
            user_id: userId, event_id: inserted.id,
            product_id: prodMap.get(sale.productId) || sale.productId,
            quantity: sale.quantity, unit_price: sale.unitPrice,
            total: sale.total, payment_method: sale.paymentMethod,
            sold_at: sale.timestamp, day: sale.day || 1,
          });
        }
      }
    }

    // Migrate transactions
    for (const tx of old.transactions || []) {
      await db.from('transactions').insert({
        user_id: userId, type: tx.type, amount: tx.amount,
        description: tx.description, category: tx.category, date: tx.date,
        event_id: evtMap.get(tx.eventId!) || null,
        ingredient_id: ingMap.get(tx.ingredientId!) || null,
      });
    }

    // Migrate production goals
    for (const pg of old.productionGoals || []) {
      await db.from('production_goals').insert({
        user_id: userId, product_id: prodMap.get(pg.productId) || pg.productId,
        recipe_id: recMap.get(pg.recipeId) || pg.recipeId,
        target_quantity: pg.targetQuantity, produced_quantity: pg.producedQuantity, date: pg.date,
      });
    }

    localStorage.removeItem(key);
    // Reload after migration
    await loadDataFromSupabase(userId);
  } catch (err) {
    console.error('Error migrating localStorage:', err);
  }
}

// ---- INGREDIENTS ----

export async function addIngredient(ing: Omit<Ingredient, 'id'>): Promise<Ingredient> {
  const { data: inserted, error } = await db.from('ingredients').insert({
    user_id: currentUserId!, name: ing.name, unit: ing.unit, quantity: ing.quantity,
    cost_per_unit: ing.costPerUnit, low_stock_threshold: ing.lowStockThreshold,
  }).select().single();

  if (error) throw error;
  const item: Ingredient = {
    id: inserted.id, name: inserted.name, unit: inserted.unit as any,
    quantity: Number(inserted.quantity), costPerUnit: Number(inserted.cost_per_unit),
    lowStockThreshold: Number(inserted.low_stock_threshold),
  };
  data = { ...data, ingredients: [...data.ingredients, item] };
  notify();
  return item;
}

export async function updateIngredient(id: string, updates: Partial<Ingredient>) {
  const dbUpdates: any = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.unit !== undefined) dbUpdates.unit = updates.unit;
  if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
  if (updates.costPerUnit !== undefined) dbUpdates.cost_per_unit = updates.costPerUnit;
  if (updates.lowStockThreshold !== undefined) dbUpdates.low_stock_threshold = updates.lowStockThreshold;

  await db.from('ingredients').update(dbUpdates).eq('id', id);
  data = { ...data, ingredients: data.ingredients.map(i => i.id === id ? { ...i, ...updates } : i) };
  notify();
}

export async function deleteIngredient(id: string) {
  await db.from('ingredients').delete().eq('id', id);
  data = { ...data, ingredients: data.ingredients.filter(i => i.id !== id) };
  notify();
}

// ---- PRODUCTS ----

export async function addProduct(prod: Omit<Product, 'id'>): Promise<Product> {
  const { data: inserted, error } = await db.from('products').insert({
    user_id: currentUserId!, name: prod.name, unit: prod.unit, price: prod.price,
    resale_price: prod.resalePrice, quantity: prod.quantity, recipe_id: prod.recipeId, category: prod.category,
  }).select().single();

  if (error) throw error;
  const item: Product = {
    id: inserted.id, name: inserted.name, unit: inserted.unit as any,
    price: Number(inserted.price), resalePrice: inserted.resale_price != null ? Number(inserted.resale_price) : undefined,
    quantity: Number(inserted.quantity), recipeId: inserted.recipe_id || undefined, category: inserted.category as any,
  };
  data = { ...data, products: [...data.products, item] };
  notify();
  return item;
}

export async function updateProduct(id: string, updates: Partial<Product>) {
  const dbUpdates: any = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.unit !== undefined) dbUpdates.unit = updates.unit;
  if (updates.price !== undefined) dbUpdates.price = updates.price;
  if (updates.resalePrice !== undefined) dbUpdates.resale_price = updates.resalePrice;
  if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
  if (updates.recipeId !== undefined) dbUpdates.recipe_id = updates.recipeId;
  if (updates.category !== undefined) dbUpdates.category = updates.category;

  await db.from('products').update(dbUpdates).eq('id', id);
  data = { ...data, products: data.products.map(p => p.id === id ? { ...p, ...updates } : p) };
  notify();
}

export async function deleteProduct(id: string) {
  await db.from('products').delete().eq('id', id);
  data = { ...data, products: data.products.filter(p => p.id !== id) };
  notify();
}

// ---- RECIPES ----

export async function addRecipe(recipe: Omit<Recipe, 'id'>): Promise<Recipe> {
  const { data: inserted, error } = await db.from('recipes').insert({
    user_id: currentUserId!, product_id: recipe.productId, product_name: recipe.productName,
    yields_quantity: recipe.yieldsQuantity,
  }).select().single();

  if (error) throw error;

  // Insert recipe ingredients
  for (const ri of recipe.ingredients) {
    await db.from('recipe_ingredients').insert({
      recipe_id: inserted.id, ingredient_id: ri.ingredientId, quantity: ri.quantity, unit: ri.unit,
    });
  }

  const item: Recipe = {
    id: inserted.id, productId: recipe.productId, productName: recipe.productName,
    yieldsQuantity: recipe.yieldsQuantity, ingredients: recipe.ingredients,
  };
  data = { ...data, recipes: [...data.recipes, item] };
  notify();
  return item;
}

export async function updateRecipe(id: string, updates: Partial<Recipe>) {
  const dbUpdates: any = {};
  if (updates.productName !== undefined) dbUpdates.product_name = updates.productName;
  if (updates.yieldsQuantity !== undefined) dbUpdates.yields_quantity = updates.yieldsQuantity;
  if (updates.productId !== undefined) dbUpdates.product_id = updates.productId;

  if (Object.keys(dbUpdates).length > 0) {
    await db.from('recipes').update(dbUpdates).eq('id', id);
  }

  if (updates.ingredients) {
    await db.from('recipe_ingredients').delete().eq('recipe_id', id);
    for (const ri of updates.ingredients) {
      await db.from('recipe_ingredients').insert({
        recipe_id: id, ingredient_id: ri.ingredientId, quantity: ri.quantity, unit: ri.unit,
      });
    }
  }

  data = { ...data, recipes: data.recipes.map(r => r.id === id ? { ...r, ...updates } : r) };
  notify();
}

export async function deleteRecipe(id: string) {
  await db.from('recipe_ingredients').delete().eq('recipe_id', id);
  await db.from('recipes').delete().eq('id', id);
  data = { ...data, recipes: data.recipes.filter(r => r.id !== id) };
  notify();
}

// ---- EVENTS ----

export async function addEvent(event: Omit<FairEvent, 'id' | 'sales' | 'isActive' | 'isCompleted'>): Promise<FairEvent> {
  const { data: inserted, error } = await db.from('events').insert({
    user_id: currentUserId!, name: event.name, date: event.date,
    duration_days: event.durationDays || 1, current_day: 0, completed_days: [],
    is_active: false, is_completed: false, sales_goal: event.salesGoal,
    products: event.products || [], product_goals: event.productGoals || [],
    day_goals: event.dayGoals || [], preparation_costs: event.preparationCosts || [],
    price_type: event.priceType || 'local',
  }).select().single();

  if (error) throw error;
  const item: FairEvent = {
    id: inserted.id, name: inserted.name, date: inserted.date,
    durationDays: inserted.duration_days, currentDay: 0, completedDays: [],
    products: inserted.products as any || [], productGoals: inserted.product_goals as any || [],
    dayGoals: inserted.day_goals as any || [], salesGoal: inserted.sales_goal != null ? Number(inserted.sales_goal) : undefined,
    priceType: (inserted.price_type as PriceType) || 'local',
    isActive: false, isCompleted: false, sales: [],
    preparationCosts: inserted.preparation_costs as any || [],
  };
  data = { ...data, events: [...data.events, item] };
  notify();
  return item;
}

export async function addEventPreparationCosts(eventId: string, costs: EventCost[]) {
  await db.from('events').update({ preparation_costs: costs as any }).eq('id', eventId);

  data = {
    ...data,
    events: data.events.map(e => e.id === eventId ? { ...e, preparationCosts: costs } : e),
  };

  const event = data.events.find(e => e.id === eventId);
  for (const cost of costs) {
    if (cost.amount > 0) {
      const { data: inserted } = await db.from('transactions').insert({
        user_id: currentUserId!,
        type: 'expense', amount: cost.amount,
        description: `Preparação (${event?.name || 'Evento'}): ${cost.name}`,
        category: 'Preparação de Evento', date: new Date().toISOString(), event_id: eventId,
      }).select().single();
      if (inserted) {
        const tx: Transaction = {
          id: inserted.id, type: 'expense', amount: cost.amount,
          description: inserted.description, category: inserted.category,
          date: inserted.date, eventId,
        };
        data = { ...data, transactions: [...data.transactions, tx] };
      }
    }
  }
  notify();
}

export async function startEvent(id: string) {
  await db.from('events').update({ is_active: true, current_day: 1 }).eq('id', id);
  data = { ...data, events: data.events.map(e => e.id === id ? { ...e, isActive: true, currentDay: 1 } : e) };
  notify();
}

export async function registerSale(eventId: string, productId: string, paymentMethod: PaymentMethod, quantity: number = 1, customUnitPrice?: number): Promise<Sale | undefined> {
  const event = data.events.find(e => e.id === eventId);
  const product = data.products.find(p => p.id === productId);
  if (!product || !event) return undefined;

  const unitPrice = customUnitPrice ?? product.price;
  const total = unitPrice * quantity;

  const { data: inserted, error } = await db.from('sales').insert({
    user_id: currentUserId!, event_id: eventId, product_id: productId,
    quantity, unit_price: unitPrice, total, payment_method: paymentMethod,
    sold_at: new Date().toISOString(), day: event.currentDay || 1,
  }).select().single();

  if (error) throw error;

  const sale: Sale = {
    id: inserted.id, eventId, productId, quantity,
    unitPrice: unitPrice, total, paymentMethod,
    timestamp: inserted.sold_at, day: inserted.day,
  };

  // Update event products
  const updatedProducts = (event.products || []).map((ep: any) =>
    ep.productId === productId ? { ...ep, quantitySold: (ep.quantitySold || 0) + quantity } : ep
  );
  await db.from('events').update({ products: updatedProducts as any }).eq('id', eventId);

  // Update product quantity
  const newQty = Math.max(0, product.quantity - quantity);
  await db.from('products').update({ quantity: newQty }).eq('id', productId);

  // Add transaction
  const { data: txInserted } = await db.from('transactions').insert({
    user_id: currentUserId!, type: 'income', amount: total,
    description: `Venda: ${product.name} (${quantity} ${product.unit || 'un'})`,
    category: 'Vendas', date: new Date().toISOString(), event_id: eventId,
  }).select().single();

  data = {
    ...data,
    events: data.events.map(e => {
      if (e.id !== eventId) return e;
      return { ...e, sales: [...e.sales, sale], products: updatedProducts };
    }),
    products: data.products.map(p => p.id === productId ? { ...p, quantity: newQty } : p),
  };

  if (txInserted) {
    const tx: Transaction = {
      id: txInserted.id, type: 'income', amount: total,
      description: txInserted.description, category: txInserted.category,
      date: txInserted.date, eventId,
    };
    data = { ...data, transactions: [...data.transactions, tx] };
  }

  notify();
  return sale;
}

export async function undoSale(eventId: string, saleId: string) {
  const event = data.events.find(e => e.id === eventId);
  if (!event) return;
  const sale = event.sales.find(s => s.id === saleId);
  if (!sale) return;

  await db.from('sales').delete().eq('id', saleId);

  const updatedProducts = (event.products || []).map((ep: any) =>
    ep.productId === sale.productId ? { ...ep, quantitySold: Math.max(0, (ep.quantitySold || 0) - sale.quantity) } : ep
  );
  await db.from('events').update({ products: updatedProducts as any }).eq('id', eventId);

  const product = data.products.find(p => p.id === sale.productId);
  if (product) {
    const newQty = product.quantity + sale.quantity;
    await db.from('products').update({ quantity: newQty }).eq('id', sale.productId);
    data = {
      ...data,
      products: data.products.map(p =>
        p.id === sale.productId ? { ...p, quantity: newQty } : p
      ),
    };
  }

  // Remove related transaction
  const relatedTx = data.transactions.find(t =>
    t.eventId === eventId && t.type === 'income' && t.amount === sale.total &&
    t.description.includes(product?.name || '')
  );
  if (relatedTx) {
    await db.from('transactions').delete().eq('id', relatedTx.id);
  }

  data = {
    ...data,
    events: data.events.map(e => {
      if (e.id !== eventId) return e;
      return {
        ...e, sales: e.sales.filter(s => s.id !== saleId), products: updatedProducts,
      };
    }),
    transactions: relatedTx ? data.transactions.filter(t => t.id !== relatedTx.id) : data.transactions,
  };
  notify();
}

export async function endDay(eventId: string) {
  const event = data.events.find(e => e.id === eventId);
  if (!event) return;

  const newCompletedDays = [...event.completedDays, event.currentDay];
  const allDaysDone = newCompletedDays.length >= event.durationDays;

  const updates = allDaysDone
    ? { completed_days: newCompletedDays, current_day: 0, is_active: false, is_completed: true }
    : { completed_days: newCompletedDays, current_day: event.currentDay + 1 };

  await db.from('events').update(updates).eq('id', eventId);

  data = {
    ...data,
    events: data.events.map(e => {
      if (e.id !== eventId) return e;
      if (allDaysDone) {
        return { ...e, completedDays: newCompletedDays, currentDay: 0, isActive: false, isCompleted: true };
      }
      return { ...e, completedDays: newCompletedDays, currentDay: e.currentDay + 1 };
    }),
  };
  notify();
}

export async function endEvent(id: string) {
  await db.from('events').update({ is_active: false, is_completed: true, current_day: 0 }).eq('id', id);
  data = { ...data, events: data.events.map(e => e.id === id ? { ...e, isActive: false, isCompleted: true, currentDay: 0 } : e) };
  notify();
}

export async function deleteEvent(id: string) {
  await db.from('sales').delete().eq('event_id', id);
  await db.from('events').delete().eq('id', id);
  data = { ...data, events: data.events.filter(e => e.id !== id) };
  notify();
}

export async function updateEvent(id: string, updates: Partial<FairEvent>) {
  const dbUpdates: any = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.date !== undefined) dbUpdates.date = updates.date;
  if (updates.durationDays !== undefined) dbUpdates.duration_days = updates.durationDays;
  if (updates.currentDay !== undefined) dbUpdates.current_day = updates.currentDay;
  if (updates.completedDays !== undefined) dbUpdates.completed_days = updates.completedDays;
  if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
  if (updates.isCompleted !== undefined) dbUpdates.is_completed = updates.isCompleted;
  if (updates.salesGoal !== undefined) dbUpdates.sales_goal = updates.salesGoal;
  if (updates.products !== undefined) dbUpdates.products = updates.products;
  if (updates.productGoals !== undefined) dbUpdates.product_goals = updates.productGoals;
  if (updates.dayGoals !== undefined) dbUpdates.day_goals = updates.dayGoals;
  if (updates.preparationCosts !== undefined) dbUpdates.preparation_costs = updates.preparationCosts;
  if (updates.priceType !== undefined) dbUpdates.price_type = updates.priceType;

  if (Object.keys(dbUpdates).length > 0) {
    await db.from('events').update(dbUpdates).eq('id', id);
  }
  data = { ...data, events: data.events.map(e => e.id === id ? { ...e, ...updates } : e) };
  notify();
}

export async function updateTransaction(id: string, updates: Partial<Transaction>) {
  const dbUpdates: any = {};
  if (updates.type !== undefined) dbUpdates.type = updates.type;
  if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.category !== undefined) dbUpdates.category = updates.category;
  if (updates.date !== undefined) dbUpdates.date = updates.date;

  await db.from('transactions').update(dbUpdates).eq('id', id);
  data = { ...data, transactions: data.transactions.map(t => t.id === id ? { ...t, ...updates } : t) };
  notify();
}

// ---- TRANSACTIONS ----

export async function addTransaction(tx: Omit<Transaction, 'id'>): Promise<Transaction> {
  const { data: inserted, error } = await db.from('transactions').insert({
    user_id: currentUserId!, type: tx.type, amount: tx.amount,
    description: tx.description, category: tx.category, date: tx.date,
    event_id: tx.eventId || null, ingredient_id: tx.ingredientId || null,
    products: tx.products || null,
  }).select().single();

  if (error) throw error;

  // Descontar estoque se houver produtos vinculados
  if (tx.products && tx.products.length > 0) {
    for (const pInfo of tx.products) {
      const product = data.products.find(p => p.id === pInfo.productId);
      if (product) {
        const newQty = Math.max(0, product.quantity - pInfo.quantity);
        await db.from('products').update({ quantity: newQty }).eq('id', product.id);
        data = {
          ...data,
          products: data.products.map(p => p.id === product.id ? { ...p, quantity: newQty } : p)
        };
      }
    }
  }

  const item: Transaction = {
    id: inserted.id, type: inserted.type as any, amount: Number(inserted.amount),
    description: inserted.description, category: inserted.category, date: inserted.date,
    eventId: inserted.event_id || undefined, ingredientId: inserted.ingredient_id || undefined,
    products: inserted.products || undefined,
  };
  data = { ...data, transactions: [...data.transactions, item] };
  notify();
  return item;
}

export async function deleteTransaction(id: string) {
  const tx = data.transactions.find(t => t.id === id);
  if (!tx) return;

  // Se for uma transação de venda vinculada a um evento, tentamos estornar o estoque
  if (tx.type === 'income' && tx.category === 'Vendas' && tx.eventId) {
    const event = data.events.find(e => e.id === tx.eventId);
    if (event) {
      const sale = event.sales.find(s => s.total === tx.amount && tx.description.includes(data.products.find(p => p.id === s.productId)?.name || ''));
      if (sale) {
        await undoSale(event.id, sale.id);
        return;
      }
    }
  }

  // Devolver estoque se houver produtos vinculados na transação financeira direta
  if (tx.products && tx.products.length > 0) {
    for (const pInfo of tx.products) {
      const product = data.products.find(p => p.id === pInfo.productId);
      if (product) {
        const newQty = product.quantity + pInfo.quantity;
        await db.from('products').update({ quantity: newQty }).eq('id', product.id);
        data = {
          ...data,
          products: data.products.map(p => p.id === product.id ? { ...p, quantity: newQty } : p)
        };
      }
    }
  }

  await db.from('transactions').delete().eq('id', id);
  data = { ...data, transactions: data.transactions.filter(t => t.id !== id) };
  notify();
}

// ---- PURCHASE ----

export async function purchaseIngredient(ingredientId: string, quantity: number, totalCost: number) {
  const ing = data.ingredients.find(i => i.id === ingredientId);
  if (!ing) return;

  const costPerUnit = quantity > 0 ? totalCost / quantity : 0;
  const newQty = ing.quantity + quantity;

  await db.from('ingredients').update({ quantity: newQty, cost_per_unit: costPerUnit }).eq('id', ingredientId);

  const { data: txInserted } = await db.from('transactions').insert({
    user_id: currentUserId!, type: 'expense', amount: totalCost,
    description: `Compra: ${ing.name} (${quantity} ${ing.unit})`,
    category: 'Ingredientes', date: new Date().toISOString(), ingredient_id: ingredientId,
  }).select().single();

  data = {
    ...data,
    ingredients: data.ingredients.map(i =>
      i.id === ingredientId ? { ...i, quantity: newQty, costPerUnit } : i
    ),
  };

  if (txInserted) {
    const tx: Transaction = {
      id: txInserted.id, type: 'expense', amount: totalCost,
      description: txInserted.description, category: txInserted.category,
      date: txInserted.date, ingredientId,
    };
    data = { ...data, transactions: [...data.transactions, tx] };
  }

  notify();
}

// ---- UNIT CONVERSION ----

function convertUnit(qty: number, from: string, to: string): number {
  if (from === to) return qty;
  const conversions: Record<string, Record<string, number>> = {
    kg: { g: 1000 }, g: { kg: 0.001 },
    L: { mL: 1000 }, mL: { L: 0.001 },
  };
  return qty * (conversions[from]?.[to] ?? 1);
}

export function getRecipeCost(recipeId: string): number {
  const recipe = data.recipes.find(r => r.id === recipeId);
  if (!recipe) return 0;
  return recipe.ingredients.reduce((total, ri) => {
    const ing = data.ingredients.find(i => i.id === ri.ingredientId);
    if (!ing) return total;
    const qtyInStockUnit = convertUnit(ri.quantity, ri.unit || ing.unit, ing.unit);
    return total + qtyInStockUnit * ing.costPerUnit;
  }, 0);
}

export function checkStockForProduction(recipeId: string, units: number) {
  const recipe = data.recipes.find(r => r.id === recipeId);
  if (!recipe) return { enough: false, missing: [] as any[] };

  const missing: { ingredientId: string; name: string; needed: number; available: number; unit: string }[] = [];
  recipe.ingredients.forEach(ri => {
    const ing = data.ingredients.find(i => i.id === ri.ingredientId);
    if (!ing) return;
    const qtyPerBatch = convertUnit(ri.quantity, ri.unit || ing.unit, ing.unit);
    const needed = (qtyPerBatch / recipe.yieldsQuantity) * units;
    if (ing.quantity < needed) {
      missing.push({ ingredientId: ing.id, name: ing.name, needed, available: ing.quantity, unit: ing.unit });
    }
  });
  return { enough: missing.length === 0, missing };
}

export async function produce(recipeId: string, units: number) {
  const recipe = data.recipes.find(r => r.id === recipeId);
  if (!recipe) return;

  for (const ri of recipe.ingredients) {
    const ing = data.ingredients.find(i => i.id === ri.ingredientId);
    const qtyPerBatch = convertUnit(ri.quantity, ri.unit || (ing?.unit ?? ri.unit), ing?.unit ?? ri.unit);
    const needed = (qtyPerBatch / recipe.yieldsQuantity) * units;
    const newQty = Math.max(0, (ing?.quantity || 0) - needed);
    await db.from('ingredients').update({ quantity: newQty }).eq('id', ri.ingredientId);
    data = {
      ...data,
      ingredients: data.ingredients.map(i =>
        i.id === ri.ingredientId ? { ...i, quantity: newQty } : i
      ),
    };
  }

  const product = data.products.find(p => p.id === recipe.productId);
  if (product) {
    const newQty = product.quantity + units;
    await db.from('products').update({ quantity: newQty }).eq('id', recipe.productId);
    data = {
      ...data,
      products: data.products.map(p =>
        p.id === recipe.productId ? { ...p, quantity: newQty } : p
      ),
    };
  }

  // Update production goals for today
  const today = new Date().toISOString().split('T')[0];
  const goal = data.productionGoals.find(g => g.recipeId === recipeId && g.date === today);
  if (goal) {
    const newProduced = goal.producedQuantity + units;
    await db.from('production_goals').update({ produced_quantity: newProduced }).eq('id', goal.id);
    data = {
      ...data,
      productionGoals: data.productionGoals.map(g =>
        g.id === goal.id ? { ...g, producedQuantity: newProduced } : g
      ),
    };
  }

  notify();
}

// ---- PRODUCTION GOALS ----

export async function addProductionGoal(goal: Omit<ProductionGoal, 'id'>): Promise<ProductionGoal> {
  const { data: inserted, error } = await db.from('production_goals').insert({
    user_id: currentUserId!, product_id: goal.productId, recipe_id: goal.recipeId,
    target_quantity: goal.targetQuantity, produced_quantity: goal.producedQuantity, date: goal.date,
  }).select().single();

  if (error) throw error;
  const item: ProductionGoal = {
    id: inserted.id, productId: inserted.product_id, recipeId: inserted.recipe_id,
    targetQuantity: Number(inserted.target_quantity), producedQuantity: Number(inserted.produced_quantity),
    date: inserted.date,
  };
  data = { ...data, productionGoals: [...data.productionGoals, item] };
  notify();
  return item;
}

export async function updateProductionGoal(id: string, updates: Partial<ProductionGoal>) {
  const dbUpdates: any = {};
  if (updates.targetQuantity !== undefined) dbUpdates.target_quantity = updates.targetQuantity;
  if (updates.producedQuantity !== undefined) dbUpdates.produced_quantity = updates.producedQuantity;
  if (updates.date !== undefined) dbUpdates.date = updates.date;

  await db.from('production_goals').update(dbUpdates).eq('id', id);
  data = { ...data, productionGoals: data.productionGoals.map(g => g.id === id ? { ...g, ...updates } : g) };
  notify();
}

export async function deleteProductionGoal(id: string) {
  await db.from('production_goals').delete().eq('id', id);
  data = { ...data, productionGoals: data.productionGoals.filter(g => g.id !== id) };
  notify();
}

// ---- HELPERS ----

export function getLowStockIngredients(): Ingredient[] {
  return data.ingredients.filter(i => i.quantity <= i.lowStockThreshold);
}

export function getActiveEvent(): FairEvent | undefined {
  return data.events.find(e => e.isActive);
}

export function getTodaySales(): number {
  const today = new Date().toDateString();
  return data.transactions
    .filter(t => t.type === 'income' && new Date(t.date).toDateString() === today)
    .reduce((sum, t) => sum + t.amount, 0);
}

export function getTotalRevenue(): number {
  return data.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
}

export function getTotalExpenses(): number {
  return data.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
}

export function getEventProfit(eventId: string): number {
  const event = data.events.find(e => e.id === eventId);
  if (!event) return 0;
  const revenue = event.sales.reduce((s, sale) => s + sale.total, 0);
  const prepCosts = (event.preparationCosts || []).reduce((s, c) => s + c.amount, 0);
  return revenue - prepCosts;
}

export function getIngredientPriceHistory(ingredientId: string): { date: string; costPerUnit: number; totalCost: number; quantity: number }[] {
  return data.transactions
    .filter(t => t.ingredientId === ingredientId && t.type === 'expense')
    .map(t => {
      const match = t.description.match(/\((\d+(?:\.\d+)?)\s/);
      const qty = match ? parseFloat(match[1]) : 1;
      return {
        date: t.date,
        costPerUnit: qty > 0 ? t.amount / qty : t.amount,
        totalCost: t.amount,
        quantity: qty,
      };
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

// ---- SHOPPING LIST ----

export async function addToShoppingList(recipeId: string, quantity: number) {
  const recipe = data.recipes.find(r => r.id === recipeId);
  if (!recipe) return;

  const { data: inserted, error } = await db.from('shopping_list').insert({
    user_id: currentUserId!,
    recipe_id: recipeId,
    product_name: recipe.productName,
    quantity: quantity
  }).select().single();

  if (error) throw error;

  const item: ShoppingListItem = {
    id: inserted.id,
    recipeId: inserted.recipe_id,
    productName: inserted.product_name,
    quantity: Number(inserted.quantity)
  };

  data = {
    ...data,
    shoppingList: [...(data.shoppingList || []), item]
  };
  notify();
}

export async function addManualToShoppingList(itemName: string, quantity: number, unit: string) {
  const { data: inserted, error } = await db.from('shopping_list').insert({
    user_id: currentUserId!,
    manual_item_name: itemName,
    manual_unit: unit,
    quantity: quantity
  }).select().single();

  if (error) throw error;

  const item: ShoppingListItem = {
    id: inserted.id,
    manualItemName: inserted.manual_item_name,
    manualUnit: inserted.manual_unit,
    quantity: Number(inserted.quantity)
  };

  data = {
    ...data,
    shoppingList: [...(data.shoppingList || []), item]
  };
  notify();
}

export async function removeFromShoppingList(id: string) {
  await db.from('shopping_list').delete().eq('id', id);
  data = {
    ...data,
    shoppingList: (data.shoppingList || []).filter(item => item.id !== id)
  };
  notify();
}

export async function clearShoppingList() {
  if (!currentUserId) return;
  await db.from('shopping_list').delete().eq('user_id', currentUserId);
  data = { ...data, shoppingList: [] };
  notify();
}
