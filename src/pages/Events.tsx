import { useState } from "react";
import { useStore } from "@/hooks/useStore";
import { addEvent, startEvent, endEvent, endDay, registerSale, deleteEvent, addEventPreparationCosts, undoSale, getEventProfit, updateEvent } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Play, Square, CalendarDays, Banknote, CreditCard, Smartphone, Trash2, Undo2, GitCompare, Check, X, Copy, Target, Sun } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import type { PaymentMethod, EventProduct, EventCost, ProductGoal, DayGoals } from "@/types";
import { UNIT_LABELS } from "@/types";

function CreateEventForm({ onClose }: { onClose: () => void }) {
  const data = useStore();
  const [name, setName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [durationDays, setDurationDays] = useState("1");
  const [selectedProducts, setSelectedProducts] = useState<EventProduct[]>([]);
  const [dayGoals, setDayGoals] = useState<DayGoals[]>([]);

  const numDays = Math.max(1, Number(durationDays) || 1);

  const toggleProduct = (productId: string) => {
    if (selectedProducts.find(p => p.productId === productId)) {
      setSelectedProducts(selectedProducts.filter(p => p.productId !== productId));
    } else {
      setSelectedProducts([...selectedProducts, { productId, quantityTaken: 0, quantitySold: 0 }]);
    }
  };

  const setQtyTaken = (productId: string, qty: number) => {
    setSelectedProducts(selectedProducts.map(p => p.productId === productId ? { ...p, quantityTaken: qty } : p));
  };

  // Initialize day goals when days change
  const ensureDayGoals = (days: number) => {
    const existing = [...dayGoals];
    while (existing.length < days) {
      existing.push({ day: existing.length + 1, productGoals: [] });
    }
    return existing.slice(0, days);
  };

  const updateDayProductGoal = (day: number, productId: string, quantity: number) => {
    const goals = ensureDayGoals(numDays);
    const dayIdx = goals.findIndex(g => g.day === day);
    if (dayIdx < 0) return;
    const pg = goals[dayIdx].productGoals;
    const existingIdx = pg.findIndex(g => g.productId === productId);
    if (existingIdx >= 0) {
      pg[existingIdx] = { ...pg[existingIdx], quantity };
    } else {
      pg.push({ productId, quantity });
    }
    goals[dayIdx] = { ...goals[dayIdx], productGoals: [...pg] };
    setDayGoals([...goals]);
  };

  const getDayProductGoal = (day: number, productId: string): number => {
    const dg = dayGoals.find(g => g.day === day);
    return dg?.productGoals.find(g => g.productId === productId)?.quantity || 0;
  };

  const cloneGoalsToNextDay = (fromDay: number) => {
    if (fromDay >= numDays) return;
    const goals = ensureDayGoals(numDays);
    const source = goals.find(g => g.day === fromDay);
    if (!source) return;
    const targetDay = fromDay + 1;
    const targetIdx = goals.findIndex(g => g.day === targetDay);
    if (targetIdx >= 0) {
      goals[targetIdx] = { day: targetDay, productGoals: [...source.productGoals.map(g => ({ ...g }))] };
    }
    setDayGoals([...goals]);
    toast.success(`Metas do dia ${fromDay} clonadas para o dia ${targetDay}`);
  };

  const handleSubmit = () => {
    if (!name || selectedProducts.length === 0) return;

    // For single-day events, use productGoals from day 1
    const finalDayGoals = ensureDayGoals(numDays);
    const productGoals = numDays === 1 ? (finalDayGoals[0]?.productGoals || []) : [];

    addEvent({
      name,
      date,
      durationDays: numDays,
      currentDay: 0,
      completedDays: [],
      products: selectedProducts,
      salesGoal: undefined,
      productGoals: productGoals,
      dayGoals: numDays > 1 ? finalDayGoals : [],
      preparationCosts: [],
    });
    onClose();
  };

  return (
    <div className="space-y-4">
      <div><Label>Nome do evento</Label><Input value={name} onChange={(e: any) => setName(e.target.value)} placeholder="Ex: Feira do sábado" /></div>
      <div><Label>Data de início</Label><Input type="date" value={date} onChange={(e: any) => setDate(e.target.value)} /></div>
      <div><Label>Duração (dias)</Label><Input type="number" min="1" value={durationDays} onChange={(e: any) => setDurationDays(e.target.value)} /></div>

      <div className="space-y-2">
        <Label>Produtos para levar</Label>
        {data.products.map(prod => {
          const selected = selectedProducts.find(p => p.productId === prod.id);
          return (
            <div key={prod.id} className="flex items-center gap-2 p-2 border rounded-lg">
              <Button type="button" className={`${selected
                ? "bg-green-600 text-white shadow-md"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                }`} size="sm" onClick={() => toggleProduct(prod.id)}>
                {prod.name}
              </Button>
              {selected && (
                <Input type="number" className="w-20" placeholder="Qtd" value={selected.quantityTaken || ""} onChange={(e: any) => setQtyTaken(prod.id, Number(e.target.value))} />
              )}
              <span className="text-xs text-muted-foreground">({prod.quantity} disp.)</span>
            </div>
          );
        })}
      </div>

      {/* Per-day goals */}
      {selectedProducts.length > 0 && (
        <div className="space-y-3">
          <Label className="flex items-center gap-2"><Target className="h-4 w-4" />Metas por produto {numDays > 1 && '(por dia)'}</Label>
          {Array.from({ length: numDays }, (_, i) => i + 1).map(day => (
            <div key={day} className="border rounded-lg p-3 space-y-2">
              {numDays > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-muted-foreground">Dia {day}</div>
                  {day < numDays && (
                    <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => cloneGoalsToNextDay(day)}>
                      <Copy className="h-3 w-3" />Clonar para dia {day + 1}
                    </Button>
                  )}
                </div>
              )}
              {selectedProducts.map(sp => {
                const prod = data.products.find(p => p.id === sp.productId);
                if (!prod) return null;
                const goalQty = getDayProductGoal(day, sp.productId);
                const goalValue = goalQty * prod.price;
                return (
                  <div key={sp.productId} className="flex items-center gap-2">
                    <span className="text-sm flex-1 min-w-0 truncate">{prod.name}</span>
                    <Input type="number" className="w-16" placeholder="Meta" value={goalQty || ''}
                      onChange={(e: any) => updateDayProductGoal(day, sp.productId, Number(e.target.value) || 0)} />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">un</span>
                    {goalQty > 0 && <span className="text-xs text-success font-semibold whitespace-nowrap">R$ {goalValue.toFixed(0)}</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      <Button onClick={handleSubmit} className="w-full text-white bg-green-700 hover:bg-green-800" size="lg">Criar evento</Button>
    </div>
  );
}

function EventPreparationModal({ eventId, onDone }: { eventId: string; onDone: () => void }) {
  const defaultCategories = [
    { name: 'Combustível', amount: 0 },
    { name: 'Ajudante', amount: 0 },
    { name: 'Taxa do evento', amount: 0 },
    { name: 'Manutenção', amount: 0 },
  ];
  const [costs, setCosts] = useState<{ name: string; amount: number }[]>(defaultCategories);
  const [customName, setCustomName] = useState('');

  const updateCost = (index: number, amount: number) => {
    setCosts(costs.map((c, i) => i === index ? { ...c, amount } : c));
  };

  const removeCost = (index: number) => {
    setCosts(costs.filter((_, i) => i !== index));
  };

  const addCustom = () => {
    if (!customName.trim()) return;
    setCosts([...costs, { name: customName.trim(), amount: 0 }]);
    setCustomName('');
  };

  const handleSubmit = () => {
    const validCosts = costs.filter(c => c.amount > 0).map(c => ({ id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5), ...c }));
    if (validCosts.length > 0) {
      addEventPreparationCosts(eventId, validCosts);
    }
    startEvent(eventId);
    onDone();
  };

  const handleSkip = () => {
    startEvent(eventId);
    onDone();
  };

  const total = costs.reduce((s, c) => s + (c.amount || 0), 0);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Adicione os custos de preparação para este evento (opcional).</p>

      <div className="space-y-3">
        {costs.map((cost, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-sm font-medium min-w-[120px]">{cost.name}</span>
            <Input type="number" step="0.01" placeholder="R$ 0,00" className="flex-1"
              value={cost.amount || ''} onChange={(e: any) => updateCost(i, Number(e.target.value) || 0)} />
            <Button variant="ghost" size="icon" className="shrink-0" onClick={() => removeCost(i)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input value={customName} onChange={(e: any) => setCustomName(e.target.value)} placeholder="Outro custo..." className="flex-1" />
        <Button variant="outline" size="sm" onClick={addCustom}><Plus className="h-4 w-4 mr-1" />Adicionar</Button>
      </div>

      {total > 0 && (
        <div className="text-right text-sm font-bold text-muted-foreground">
          Total: R$ {total.toFixed(2)}
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={handleSkip}>Pular</Button>
        <Button className="flex-1" onClick={handleSubmit}>
          <Play className="mr-2 h-4 w-4" />Iniciar evento
        </Button>
      </div>
    </div>
  );
}

function EventSalesMode({ eventId }: { eventId: string }) {
  const data = useStore();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [showEndDayConfirm, setShowEndDayConfirm] = useState(false);
  const [showEndEventConfirm, setShowEndEventConfirm] = useState(false);
  const [viewDay, setViewDay] = useState<number | null>(null);
  const [saleQtyDialog, setSaleQtyDialog] = useState<string | null>(null);
  const [saleQty, setSaleQty] = useState("1");
  const event = data.events.find(e => e.id === eventId);

  if (!event) return <p>Evento não encontrado</p>;

  const isMultiDay = event.durationDays > 1;

  if (event.isCompleted) {
    return <EventReport event={event} />;
  }

  if (!event.isActive) {
    return <EventPreStart event={event} />;
  }

  // Current day sales
  const currentDaySales = isMultiDay
    ? event.sales.filter(s => s.day === event.currentDay)
    : event.sales;
  const totalSold = currentDaySales.reduce((s, sale) => s + sale.total, 0);
  const totalAllDays = event.sales.reduce((s, sale) => s + sale.total, 0);
  const lastSale = currentDaySales.length > 0 ? currentDaySales[currentDaySales.length - 1] : null;

  // Get goals for current day
  const getCurrentDayGoals = () => {
    if (isMultiDay) {
      return event.dayGoals?.find(dg => dg.day === event.currentDay)?.productGoals || [];
    }
    return event.productGoals || [];
  };
  const currentGoals = getCurrentDayGoals();

  const handleSale = async (productId: string, quantity: number = 1) => {
    const sale = await registerSale(event.id, productId, paymentMethod, quantity);
    if (sale) {
      const prod = data.products.find(p => p.id === productId);
      toast.success(`Vendeu ${quantity} ${UNIT_LABELS[prod?.unit || 'un']} de ${prod?.name} — R$ ${sale.total.toFixed(2)}`, {
        icon: <Check className="h-4 w-4" />,
        style: { background: 'hsl(var(--success))', color: 'hsl(var(--success-foreground))', border: 'none' },
      });
    }
  };

  const handleFractionalSale = () => {
    if (!saleQtyDialog) return;
    const qty = Number(saleQty) || 0;
    if (qty <= 0) return;
    handleSale(saleQtyDialog, qty);
    setSaleQtyDialog(null);
    setSaleQty("1");
  };

  const handleUndo = () => {
    if (!lastSale) return;
    const prod = data.products.find(p => p.id === lastSale.productId);
    undoSale(event.id, lastSale.id);
    toast.info(`Venda de ${prod?.name} desfeita`);
  };

  const handleEndDay = () => {
    endDay(event.id);
    setShowEndDayConfirm(false);
    toast.success(`Dia ${event.currentDay} finalizado!`);
  };

  const handleEndEvent = () => {
    endEvent(event.id);
    setShowEndEventConfirm(false);
    toast.success('Evento encerrado!');
  };

  const allDaysCompleted = event.completedDays.length >= event.durationDays - 1;

  // Sales count per product for current day
  const salesByProductCurrentDay: Record<string, number> = {};
  currentDaySales.forEach(s => {
    salesByProductCurrentDay[s.productId] = (salesByProductCurrentDay[s.productId] || 0) + s.quantity;
  });

  return (
    <div className="space-y-5 animate-fade-in max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">🔴 {event.name}</h1>
        <div className="flex items-center gap-2">
          {isMultiDay && (
            <Badge variant="secondary" className="text-sm">
              <Sun className="h-3 w-3 mr-1" />Dia {event.currentDay}/{event.durationDays}
            </Badge>
          )}
          <Badge variant="destructive" className="animate-pulse">AO VIVO</Badge>
        </div>
      </div>

      {/* Completed days tabs */}
      {isMultiDay && event.completedDays.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {event.completedDays.map(day => (
            <Button key={day} variant={viewDay === day ? 'default' : 'outline'} size="sm"
              onClick={() => setViewDay(viewDay === day ? null : day)}>
              📊 Dia {day}
            </Button>
          ))}
        </div>
      )}

      {viewDay !== null ? (
        <DayReport event={event} day={viewDay} onClose={() => setViewDay(null)} />
      ) : (
        <>
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-5 text-center">
              <p className="text-sm text-muted-foreground">{isMultiDay ? `Vendas do dia ${event.currentDay}` : 'Total vendido'}</p>
              <p className="text-4xl font-extrabold text-primary">R$ {totalSold.toFixed(2)}</p>
              {isMultiDay && (
                <p className="text-xs text-muted-foreground mt-1">Total acumulado: R$ {totalAllDays.toFixed(2)}</p>
              )}
            </CardContent>
          </Card>

          {/* Product goals with progress */}
          {currentGoals.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4" />Metas</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {currentGoals.map(goal => {
                  const prod = data.products.find(p => p.id === goal.productId);
                  if (!prod) return null;
                  const sold = salesByProductCurrentDay[goal.productId] || 0;
                  const pct = goal.quantity > 0 ? Math.min(100, (sold / goal.quantity) * 100) : 0;
                  const goalValue = goal.quantity * prod.price;
                  const soldValue = sold * prod.price;
                  const isComplete = pct >= 100;
                  return (
                    <div key={goal.productId} className={`space-y-1 p-2 rounded-lg transition-all duration-500 ${isComplete ? 'bg-success/10 border border-success/30' : ''}`}>
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{prod.name}</span>
                        <span className={isComplete ? 'text-success font-bold' : 'text-muted-foreground'}>{sold}/{goal.quantity} un ({pct.toFixed(0)}%)</span>
                      </div>
                      <Progress value={pct} className="h-2" />
                      <p className="text-xs text-muted-foreground">R$ {soldValue.toFixed(2)} / R$ {goalValue.toFixed(2)}</p>
                      {isComplete && (
                        <p className="text-sm font-bold text-success animate-fade-in flex items-center gap-1">🎉 Meta concluída!</p>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          <div>
            <p className="text-sm font-bold text-muted-foreground mb-3">Forma de pagamento</p>
            <div className="grid grid-cols-3 gap-3">
              <Button variant={paymentMethod === 'cash' ? 'default' : 'outline'} className="h-20 flex-col gap-1 text-base font-bold" onClick={() => setPaymentMethod('cash')}>
                <Banknote className="h-5 w-5" />Dinheiro
              </Button>
              <Button variant={paymentMethod === 'pix' ? 'default' : 'outline'} className="h-20 flex-col gap-1 text-base font-bold" onClick={() => setPaymentMethod('pix')}>
                <Smartphone className="h-5 w-5" />Pix
              </Button>
              <Button variant={paymentMethod === 'card' ? 'default' : 'outline'} className="h-20 flex-col gap-1 text-base font-bold" onClick={() => setPaymentMethod('card')}>
                <CreditCard className="h-5 w-5" />Cartão
              </Button>
            </div>
          </div>

          <div>
            <p className="text-sm font-bold text-muted-foreground mb-3">Produtos</p>
            <div className="grid grid-cols-2 gap-3">
              {event.products.map(ep => {
                const prod = data.products.find(p => p.id === ep.productId);
                if (!prod) return null;
                const remaining = ep.quantityTaken - ep.quantitySold;
                const isFractional = prod.unit === 'kg' || prod.unit === 'g' || prod.unit === 'L' || prod.unit === 'mL';
                return (
                  <Button
                    key={ep.productId}
                    variant="outline"
                    className={`h-28 flex-col gap-2 text-lg font-bold border-2 transition-all active:scale-95 ${remaining > 0
                      ? 'border-primary bg-primary/15 hover:bg-primary/25 text-primary'
                      : 'border-destructive/30 bg-destructive/5 opacity-60'
                      }`}
                    disabled={remaining <= 0}
                    onClick={() => {
                      if (isFractional) {
                        setSaleQtyDialog(ep.productId);
                        setSaleQty("1");
                      } else {
                        handleSale(ep.productId);
                      }
                    }}
                  >
                    <span className="text-xl">{isFractional ? '' : '+1 '}{prod.name}</span>
                    <span className="text-sm font-normal opacity-70">
                      R$ {prod.price.toFixed(2)}/{UNIT_LABELS[prod.unit || 'un']} • {remaining % 1 === 0 ? remaining : remaining.toFixed(2)} restante
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Fractional sale dialog */}
          <Dialog open={!!saleQtyDialog} onOpenChange={() => setSaleQtyDialog(null)}>
            <DialogContent>
              <DialogHeader><DialogTitle>Quantidade vendida</DialogTitle></DialogHeader>
              {saleQtyDialog && (() => {
                const prod = data.products.find(p => p.id === saleQtyDialog);
                return (
                  <div className="space-y-4">
                    <p className="text-muted-foreground">{prod?.name} — R$ {prod?.price.toFixed(2)}/{UNIT_LABELS[prod?.unit || 'un']}</p>
                    <div><Label>Quantidade ({UNIT_LABELS[prod?.unit || 'un']})</Label><Input type="number" step="0.01" value={saleQty} onChange={(e: any) => setSaleQty(e.target.value)} placeholder="Ex: 0.5" autoFocus /></div>
                    {Number(saleQty) > 0 && prod && (
                      <p className="text-sm font-semibold">Total: R$ {(Number(saleQty) * prod.price).toFixed(2)}</p>
                    )}
                    <Button onClick={handleFractionalSale} className="w-full" size="lg">Registrar venda</Button>
                  </div>
                );
              })()}
            </DialogContent>
          </Dialog>

          {currentDaySales.length > 0 && (
            <Button variant="outline" className="w-full" onClick={handleUndo}>
              <Undo2 className="mr-2 h-4 w-4" />
              Desfazer última venda
              {lastSale && ` (${data.products.find(p => p.id === lastSale.productId)?.name})`}
            </Button>
          )}

          {currentDaySales.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Vendas recentes</CardTitle></CardHeader>
              <CardContent className="space-y-1 max-h-40 overflow-y-auto">
                {[...currentDaySales].reverse().slice(0, 10).map(sale => {
                  const prod = data.products.find(p => p.id === sale.productId);
                  const payLabels: Record<string, string> = { cash: '💵', pix: '📱', card: '💳' };
                  return (
                    <div key={sale.id} className="flex items-center justify-between text-sm py-1">
                      <span>{payLabels[sale.paymentMethod]} {prod?.name} — R$ {sale.total.toFixed(2)}</span>
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-destructive" onClick={() => {
                        undoSale(event.id, sale.id);
                        toast.info(`Venda de ${prod?.name} desfeita`);
                      }}>
                        <X className="h-3 w-3 mr-1" />Remover
                      </Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* End day / End event buttons */}
          {isMultiDay && !allDaysCompleted ? (
            <Button variant="secondary" size="lg" className="w-full text-lg py-6 mt-4" onClick={() => setShowEndDayConfirm(true)}>
              <Sun className="mr-2 h-5 w-5" />Finalizar dia {event.currentDay}
            </Button>
          ) : (
            <Button variant="destructive" size="lg" className="w-full text-lg py-6 mt-4" onClick={() => setShowEndEventConfirm(true)}>
              <Square className="mr-2 h-5 w-5" />Encerrar evento
            </Button>
          )}
        </>
      )}

      {/* End day confirmation */}
      <Dialog open={showEndDayConfirm} onOpenChange={setShowEndDayConfirm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Finalizar dia {event.currentDay}?</DialogTitle></DialogHeader>
          <p className="text-muted-foreground">As vendas deste dia serão salvas e você avançará para o dia {event.currentDay + 1}.</p>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setShowEndDayConfirm(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={handleEndDay}>Finalizar dia</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* End event confirmation */}
      <Dialog open={showEndEventConfirm} onOpenChange={setShowEndEventConfirm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Encerrar evento?</DialogTitle></DialogHeader>
          <p className="text-muted-foreground">Essa ação finalizará o evento por completo.</p>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setShowEndEventConfirm(false)}>Cancelar</Button>
            <Button variant="destructive" className="flex-1" onClick={handleEndEvent}>Encerrar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DayReport({ event, day, onClose }: { event: typeof useStore extends () => infer R ? R extends { events: (infer E)[] } ? E : never : never; day: number; onClose: () => void }) {
  const data = useStore();
  const daySales = event.sales.filter(s => s.day === day);
  const totalRevenue = daySales.reduce((s, sale) => s + sale.total, 0);

  const salesByProduct: Record<string, { name: string; qty: number; total: number }> = {};
  daySales.forEach(sale => {
    const prod = data.products.find(p => p.id === sale.productId);
    if (!salesByProduct[sale.productId]) salesByProduct[sale.productId] = { name: prod?.name || '?', qty: 0, total: 0 };
    salesByProduct[sale.productId].qty += sale.quantity;
    salesByProduct[sale.productId].total += sale.total;
  });

  const salesByPayment: Record<string, number> = {};
  daySales.forEach(s => { salesByPayment[s.paymentMethod] = (salesByPayment[s.paymentMethod] || 0) + s.total; });
  const paymentLabels: Record<string, string> = { cash: 'Dinheiro', pix: 'Pix', card: 'Cartão' };

  // Goals for this day
  const dayGoals = event.dayGoals?.find(dg => dg.day === day)?.productGoals || event.productGoals || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg">📊 Relatório — Dia {day}</h2>
        <Button variant="ghost" size="sm" onClick={onClose}><X className="h-4 w-4" /></Button>
      </div>
      <Card><CardContent className="p-5 text-center">
        <p className="text-sm text-muted-foreground">Receita do dia {day}</p>
        <p className="text-2xl font-extrabold text-success">R$ {totalRevenue.toFixed(2)}</p>
      </CardContent></Card>

      {/* Goals progress for this day */}
      {dayGoals.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Metas do dia {day}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {dayGoals.map(goal => {
              const prod = data.products.find(p => p.id === goal.productId);
              const sold = salesByProduct[goal.productId]?.qty || 0;
              const pct = goal.quantity > 0 ? Math.min(100, (sold / goal.quantity) * 100) : 0;
              return (
                <div key={goal.productId} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{prod?.name}</span>
                    <Badge variant={pct >= 100 ? 'default' : 'secondary'} className={pct >= 100 ? 'bg-success text-success-foreground' : ''}>
                      {pct.toFixed(0)}%
                    </Badge>
                  </div>
                  <Progress value={pct} className="h-2" />
                  <p className="text-xs text-muted-foreground">{sold}/{goal.quantity} un</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Card><CardHeader className="pb-2"><CardTitle className="text-base">Produtos vendidos</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {Object.values(salesByProduct).sort((a, b) => b.qty - a.qty).map((sp, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span>{sp.name} ({sp.qty} un)</span>
              <span className="font-bold">R$ {sp.total.toFixed(2)}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card><CardHeader className="pb-2"><CardTitle className="text-base">Pagamentos</CardTitle></CardHeader>
        <CardContent className="space-y-1">
          {Object.entries(salesByPayment).map(([method, total]) => (
            <div key={method} className="flex justify-between text-sm">
              <span>{paymentLabels[method] || method}</span>
              <span className="font-bold">R$ {total.toFixed(2)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function EventReport({ event }: { event: typeof useStore extends () => infer R ? R extends { events: (infer E)[] } ? E : never : never }) {
  const data = useStore();
  const navigate = useNavigate();
  const isMultiDay = event.durationDays > 1;

  const totalRevenue = event.sales.reduce((s, sale) => s + sale.total, 0);
  const prepCosts = (event.preparationCosts || []).reduce((s, c) => s + c.amount, 0);
  const eventProfit = totalRevenue - prepCosts;

  const salesByProduct: Record<string, { name: string; qty: number; total: number }> = {};
  event.sales.forEach(sale => {
    const prod = data.products.find(p => p.id === sale.productId);
    if (!salesByProduct[sale.productId]) salesByProduct[sale.productId] = { name: prod?.name || '?', qty: 0, total: 0 };
    salesByProduct[sale.productId].qty += sale.quantity;
    salesByProduct[sale.productId].total += sale.total;
  });
  const salesByPayment: Record<string, number> = {};
  event.sales.forEach(s => { salesByPayment[s.paymentMethod] = (salesByPayment[s.paymentMethod] || 0) + s.total; });
  const paymentLabels: Record<string, string> = { cash: 'Dinheiro', pix: 'Pix', card: 'Cartão' };

  // Overall goals
  const overallGoals = event.productGoals || [];

  return (
    <div className="space-y-5 animate-fade-in max-w-4xl">
      <h1 className="text-3xl font-extrabold">📊 Relatório: {event.name}</h1>
      {isMultiDay && <p className="text-muted-foreground">{event.durationDays} dias</p>}

      <div className="grid grid-cols-2 gap-4">
        <Card><CardContent className="p-5 text-center">
          <p className="text-sm text-muted-foreground">Receita</p>
          <p className="text-2xl font-extrabold text-success">R$ {totalRevenue.toFixed(2)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-5 text-center">
          <p className="text-sm text-muted-foreground">Lucro</p>
          <p className={`text-2xl font-extrabold ${eventProfit >= 0 ? 'text-success' : 'text-destructive'}`}>R$ {eventProfit.toFixed(2)}</p>
        </CardContent></Card>
      </div>

      {/* Overall product goals */}
      {overallGoals.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Metas de vendas</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {overallGoals.map(goal => {
              const prod = data.products.find(p => p.id === goal.productId);
              const sold = salesByProduct[goal.productId]?.qty || 0;
              const pct = goal.quantity > 0 ? Math.min(100, (sold / goal.quantity) * 100) : 0;
              return (
                <div key={goal.productId} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{prod?.name}</span>
                    <Badge variant={pct >= 100 ? 'default' : 'secondary'} className={pct >= 100 ? 'bg-success text-success-foreground' : ''}>
                      {pct.toFixed(0)}%
                    </Badge>
                  </div>
                  <Progress value={pct} className="h-2" />
                  <p className="text-xs text-muted-foreground">{sold}/{goal.quantity} un</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Per-day comparison for multi-day events */}
      {isMultiDay && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Comparação por dia</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: event.durationDays }, (_, i) => i + 1).map(day => {
              const daySales = event.sales.filter(s => s.day === day);
              const dayRevenue = daySales.reduce((s, sale) => s + sale.total, 0);
              const dayItems = daySales.length;

              // Day goals
              const dg = event.dayGoals?.find(g => g.day === day)?.productGoals || [];
              const totalGoalQty = dg.reduce((s, g) => s + g.quantity, 0);
              const totalSoldQty = daySales.reduce((s, sale) => s + sale.quantity, 0);
              const goalPct = totalGoalQty > 0 ? Math.min(100, (totalSoldQty / totalGoalQty) * 100) : 0;

              return (
                <div key={day} className="p-3 border rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="font-bold">Dia {day}</p>
                    <p className="text-success font-bold">R$ {dayRevenue.toFixed(2)}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{dayItems} vendas</p>
                  {totalGoalQty > 0 && (
                    <>
                      <Progress value={goalPct} className="h-2" />
                      <p className="text-xs text-muted-foreground">Meta: {goalPct.toFixed(0)}% ({totalSoldQty}/{totalGoalQty} un)</p>
                    </>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {prepCosts > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Custos de preparação</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {(event.preparationCosts || []).map((c, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span>{c.name}</span>
                <span className="text-destructive font-semibold">-R$ {c.amount.toFixed(2)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card><CardHeader className="pb-2"><CardTitle className="text-base">Produtos mais vendidos</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {Object.values(salesByProduct).sort((a, b) => b.qty - a.qty).map((sp, i) => {
            const medals = ['🥇', '🥈', '🥉'];
            const rank = i < 3 ? medals[i] : `${i + 1}º`;
            return (
              <div key={i} className="flex justify-between text-sm items-center">
                <span className="flex items-center gap-2">
                  <span className="font-bold min-w-[2rem]">{rank}</span>
                  <span>{sp.name} ({sp.qty} un)</span>
                </span>
                <span className="font-bold">R$ {sp.total.toFixed(2)}</span>
              </div>
            );
          })}
        </CardContent>
      </Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-base">Formas de pagamento</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {Object.entries(salesByPayment).sort((a, b) => b[1] - a[1]).map(([method, total], i) => {
            const medals = ['🥇', '🥈', '🥉'];
            const rank = i < 3 ? medals[i] : `${i + 1}º`;
            return (
              <div key={method} className="flex justify-between text-sm items-center">
                <span className="flex items-center gap-2">
                  <span className="font-bold min-w-[2rem]">{rank}</span>
                  <span>{paymentLabels[method] || method}</span>
                </span>
                <span className="font-bold">R$ {total.toFixed(2)}</span>
              </div>
            );
          })}
        </CardContent>
      </Card>
      <Button variant="outline" className="w-full" onClick={() => navigate('/events')}>Voltar</Button>
    </div>
  );
}

function EventPreStart({ event }: { event: typeof useStore extends () => infer R ? R extends { events: (infer E)[] } ? E : never : never }) {
  const data = useStore();
  const navigate = useNavigate();
  const [showPrep, setShowPrep] = useState(false);
  const isMultiDay = event.durationDays > 1;

  return (
    <div className="space-y-5 animate-fade-in max-w-4xl">
      <h1 className="text-3xl font-extrabold">{event.name}</h1>
      <p className="text-muted-foreground">
        {new Date(event.date).toLocaleDateString('pt-BR')}
        {isMultiDay && ` • ${event.durationDays} dias`}
      </p>
      <Card><CardContent className="p-5 space-y-2">
        <p className="font-bold">Produtos:</p>
        {event.products.map(ep => {
          const prod = data.products.find(p => p.id === ep.productId);
          return <div key={ep.productId} className="text-sm">{prod?.name} — {ep.quantityTaken} un</div>;
        })}
      </CardContent></Card>
      <Button size="lg" className="w-full text-lg py-6" onClick={() => setShowPrep(true)}>
        <Play className="mr-2 h-5 w-5" />Iniciar vendas
      </Button>
      <Button variant="outline" className="w-full" onClick={() => navigate('/events')}>Voltar</Button>

      <Dialog open={showPrep} onOpenChange={setShowPrep}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>🎒 Preparação do Evento</DialogTitle></DialogHeader>
          <EventPreparationModal eventId={event.id} onDone={() => setShowPrep(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EventComparison() {
  const data = useStore();
  const completedEvents = data.events.filter(e => e.isCompleted);
  const [eventA, setEventA] = useState('');
  const [eventB, setEventB] = useState('');

  const eA = data.events.find(e => e.id === eventA);
  const eB = data.events.find(e => e.id === eventB);

  const getStats = (event: typeof eA) => {
    if (!event) return null;
    const revenue = event.sales.reduce((s, sale) => s + sale.total, 0);
    const prepCosts = (event.preparationCosts || []).reduce((s, c) => s + c.amount, 0);
    const profit = revenue - prepCosts;
    const totalItems = event.sales.length;
    const byProduct: Record<string, { name: string; qty: number }> = {};
    event.sales.forEach(s => {
      const prod = data.products.find(p => p.id === s.productId);
      if (!byProduct[s.productId]) byProduct[s.productId] = { name: prod?.name || '?', qty: 0 };
      byProduct[s.productId].qty += s.quantity;
    });
    const topProduct = Object.values(byProduct).sort((a, b) => b.qty - a.qty)[0];
    const byPayment: Record<string, number> = {};
    event.sales.forEach(s => { byPayment[s.paymentMethod] = (byPayment[s.paymentMethod] || 0) + s.total; });

    // Goal achievement
    const goals = event.productGoals || [];
    let goalPct = 0;
    if (goals.length > 0) {
      const totalGoalQty = goals.reduce((s, g) => s + g.quantity, 0);
      const totalSoldQty = event.sales.reduce((s, sale) => s + sale.quantity, 0);
      goalPct = totalGoalQty > 0 ? (totalSoldQty / totalGoalQty) * 100 : 0;
    }

    return { revenue, profit, totalItems, topProduct, byPayment, goalPct };
  };

  const statsA = getStats(eA);
  const statsB = getStats(eB);
  const paymentLabels: Record<string, string> = { cash: 'Dinheiro', pix: 'Pix', card: 'Cartão' };

  if (completedEvents.length < 2) {
    return (
      <Card><CardContent className="p-10 text-center text-muted-foreground">
        <GitCompare className="mx-auto h-14 w-14 mb-4 opacity-40" />
        <p className="font-semibold text-foreground">É necessário pelo menos 2 eventos concluídos para comparar</p>
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Evento A</Label>
          <Select value={eventA} onValueChange={setEventA}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {completedEvents.filter(e => e.id !== eventB).map(e => (
                <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Evento B</Label>
          <Select value={eventB} onValueChange={setEventB}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {completedEvents.filter(e => e.id !== eventA).map(e => (
                <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {statsA && statsB && eA && eB && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-primary/30"><CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground font-semibold">{eA.name}</p>
              <p className="text-lg font-extrabold text-success">R$ {statsA.revenue.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Receita</p>
            </CardContent></Card>
            <Card className="border-accent/30"><CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground font-semibold">{eB.name}</p>
              <p className="text-lg font-extrabold text-success">R$ {statsB.revenue.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Receita</p>
            </CardContent></Card>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Card><CardContent className="p-4 text-center">
              <p className={`text-lg font-extrabold ${statsA.profit >= 0 ? 'text-success' : 'text-destructive'}`}>R$ {statsA.profit.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Lucro</p>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <p className={`text-lg font-extrabold ${statsB.profit >= 0 ? 'text-success' : 'text-destructive'}`}>R$ {statsB.profit.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Lucro</p>
            </CardContent></Card>
          </div>

          {/* Goal comparison */}
          {(statsA.goalPct > 0 || statsB.goalPct > 0) && (
            <div className="grid grid-cols-2 gap-3">
              <Card><CardContent className="p-4 text-center">
                <p className="text-lg font-extrabold">{statsA.goalPct.toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground">Meta atingida</p>
                <Progress value={Math.min(100, statsA.goalPct)} className="h-2 mt-2" />
              </CardContent></Card>
              <Card><CardContent className="p-4 text-center">
                <p className="text-lg font-extrabold">{statsB.goalPct.toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground">Meta atingida</p>
                <Progress value={Math.min(100, statsB.goalPct)} className="h-2 mt-2" />
              </CardContent></Card>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Card><CardContent className="p-4 text-center">
              <p className="text-sm font-bold">🏆 {statsA.topProduct?.name || '-'}</p>
              <p className="text-xs text-muted-foreground">Mais vendido ({statsA.topProduct?.qty || 0} un)</p>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <p className="text-sm font-bold">🏆 {statsB.topProduct?.name || '-'}</p>
              <p className="text-xs text-muted-foreground">Mais vendido ({statsB.topProduct?.qty || 0} un)</p>
            </CardContent></Card>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Card><CardContent className="p-4">
              <p className="text-xs font-bold mb-1 text-muted-foreground">Pagamentos</p>
              {Object.entries(statsA.byPayment).map(([m, v]) => (
                <div key={m} className="flex justify-between text-xs"><span>{paymentLabels[m]}</span><span>R$ {v.toFixed(2)}</span></div>
              ))}
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <p className="text-xs font-bold mb-1 text-muted-foreground">Pagamentos</p>
              {Object.entries(statsB.byPayment).map(([m, v]) => (
                <div key={m} className="flex justify-between text-xs"><span>{paymentLabels[m]}</span><span>R$ {v.toFixed(2)}</span></div>
              ))}
            </CardContent></Card>
          </div>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-5 space-y-1">
              <p className="font-bold text-sm">🧠 Conclusão:</p>
              <p className="text-sm">
                {statsA.profit > statsB.profit
                  ? `"${eA.name}" foi mais lucrativo (R$ ${(statsA.profit - statsB.profit).toFixed(2)} a mais)`
                  : statsB.profit > statsA.profit
                    ? `"${eB.name}" foi mais lucrativo (R$ ${(statsB.profit - statsA.profit).toFixed(2)} a mais)`
                    : 'Ambos tiveram o mesmo lucro'}
              </p>
              <p className="text-sm">
                {statsA.totalItems > statsB.totalItems
                  ? `"${eA.name}" vendeu mais produtos (${statsA.totalItems} vs ${statsB.totalItems})`
                  : statsB.totalItems > statsA.totalItems
                    ? `"${eB.name}" vendeu mais produtos (${statsB.totalItems} vs ${statsA.totalItems})`
                    : 'Ambos venderam a mesma quantidade'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export function EventDetail() {
  const { id } = useParams();
  if (!id) return null;
  return <EventSalesMode eventId={id} />;
}

export default function Events() {
  const data = useStore();
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showCompare, setShowCompare] = useState(false);

  const activeEvents = data.events.filter(e => e.isActive);
  const upcoming = data.events.filter(e => !e.isActive && !e.isCompleted);
  const completed = data.events.filter(e => e.isCompleted);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDeleteConfirm(id);
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteEvent(deleteConfirm);
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl">
      <h1 className="text-3xl font-extrabold">Eventos</h1>

      <div className="flex gap-3 flex-wrap">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2 text-base text-white bg-green-700 hover:bg-green-800"><Plus className="h-5 w-5" />Novo evento</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] text overflow-y-auto">
            <DialogHeader><DialogTitle>Criar evento</DialogTitle></DialogHeader>
            <CreateEventForm onClose={() => setCreateOpen(false)} />
          </DialogContent>
        </Dialog>

        {completed.length >= 2 && (
          <Button variant="outline" size="lg" onClick={() => setShowCompare(!showCompare)}>
            <GitCompare className="mr-2 h-4 w-4" />Comparar eventos
          </Button>
        )}
      </div>

      {showCompare && <EventComparison />}

      {activeEvents.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-bold text-lg">🔴 Ao vivo</h2>
          {activeEvents.map(e => (
            <Card key={e.id} className="border-primary cursor-pointer card-hover" onClick={() => navigate(`/events/${e.id}`)}>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="font-bold text-lg">{e.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {e.sales.length} vendas
                    {e.durationDays > 1 && ` • Dia ${e.currentDay}/${e.durationDays}`}
                  </p>
                </div>
                <Badge variant="destructive" className="animate-pulse">AO VIVO</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-bold text-lg">Próximos</h2>
          {upcoming.map(e => (
            <Card key={e.id} className="cursor-pointer card-hover" onClick={() => navigate(`/events/${e.id}`)}>
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-bold">{e.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(e.date).toLocaleDateString('pt-BR')} • {e.products.length} produtos
                    {e.durationDays > 1 && ` • ${e.durationDays} dias`}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={(ev) => handleDelete(e.id, ev)}>
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {completed.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-bold text-lg">Concluídos</h2>
          {completed.map(e => {
            const total = e.sales.reduce((s, sale) => s + sale.total, 0);
            return (
              <Card key={e.id} className="cursor-pointer card-hover" onClick={() => navigate(`/events/${e.id}`)}>
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-bold">{e.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(e.date).toLocaleDateString('pt-BR')} • R$ {total.toFixed(2)}
                      {e.durationDays > 1 && ` • ${e.durationDays} dias`}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={(ev) => handleDelete(e.id, ev)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {data.events.length === 0 && (
        <Card><CardContent className="p-10 text-center text-muted-foreground">
          <CalendarDays className="mx-auto h-14 w-14 mb-4 opacity-40" />
          <p className="font-semibold text-foreground">Você ainda não criou nenhum evento</p>
          <p className="text-sm mt-1">Crie seu primeiro para começar a vender 👇</p>
        </CardContent></Card>
      )}

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Excluir evento?</DialogTitle></DialogHeader>
          <p className="text-muted-foreground">Essa ação não pode ser desfeita.</p>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
            <Button variant="destructive" className="flex-1" onClick={confirmDelete}>Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
