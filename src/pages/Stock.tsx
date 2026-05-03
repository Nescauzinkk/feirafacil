import { useState } from "react";
import { useStore } from "@/hooks/useStore";
import { addIngredient, updateIngredient, deleteIngredient, addProduct, updateProduct, deleteProduct, purchaseIngredient } from "@/lib/store";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Package, ShoppingCart, AlertTriangle, Trash2, Pencil } from "lucide-react";
import type { UnitType, Ingredient, Product, ProductCategory } from "@/types";
import { UNIT_LABELS, PRODUCT_CATEGORIES } from "@/types";

function IngredientForm({ onClose, editItem }: { onClose: () => void; editItem?: Ingredient }) {
  const [name, setName] = useState(editItem?.name || "");
  const [unit, setUnit] = useState<UnitType>(editItem?.unit || "kg");
  const [quantity, setQuantity] = useState(editItem?.quantity.toString() || "");
  const [threshold, setThreshold] = useState(editItem?.lowStockThreshold.toString() || "5");

  const handleSubmit = () => {
    if (!name) return;
    if (editItem) {
      updateIngredient(editItem.id, { name, unit, quantity: Number(quantity) || 0, lowStockThreshold: Number(threshold) || 5 });
    } else {
      addIngredient({ name, unit, quantity: Number(quantity) || 0, costPerUnit: 0, lowStockThreshold: Number(threshold) || 5 });
    }
    onClose();
  };

  return (
    <div className="space-y-4">
      <div><Label>Nome</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Farinha de trigo" /></div>
      <div><Label>Unidade de medida</Label>
        <Select value={unit} onValueChange={v => setUnit(v as UnitType)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent className="bg-white text-black shadow-lg border rounded-md">
            {Object.entries(UNIT_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div><Label>Quantidade em estoque</Label><Input type="number" step="0.01" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="Ex: 10" /></div>
      <div><Label>Alerta de estoque baixo</Label><Input type="number" step="0.01" value={threshold} onChange={e => setThreshold(e.target.value)} /></div>
      <Button onClick={handleSubmit} className="w-full text-white bg-green-700 hover:bg-green-800" size="lg">{editItem ? 'Atualizar' : 'Salvar'}</Button>
    </div>
  );
}

function ProductForm({ onClose, editItem }: { onClose: () => void; editItem?: Product }) {
  const [name, setName] = useState(editItem?.name || "");
  const [unit, setUnit] = useState<UnitType>(editItem?.unit || "un");
  const [price, setPrice] = useState(editItem?.price.toString() || "");
  const [priceRegional, setPriceRegional] = useState(editItem?.priceRegional?.toString() || "");
  const [resalePrice, setResalePrice] = useState(editItem?.resalePrice?.toString() || "");
  const [quantity, setQuantity] = useState(editItem?.quantity.toString() || "");
  const [category, setCategory] = useState<ProductCategory | "">(editItem?.category || "");

  const handleSubmit = () => {
    if (!name) return;
    const productData = {
      name,
      unit,
      price: Number(price) || 0,
      priceRegional: priceRegional ? Number(priceRegional) : undefined,
      resalePrice: resalePrice ? Number(resalePrice) : undefined,
      quantity: Number(quantity) || 0,
      category: category || undefined,
    };
    if (editItem) {
      updateProduct(editItem.id, productData);
    } else {
      addProduct(productData as Omit<Product, 'id'>);
    }
    onClose();
  };

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div><Label>Nome do produto</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Queijo colonial" /></div>
      <div><Label>Unidade de venda</Label>
        <Select value={unit} onValueChange={v => setUnit(v as UnitType)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent className="bg-white text-black shadow-lg border rounded-md">
            {Object.entries(UNIT_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div><Label>Categoria (opcional)</Label>
        <Select value={category} onValueChange={v => setCategory(v as ProductCategory)}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent className="bg-white text-black shadow-lg border rounded-md">
            {PRODUCT_CATEGORIES.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div><Label>Preço de venda — Feira Local (R$)</Label><Input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} /></div>
      <div><Label>Preço de venda — Feira Regional/Fora (R$)</Label><Input type="number" step="0.01" value={priceRegional} onChange={e => setPriceRegional(e.target.value)} placeholder="Opcional" /></div>
      <div><Label>Preço de venda — Revenda/Mercado (R$)</Label><Input type="number" step="0.01" value={resalePrice} onChange={e => setResalePrice(e.target.value)} placeholder="Opcional" /></div>
      <div><Label>Quantidade em estoque</Label><Input type="number" step="0.01" value={quantity} onChange={e => setQuantity(e.target.value)} /></div>
      <Button onClick={handleSubmit} className="w-full bg-green-700 hover:bg-green-800 text-white" size="lg">{editItem ? 'Atualizar' : 'Salvar'}</Button>
    </div>
  );
}

function PurchaseForm({ onClose }: { onClose: () => void }) {
  const data = useStore();
  const [ingredientId, setIngredientId] = useState("");
  const [isBulk, setIsBulk] = useState(false);
  const [bulkQty, setBulkQty] = useState("");
  const [unitsPerBundle, setUnitsPerBundle] = useState("");
  const [weightPerUnit, setWeightPerUnit] = useState("");
  const [weightUnit, setWeightUnit] = useState<UnitType>("g");
  const [pkgCount, setPkgCount] = useState("");
  const [qtyPerPkg, setQtyPerPkg] = useState("");
  const [pkgUnit, setPkgUnit] = useState<UnitType>("g");
  const [cost, setCost] = useState("");

  const selectedIng = data.ingredients.find(i => i.id === ingredientId);

  const handleIngredientChange = (id: string) => {
    setIngredientId(id);
    const ing = data.ingredients.find(i => i.id === id);
    if (ing) {
      setPkgUnit(ing.unit);
      setWeightUnit(ing.unit);
    }
  };

  const getFinalQuantity = (): number => {
    if (isBulk) {
      const bundles = Number(bulkQty) || 0;
      const perBundle = Number(unitsPerBundle) || 0;
      const perUnit = Number(weightPerUnit) || 0;
      const totalUnits = bundles * perBundle;
      if (!selectedIng) return 0;
      return convertToBase(totalUnits * perUnit, weightUnit, selectedIng.unit);
    }
    const count = Number(pkgCount) || 0;
    const perPkg = Number(qtyPerPkg) || 0;
    if (!selectedIng) return 0;
    return convertToBase(count * perPkg, pkgUnit, selectedIng.unit);
  };

  const finalQty = getFinalQuantity();
  const numPkgs = isBulk ? (Number(bulkQty) || 0) : (Number(pkgCount) || 0);
  const costPerPkg = numPkgs > 0 && Number(cost) > 0 ? Number(cost) / numPkgs : 0;
  const costPerBaseUnit = finalQty > 0 && Number(cost) > 0 ? Number(cost) / finalQty : 0;

  const handleSubmit = () => {
    if (!ingredientId || !cost || finalQty <= 0) return;
    purchaseIngredient(ingredientId, finalQty, Number(cost));
    onClose();
  };

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div><Label>Ingrediente</Label>
        <Select value={ingredientId} onValueChange={handleIngredientChange}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent className="bg-white text-black shadow-lg border rounded-md">
            {data.ingredients.map(i => <SelectItem key={i.id} value={i.id}>{i.name} ({UNIT_LABELS[i.unit]})</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3">
        <Switch
          checked={isBulk}
          onCheckedChange={setIsBulk}
          id="bulk-mode"
          className="
    data-[state=checked]:bg-green-600
    data-[state=unchecked]:bg-gray-300
    transition-colors
  "
        />
        <Label htmlFor="bulk-mode" className="text-sm font-medium">Compra em fardo</Label>
      </div>

      {isBulk ? (
        <>
          <div><Label>Quantos fardos?</Label><Input type="number" value={bulkQty} onChange={e => setBulkQty(e.target.value)} placeholder="Ex: 1" /></div>
          <div><Label>Unidades por fardo</Label><Input type="number" value={unitsPerBundle} onChange={e => setUnitsPerBundle(e.target.value)} placeholder="Ex: 5" /></div>
          <div className="flex gap-2">
            <div className="flex-1"><Label>Peso/volume por unidade</Label><Input type="number" step="0.01" value={weightPerUnit} onChange={e => setWeightPerUnit(e.target.value)} placeholder="Ex: 5" /></div>
            <div className="w-24"><Label>Unidade</Label>
              <Select value={weightUnit} onValueChange={v => setWeightUnit(v as UnitType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white text-black shadow-lg border rounded-md">
                  {Object.entries(UNIT_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </>
      ) : (
        <>
          <div><Label>Quantidade de pacotes/unidades</Label><Input type="number" value={pkgCount} onChange={e => setPkgCount(e.target.value)} placeholder="Ex: 3" /></div>
          <div className="flex gap-2">
            <div className="flex-1"><Label>Quantidade por pacote</Label><Input type="number" step="0.01" value={qtyPerPkg} onChange={e => setQtyPerPkg(e.target.value)} placeholder="Ex: 400" /></div>
            <div className="w-24"><Label>Unidade</Label>
              <Select value={pkgUnit} onValueChange={v => setPkgUnit(v as UnitType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white text-black shadow-lg border rounded-md">
                  {Object.entries(UNIT_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </>
      )}

      {finalQty > 0 && selectedIng && (
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm space-y-1">
          <p><strong>Total:</strong> {finalQty % 1 === 0 ? finalQty : finalQty.toFixed(2)} {UNIT_LABELS[selectedIng.unit]}</p>
          {costPerPkg > 0 && <p><strong>Custo por {isBulk ? 'fardo' : 'pacote'}:</strong> R$ {costPerPkg.toFixed(2)}</p>}
          {costPerBaseUnit > 0 && <p><strong>Custo por {UNIT_LABELS[selectedIng.unit]}:</strong> R$ {costPerBaseUnit.toFixed(2)}</p>}
        </div>
      )}

      <div><Label>Valor total pago (R$)</Label><Input type="number" step="0.01" value={cost} onChange={e => setCost(e.target.value)} /></div>
      <Button onClick={handleSubmit} className="w-full bg-green-700 hover:bg-green-800 text-white" size="lg">Registrar compra</Button>
    </div>
  );
}

const WEIGHT_UNITS = ['g', 'kg'];
const VOLUME_UNITS = ['mL', 'L'];
const COUNT_UNITS = ['un', 'pc'];

function convertToBase(value: number, from: UnitType, to: UnitType): number {
  if (from === to) return value;

  if (
    (WEIGHT_UNITS.includes(from) && COUNT_UNITS.includes(to)) ||
    (VOLUME_UNITS.includes(from) && COUNT_UNITS.includes(to))
  ) {
    return 0;
  }

  // Peso
  if (WEIGHT_UNITS.includes(from) && WEIGHT_UNITS.includes(to)) {
    const conversions = {
      g: { kg: 0.001 },
      kg: { g: 1000 },
    };
    return value * (conversions[from]?.[to] ?? 1);
  }

  // Volume
  if (VOLUME_UNITS.includes(from) && VOLUME_UNITS.includes(to)) {
    const conversions = {
      mL: { L: 0.001 },
      L: { mL: 1000 },
    };
    return value * (conversions[from]?.[to] ?? 1);
  }

  // Contagem
  if (COUNT_UNITS.includes(from) && COUNT_UNITS.includes(to)) {
    return value;
  }

  return value;
}


function formatQty(qty: number, unit: UnitType): string {
  const display = qty % 1 === 0 ? qty.toString() : qty.toFixed(2);
  return `${display} ${UNIT_LABELS[unit]}`;
}

export default function Stock() {
  const data = useStore();
  const [ingOpen, setIngOpen] = useState(false);
  const [prodOpen, setProdOpen] = useState(false);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [editIng, setEditIng] = useState<Ingredient | null>(null);
  const [editProd, setEditProd] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'ingredient' | 'product'; id: string } | null>(null);

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'ingredient') deleteIngredient(deleteConfirm.id);
    else deleteProduct(deleteConfirm.id);
    setDeleteConfirm(null);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl">
      <h1 className="text-3xl font-extrabold">Estoque</h1>

      <Tabs defaultValue="ingredients">
        <TabsList className="grid w-full grid-cols-2 bg-gray-200 rounded-lg p-1">
          <TabsTrigger
            value="ingredients"
            className="data-[state=active]:bg-white data-[state=active]:text-green-800"
          >
            Ingredientes
          </TabsTrigger>

          <TabsTrigger
            value="products"
            className="data-[state=active]:bg-white data-[state=active]:text-green-800"
          >
            Produtos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ingredients" className="space-y-4 mt-6">
          <div className="flex gap-3 flex-wrap">
            <Dialog open={ingOpen} onOpenChange={(open) => { setIngOpen(open); if (!open) setEditIng(null); }}>
              <DialogTrigger asChild>
                <Button size="lg" className="text-white bg-green-700 hover:bg-green-800 gap-2 text-base"><Plus className="h-5 w-5" />Novo ingrediente</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{editIng ? 'Editar ingrediente' : 'Novo ingrediente'}</DialogTitle></DialogHeader>
                <IngredientForm onClose={() => { setIngOpen(false); setEditIng(null); }} editItem={editIng || undefined} />
              </DialogContent>
            </Dialog>

            <Dialog open={purchaseOpen} onOpenChange={setPurchaseOpen}>
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  className="bg-yellow-500 hover:bg-yellow-600 transition-colors text-black gap-2"
                ><ShoppingCart className="h-4 w-4" />Registrar compra</Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Compra de ingrediente</DialogTitle></DialogHeader>
                <PurchaseForm onClose={() => setPurchaseOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>

          {data.ingredients.length === 0 ? (
            <Card><CardContent className="p-10 flex flex-col items-center justify-center text-center text-muted-foreground">
              <Package className="mx-auto h-14 w-14 mb-4 opacity-40" />
              <div className="font-bold flex items-center gap-2">Você ainda não cadastrou ingredientes</div>
              <div className="text-sm mt-1">Comece adicionando o primeiro 👇</div>
            </CardContent></Card>
          ) : (
            <div className="grid gap-3">
              {data.ingredients.map(ing => (
                <Card key={ing.id} className="card-hover">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-bold flex items-center gap-2">
                        {ing.name}
                        {ing.quantity <= ing.lowStockThreshold && (
                          <Badge variant="outline" className="border-warning text-warning-foreground bg-warning/10 text-xs bg-yellow-500 gap-1">
                            <AlertTriangle className="h-3 w-3" />Baixo
                          </Badge>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatQty(ing.quantity, ing.unit)}
                        {ing.costPerUnit > 0 && ` • R$ ${ing.costPerUnit.toFixed(2)}/${UNIT_LABELS[ing.unit]}`}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditIng(ing); setIngOpen(true); }}>
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm({ type: 'ingredient', id: ing.id })}>
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="products" className="space-y-4 mt-6">
          <Dialog open={prodOpen} onOpenChange={(open) => { setProdOpen(open); if (!open) setEditProd(null); }}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-green-700 text-white gap-2 text-base"><Plus className="h-5 w-5" />Novo produto</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editProd ? 'Editar produto' : 'Novo produto'}</DialogTitle></DialogHeader>
              <ProductForm onClose={() => { setProdOpen(false); setEditProd(null); }} editItem={editProd || undefined} />
            </DialogContent>
          </Dialog>

          {data.products.length === 0 ? (
            <Card><CardContent className="p-10 text-center text-muted-foreground">
              <Package className="mx-auto h-14 w-14 mb-4 opacity-40" />
              <p className="font-semibold text-foreground">Nenhum produto cadastrado</p>
              <p className="text-sm mt-1">Adicione seu primeiro produto para começar a vender 👇</p>
            </CardContent></Card>
          ) : (
            <div className="grid gap-3">
              {data.products.map(prod => (
                <Card key={prod.id} className="card-hover">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-bold flex items-center gap-2">
                        {prod.name}
                        {prod.category && <Badge variant="secondary" className="text-xs">{prod.category}</Badge>}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatQty(prod.quantity, prod.unit || 'un')} • Feira: R$ {prod.price.toFixed(2)}/{UNIT_LABELS[prod.unit || 'un']}
                        {prod.resalePrice !== undefined && prod.resalePrice > 0 && ` • Revenda: R$ ${prod.resalePrice.toFixed(2)}`}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditProd(prod); setProdOpen(true); }}>
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm({ type: 'product', id: prod.id })}>
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Excluir {deleteConfirm?.type === 'ingredient' ? 'ingrediente' : 'produto'}?</DialogTitle></DialogHeader>
          <p className="text-muted-foreground">Essa ação não pode ser desfeita.</p>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
            <Button variant="destructive" className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={confirmDelete}>Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
