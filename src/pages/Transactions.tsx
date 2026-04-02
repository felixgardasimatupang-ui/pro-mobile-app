import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp, TrendingDown, Plus, Search, Trash2, Edit2, DollarSign,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  useTransactions,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
  TransactionFilters,
} from "@/hooks/useTransactions";
import { useWallets } from "@/hooks/useWallets";
import { useCategories } from "@/hooks/useCategories";
import { Tables } from "@/integrations/supabase/types";

type TxType = "income" | "expense";
type Transaction = Tables<"transactions"> & {
  categories?: Tables<"categories"> | null;
  wallets?: Tables<"wallets"> | null;
};

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

const today = () => new Date().toISOString().split("T")[0];

const Transactions = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);

  // Form state
  const [txType, setTxType] = useState<TxType>("expense");
  const [txAmount, setTxAmount] = useState("");
  const [txName, setTxName] = useState("");
  const [txCategory, setTxCategory] = useState("");
  const [txWallet, setTxWallet] = useState("");
  const [txNote, setTxNote] = useState("");
  const [txDate, setTxDate] = useState(today());

  const filters: TransactionFilters = {
    type: filterType,
    search: search || undefined,
  };

  const { data: transactions = [], isLoading, error: transactionsError } = useTransactions(filters);
  const { data: wallets = [], isLoading: walletsLoading, error: walletsError } = useWallets();
  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useCategories(txType);
  const createTx = useCreateTransaction();
  const updateTx = useUpdateTransaction();
  const deleteTx = useDeleteTransaction();

  const resetForm = () => {
    setTxType("expense"); setTxAmount(""); setTxName(""); setTxCategory("");
    setTxWallet(""); setTxNote(""); setTxDate(today()); setEditTx(null);
  };

  const openEdit = (t: Transaction) => {
    setEditTx(t);
    setTxType(t.type as TxType);
    setTxAmount(String(t.amount));
    setTxName(t.description);
    setTxCategory(t.category_id ?? "");
    setTxWallet(t.wallet_id);
    setTxNote(t.note ?? "");
    setTxDate(t.date);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!txAmount || !txName || !txWallet) return;
    const payload = {
      type: txType,
      amount: parseFloat(txAmount),
      description: txName,
      category_id: txCategory || null,
      wallet_id: txWallet,
      note: txNote || null,
      date: txDate,
    };
    if (editTx) {
      await updateTx.mutateAsync({ id: editTx.id, ...payload });
    } else {
      await createTx.mutateAsync(payload);
    }
    setDialogOpen(false);
    resetForm();
  };

  const isPending = createTx.isPending || updateTx.isPending;
  const hasWallets = wallets.length > 0;
  const canSubmit = Boolean(txAmount && txName && txWallet && hasWallets);

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-display font-bold">Transaksi</h1>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-full gap-1">
              <Plus className="h-4 w-4" /> Tambah
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">{editTx ? "Edit Transaksi" : "Tambah Transaksi"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {!hasWallets && !walletsLoading && (
                <Alert>
                  <AlertDescription className="space-y-3">
                    <p>Anda perlu membuat minimal 1 wallet dulu sebelum bisa menambahkan transaksi.</p>
                    <Button type="button" variant="outline" size="sm" onClick={() => navigate("/settings")}>
                      Buka Pengaturan Wallet
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {walletsError && (
                <Alert variant="destructive">
                  <AlertDescription>Gagal memuat wallet: {walletsError.message}</AlertDescription>
                </Alert>
              )}

              {categoriesError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    Gagal memuat kategori. Transaksi masih bisa disimpan tanpa kategori bila wallet tersedia.
                  </AlertDescription>
                </Alert>
              )}

              {/* Type Toggle */}
              <div className="flex gap-2">
                <Button variant={txType === "expense" ? "default" : "outline"}
                  type="button"
                  className={`flex-1 ${txType === "expense" ? "bg-expense hover:bg-expense/90" : ""}`}
                  onClick={() => { setTxType("expense"); setTxCategory(""); }}>
                  <TrendingDown className="h-4 w-4 mr-1" /> Pengeluaran
                </Button>
                <Button variant={txType === "income" ? "default" : "outline"}
                  type="button"
                  className={`flex-1 ${txType === "income" ? "bg-income hover:bg-income/90" : ""}`}
                  onClick={() => { setTxType("income"); setTxCategory(""); }}>
                  <TrendingUp className="h-4 w-4 mr-1" /> Pemasukan
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Jumlah (Rp)</Label>
                <Input type="number" placeholder="0" className="text-2xl font-display h-14"
                  value={txAmount} onChange={(e) => setTxAmount(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Nama Transaksi</Label>
                <Input placeholder="Contoh: Makan siang" value={txName} onChange={(e) => setTxName(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Kategori (opsional)</Label>
                  <Select value={txCategory} onValueChange={setTxCategory} disabled={categoriesLoading || categories.length === 0}>
                    <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!categoriesLoading && categories.length === 0 && (
                    <p className="text-xs text-muted-foreground">Kategori belum tersedia. Anda tetap bisa simpan tanpa kategori.</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Wallet</Label>
                  <Select value={txWallet} onValueChange={setTxWallet} disabled={walletsLoading || !hasWallets}>
                    <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                    <SelectContent>
                      {wallets.map((w) => (
                        <SelectItem key={w.id} value={w.id}>{w.icon} {w.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!walletsLoading && !hasWallets && (
                    <p className="text-xs text-muted-foreground">Belum ada wallet aktif. Tambahkan wallet di halaman Pengaturan.</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tanggal</Label>
                <Input type="date" value={txDate} onChange={(e) => setTxDate(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Catatan (opsional)</Label>
                <Textarea placeholder="Tambah catatan..." value={txNote} onChange={(e) => setTxNote(e.target.value)} />
              </div>

              <Button className="w-full" onClick={handleSubmit} disabled={isPending || !canSubmit}>
                {isPending ? "Menyimpan..." : editTx ? "Perbarui Transaksi" : "Simpan Transaksi"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Cari transaksi..." className="pl-9 h-9"
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Tabs value={filterType} onValueChange={(v) => setFilterType(v as typeof filterType)}>
        <TabsList className="grid w-full grid-cols-3 h-9">
          <TabsTrigger value="all" className="text-xs">Semua</TabsTrigger>
          <TabsTrigger value="income" className="text-xs">Pemasukan</TabsTrigger>
          <TabsTrigger value="expense" className="text-xs">Pengeluaran</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* List */}
      <div className="space-y-2">
        {transactionsError && (
          <Alert variant="destructive">
            <AlertDescription>Gagal memuat transaksi: {transactionsError.message}</AlertDescription>
          </Alert>
        )}
        {isLoading ? (
          [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)
        ) : transactions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            <DollarSign className="h-10 w-10 mx-auto mb-2 opacity-20" />
            Tidak ada transaksi ditemukan
          </div>
        ) : transactions.map((t) => (
          <Card key={t.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 ${
                  t.type === "income" ? "bg-income/10" : "bg-expense/10"
                }`}>
                  {t.categories?.icon ?? "💸"}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{t.description}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {t.categories?.name ?? "—"} · {t.wallets?.name} · {t.date}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                <span className={`text-sm font-semibold ${t.type === "income" ? "text-income" : "text-expense"}`}>
                  {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                </span>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(t)}>
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
                      <AlertDialogTitle>Hapus Transaksi?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Transaksi "{t.description}" akan dihapus permanen dan saldo wallet akan disesuaikan.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction className="bg-expense hover:bg-expense/90"
                        onClick={() => deleteTx.mutate(t.id)}>
                        Hapus
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Transactions;
