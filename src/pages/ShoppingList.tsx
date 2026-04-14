import { useMemo, useState } from "react";
import { useStore } from "@/hooks/useStore";
import { removeFromShoppingList, clearShoppingList, addManualToShoppingList } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ShoppingCart, Trash2, Share2, Trash, Plus, Info, ListPlus } from "lucide-react";
import { UNIT_LABELS, UnitType } from "@/types";
import { toast } from "sonner";

function convertToStandard(qty: number, unit: string): { qty: number; unit: string } {
  const u = unit.toLowerCase();
  if (u === 'g') return { qty: qty / 1000, unit: 'kg' };
  if (u === 'ml') return { qty: qty / 1000, unit: 'L' };
  return { qty, unit };
}

export default function ShoppingList() {
  const data = useStore();
  const shoppingList = data.shoppingList || [];
  const [manualOpen, setManualOpen] = useState(false);
  const [manualItem, setManualItem] = useState({ name: "", quantity: "", unit: "un" });

  const consolidatedIngredients = useMemo(() => {
    const totals: Record<string, { name: string; needed: number; unit: string; available: number; isManual?: boolean }> = {};

    shoppingList.forEach(item => {
      if (item.recipeId) {
        // Recipe-based items
        const recipe = data.recipes.find(r => r.id === item.recipeId);
        if (!recipe) return;

        recipe.ingredients.forEach(ri => {
          const ing = data.ingredients.find(i => i.id === ri.ingredientId);
          if (!ing) return;

          const qtyPerUnit = ri.quantity / recipe.yieldsQuantity;
          const totalNeededForThisItem = qtyPerUnit * item.quantity;

          const standard = convertToStandard(totalNeededForThisItem, ri.unit || ing.unit);
          const ingStandard = convertToStandard(ing.quantity, ing.unit);

          const key = `ing-${ing.id}`;
          if (!totals[key]) {
            totals[key] = {
              name: ing.name,
              needed: 0,
              unit: standard.unit,
              available: ingStandard.qty
            };
          }
          totals[key].needed += standard.qty;
        });
      } else if (item.manualItemName) {
        // Manual items
        const standard = convertToStandard(item.quantity, item.manualUnit || 'un');
        const key = `manual-${item.manualItemName.toLowerCase()}-${standard.unit}`;
        
        if (!totals[key]) {
          totals[key] = {
            name: item.manualItemName,
            needed: 0,
            unit: standard.unit,
            available: 0,
            isManual: true
          };
        }
        totals[key].needed += standard.qty;
      }
    });

    return Object.entries(totals)
      .map(([id, data]) => ({ id, ...data }))
      .filter(item => item.isManual || item.needed > item.available);
  }, [shoppingList, data.recipes, data.ingredients]);

  const handleAddManual = async () => {
    if (!manualItem.name || !manualItem.quantity) {
      toast.error("Preencha o nome e a quantidade");
      return;
    }
    await addManualToShoppingList(manualItem.name, Number(manualItem.quantity), manualItem.unit);
    toast.success("Item adicionado!");
    setManualItem({ name: "", quantity: "", unit: "un" });
    setManualOpen(false);
  };

  const exportToWhatsApp = () => {
    if (shoppingList.length === 0) return;

    let text = `🛒 *LISTA DE MERCADO - FEIRA FÁCIL*\n\n`;
    
    const recipeItems = shoppingList.filter(i => i.recipeId);
    if (recipeItems.length > 0) {
      text += `*Produções planejadas:*\n`;
      recipeItems.forEach(item => {
        text += `• ${item.productName}: ${item.quantity} un\n`;
      });
      text += `\n`;
    }

    text += `*Itens a comprar:*\n`;
    consolidatedIngredients.forEach(item => {
      const toBuy = item.isManual ? item.needed : (item.needed - item.available);
      text += `• *${item.name}*: ${toBuy.toFixed(2)} ${item.unit}\n`;
    });

    text += `\n_Gerado pelo Feira Fácil Online_`;

    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">Lista de Mercado</h1>
          <p className="text-muted-foreground mt-1">Consolidação de insumos e itens manuais</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={manualOpen} onOpenChange={setManualOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 border-green-600 text-green-700 hover:bg-green-50">
                <ListPlus className="h-4 w-4" /> Item Manual
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Adicionar item manual</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Nome do item</Label>
                  <Input placeholder="Ex: Embalagem de Bolo" value={manualItem.name} onChange={e => setManualItem({...manualItem, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Quantidade</Label>
                    <Input type="number" placeholder="Ex: 50" value={manualItem.quantity} onChange={e => setManualItem({...manualItem, quantity: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Unidade</Label>
                    <Input placeholder="Ex: un, kg, pct" value={manualItem.unit} onChange={e => setManualItem({...manualItem, unit: e.target.value})} />
                  </div>
                </div>
                <Button onClick={handleAddManual} className="w-full bg-green-700 hover:bg-green-800 text-white">Adicionar à Lista</Button>
              </div>
            </DialogContent>
          </Dialog>
          {shoppingList.length > 0 && (
            <Button variant="destructive" size="sm" onClick={() => clearShoppingList()} className="gap-2">
              <Trash className="h-4 w-4" /> Limpar
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" /> Itens na Lista
          </h2>
          {shoppingList.length === 0 ? (
            <Card className="bg-gray-50 border-dashed">
              <CardContent className="p-6 text-center text-muted-foreground text-sm">
                Lista vazia. Adicione receitas na aba Produção ou use o botão 'Item Manual'.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {shoppingList.map(item => (
                <Card key={item.id} className={`border-l-4 ${item.recipeId ? 'border-l-primary' : 'border-l-orange-400'}`}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm">{item.productName || item.manualItemName}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} {item.manualUnit || 'un'} {item.recipeId ? '(Produção)' : '(Manual)'}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeFromShoppingList(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="md:col-span-2 space-y-4">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" /> O que comprar (Consolidado)
          </h2>
          {consolidatedIngredients.length === 0 ? (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-10 text-center text-green-700">
                Você tem estoque suficiente para as receitas ou a lista está vazia.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="divide-y">
                  {consolidatedIngredients.map(item => {
                    const toBuy = item.isManual ? item.needed : (item.needed - item.available);
                    return (
                      <div key={item.id} className="py-3 flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.isManual ? 'Item manual' : `Necessário: ${item.needed.toFixed(2)} ${item.unit} | No estoque: ${item.available.toFixed(2)} ${item.unit}`}
                          </p>
                        </div>
                        <Badge variant={item.isManual ? "outline" : "destructive"} className={`text-sm px-3 py-1 ${item.isManual ? 'border-orange-400 text-orange-600' : ''}`}>
                          {toBuy.toFixed(2)} {item.unit}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
                <Button onClick={exportToWhatsApp} className="w-full bg-green-600 hover:bg-green-700 text-white gap-2" size="lg">
                  <Share2 className="h-5 w-5" /> Enviar para WhatsApp
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
