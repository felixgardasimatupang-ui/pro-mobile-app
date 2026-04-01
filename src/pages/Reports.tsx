import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, TrendingUp, TrendingDown } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { useMonthlyStats, useExpenseByCategory, useTransactions, type Transaction } from "@/hooks/useTransactions";
import { toast } from "@/hooks/use-toast";

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

const escapeCsvValue = (value: unknown) => {
  const normalized = String(value ?? "").replace(/"/g, '""');
  return `"${normalized}"`;
};

const periods = [
  { label: "1 Bulan Terakhir", value: "1" },
  { label: "3 Bulan Terakhir", value: "3" },
  { label: "6 Bulan Terakhir", value: "6" },
  { label: "1 Tahun Terakhir", value: "12" },
];

type ReportTransaction = Transaction;

const Reports = () => {
  const [period, setPeriod] = useState("6");
  const periodMonths = parseInt(period);

  // Calculate from_date based on period
  const fromDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - periodMonths + 1);
    d.setDate(1);
    return d.toISOString().split("T")[0];
  }, [periodMonths]);

  const { data: chartData = [], isLoading: chartLoading } = useMonthlyStats(undefined, periodMonths);
  const { data: pieData = [], isLoading: pieLoading } = useExpenseByCategory(fromDate);
  const { data: txList = [] } = useTransactions({ from_date: fromDate });

  const totalIncome = chartData.reduce((a, b) => a + b.income, 0);
  const totalExpense = chartData.reduce((a, b) => a + b.expense, 0);
  const totalPieExpense = pieData.reduce((a, b) => a + b.value, 0);
  const netSavings = totalIncome - totalExpense;

  const handleExportCSV = () => {
    if (txList.length === 0) {
      toast({ title: "Tidak ada data", description: "Tidak ada transaksi untuk diekspor", variant: "destructive" });
      return;
    }
    const headers = ["Tanggal", "Tipe", "Deskripsi", "Jumlah", "Kategori", "Wallet"];
    const rows = txList.map((t: ReportTransaction) => [
      t.date, t.type, t.description, t.amount,
      t.categories?.name ?? "", t.wallets?.name ?? "",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsvValue).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `laporan-keuangan-${fromDate}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "✅ Export Berhasil!", description: "File CSV berhasil diunduh" });
  };

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto space-y-5 animate-slide-up">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-display font-bold">Laporan</h1>
        <Button size="sm" variant="outline" className="text-xs gap-1" onClick={handleExportCSV}>
          <Download className="h-3 w-3" /> CSV
        </Button>
      </div>

      {/* Period Selector */}
      <Select value={period} onValueChange={setPeriod}>
        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
        <SelectContent>
          {periods.map((p) => (
            <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-0 shadow-sm col-span-1">
          <CardContent className="p-3">
            <div className="flex items-center gap-1 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-income" />
              <span className="text-[10px] text-muted-foreground">Pemasukan</span>
            </div>
            {chartLoading ? <Skeleton className="h-5 w-full" /> : (
              <p className="text-sm font-display font-bold text-income">{fmt(totalIncome)}</p>
            )}
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm col-span-1">
          <CardContent className="p-3">
            <div className="flex items-center gap-1 mb-1">
              <TrendingDown className="h-3.5 w-3.5 text-expense" />
              <span className="text-[10px] text-muted-foreground">Pengeluaran</span>
            </div>
            {chartLoading ? <Skeleton className="h-5 w-full" /> : (
              <p className="text-sm font-display font-bold text-expense">{fmt(totalExpense)}</p>
            )}
          </CardContent>
        </Card>
        <Card className={`border-0 shadow-sm col-span-1 ${netSavings >= 0 ? "bg-income/5" : "bg-expense/5"}`}>
          <CardContent className="p-3">
            <span className="text-[10px] text-muted-foreground block mb-1">Tabungan</span>
            {chartLoading ? <Skeleton className="h-5 w-full" /> : (
              <p className={`text-sm font-display font-bold ${netSavings >= 0 ? "text-income" : "text-expense"}`}>
                {netSavings >= 0 ? "+" : ""}{fmt(netSavings)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bar Chart */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <h2 className="text-sm font-semibold mb-3">Pemasukan vs Pengeluaran</h2>
          {chartLoading ? <Skeleton className="h-52 w-full" /> : chartData.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-muted-foreground text-xs">
              Belum ada data untuk periode ini
            </div>
          ) : (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 90%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v / 1000000}jt`} stroke="hsl(220, 10%, 46%)" />
                  <Tooltip formatter={(value: number) => fmt(value)} />
                  <Bar dataKey="income" fill="hsl(152, 60%, 40%)" radius={[4, 4, 0, 0]} name="Pemasukan" />
                  <Bar dataKey="expense" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} name="Pengeluaran" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pie Chart */}
      {pieData.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold mb-3">Pengeluaran per Kategori</h2>
            {pieLoading ? <Skeleton className="h-52 w-full" /> : (
              <div className="h-52 flex items-center">
                <ResponsiveContainer width="50%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name"
                      cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3}>
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => fmt(value)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {pieData.map((cat) => (
                    <div key={cat.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="text-xs truncate max-w-[70px]">{cat.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium">{totalPieExpense > 0 ? Math.round((cat.value / totalPieExpense) * 100) : 0}%</p>
                        <p className="text-[9px] text-muted-foreground">{fmt(cat.value)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Transaction Count Summary */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <h2 className="text-sm font-semibold mb-3">Ringkasan Transaksi</h2>
          <div className="grid grid-cols-3 text-center gap-3">
            <div>
              <p className="text-2xl font-bold text-primary">{txList.length}</p>
              <p className="text-[10px] text-muted-foreground">Total</p>
            </div>
            <div>
                <p className="text-2xl font-bold text-income">
                {txList.filter((t: ReportTransaction) => t.type === "income").length}
              </p>
              <p className="text-[10px] text-muted-foreground">Pemasukan</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-expense">
                {txList.filter((t: ReportTransaction) => t.type === "expense").length}
              </p>
              <p className="text-[10px] text-muted-foreground">Pengeluaran</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
