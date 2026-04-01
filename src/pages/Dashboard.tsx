import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Plus, RefreshCw,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useRecentTransactions, useMonthlyStats } from "@/hooks/useTransactions";
import { useTotalBalance, useWallets } from "@/hooks/useWallets";
import { useBudgets } from "@/hooks/useBudgets";
import { useProfile } from "@/hooks/useProfile";

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(Math.abs(n));

const Dashboard = () => {
  const navigate = useNavigate();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: balance = 0, isLoading: balLoading } = useTotalBalance();
  const { data: wallets = [] } = useWallets();
  const { data: recent = [], isLoading: txLoading } = useRecentTransactions(5);
  const { data: chartData = [], isLoading: chartLoading } = useMonthlyStats();
  const { data: budgets = [] } = useBudgets();

  const currentMonthIncome = chartData.length > 0 ? chartData[chartData.length - 1]?.income ?? 0 : 0;
  const currentMonthExpense = chartData.length > 0 ? chartData[chartData.length - 1]?.expense ?? 0 : 0;

  const name = profile?.full_name?.split(" ")[0] ?? "User";

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto space-y-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Selamat datang,</p>
          <h1 className="text-xl font-display font-bold text-foreground">
            {profileLoading ? <Skeleton className="h-6 w-28" /> : `${name} 👋`}
          </h1>
        </div>
        <Button size="icon" className="rounded-full h-10 w-10" onClick={() => navigate("/transactions")}>
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {/* Total Balance Card */}
      <Card className="bg-primary text-primary-foreground border-0 shadow-lg">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="h-4 w-4 opacity-80" />
            <span className="text-sm opacity-80">Total Saldo ({wallets.length} wallet)</span>
          </div>
          {balLoading ? (
            <Skeleton className="h-10 w-48 bg-primary-foreground/30" />
          ) : (
            <p className="text-3xl font-display font-bold tracking-tight">{fmt(balance)}</p>
          )}
          <div className="flex gap-4 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <ArrowUpRight className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] opacity-70">Pemasukan</p>
                <p className="text-sm font-semibold">{fmt(currentMonthIncome)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <ArrowDownRight className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] opacity-70">Pengeluaran</p>
                <p className="text-sm font-semibold">{fmt(currentMonthExpense)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wallets Row */}
      {wallets.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-2">Wallet Saya</h2>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {wallets.map((w) => (
              <Card key={w.id} className="border-0 shadow-sm min-w-[120px]">
                <CardContent className="p-3">
                  <p className="text-lg mb-1">{w.icon}</p>
                  <p className="text-[11px] font-medium text-foreground truncate">{w.name}</p>
                  <p className="text-xs font-bold text-primary">{fmt(w.balance)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Chart */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <h2 className="text-sm font-semibold text-foreground mb-3">Statistik Bulanan</h2>
          {chartLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : chartData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-muted-foreground text-xs">
              Belum ada data transaksi
            </div>
          ) : (
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
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
                  <Tooltip formatter={(value: number) => fmt(value)} labelStyle={{ fontWeight: 600 }} />
                  <Area type="monotone" dataKey="income" stroke="hsl(152, 60%, 40%)" fill="url(#incomeGrad)" strokeWidth={2} name="Pemasukan" />
                  <Area type="monotone" dataKey="expense" stroke="hsl(0, 72%, 51%)" fill="url(#expenseGrad)" strokeWidth={2} name="Pengeluaran" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Budget Progress */}
      {budgets.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">Anggaran Bulan Ini</h2>
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate("/budget")}>
              Lihat Semua
            </Button>
          </div>
          <div className="space-y-3">
            {budgets.slice(0, 3).map((b) => {
              const pct = Math.round(((b.spent ?? 0) / b.amount_limit) * 100);
              const barColor = pct >= 90 ? "bg-expense" : pct >= 70 ? "bg-warning" : "bg-income";
              return (
                <Card key={b.id} className="border-0 shadow-sm">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-medium flex items-center gap-1">
                        <span>{b.categories?.icon}</span>
                        {b.categories?.name}
                      </span>
                      <span className="text-xs text-muted-foreground">{Math.min(pct, 100)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className={`${barColor} h-2 rounded-full transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-muted-foreground">{fmt(b.spent ?? 0)}</span>
                      <span className="text-[10px] text-muted-foreground">{fmt(b.amount_limit)}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">Transaksi Terbaru</h2>
          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate("/transactions")}>
            Lihat Semua
          </Button>
        </div>
        {txLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
          </div>
        ) : recent.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <RefreshCw className="h-8 w-8 mx-auto mb-2 opacity-30" />
            Belum ada transaksi. Ayo mulai catat!
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map((t) => (
              <Card key={t.id} className="border-0 shadow-sm">
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base ${
                      t.type === "income" ? "bg-income/10" : "bg-expense/10"
                    }`}>
                      {t.categories?.icon ?? (t.type === "income" ? "💰" : "💸")}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t.description}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {t.categories?.name ?? "Lainnya"} · {t.wallets?.name} · {t.date}
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${t.type === "income" ? "text-income" : "text-expense"}`}>
                    {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
