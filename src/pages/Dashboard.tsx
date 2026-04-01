import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Plus, CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// Mock data for initial UI
const mockChartData = [
  { month: "Jan", income: 5000000, expense: 3200000 },
  { month: "Feb", income: 4800000, expense: 3500000 },
  { month: "Mar", income: 5200000, expense: 2800000 },
  { month: "Apr", income: 5500000, expense: 4100000 },
  { month: "Mei", income: 6000000, expense: 3600000 },
  { month: "Jun", income: 5800000, expense: 3900000 },
];

const mockTransactions = [
  { id: 1, name: "Gaji Bulanan", category: "Gaji", amount: 8000000, type: "income", date: "Hari ini" },
  { id: 2, name: "Makan Siang", category: "Makanan", amount: -55000, type: "expense", date: "Hari ini" },
  { id: 3, name: "Grab", category: "Transport", amount: -35000, type: "expense", date: "Kemarin" },
  { id: 4, name: "Freelance Project", category: "Pendapatan Lain", amount: 2500000, type: "income", date: "Kemarin" },
  { id: 5, name: "Tagihan Listrik", category: "Tagihan", amount: -350000, type: "expense", date: "2 hari lalu" },
];

const mockBudgets = [
  { category: "Makanan", spent: 1200000, limit: 2000000 },
  { category: "Transport", spent: 800000, limit: 1000000 },
  { category: "Hiburan", spent: 450000, limit: 500000 },
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("User");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.user_metadata?.full_name) {
        setUserName(data.user.user_metadata.full_name.split(" ")[0]);
      }
    });
  }, []);

  const totalBalance = 15650000;
  const totalIncome = 10500000;
  const totalExpense = 4400000;

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto space-y-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Selamat datang,</p>
          <h1 className="text-xl font-display font-bold text-foreground">{userName} 👋</h1>
        </div>
        <Button size="icon" className="rounded-full h-10 w-10" onClick={() => navigate("/transactions/add")}>
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {/* Total Balance Card */}
      <Card className="bg-primary text-primary-foreground border-0 shadow-lg">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="h-4 w-4 opacity-80" />
            <span className="text-sm opacity-80">Total Saldo</span>
          </div>
          <p className="text-3xl font-display font-bold tracking-tight">
            {formatCurrency(totalBalance)}
          </p>
          <div className="flex gap-4 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <ArrowUpRight className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] opacity-70">Pemasukan</p>
                <p className="text-sm font-semibold">{formatCurrency(totalIncome)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <ArrowDownRight className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] opacity-70">Pengeluaran</p>
                <p className="text-sm font-semibold">{formatCurrency(totalExpense)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <h2 className="text-sm font-semibold text-foreground mb-3">Statistik Bulanan</h2>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockChartData}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(152, 60%, 40%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(152, 60%, 40%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 90%)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v / 1000000}jt`} stroke="hsl(220, 10%, 46%)" />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelStyle={{ fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="income" stroke="hsl(152, 60%, 40%)" fill="url(#incomeGrad)" strokeWidth={2} name="Pemasukan" />
                <Area type="monotone" dataKey="expense" stroke="hsl(0, 72%, 51%)" fill="url(#expenseGrad)" strokeWidth={2} name="Pengeluaran" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Budget Progress */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Anggaran Bulan Ini</h2>
        <div className="space-y-3">
          {mockBudgets.map((b) => {
            const pct = Math.round((b.spent / b.limit) * 100);
            const color = pct >= 90 ? "bg-expense" : pct >= 70 ? "bg-warning" : "bg-income";
            return (
              <Card key={b.category} className="border-0 shadow-sm">
                <CardContent className="p-3">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-medium">{b.category}</span>
                    <span className="text-xs text-muted-foreground">{pct}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-muted-foreground">{formatCurrency(b.spent)}</span>
                    <span className="text-[10px] text-muted-foreground">{formatCurrency(b.limit)}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">Transaksi Terbaru</h2>
          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate("/transactions")}>
            Lihat Semua
          </Button>
        </div>
        <div className="space-y-2">
          {mockTransactions.map((t) => (
            <Card key={t.id} className="border-0 shadow-sm">
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    t.type === "income" ? "bg-income/10" : "bg-expense/10"
                  }`}>
                    {t.type === "income" ? (
                      <TrendingUp className="h-4 w-4 text-income" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-expense" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-[10px] text-muted-foreground">{t.category} · {t.date}</p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${
                  t.type === "income" ? "text-income" : "text-expense"
                }`}>
                  {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
