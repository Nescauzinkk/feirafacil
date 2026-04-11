import { useState, useMemo } from "react";
import { useStore } from "@/hooks/useStore";
import { addTransaction, deleteTransaction, updateTransaction, getTotalRevenue, getTotalExpenses } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, DollarSign, Plus, Trash2, Pencil, ChevronLeft } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const EXPENSE_CATEGORIES = [
  "Insumos", "Estrutura", "Manutenção", "Transporte",
  "Alimentação", "Investimento", "Lazer", "Taxas e Impostos", "Ajudante", "Outros",
];

const INCOME_CATEGORIES = ["Vendas", "Vendas Avulsas", "Outros"];

const INCOME_COLORS = [
  'hsl(142, 71%, 45%)', 'hsl(142, 50%, 55%)', 'hsl(160, 60%, 40%)',
  'hsl(120, 40%, 50%)', 'hsl(155, 55%, 35%)', 'hsl(135, 45%, 60%)',
  'hsl(170, 50%, 45%)', 'hsl(100, 40%, 45%)', 'hsl(142, 35%, 65%)', 'hsl(145, 60%, 30%)',
];

const EXPENSE_COLORS = [
  'hsl(0, 70%, 55%)', 'hsl(0, 55%, 45%)', 'hsl(10, 65%, 50%)',
  'hsl(350, 60%, 55%)', 'hsl(15, 70%, 45%)', 'hsl(0, 50%, 60%)',
  'hsl(5, 60%, 40%)', 'hsl(345, 55%, 50%)', 'hsl(20, 50%, 55%)', 'hsl(0, 45%, 65%)',
];

function AddTransactionForm({ type, onClose, editTx }: { type: 'income' | 'expense'; onClose: () => void; editTx?: { id: string; amount: number; description: string; category: string } }) {
  const [amount, setAmount] = useState(editTx?.amount.toString() || "");
  const [description, setDescription] = useState(editTx?.description || "");
  const [category, setCategory] = useState(editTx?.category || "");
  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const handleSubmit = () => {
    if (!amount || !description) return;
    if (editTx) {
      updateTransaction(editTx.id, { amount: Number(amount), description, category: category || 'Outros' });
    } else {
      addTransaction({ type, amount: Number(amount), description, category: category || 'Outros', date: new Date().toISOString() });
    }
    onClose();
  };

  return (
    <div className="space-y-4">
      <div><Label>Descrição</Label><Input value={description} onChange={(e: any) => setDescription(e.target.value)} placeholder={type === 'income' ? "Ex: Venda avulsa" : "Ex: Compra de farinha"} /></div>
      <div><Label>Valor (R$)</Label><Input type="number" step="0.01" value={amount} onChange={(e: any) => setAmount(e.target.value)} /></div>
      <div>
        <Label>Categoria</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger><SelectValue placeholder="Selecione a categoria" /></SelectTrigger>
          <SelectContent className="bg-white shadow-xl border rounded-lg backdrop-blur-sm">
            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Button onClick={handleSubmit} className="w-full bg-green-700 hover:bg-green-800 text-white" size="lg">{editTx ? 'Atualizar' : 'Salvar'}</Button>
    </div>
  );
}

