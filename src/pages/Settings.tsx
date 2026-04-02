import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, LogOut, Moon, Sun, Plus, Trash2, Edit2, Wallet, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useWallets, useCreateWallet, useUpdateWallet, useDeleteWallet } from "@/hooks/useWallets";
import { Tables } from "@/integrations/supabase/types";

type WalletType = Tables<"wallets">;

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

const walletIcons = ["💵", "🏦", "📱", "💳", "🪙", "💰", "🏧"];

const Settings = () => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(document.documentElement.classList.contains("dark"));
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);
  const [editWallet, setEditWallet] = useState<WalletType | null>(null);
  const [walletName, setWalletName] = useState("");
  const [walletType, setWalletType] = useState<"cash" | "bank" | "ewallet" | "other">("cash");
  const [walletIcon, setWalletIcon] = useState("💵");
  const [walletBalance, setWalletBalance] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: wallets = [], isLoading: walletsLoading } = useWallets();
  const updateProfile = useUpdateProfile();
  const createWallet = useCreateWallet();
  const updateWallet = useUpdateWallet();
  const deleteWallet = useDeleteWallet();

  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (mounted) {
        setUserEmail(data.user?.email ?? "");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user.email ?? "");
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
  };

  const handleLogout = async () => {
    localStorage.removeItem("sb-mock-session");
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleSaveName = async () => {
    if (!newName.trim()) return;
    await updateProfile.mutateAsync({ full_name: newName.trim() });
    setEditingName(false);
  };

  const resetWalletForm = () => {
    setWalletName(""); setWalletType("cash"); setWalletIcon("💵");
    setWalletBalance(""); setEditWallet(null);
  };

  const openEditWallet = (w: WalletType) => {
    setEditWallet(w);
    setWalletName(w.name);
    setWalletType(w.type);
    setWalletIcon(w.icon);
    setWalletBalance(String(w.balance));
    setWalletDialogOpen(true);
  };

  const handleSaveWallet = async () => {
    if (!walletName) return;
    if (editWallet) {
      await updateWallet.mutateAsync({ id: editWallet.id, name: walletName, type: walletType, icon: walletIcon });
    } else {
      await createWallet.mutateAsync({
        name: walletName,
        type: walletType,
        icon: walletIcon,
        balance: parseFloat(walletBalance) || 0,
      });
    }
    setWalletDialogOpen(false);
    resetWalletForm();
  };

  const isPending = createWallet.isPending || updateWallet.isPending;

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto space-y-5 animate-slide-up">
      <h1 className="text-xl font-display font-bold">Profil & Pengaturan</h1>

      {/* Profile Card */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          {profileLoading ? (
            <div className="flex items-center gap-4">
              <Skeleton className="w-14 h-14 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-7 w-7 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {editingName ? (
                    <div className="flex gap-2 items-center w-full">
                      <Input
                        className="h-7 text-sm"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Nama lengkap"
                        autoFocus
                      />
                      <Button size="sm" className="h-7 text-xs" onClick={handleSaveName}
                        disabled={updateProfile.isPending}>
                        Simpan
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingName(false)}>
                        Batal
                      </Button>
                    </div>
                  ) : (
                    <>
                      <p className="font-semibold">{profile?.full_name ?? "User"}</p>
                      {profile?.is_admin && (
                        <Badge className="text-[9px] px-1.5 py-0 h-4 bg-primary gap-1">
                          <ShieldCheck className="h-2.5 w-2.5" /> Admin
                        </Badge>
                      )}
                      <Button size="icon" variant="ghost" className="h-6 w-6"
                        onClick={() => { setNewName(profile?.full_name ?? ""); setEditingName(true); }}>
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{userEmail || "Email belum tersedia"}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Wallets Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Dompet / Wallet</h2>
          <Dialog open={walletDialogOpen} onOpenChange={(open) => { setWalletDialogOpen(open); if (!open) resetWalletForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="text-xs gap-1 h-7">
                <Plus className="h-3 w-3" /> Tambah
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md mx-4">
              <DialogHeader>
                <DialogTitle className="font-display">{editWallet ? "Edit Wallet" : "Tambah Wallet"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nama Wallet</Label>
                  <Input placeholder="Contoh: Bank Mandiri" value={walletName}
                    onChange={(e) => setWalletName(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Tipe</Label>
                    <Select value={walletType} onValueChange={(v) => setWalletType(v as typeof walletType)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">💵 Cash</SelectItem>
                        <SelectItem value="bank">🏦 Bank</SelectItem>
                        <SelectItem value="ewallet">📱 E-Wallet</SelectItem>
                        <SelectItem value="other">🪙 Lainnya</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Icon</Label>
                    <Select value={walletIcon} onValueChange={setWalletIcon}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {walletIcons.map((icon) => (
                          <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {!editWallet && (
                  <div className="space-y-2">
                    <Label>Saldo Awal (Rp)</Label>
                    <Input type="number" placeholder="0" value={walletBalance}
                      onChange={(e) => setWalletBalance(e.target.value)} />
                  </div>
                )}
                <Button className="w-full" onClick={handleSaveWallet} disabled={isPending || !walletName}>
                  {isPending ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {walletsLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
          </div>
        ) : wallets.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            <Wallet className="h-8 w-8 mx-auto mb-2 opacity-30" />
            Belum ada wallet. Tambahkan wallet pertama Anda!
          </div>
        ) : (
          <div className="space-y-2">
            {wallets.map((w) => (
              <Card key={w.id} className="border-0 shadow-sm">
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{w.icon}</span>
                    <div>
                      <p className="text-sm font-medium">{w.name}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{w.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{fmt(w.balance)}</p>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditWallet(w)}>
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
                          <AlertDialogTitle>Hapus Wallet?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Wallet "{w.name}" akan dinonaktifkan. Transaksi yang ada tidak akan terhapus.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction className="bg-expense hover:bg-expense/90"
                            onClick={() => deleteWallet.mutate(w.id)}>
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
        )}
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
      </div>

      <Separator />

      <Button variant="destructive" className="w-full gap-2" onClick={handleLogout}>
        <LogOut className="h-4 w-4" /> Keluar
      </Button>
    </div>
  );
};

export default Settings;
