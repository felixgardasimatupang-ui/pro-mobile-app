import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Plus, Utensils, Car, ShoppingBag, Zap, Gamepad2, Edit2
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

const budgetCategories = [
  { icon: Utensils, name: "Makanan", spent: 1200000, limit: 2000000, color: "bg-orange-500" },
  { icon: Car, name: "Transport", spent: 800000, limit: 1000000, color: "bg-blue-500" },
  { icon: ShoppingBag, name: "Belanja", spent: 650000, limit: 1500000, color: "bg-purple-500" },
  { icon: Zap, name: "Tagihan", spent: 950000, limit: 1000000, color: "bg-yellow-500" },
  { icon: Gamepad2, name: "Hiburan", spent: 450000, limit: 500000, color: "bg-pink-500" },
];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

const Budget = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [budgetCategory, setBudgetCategory] = useState("");
  const [budgetLimit, setBudgetLimit] = useState("");

  const totalSpent = budgetCategories.reduce((a, b) => a + b.spent, 0);
  const totalLimit = budgetCategories.reduce((a, b) => a + b.limit, 0);
  const totalPct = Math.round((totalSpent / totalLimit) * 100);

  const handleSave = () => {
    if (!budgetCategory || !budgetLimit) {
      toast({ title: "Error", description: "Harap isi semua field", variant: "destructive" });
      return;
    }
    toast({ title: "Berhasil!", description: "Anggaran berhasil ditambahkan" });
    setDialogOpen(false);
    setBudgetCategory("");
    setBudgetLimit("");
  };

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto space-y-5 animate-slide-up">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-display font-bold">Anggaran</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-full gap-1">
              <Plus className="h-4 w-4" /> Tambah
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md mx-4">
            <DialogHeader>
              <DialogTitle className="font-display">Tambah Anggaran</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select value={budgetCategory} onValueChange={setBudgetCategory}>
                  <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Makanan">Makanan</SelectItem>
                    <SelectItem value="Transport">Transport</SelectItem>
                    <SelectItem value="Belanja">Belanja</SelectItem>
                    <SelectItem value="Tagihan">Tagihan</SelectItem>
                    <SelectItem value="Hiburan">Hiburan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Batas Anggaran (Rp)</Label>
                <Input type="number" placeholder="0" value={budgetLimit} onChange={(e) => setBudgetLimit(e.target.value)} />
              </div>
              <Button className="w-full" onClick={handleSave}>Simpan</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Total Summary */}
      <Card className="bg-primary text-primary-foreground border-0 shadow-lg">
        <CardContent className="p-5">
          <p className="text-sm opacity-80 mb-1">Total Pengeluaran Bulan Ini</p>
          <p className="text-2xl font-display font-bold">{formatCurrency(totalSpent)}</p>
          <p className="text-xs opacity-70 mt-1">dari {formatCurrency(totalLimit)} anggaran</p>
          <div className="mt-3 w-full bg-primary-foreground/20 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all ${
                totalPct >= 90 ? "bg-expense" : totalPct >= 70 ? "bg-warning" : "bg-income"
              }`}
              style={{ width: `${Math.min(totalPct, 100)}%` }}
            />
          </div>
          <p className="text-xs opacity-70 mt-1 text-right">{totalPct}% terpakai</p>
        </CardContent>
      </Card>

      {/* Budget Categories */}
      <div className="space-y-3">
        {budgetCategories.map((b) => {
          const pct = Math.round((b.spent / b.limit) * 100);
          const statusColor = pct >= 90 ? "text-expense" : pct >= 70 ? "text-warning" : "text-income";
          const barColor = pct >= 90 ? "bg-expense" : pct >= 70 ? "bg-warning" : "bg-income";

          return (
            <Card key={b.name} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl ${b.color} bg-opacity-10 flex items-center justify-center`}>
                      <b.icon className={`h-4 w-4 ${b.color.replace("bg-", "text-")}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{b.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatCurrency(b.spent)} / {formatCurrency(b.limit)}
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${statusColor}`}>{pct}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className={`${barColor} h-2 rounded-full transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
                {pct >= 90 && (
                  <p className="text-[10px] text-expense mt-1.5 font-medium">⚠️ Mendekati batas anggaran!</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Budget;