function TransactionCard({ tx, onEdit, onDelete }: { tx: { id: string; type: string; amount: number; description: string; date: string; category: string }; onEdit: () => void; onDelete: () => void }) {
  return (
    <Card className={`card-hover ${tx.type === 'income'
      ? 'bg-green-50 border-green-200'
      : 'bg-red-50 border-red-200'
      }`}>
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex-1">
          <p className="font-semibold text-sm">{tx.description}</p>
          <p className="text-xs text-muted-foreground">{new Date(tx.date).toLocaleDateString('pt-BR')}{tx.category ? ` • ${tx.category}` : ''}</p>
        </div>
        <div className="flex items-center gap-1">
          <p className={`font-bold mr-2 ${tx.type === 'income'
            ? 'text-green-600'
            : 'text-red-400'
            }`}>
            {tx.type === 'income' ? '+' : '-'} R$ {tx.amount.toFixed(2)}
          </p>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CategoryDetailPanel({ title, transactions, onClose }: { title: string; transactions: { id: string; description: string; amount: number; date: string; category: string; eventId?: string }[]; onClose: () => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}><ChevronLeft className="h-4 w-4" /></Button>
        <h3 className="font-bold text-sm">{title}</h3>
        <span className="text-xs text-muted-foreground ml-auto">{transactions.length} itens</span>
      </div>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {transactions.map(tx => (
          <div key={tx.id}
            className={`flex justify-between items-center p-3 rounded-lg text-sm ${title.includes("Entrada") || title.includes("Vendas")
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
              }`}>
            <div>
              <p className="font-semibold">{tx.description}</p>
              <p className="text-xs text-muted-foreground">{new Date(tx.date).toLocaleDateString('pt-BR')}</p>
            </div>
            <p className="font-bold">R$ {tx.amount.toFixed(2)}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground text-right font-bold">
        Total: R$ {transactions.reduce((s, t) => s + t.amount, 0).toFixed(2)}
      </p>
    </div>
  );
}

export default function Finance() {
  const data = useStore();
  const revenue = getTotalRevenue();
  const expenses = getTotalExpenses();
  const profit = revenue - expenses;
  const profitPct = revenue > 0 ? ((profit / revenue) * 100) : 0;
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [editTx, setEditTx] = useState<{ id: string; type: string; amount: number; description: string; category: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [selectedIncomeCategory, setSelectedIncomeCategory] = useState<string | null>(null);
  const [selectedExpenseCategory, setSelectedExpenseCategory] = useState<string | null>(null);

  const allSorted = [...data.transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const incomeTransactions = allSorted.filter(t => t.type === 'income');
  const expenseTransactions = allSorted.filter(t => t.type === 'expense');

  const handleEdit = (tx: typeof data.transactions[0]) => {
    setEditTx({ id: tx.id, type: tx.type, amount: tx.amount, description: tx.description, category: tx.category });
  };

  const incomeByCategory = useMemo(() => {
    const cats: Record<string, number> = {};
    incomeTransactions.forEach(t => { const cat = t.category || 'Outros'; cats[cat] = (cats[cat] || 0) + t.amount; });
    return Object.entries(cats).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [incomeTransactions]);

  const expenseByCategory = useMemo(() => {
    const cats: Record<string, number> = {};
    expenseTransactions.forEach(t => { const cat = t.category || 'Outros'; cats[cat] = (cats[cat] || 0) + t.amount; });
    return Object.entries(cats).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [expenseTransactions]);

  const selectedIncomeTxs = useMemo(() => {
    if (!selectedIncomeCategory) return [];
    return incomeTransactions.filter(t => (t.category || 'Outros') === selectedIncomeCategory);
  }, [selectedIncomeCategory, incomeTransactions]);

  const selectedExpenseTxs = useMemo(() => {
    if (!selectedExpenseCategory) return [];
    return expenseTransactions.filter(t => (t.category || 'Outros') === selectedExpenseCategory);
  }, [selectedExpenseCategory, expenseTransactions]);

  const handleIncomePieClick = (_: unknown, index: number) => {
    setSelectedIncomeCategory(incomeByCategory[index]?.name || null);
  };

  const handleExpensePieClick = (_: unknown, index: number) => {
    setSelectedExpenseCategory(expenseByCategory[index]?.name || null);
  };

  const renderList = (txs: typeof data.transactions) =>
    txs.length === 0 ? (
      <p className="text-center text-muted-foreground py-10">Nenhuma movimentação registrada</p>
    ) : (
      txs.map(tx => (
        <TransactionCard key={tx.id} tx={tx} onEdit={() => handleEdit(tx)} onDelete={() => setDeleteConfirm(tx.id)} />
      ))
    );

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-3xl font-extrabold">Finanças</h1>
        <p className="text-muted-foreground mt-1">Resumo financeiro do seu negócio</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="card-hover bg-green-200 border-green-500"><CardContent className="p-4 text-center text-green-800">
          <TrendingUp className="mx-auto h-5 w-5 text-success mb-1" />
          <p className="text-xs border-green-200 text-muted-foreground">Entradas</p>
          <p className="text-xl font-extrabold text-success">R$ {revenue.toFixed(2)}</p>
        </CardContent></Card>
        <Card className="card-hover bg-red-200 border-red-500"><CardContent className="text-red-800 p-4 text-center">
          <TrendingDown className="mx-auto h-5 w-5 text-destructive mb-1" />
          <p className="text-xs border-red-200 text-muted-foreground">Saídas</p>
          <p className="text-xl font-extrabold text-destructive">R$ {expenses.toFixed(2)}</p>
        </CardContent></Card>
        <Card className="card-hover bg-yellow-200 border-yellow-800"><CardContent className="p-4 text-center text-yellow-800">
          <DollarSign className="mx-auto h-5 w-5 text-accent mb-1" />
          <p className="text-xs text-muted-foreground">Lucro</p>
          <p className={`text-xl font-extrabold ${profit >= 0 ? 'text-success' : 'text-destructive'}`}>R$ {profit.toFixed(2)}</p>
        </CardContent></Card>
      </div>

      {/* Net Profit */}
      <Card className={`card-hover ${profit > 0
        ? "bg-green-50 border-green-200"
        : profit < 0
          ? "bg-red-50 border-red-200"
          : "bg-gray-50 border-gray-200"
        }`}>
        <CardContent
          className={`p-5 text-center border-2 ${profit > 0
              ? "bg-green-300 border-green-800"
              : profit < 0
                ? "bg-red-300 border-red-800"
                : "bg-gray-200 border-gray-400"
            }`}
        >
          <p className="text-sm text-muted-foreground font-medium">Lucro Líquido</p>
          <p className={`text-3xl font-extrabold ${profit > 0
            ? "text-green-700"
            : profit < 0
              ? "text-red-700"
              : "text-gray-600"
            }`}>
            R$ {profit.toFixed(2)} ({profitPct.toFixed(1)}%)
          </p>
        </CardContent>
      </Card>

      {/* Charts */}
      {data.transactions.length > 0 && (
        <div className="bg-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base text-success flex items-center gap-2"><TrendingUp className="h-4 w-4" />Entradas por Categoria</CardTitle></CardHeader>
            <CardContent className="bg-gray-100">
              {selectedIncomeCategory ? (
                <CategoryDetailPanel title={selectedIncomeCategory} transactions={selectedIncomeTxs} onClose={() => setSelectedIncomeCategory(null)} />
              ) : incomeByCategory.length > 0 ? (
                <>
                  <div className="w-full h-[300px] min-h-[300px]">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie data={incomeByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} onClick={handleIncomePieClick} cursor="pointer"
                          label={({ name, percent }) => `${name.substring(0, 10)} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                          {incomeByCategory.map((_, i) => <Cell key={i} fill={INCOME_COLORS[i % INCOME_COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-1">Clique em uma fatia para ver detalhes</p>
                </>
              ) : (
                <p className="text-centertext-muted-foreground py-8 text-sm">Sem entradas</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base text-destructive flex items-center gap-2"><TrendingDown className="h-4 w-4" />Saídas por Categoria</CardTitle></CardHeader>
            <CardContent>
              {selectedExpenseCategory ? (
                <CategoryDetailPanel title={selectedExpenseCategory} transactions={selectedExpenseTxs} onClose={() => setSelectedExpenseCategory(null)} />
              ) : expenseByCategory.length > 0 ? (
                <>
                  <div className="w-full h-[300px] min-h-[300px]">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie data={expenseByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} onClick={handleExpensePieClick} cursor="pointer"
                          label={({ name, percent }) => `${name.substring(0, 10)} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                          {expenseByCategory.map((_, i) => <Cell key={i} fill={EXPENSE_COLORS[i % EXPENSE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-1">Clique em uma fatia para ver detalhes</p>
                </>
              ) : (
                <p className="text-center text-muted-foreground py-8 text-sm">Sem saídas</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Dialog open={incomeOpen} onOpenChange={setIncomeOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="flex-1 gap-2 text-base bg-green-700 hover:bg-green-800 text-white">Entrada</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova entrada</DialogTitle></DialogHeader>
            <AddTransactionForm type="income" onClose={() => setIncomeOpen(false)} />
          </DialogContent>
        </Dialog>
        <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="flex-1 gap-2 text-base bg-red-700 hover:bg-red-800 text-white">Saída</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova saída</DialogTitle></DialogHeader>
            <AddTransactionForm type="expense" onClose={() => setExpenseOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Transaction List */}
      <Tabs defaultValue="all">
        <TabsList className="grid w-full grid-cols-3 bg-gray-200 p-1 rounded-lg">
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-gray-400 data-[state=active]:text-white bg-gray-200"
          >
            Tudo
          </TabsTrigger>

          <TabsTrigger
            value="income"
            className="data-[state=active]:bg-gray-400 data-[state=active]:text-white bg-gray-200"
          >
            Entradas
          </TabsTrigger>

          <TabsTrigger
            value="expenses"
            className="data-[state=active]:bg-gray-400 data-[state=active]:text-white bg-gray-200"
          >
            Saídas
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4 space-y-2">{renderList(allSorted)}</TabsContent>
        <TabsContent value="income" className="mt-4 space-y-2">{renderList(incomeTransactions)}</TabsContent>
        <TabsContent value="expenses" className="mt-4 space-y-2">{renderList(expenseTransactions)}</TabsContent>
      </Tabs>

      <Dialog open={!!editTx} onOpenChange={() => setEditTx(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar {editTx?.type === 'income' ? 'entrada' : 'saída'}</DialogTitle></DialogHeader>
          {editTx && <AddTransactionForm type={editTx.type as 'income' | 'expense'} onClose={() => setEditTx(null)} editTx={editTx} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Excluir transação?</DialogTitle></DialogHeader>
          <p className="text-muted-foreground">Essa ação não pode ser desfeita.</p>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
            <Button variant="destructive" className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold shadow-sm" onClick={() => { if (deleteConfirm) deleteTransaction(deleteConfirm); setDeleteConfirm(null); }}>Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
