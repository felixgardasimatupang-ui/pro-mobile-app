import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  User, LogOut, Moon, Sun, CreditCard, Plus, Trash2, Edit2, Wallet
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

const mockWallets = [
  { id: 1, name: "Cash", balance: 2500000, icon: "💵", type: "cash" },
  { id: 2, name: "Bank BCA", balance: 8500000, icon: "🏦", type: "bank" },
  { id: 3, name: "GoPay", balance: 650000, icon: "📱", type: "ewallet" },
  { id: 4, name: "OVO", balance: 4000000, icon: "💳", type: "ewallet" },
];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

const Settings = () => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [currency, setCurrency] = useState("IDR");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);
  const [walletName, setWalletName] = useState("");
  const [walletType, setWalletType] = useState("");

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setDarkMode(isDark);
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserName(data.user.user_metadata?.full_name || "");
        setUserEmail(data.user.email || "");
      }
    });
  }, []);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleAddWallet = () => {
    if (!walletName || !walletType) {
      toast({ title: "Error", description: "Harap isi semua field", variant: "destructive" });
      return;
    }
    toast({ title: "Berhasil!", description: "Wallet berhasil ditambahkan" });
    setWalletDialogOpen(false);
    setWalletName("");
    setWalletType("");
  };

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto space-y-5 animate-slide-up">
      <h1 className="text-xl font-display font-bold">Profil & Pengaturan</h1>

      {/* Profile Card */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">{userName || "User"}</p>
              <p className="text-sm text-muted-foreground">{userEmail}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wallets */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Dompet / Wallet</h2>
          <Dialog open={walletDialogOpen} onOpenChange={setWalletDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="text-xs gap-1 h-7">
                <Plus className="h-3 w-3" /> Tambah
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md mx-4">
              <DialogHeader>
                <DialogTitle className="font-display">Tambah Wallet</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nama Wallet</Label>
                  <Input placeholder="Contoh: Bank Mandiri" value={walletName} onChange={(e) => setWalletName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Tipe</Label>
                  <Select value={walletType} onValueChange={setWalletType}>
                    <SelectTrigger><SelectValue placeholder="Pilih tipe" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank">Bank</SelectItem>
                      <SelectItem value="ewallet">E-Wallet</SelectItem>
                      <SelectItem value="other">Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={handleAddWallet}>Simpan</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="space-y-2">
          {mockWallets.map((w) => (
            <Card key={w.id} className="border-0 shadow-sm">
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{w.icon}</span>
                  <div>
                    <p className="text-sm font-medium">{w.name}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{w.type}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold">{formatCurrency(w.balance)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* Settings */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold">Pengaturan</h2>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            <span className="text-sm">Mode Gelap</span>
          </div>
          <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm">Mata Uang</span>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="w-28 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="IDR">IDR (Rp)</SelectItem>
              <SelectItem value="USD">USD ($)</SelectItem>
              <SelectItem value="EUR">EUR (€)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      <Button variant="destructive" className="w-full gap-2" onClick={handleLogout}>
        <LogOut className="h-4 w-4" /> Keluar
      </Button>
    </div>
  );
};

export default Settings;
