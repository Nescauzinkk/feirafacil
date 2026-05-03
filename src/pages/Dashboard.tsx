import { useEffect } from "react";
import { useState, useMemo } from "react";
import { useStore } from "@/hooks/useStore";
import { getTodaySales, getTotalRevenue, getTotalExpenses, getLowStockIngredients, getActiveEvent } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, TrendingUp, TrendingDown, DollarSign, CalendarDays, ShoppingBag, Plus, Rocket } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";


export default function Dashboard() {
  const data = useStore();
  const todaySales = getTodaySales();
  const revenue = getTotalRevenue();
  const expenses = getTotalExpenses();
  const profit = revenue - expenses;
  const lowStock = getLowStockIngredients();
  const activeEvent = getActiveEvent();
  const nextEvent = data.events.find(e => !e.isCompleted && !e.isActive);
  const navigate = useNavigate();

  const today = new Date().toDateString();
  const todayTx = data.transactions.filter(t => new Date(t.date).toDateString() === today);
  const todayExpenses = todayTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const todayItemsSold = todayTx.filter(t => t.type === 'income' && t.category === 'Vendas').length;

  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);

  const chartData = useMemo(() => {
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    to.setHours(23, 59, 59);
    const dayMap: Record<string, { date: string; entradas: number; saidas: number }> = {};
    const cursor = new Date(from);
    while (cursor <= to) {
      const key = cursor.toISOString().split('T')[0];
      dayMap[key] = { date: new Date(key).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), entradas: 0, saidas: 0 };
      cursor.setDate(cursor.getDate() + 1);
    }
    data.transactions.forEach(t => {
      const d = new Date(t.date);
      if (d < from || d > to) return;
      const key = d.toISOString().split('T')[0];
      if (!dayMap[key]) return;
      if (t.type === 'income') dayMap[key].entradas += t.amount;
      else dayMap[key].saidas += t.amount;
    });
    return Object.values(dayMap);
  }, [data.transactions, dateFrom, dateTo]);

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-3xl font-extrabold">Olá! 👋</h1>
        <p className="text-muted-foreground mt-1">Aqui está o resumo do seu negócio.</p>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3 flex-wrap">
        <Button size="lg" onClick={() => navigate('/events')} className="text-white bg-green-700 hover:bg-green-800 gap-2">
          <Plus className="text-white h-4 w-4" />Novo Evento
        </Button>
        <Button size="lg" variant="outline" onClick={() => navigate('/finance')} className="gap-2 bg-yellow-500 hover:bg-yellow-600">
          <DollarSign className="h-4 w-4" />Registrar Venda
        </Button>
      </div>

      {activeEvent && (
        <Card className="border-primary bg-primary/5 cursor-pointer card-hover" onClick={() => navigate(`/events/${activeEvent.id}`)}>
          <CardContent className="p-5 flex items-center gap-3">
            <CalendarDays className="h-6 w-6 text-primary" />
            <div>
              <p className="font-bold text-lg">Evento ativo: {activeEvent.name}</p>
              <p className="text-sm text-muted-foreground">Toque para registrar vendas</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards - clickable */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="card-hover cursor-pointer" onClick={() => navigate('/events')}>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2"><ShoppingBag className="h-5 w-5 text-primary" /><span className="text-sm text-muted-foreground">Vendas hoje</span></div>
            <p className="text-2xl font-extrabold">R$ {todaySales.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="card-hover cursor-pointer" onClick={() => navigate('/finance')}>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2"><TrendingUp className="h-5 w-5 text-success" /><span className="text-sm text-muted-foreground">Entradas</span></div>
            <p className="text-2xl font-extrabold text-success text-green-600">R$ {revenue.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="card-hover cursor-pointer" onClick={() => navigate('/finance')}>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2"><TrendingDown className="h-5 w-5 text-destructive" /><span className="text-sm text-muted-foreground">Saídas</span></div>
            <p className="text-2xl font-extrabold text-destructive text-red-600">R$ {expenses.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card
          className={`card-hover cursor-pointer ${profit > 0
            ? '!bg-green-100 border-green-200'
            : profit < 0
              ? '!bg-red-100 border-red-200'
              : '!bg-gray-100'
            }`}
          onClick={() => navigate('/finance')}
        >
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2"><DollarSign className="h-5 w-5 text-accent" /><span className="text-sm text-muted-foreground">Lucro</span></div>
            <p className={`text-2xl font-extrabold ${profit > 0
              ? 'text-green-600'
              : profit < 0
                ? 'text-red-600'
                : 'text-gray-500'
              }`}>
              R$ {profit.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Today's summary with actionable language */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-5">
          <p className="text-sm font-semibold">
            {todaySales > 0 ? (
              <>👉 Hoje você faturou R$ {todaySales.toFixed(2)}.
                {todayExpenses > 0 && ` Gastou R$ ${todayExpenses.toFixed(2)}.`}
                {todayItemsSold > 0 && ` Vendeu ${todayItemsSold} item(ns).`}</>
            ) : (
              <>👉 Você ainda não fez vendas hoje. {activeEvent ? 'Acesse o evento ativo para começar!' : 'Inicie um evento para começar a vender'} <Rocket className="inline h-4 w-4" /></>
            )}
          </p>
        </CardContent>
      </Card>

      {/* Bar chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold">📊 Movimentação financeira</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">De</Label><Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></div>
            <div><Label className="text-xs">Até</Label><Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} /></div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `R$${v}`} />
                <Tooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
                <Bar dataKey="entradas" fill="hsl(var(--success))" name="Entradas" radius={[2, 2, 0, 0]} />
                <Bar dataKey="saidas" fill="hsl(var(--destructive))" name="Saídas" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {lowStock.length > 0 && (
        <div className="pt-6"> <Card className="mt-6 bg-yellow-100 border-yellow-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />Estoque baixo
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {lowStock.map(i => (
                <Badge
                  key={i.name} // 🔥 ESSENCIAL
                  className="bg-yellow-400 text-yellow-800 border-yellow-800"
                >
                  {i.name}: {i.quantity} {i.unit}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
        </div>
      )
      }

      {nextEvent && !activeEvent && (
        <Card className="card-hover cursor-pointer" onClick={() => navigate('/events')}>
          <CardContent className="p-5 flex items-center gap-3">
            <CalendarDays className="h-6 w-6 text-muted-foreground" />
            <div>
              <p className="font-bold">Próximo evento: {nextEvent.name}</p>
              <p className="text-sm text-muted-foreground">
                {new Date(nextEvent.date).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div >
  );
}
