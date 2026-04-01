import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp, TrendingDown, Plus, Search, Filter,
  ShoppingBag, Car, Utensils, Zap, Gamepad2, Briefcase,
  DollarSign, ArrowLeftRight
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

const categoryIcons: Record<string, any> = {
  Makanan: Utensils,
  Transport: Car,
  Belanja: ShoppingBag,
  Tagihan: Zap,
  Hiburan: Gamepad2,
  Gaji: Briefcase,
  "Pendapatan Lain": DollarSign,
  Transfer: ArrowLeftRight,
};

const categories = {
  expense: ["Makanan", "Transport", "Belanja", "Tagihan", "Hiburan"],
  income: ["Gaji", "Pendapatan Lain"],
};

const mockTransactions = [
  { id: 1, name: "Gaji Bulanan", category: "Gaji", amount: 8000000, type: "income", date: "2026-04-01", wallet: "Bank BCA" },
  { id: 2, name: "Makan Siang", category: "Makanan", amount: 55000, type: "expense", date: "2026-04-01", wallet: "Cash" },
  { id: 3, name: "Grab", category: "Transport", amount: 35000, type: "expense", date: "2026-03-31", wallet: "GoPay" },
  { id: 4, name: "Freelance Project", category: "Pendapatan Lain", amount: 2500000, type: "income", date: "2026-03-31", wallet: "Bank BCA" },
  { id: 5, name: "Tagihan Listrik", category: "Tagihan", amount: 350000, type: "expense", date: "2026-03-30", wallet: "Bank BCA" },
  { id: 6, name: "Netflix", category: "Hiburan", amount: 54000, type: "expense", date: "2026-03-30", wallet: "GoPay" },
  { id: 7, name: "Belanja Bulanan", category: "Belanja", amount: 850000, type: "expense", date: "2026-03-29", wallet: "Cash" },
];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

const Transactions = () => {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [txType, setTxType] = useState<"income" | "expense">("expense");
  const [txAmount, setTxAmount] = useState("");
  const [txName, setTxName] = useState("");
  const [txCategory, setTxCategory] = useState("");
  const [txWallet, setTxWallet] = useState("");
  const [txNote, setTxNote] = useState("");

  const filtered = mockTransactions.filter((t) => {
    if (filterType !== "all" && t.type !== filterType) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleSubmit = () => {
    if (!txAmount || !txName || !txCategory || !txWallet) {
      toast({ title: "Error", description: "Harap isi semua field", variant: "destructive" });
      return;
    }
    toast({ title: "Berhasil!", description: "Transaksi berhasil ditambahkan" });
    setDialogOpen(false);
    setTxAmount("");
    setTxName("");
    setTxCategory("");
    setTxWallet("");
    setTxNote("");
  };

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-display font-bold">Transaksi</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-full gap-1">
              <Plus className="h-4 w-4" /> Tambah
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md mx-4">
            <DialogHeader>
              <DialogTitle className="font-display">Tambah Transaksi</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Type Toggle */}
              <div className="flex gap-2">
                <Button
                  variant={txType === "expense" ? "default" : "outline"}
                  className={`flex-1 ${txType === "expense" ? "bg-expense hover:bg-expense/90" : ""}`}
                  onClick={() => { setTxType("expense"); setTxCategory(""); }}
                >
                  <TrendingDown className="h-4 w-4 mr-1" /> Pengeluaran
                </Button>
                <Button
                  variant={txType === "income" ? "default" : "outline"}
                  className={`flex-1 ${txType === "income" ? "bg-income hover:bg-income/90" : ""}`}
                  onClick={() => { setTxType("income"); setTxCategory(""); }}
                >
                  <TrendingUp className="h-4 w-4 mr-1" /> Pemasukan
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Jumlah (Rp)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  className="text-2xl font-display h-14"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Nama Transaksi</Label>
                <Input placeholder="Contoh: Makan siang" value={txName} onChange={(e) => setTxName(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Kategori</Label>
                  <Select value={txCategory} onValueChange={setTxCategory}>
                    <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                    <SelectContent>
                      {categories[txType].map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Wallet</Label>
                  <Select value={txWallet} onValueChange={setTxWallet}>
                    <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Bank BCA">Bank BCA</SelectItem>
                      <SelectItem value="GoPay">GoPay</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Catatan (opsional)</Label>
                <Textarea placeholder="Tambah catatan..." value={txNote} onChange={(e) => setTxNote(e.target.value)} />
              </div>

              <Button className="w-full" onClick={handleSubmit}>Simpan Transaksi</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari transaksi..."
            className="pl-9 h-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Tabs value={filterType} onValueChange={(v) => setFilterType(v as any)}>
        <TabsList className="grid w-full grid-cols-3 h-9">
          <TabsTrigger value="all" className="text-xs">Semua</TabsTrigger>
          <TabsTrigger value="income" className="text-xs">Pemasukan</TabsTrigger>
          <TabsTrigger value="expense" className="text-xs">Pengeluaran</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Transaction List */}
      <div className="space-y-2">
        {filtered.map((t) => {
          const Icon = categoryIcons[t.category] || DollarSign;
          return (
            <Card key={t.id} className="border-0 shadow-sm">
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    t.type === "income" ? "bg-income/10" : "bg-expense/10"
                  }`}>
                    <Icon className={`h-4 w-4 ${t.type === "income" ? "text-income" : "text-expense"}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-[10px] text-muted-foreground">{t.category} · {t.wallet} · {t.date}</p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${t.type === "income" ? "text-income" : "text-expense"}`}>
                  {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
                </span>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-10 text-muted-foreground text-sm">
            Tidak ada transaksi ditemukan
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;
