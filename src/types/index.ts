export type UnitType = 'kg' | 'g' | 'un' | 'L' | 'mL' | 'piece';

export const UNIT_LABELS: Record<UnitType, string> = {
  kg: 'Kg',
  g: 'Gramas',
  un: 'Unidades',
  L: 'Litros',
  mL: 'mL',
  piece: 'Peça',
};

export const PRODUCT_CATEGORIES = [
  'Panificação',
  'Laticínios',
  'Derivados de cana',
  'Doces e conservas',
  'Bebidas',
  'Outros',
] as const;

export type ProductCategory = typeof PRODUCT_CATEGORIES[number];

export interface Ingredient {
  id: string;
  name: string;
  unit: UnitType;
  quantity: number;
  costPerUnit: number;
  lowStockThreshold: number;
}

export interface Product {
  id: string;
  name: string;
  unit: UnitType;
  price: number;
  resalePrice?: number;
  quantity: number;
  recipeId?: string;
  category?: ProductCategory;
}

export interface RecipeIngredient {
  ingredientId: string;
  quantity: number;
  unit: UnitType;
}

export interface Recipe {
  id: string;
  productId: string;
  productName: string;
  ingredients: RecipeIngredient[];
  yieldsQuantity: number;
}

export type PaymentMethod = 'cash' | 'pix' | 'card';

export interface Sale {
  id: string;
  eventId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  total: number;
  paymentMethod: PaymentMethod;
  timestamp: string;
  day?: number;
}

export interface EventProduct {
  productId: string;
  quantityTaken: number;
  quantitySold: number;
}

export interface EventCost {
  id: string;
  name: string;
  amount: number;
}

export interface ProductGoal {
  productId: string;
  quantity: number;
}

export interface DayGoals {
  day: number;
  productGoals: ProductGoal[];
}

export interface FairEvent {
  id: string;
  name: string;
  date: string;
  durationDays: number;
  currentDay: number;
  completedDays: number[];
  products: EventProduct[];
  salesGoal?: number;
  productGoals?: ProductGoal[];
  dayGoals?: DayGoals[];
  isActive: boolean;
  isCompleted: boolean;
  sales: Sale[];
  preparationCosts: EventCost[];
}

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  category: string;
  date: string;
  eventId?: string;
  ingredientId?: string;
}

export interface ProductionGoal {
  id: string;
  productId: string;
  recipeId: string;
  targetQuantity: number;
  producedQuantity: number;
  date: string;
}

export interface AppData {
  ingredients: Ingredient[];
  products: Product[];
  recipes: Recipe[];
  events: FairEvent[];
  transactions: Transaction[];
  productionGoals: ProductionGoal[];
}
