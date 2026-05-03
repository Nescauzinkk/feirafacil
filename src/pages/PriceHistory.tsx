import { useState, useMemo } from "react";
import { useStore } from "@/hooks/useStore";
import { getIngredientPriceHistory } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";

const CHART_COLORS = [
  'hsl(142, 76%, 36%)', 'hsl(221, 83%, 53%)', 'hsl(0, 84%, 60%)',
  'hsl(45, 93%, 47%)', 'hsl(280, 67%, 55%)', 'hsl(190, 90%, 40%)',
  'hsl(330, 80%, 50%)', 'hsl(25, 95%, 53%)',
];

export default function PriceHistory() {
  const data = useStore();
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const ingredientsToShow = useMemo(() => {
    if (selectedIngredients.length > 0) return selectedIngredients;
    return data.ingredients.map(i => i.id).filter(id => getIngredientPriceHistory(id).length > 0);
  }, [selectedIngredients, data.ingredients]);

  const toggleIngredient = (id: string) => {
    setSelectedIngredients(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const { chartData, insights } = useMemo(() => {
    if (ingredientsToShow.length === 0) return { chartData: [], insights: [] };
    const dateMap: Record<string, Record<string, number>> = {};

    ingredientsToShow.forEach(ingId => {
      let items = getIngredientPriceHistory(ingId);
      if (dateFrom) items = items.filter(h => h.date >= dateFrom);
      if (dateTo) items = items.filter(h => h.date <= dateTo + "T23:59:59");

      items.forEach(h => {
        const dateKey = new Date(h.date).toLocaleDateString('pt-BR');
        if (!dateMap[dateKey]) dateMap[dateKey] = { _ts: new Date(h.date).getTime() } as any;
        const ing = data.ingredients.find(i => i.id === ingId);
        if (ing) dateMap[dateKey][ing.name] = h.costPerUnit;
      });
    });

    const sorted = Object.entries(dateMap)
      .sort((a, b) => (a[1] as any)._ts - (b[1] as any)._ts)
      .map(([date, vals]) => {
        const { _ts, ...rest } = vals as any;
        return { date, ...rest };
      });

    const insightList: { text: string; icon: 'up' | 'down' | 'stable'; color: string }[] = [];
    ingredientsToShow.forEach(ingId => {
      let items = getIngredientPriceHistory(ingId);
      if (dateFrom) items = items.filter(h => h.date >= dateFrom);
      if (dateTo) items = items.filter(h => h.date <= dateTo + "T23:59:59");
      if (items.length < 2) return;
      const ing = data.ingredients.find(i => i.id === ingId);
      const first = items[0].costPerUnit;
      const last = items[items.length - 1].costPerUnit;
      const change = ((last - first) / first) * 100;
      const name = ing?.name || 'Item';

      if (Math.abs(change) < 3) {
        insightList.push({ text: `${name} está estável no período.`, icon: 'stable', color: 'text-muted-foreground' });
      } else if (change > 0) {
        insightList.push({ text: `${name} subiu ${change.toFixed(0)}% no período.`, icon: 'up', color: 'text-destructive' });
      } else {
        insightList.push({ text: `${name} caiu ${Math.abs(change).toFixed(0)}% no período.`, icon: 'down', color: 'text-success' });
      }
    });

    return { chartData: sorted, insights: insightList };
  }, [ingredientsToShow, dateFrom, dateTo, data.ingredients]);

  const ingredientNames = ingredientsToShow.map(id => data.ingredients.find(i => i.id === id)?.name).filter(Boolean) as string[];

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl">
      <h1 className="text-3xl font-extrabold">Histórico de Preços</h1>

      <Card>
        <CardContent className="p-5 space-y-4">
          <div>
            <Label className="text-sm font-semibold">Selecione um ingrediente (ou deixe vazio para ver todos)</Label>
            <div className="flex flex-wrap gap-2 mt-3">
              {data.ingredients.map((ing, idx) => {
                const isSelected = selectedIngredients.includes(ing.id);
                const hasHistory = getIngredientPriceHistory(ing.id).length > 0;
                return (
                  <Badge
                    key={ing.id}
                    className={`cursor-pointer transition-all
    ${!hasHistory ? 'opacity-40' : ''}
    ${isSelected
                        ? 'bg-gray-500 text-white hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }
  `}
                    onClick={() => toggleIngredient(ing.id)}
                  >
                    {ing.name}
                  </Badge>
                );
              })}
            </div>
            {selectedIngredients.length > 0 && (
              <button className="text-xs mt-2 hover:text-gray-600 transition"
                onClick={() => setSelectedIngredients([])}>
                Limpar filtro (mostrar todos)
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>De</Label><Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></div>
            <div><Label>Até</Label><Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} /></div>
          </div>
        </CardContent>
      </Card>

      {chartData.length > 0 ? (
        <>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold">Preço ao longo do tempo</CardTitle>
            </CardHeader>
            <CardContent className="p-4 h-72">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `R$${v.toFixed(2)}`} />
                  <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                  <Legend />
                  {ingredientNames.map((name, idx) => (
                    <Line
                      key={name}
                      type="monotone"
                      dataKey={name}
                      stroke={CHART_COLORS[data.ingredients.findIndex(i => i.name === name) % CHART_COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {insights.length > 0 && (
            <div className="space-y-2">
              {insights.map((insight, i) => (
                <Card key={i} className={`border-l-4 ${insight.icon === 'up' ? 'border-l-destructive' : insight.icon === 'down' ? 'border-l-success' : 'border-l-muted-foreground'}`}>
                  <CardContent className="p-4 flex items-center gap-3">
                    {insight.icon === 'up' && <TrendingUp className="h-5 w-5 text-destructive shrink-0" />}
                    {insight.icon === 'down' && <TrendingDown className="h-5 w-5 text-success shrink-0" />}
                    {insight.icon === 'stable' && <Minus className="h-5 w-5 text-muted-foreground shrink-0" />}
                    <p className={`text-sm font-semibold ${insight.color}`}>💡 {insight.text}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            <BarChart3 className="mx-auto h-14 w-14 mb-4 opacity-40" />
            <p className="font-semibold text-foreground">
              {data.ingredients.length === 0
                ? 'Você ainda não registrou compras'
                : ingredientsToShow.length === 0
                  ? 'Nenhuma compra registrada ainda'
                  : 'Nenhuma compra registrada para os ingredientes selecionados'}
            </p>
            <p className="text-sm mt-1">Registre compras no Estoque para acompanhar os preços.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
