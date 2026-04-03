import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Edit2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useBudgets, useCreateBudget, useUpdateBudget, useDeleteBudget } from "@/hooks/useBudgets";
import { useCategories, useCreateCategory } from "@/hooks/useCategories";
import { Tables } from "@/integrations/supabase/types";

type Budget = Tables<"budgets"> & {
  categories?: Tables<"categories"> | null;
  spent?: number;
};

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

const now = new Date();
const CUSTOM_CATEGORY_VALUE = "__custom_budget_category__";

const Budget = () => {
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editBudget, setEditBudget] = useState<Budget | null>(null);
  const [budgetCategory, setBudgetCategory] = useState("");
  const [budgetLimit, setBudgetLimit] = useState("");
  const [customCategoryName, setCustomCategoryName] = useState("");

  const { data: budgets = [], isLoading, error: budgetsError } = useBudgets(month, year);
  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useCategories("expense");
  const createCategory = useCreateCategory();
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();
  const deleteBudget = useDeleteBudget();

  const totalSpent = budgets.reduce((sum, b) => sum + (b.spent ?? 0), 0);
  const totalLimit = budgets.reduce((sum, b) => sum + b.amount_limit, 0);
  const totalPct = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;

  const resetForm = () => {
    setBudgetCategory(""); setBudgetLimit(""); setEditBudget(null); setCustomCategoryName("");
  };

  const openEdit = (b: Budget) => {
    setEditBudget(b);
    setBudgetCategory(b.category_id);
    setBudgetLimit(String(b.amount_limit));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!budgetCategory || !budgetLimit) return;
    if (editBudget) {
      await updateBudget.mutateAsync({ id: editBudget.id, amount_limit: parseFloat(budgetLimit) });
    } else {
      let categoryId = budgetCategory;

      if (budgetCategory === CUSTOM_CATEGORY_VALUE) {
        if (!customCategoryName.trim()) return;
        const createdCategory = await createCategory.mutateAsync({
          name: customCategoryName.trim(),
          type: "expense",
          icon: "🏷️",
          color: "#6b7280",
        });
        categoryId = createdCategory.id;
      }

      await createBudget.mutateAsync({
        category_id: categoryId,
        amount_limit: parseFloat(budgetLimit),
        period_month: month,
        period_year: year,
      });
    }
    setDialogOpen(false);
    resetForm();
  };

  const isPending = createBudget.isPending || updateBudget.isPending || createCategory.isPending;
  const needsCustomCategory = budgetCategory === CUSTOM_CATEGORY_VALUE;

  const monthNames = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto space-y-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-display font-bold">Anggaran</h1>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-full gap-1" disabled={false}>
              <Plus className="h-4 w-4" /> Tambah
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md mx-4">
            <DialogHeader>
              <DialogTitle className="font-display">{editBudget ? "Edit Anggaran" : "Tambah Anggaran"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {categoriesError && (
                <Alert variant="destructive">
                  <AlertDescription>Gagal memuat kategori: {categoriesError.message}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select
                  value={budgetCategory}
                  onValueChange={setBudgetCategory}
                  disabled={!!editBudget || categoriesLoading}
                >
                  <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                    ))}
                    <SelectItem value={CUSTOM_CATEGORY_VALUE}>⌨️ Ketik kategori lain</SelectItem>
                  </SelectContent>
                </Select>
                {needsCustomCategory && (
                  <Input
                    placeholder="Tulis kategori baru"
                    value={customCategoryName}
                    onChange={(e) => setCustomCategoryName(e.target.value)}
                  />
                )}
                {!categoriesLoading && categories.length === 0 && (
                  <p className="text-xs text-muted-foreground">Kategori default belum tersedia. Anda tetap bisa ketik kategori sendiri.</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Batas Anggaran (Rp)</Label>
                <Input type="number" placeholder="0" value={budgetLimit} onChange={(e) => setBudgetLimit(e.target.value)} />
              </div>
              <Button className="w-full" onClick={handleSave} disabled={isPending || !budgetCategory || !budgetLimit || (needsCustomCategory && !customCategoryName.trim())}>
                {isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Month Selector */}
      <div className="flex gap-2">
        <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
          <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            {monthNames.map((m, i) => (
              <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            {[2024, 2025, 2026, 2027].map((y) => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Total Summary */}
      {budgetsError && (
        <Alert variant="destructive">
          <AlertDescription>Gagal memuat anggaran: {budgetsError.message}</AlertDescription>
        </Alert>
      )}
      {isLoading ? (
        <Skeleton className="h-28 rounded-2xl" />
      ) : budgets.length > 0 ? (
        <Card className="bg-primary text-primary-foreground border-0 shadow-lg">
          <CardContent className="p-5">
            <p className="text-sm opacity-80 mb-1">Total Pengeluaran {monthNames[month - 1]} {year}</p>
            <p className="text-2xl font-display font-bold">{fmt(totalSpent)}</p>
            <p className="text-xs opacity-70 mt-1">dari {fmt(totalLimit)} anggaran</p>
            <div className="mt-3 w-full bg-primary-foreground/20 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all ${totalPct >= 90 ? "bg-expense" : totalPct >= 70 ? "bg-yellow-400" : "bg-income"}`}
                style={{ width: `${Math.min(totalPct, 100)}%` }}
              />
            </div>
            <p className="text-xs opacity-70 mt-1 text-right">{totalPct}% terpakai</p>
          </CardContent>
        </Card>
      ) : null}

      {/* Budget Categories */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : budgets.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          <p className="text-3xl mb-2">📊</p>
          Belum ada anggaran untuk bulan ini.<br />Tambahkan anggaran baru!
        </div>
      ) : (
        <div className="space-y-3">
          {budgets.map((b) => {
            const spent = b.spent ?? 0;
            const pct = b.amount_limit > 0 ? Math.round((spent / b.amount_limit) * 100) : 0;
            const statusColor = pct >= 90 ? "text-expense" : pct >= 70 ? "text-yellow-600" : "text-income";
            const barColor = pct >= 90 ? "bg-expense" : pct >= 70 ? "bg-yellow-400" : "bg-income";
            return (
              <Card key={b.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-base">
                        {b.categories?.icon ?? "📁"}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{b.categories?.name ?? "Kategori"}</p>
                        <p className="text-[10px] text-muted-foreground">{fmt(spent)} / {fmt(b.amount_limit)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`text-sm font-bold ${statusColor}`}>{pct}%</span>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(b)}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-expense hover:text-expense">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus Anggaran?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Anggaran untuk "{b.categories?.name}" akan dihapus permanen.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction className="bg-expense hover:bg-expense/90"
                              onClick={() => deleteBudget.mutate(b.id)}>
                              Hapus
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className={`${barColor} h-2 rounded-full transition-all`}
                      style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                  {pct >= 90 && (
                    <p className="text-[10px] text-expense mt-1.5 font-medium">⚠️ Mendekati batas anggaran!</p>
                  )}
                  {pct >= 100 && (
                    <p className="text-[10px] text-expense mt-0.5 font-bold">🚨 Anggaran sudah melebihi batas!</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Budget;
