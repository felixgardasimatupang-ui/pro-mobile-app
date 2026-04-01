import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Download, TrendingUp, TrendingDown } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { toast } from "@/hooks/use-toast";

const monthlyData = [
  { month: "Jan", income: 5000000, expense: 3200000 },
  { month: "Feb", income: 4800000, expense: 3500000 },
  { month: "Mar", income: 5200000, expense: 2800000 },
  { month: "Apr", income: 5500000, expense: 4100000 },
  { month: "Mei", income: 6000000, expense: 3600000 },
  { month: "Jun", income: 5800000, expense: 3900000 },
];

const expenseByCategory = [
  { name: "Makanan", value: 1200000, color: "#f97316" },
  { name: "Transport", value: 800000, color: "#3b82f6" },
  { name: "Belanja", value: 650000, color: "#a855f7" },
  { name: "Tagihan", value: 950000, color: "#eab308" },
  { name: "Hiburan", value: 450000, color: "#ec4899" },
];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

const Reports = () => {
  const [period, setPeriod] = useState("6months");

  const totalIncome = monthlyData.reduce((a, b) => a + b.income, 0);
  const totalExpense = monthlyData.reduce((a, b) => a + b.expense, 0);
  const totalCatExpense = expenseByCategory.reduce((a, b) => a + b.value, 0);

  const handleExport = (format: string) => {
    toast({ title: "Export", description: `Laporan berhasil di-export ke ${format}` });
  };

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto space-y-5 animate-slide-up">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-display font-bold">Laporan</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => handleExport("PDF")}>
            <Download className="h-3 w-3" /> PDF
          </Button>
          <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => handleExport("CSV")}>
            <Download className="h-3 w-3" /> CSV
          </Button>
        </div>
      </div>

      {/* Period */}
      <Select value={period} onValueChange={setPeriod}>
        <SelectTrigger className="h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1month">1 Bulan Terakhir</SelectItem>
          <SelectItem value="3months">3 Bulan Terakhir</SelectItem>
          <SelectItem value="6months">6 Bulan Terakhir</SelectItem>
          <SelectItem value="1year">1 Tahun Terakhir</SelectItem>
        </SelectContent>
      </Select>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-income" />
              <span className="text-xs text-muted-foreground">Total Pemasukan</span>
            </div>
            <p className="text-lg font-display font-bold text-income">{formatCurrency(totalIncome)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-expense" />
              <span className="text-xs text-muted-foreground">Total Pengeluaran</span>
            </div>
            <p className="text-lg font-display font-bold text-expense">{formatCurrency(totalExpense)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Bar Chart */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <h2 className="text-sm font-semibold mb-3">Pemasukan vs Pengeluaran</h2>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 90%)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v / 1000000}jt`} stroke="hsl(220, 10%, 46%)" />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="income" fill="hsl(152, 60%, 40%)" radius={[4, 4, 0, 0]} name="Pemasukan" />
                <Bar dataKey="expense" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} name="Pengeluaran" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Pie Chart */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <h2 className="text-sm font-semibold mb-3">Pengeluaran per Kategori</h2>
          <div className="h-52 flex items-center">
            <ResponsiveContainer width="50%" height="100%">
              <PieChart>
                <Pie
                  data={expenseByCategory}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={3}
                >
                  {expenseByCategory.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {expenseByCategory.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-xs">{cat.name}</span>
                  </div>
                  <span className="text-xs font-medium">{Math.round((cat.value / totalCatExpense) * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
