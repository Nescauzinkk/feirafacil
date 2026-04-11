import { useState, useMemo } from "react";
import { useStore } from "@/hooks/useStore";
import { addRecipe, updateRecipe, deleteRecipe, checkStockForProduction, produce, getRecipeCost, addProductionGoal, deleteProductionGoal } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, ChefHat, CheckCircle, XCircle, Trash2, Pencil, ArrowRight, Target, PartyPopper } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { RecipeIngredient, UnitType, Recipe } from "@/types";
import { UNIT_LABELS } from "@/types";

const compatibleUnits: Record<string, UnitType[]> = {
  kg: ['kg', 'g'], g: ['g', 'kg'], L: ['L', 'mL'], mL: ['mL', 'L'], un: ['un'],
};

function convertForDisplay(qty: number, from: string, to: string): number {
  if (from === to) return qty;
  const conversions: Record<string, Record<string, number>> = {
    kg: { g: 1000 }, g: { kg: 0.001 },
    L: { mL: 1000 }, mL: { L: 0.001 },
  };
  return qty * (conversions[from]?.[to] ?? 1);
}

function RecipeForm({ onClose, editRecipe }: { onClose: () => void; editRecipe?: Recipe }) {
  const data = useStore();
  const [productId, setProductId] = useState(editRecipe?.productId || "");
  const [yieldsQty, setYieldsQty] = useState(editRecipe?.yieldsQuantity.toString() || "1");
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>(editRecipe?.ingredients || []);
  const [selIngId, setSelIngId] = useState("");
  const [selQty, setSelQty] = useState("");
  const [selUnit, setSelUnit] = useState<UnitType | "">("");

  const selectedIng = data.ingredients.find(i => i.id === selIngId);
  const unitOptions = selectedIng ? compatibleUnits[selectedIng.unit] || [selectedIng.unit] : [];

  const addIng = () => {
    if (!selIngId || !selQty || !selUnit) return;
    setIngredients([...ingredients, { ingredientId: selIngId, quantity: Number(selQty), unit: selUnit as UnitType }]);
    setSelIngId(""); setSelQty(""); setSelUnit("");
  };

  const handleSubmit = () => {
    if (!productId || ingredients.length === 0) return;
    const product = data.products.find(p => p.id === productId);
    if (!product) return;
    if (editRecipe) {
      updateRecipe(editRecipe.id, { productId, productName: product.name, ingredients, yieldsQuantity: Number(yieldsQty) || 1 });
    } else {
      addRecipe({ productId, productName: product.name, ingredients, yieldsQuantity: Number(yieldsQty) || 1 });
    }
    onClose();
  };

  return (
    <div className="space-y-4">
      <div><Label>Produto</Label>
        <Select value={productId} onValueChange={setProductId}>
          <SelectTrigger><SelectValue placeholder="Selecione o produto" /></SelectTrigger>
          <SelectContent className="bg-white text-black shadow-lg border rounded-md">
            {data.products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div><Label>Rende quantas unidades</Label><Input type="number" value={yieldsQty} onChange={e => setYieldsQty(e.target.value)} /></div>

      <div className="border rounded-lg p-3 space-y-3">
        <Label>Ingredientes da receita</Label>
        {ingredients.map((ri, idx) => {
          const ing = data.ingredients.find(i => i.id === ri.ingredientId);
          return (
            <div key={idx} className="flex items-center gap-2 text-sm">
              <span className="flex-1">{ing?.name}</span>
              <span>{ri.quantity} {ri.unit}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIngredients(ingredients.filter((_, i) => i !== idx))}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          );
        })}
        <div className="flex gap-2 flex-wrap">
          <Select value={selIngId} onValueChange={(v) => { setSelIngId(v); const ing = data.ingredients.find(i => i.id === v); if (ing) setSelUnit(ing.unit); }}>
            <SelectTrigger className="flex-1 min-w-[120px]"><SelectValue placeholder="Ingrediente" /></SelectTrigger>
            <SelectContent className="bg-white text-black shadow-lg border rounded-md">
              {data.ingredients.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="number" className="w-20" placeholder="Qtd" value={selQty} onChange={e => setSelQty(e.target.value)} />
          <Select value={selUnit} onValueChange={(v) => setSelUnit(v as UnitType)}>
            <SelectTrigger className="w-20"><SelectValue placeholder="Un" /></SelectTrigger>
            <SelectContent className="bg-white text-black shadow-lg border rounded-md">
              {unitOptions.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={addIng}><Plus className="h-4 w-4" /></Button>
        </div>
      </div>

      <Button onClick={handleSubmit} className="w-full bg-green-700 hover:bg-green-800 text-white" size="lg">{editRecipe ? 'Atualizar receita' : 'Salvar receita'}</Button>
    </div>
  );
}

function ProduceDialog({ recipeId, onClose }: { recipeId: string; onClose: () => void }) {
  const data = useStore();
  const [units, setUnits] = useState("1");
  const qty = Number(units) || 0;
  const check = checkStockForProduction(recipeId, qty);
  const recipe = data.recipes.find(r => r.id === recipeId);
  const product = recipe ? data.products.find(p => p.id === recipe.productId) : null;
  const productUnit = product?.unit || 'un';

  const ingredientUsage = useMemo(() => {
    if (!recipe || qty <= 0) return [];
    return recipe.ingredients.map(ri => {
      const ing = data.ingredients.find(i => i.id === ri.ingredientId);
      if (!ing) return null;
      const qtyPerBatch = convertForDisplay(ri.quantity, ri.unit || ing.unit, ing.unit);
      const needed = (qtyPerBatch / recipe.yieldsQuantity) * qty;
      return { name: ing.name, needed, unit: ing.unit, available: ing.quantity };
    }).filter(Boolean) as { name: string; needed: number; unit: string; available: number }[];
  }, [recipe, qty, data.ingredients]);

  const handleProduce = () => {
    if (check.enough && qty > 0) { produce(recipeId, qty); onClose(); }
  };

  return (
    <div className="space-y-4">
      <div><Label>Quantidade total produzida ({UNIT_LABELS[productUnit]})</Label><Input type="number" step="0.01" value={units} onChange={e => setUnits(e.target.value)} min="0.1" placeholder={`Ex: 10`} /></div>

      {qty > 0 && ingredientUsage.length > 0 && (
        <div className="border rounded-lg p-3 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Insumos necessários para {qty} {UNIT_LABELS[productUnit]}:</p>
          {ingredientUsage.map((iu, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span>{iu.name}</span>
              <span className={iu.needed > iu.available ? 'text-destructive font-semibold' : 'text-muted-foreground'}>
                {iu.needed % 1 === 0 ? iu.needed : iu.needed.toFixed(2)} {iu.unit}
                <span className="text-xs ml-1 opacity-60">(tem {iu.available % 1 === 0 ? iu.available : iu.available.toFixed(2)})</span>
              </span>
            </div>
          ))}
        </div>
      )}

      {qty > 0 && (
        <div className="space-y-2">
          {check.enough ? (
            <div className="flex items-center gap-2 text-success"><CheckCircle className="h-5 w-5" /><span>Estoque suficiente!</span></div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-destructive"><XCircle className="h-5 w-5" /><span>Falta ingrediente:</span></div>
              {check.missing.map(m => (
                <div key={m.ingredientId} className="text-sm p-2 bg-destructive/10 rounded">
                  <strong>{m.name}</strong>: precisa {m.needed.toFixed(1)} {m.unit}, tem {m.available.toFixed(1)} {m.unit}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <Button onClick={handleProduce} disabled={!check.enough || qty <= 0} className="w-full text-white bg-green-700 hover:bg-green-800" size="lg">Produzir</Button>
    </div>
  );
}

function GoalForm({ onClose }: { onClose: () => void }) {
  const data = useStore();
  const [recipeId, setRecipeId] = useState("");
  const [target, setTarget] = useState("");
  const today = new Date().toISOString().split('T')[0];

  const recipe = data.recipes.find(r => r.id === recipeId);

  const handleSubmit = () => {
    if (!recipeId || !target || !recipe) return;
    addProductionGoal({
      productId: recipe.productId,
      recipeId,
      targetQuantity: Number(target),
      producedQuantity: 0,
      date: today,
    });
    onClose();
  };

  return (
    <div className="space-y-4">
      <div><Label>Receita</Label>
        <Select value={recipeId} onValueChange={setRecipeId}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent className="bg-white text-black shadow-lg border rounded-md">
            {data.recipes.map(r => <SelectItem key={r.id} value={r.id}>{r.productName}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div><Label>Meta (unidades)</Label><Input type="number" value={target} onChange={e => setTarget(e.target.value)} placeholder="Ex: 50" /></div>
      <Button onClick={handleSubmit} className="w-full bg-green-700 hover:bg-green-800 text-white" size="lg">Criar meta</Button>
    </div>
  );
}

export default function Production() {
  const data = useStore();
  const navigate = useNavigate();
  const [recipeOpen, setRecipeOpen] = useState(false);
  const [produceRecipeId, setProduceRecipeId] = useState<string | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [goalOpen, setGoalOpen] = useState(false);

  const canCreate = data.ingredients.length > 0 && data.products.length > 0;

  const today = new Date().toISOString().split('T')[0];
  const todayGoals = data.productionGoals.filter(g => g.date === today);

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl">
      <h1 className="text-3xl font-extrabold">Produção</h1>

      {/* Today's Production Goals */}
      {data.recipes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg flex items-center gap-2"><Target className="h-5 w-5 text-primary" />Metas de hoje</h2>
            <Dialog open={goalOpen} onOpenChange={setGoalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1 hover:bg-gray-200"><Plus className="h-4 w-4" />Nova meta</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Meta de produção</DialogTitle></DialogHeader>
                <GoalForm onClose={() => setGoalOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
          {todayGoals.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma meta definida para hoje.</p>
          ) : (
            <div className="grid gap-3">
              {todayGoals.map(goal => {
                const recipe = data.recipes.find(r => r.id === goal.recipeId);
                const pct = goal.targetQuantity > 0 ? Math.min(100, (goal.producedQuantity / goal.targetQuantity) * 100) : 0;
                return (
                  <Card key={goal.id} className={pct >= 100 ? 'border-success/50 shadow-[0_0_12px_hsl(var(--success)/0.3)] transition-all duration-500' : ''}>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-bold">{recipe?.productName || '?'}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant={pct >= 100 ? 'default' : 'secondary'} className={pct >= 100 ? 'bg-success text-success-foreground' : ''}>
                            {pct.toFixed(0)}%
                          </Badge>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteProductionGoal(goal.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <Progress value={pct} className="h-3" />
                      <p className="text-xs text-muted-foreground">{goal.producedQuantity} / {goal.targetQuantity} unidades</p>
                      {pct >= 100 && (
                        <div className="flex items-center gap-2 text-success animate-fade-in">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm font-bold">🎉 Meta concluída!</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {canCreate ? (
        <Dialog open={recipeOpen} onOpenChange={(open) => { setRecipeOpen(open); if (!open) setEditingRecipe(null); }}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2 bg-green-700 hover:bg-green-800 text-white text-base"><Plus className="h-5 w-5" />Nova receita</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingRecipe ? 'Editar receita' : 'Nova receita'}</DialogTitle></DialogHeader>
            <RecipeForm onClose={() => { setRecipeOpen(false); setEditingRecipe(null); }} editRecipe={editingRecipe || undefined} />
          </DialogContent>
        </Dialog>
      ) : null}

      {data.recipes.length === 0 ? (
        <Card><CardContent className="p-10 text-center text-muted-foreground">
          <ChefHat className="mx-auto h-14 w-14 mb-4 opacity-40" />
          {canCreate ? (
            <>
              <p className="font-semibold text-foreground">Nenhuma receita cadastrada</p>
              <p className="text-sm mt-1">Crie sua primeira receita para organizar a produção 👇</p>
            </>
          ) : (
            <>
              <p className="font-semibold text-foreground">Você precisa cadastrar ingredientes e produtos antes de criar receitas</p>
              <p className="text-sm mt-2">Vá até o estoque para começar.</p>
              <Button variant="outline" className="mt-4 gap-2" onClick={() => navigate('/stock')}>
                Ir para Estoque <ArrowRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {data.recipes.map(recipe => {
            const cost = getRecipeCost(recipe.id);
            const costPerUnit = recipe.yieldsQuantity > 0 ? cost / recipe.yieldsQuantity : 0;
            const product = data.products.find(p => p.id === recipe.productId);

            // Profit calculations
            const profitFeira = product ? (product.price - costPerUnit) * recipe.yieldsQuantity : 0;
            const profitRevenda = product?.resalePrice ? (product.resalePrice - costPerUnit) * recipe.yieldsQuantity : 0;

            return (
              <Card key={recipe.id} className="card-hover">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-bold text-lg">{recipe.productName}</p>
                      <p className="text-sm text-muted-foreground">
                        Rende {recipe.yieldsQuantity} un • Custo total: R$ {cost.toFixed(2)} • Custo/un: R$ {costPerUnit.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingRecipe(recipe); setRecipeOpen(true); }}>
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(recipe.id)}>
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>

                  {/* Profit info */}
                  {product && (
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className={`p-3 rounded-lg border text-sm ${profitFeira > 0
                        ? 'bg-green-100 border-green-300'
                        : profitFeira < 0
                          ? 'bg-red-100 border-red-300'
                          : 'bg-gray-100 border-gray-300'
                        }`}>
                        <p className="text-xs text-muted-foreground font-semibold">Lucro Feira</p>
                        <p className={`font-bold ${profitFeira >= 0 ? 'text-green-700' : 'text-red-700'
                          }`}>
                          R$ {profitFeira.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">R$ {(product.price - costPerUnit).toFixed(2)}/un</p>
                      </div>
                      {product.resalePrice !== undefined && product.resalePrice > 0 && (
                        <div className={`p-3 rounded-lg border text-sm ${profitRevenda > 0
                          ? 'bg-green-100 border-green-300'
                          : profitRevenda < 0
                            ? 'bg-red-100 border-red-300'
                            : 'bg-gray-100 border-gray-300'
                          }`}>
                          <p className="text-xs text-muted-foreground font-semibold">Lucro Revenda</p>
                          <p className={`font-bold ${profitFeira >= 0 ? 'text-green-700' : 'text-red-700'
                            }`}>
                            R$ {profitRevenda.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">R$ {(product.resalePrice - costPerUnit).toFixed(2)}/un</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1 mb-4">
                    {recipe.ingredients.map((ri, idx) => {
                      const ing = data.ingredients.find(i => i.id === ri.ingredientId);
                      return <Badge key={idx} variant="secondary">{ing?.name}: {ri.quantity} {ri.unit}</Badge>;
                    })}
                  </div>
                  <Button variant="outline" size="lg" className="w-full bg-yellow-500 hover:bg-yellow-600" onClick={() => setProduceRecipeId(recipe.id)}>
                    Produzir
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )
      }

      <Dialog open={!!produceRecipeId} onOpenChange={() => setProduceRecipeId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Produzir</DialogTitle></DialogHeader>
          {produceRecipeId && <ProduceDialog recipeId={produceRecipeId} onClose={() => setProduceRecipeId(null)} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Excluir receita?</DialogTitle></DialogHeader>
          <p className="text-muted-foreground">Essa ação não pode ser desfeita.</p>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
            <Button variant="destructive" className="flex-1 bg-red-600 text-white hover:bg-red-700" onClick={() => { if (deleteConfirm) deleteRecipe(deleteConfirm); setDeleteConfirm(null); }}>Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div >
  );
}
