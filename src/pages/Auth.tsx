import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Mail, Lock, Eye, EyeOff, Wallet, ShieldCheck, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getAppUrl } from "@/lib/appUrl";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [showAdminCode, setShowAdminCode] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [pendingConfirmationEmail, setPendingConfirmationEmail] = useState("");

  const confirmationEmail = useMemo(
    () => pendingConfirmationEmail || registerEmail || loginEmail,
    [loginEmail, pendingConfirmationEmail, registerEmail]
  );
  const appUrl = getAppUrl();

  // ─── LOGIN ─────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) return;

    setRegistered(false);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPassword,
    });
    setLoading(false);

    if (error) {
      if (error.message.toLowerCase().includes("email not confirmed")) {
        setPendingConfirmationEmail(loginEmail.trim());
        toast({
          title: "Email belum diverifikasi",
          description: "Cek inbox email Anda dan klik link konfirmasi. Atau nonaktifkan 'Confirm email' di Supabase Dashboard.",
          variant: "destructive",
        });
      } else if (error.message.toLowerCase().includes("invalid login credentials")) {
        toast({ title: "Login gagal", description: "Email atau password salah.", variant: "destructive" });
      } else {
        toast({ title: "Login gagal", description: error.message, variant: "destructive" });
      }
    } else {
      setPendingConfirmationEmail("");
      navigate("/dashboard");
    }
  };

  // ─── REGISTER ─────────────────────────────────────────────────
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerEmail.trim() || !registerPassword.trim() || registerPassword.length < 6) {
      toast({ title: "Error", description: "Password minimal 6 karakter", variant: "destructive" });
      return;
    }
    if (!fullName.trim()) {
      toast({ title: "Error", description: "Nama lengkap harus diisi", variant: "destructive" });
      return;
    }

    setPendingConfirmationEmail("");
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: registerEmail.trim(),
      password: registerPassword,
      options: {
        data: {
          full_name: fullName.trim(),
          is_admin: adminCode === "ADMIN2026",
        },
        emailRedirectTo: `${appUrl}/dashboard`,
      },
    });
    setLoading(false);

    if (error) {
      toast({ title: "Registrasi gagal", description: error.message, variant: "destructive" });
    } else if (data.session) {
      // Auto-confirmed (email confirmation disabled) — go straight in
      toast({ title: "✅ Akun berhasil dibuat!", description: "Selamat datang!" });
      setPendingConfirmationEmail("");
      navigate("/dashboard");
    } else {
      // Email confirmation required
      setRegistered(true);
      setActiveTab("login");
      setLoginEmail(registerEmail.trim());
      setPendingConfirmationEmail(registerEmail.trim());
      toast({
        title: "✅ Akun berhasil dibuat!",
        description: "Akun sudah dibuat, tetapi belum aktif sampai email Anda diverifikasi.",
      });
    }
  };

  const handleResendConfirmation = async () => {
    if (!confirmationEmail.trim()) {
      toast({
        title: "Email belum tersedia",
        description: "Masukkan email akun Anda dulu untuk kirim ulang link verifikasi.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: confirmationEmail.trim(),
      options: {
        emailRedirectTo: `${appUrl}/dashboard`,
      },
    });
    setLoading(false);

    if (error) {
      toast({ title: "Gagal mengirim ulang", description: error.message, variant: "destructive" });
      return;
    }

    toast({
      title: "Link verifikasi dikirim ulang",
      description: `Cek inbox ${confirmationEmail.trim()} lalu klik link aktivasi akun.`,
    });
  };

  // ─── GOOGLE ───────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${appUrl}/dashboard` },
    });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4 py-8">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-card/95 backdrop-blur-sm">
        <CardHeader className="text-center space-y-3 pb-2">
          <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
            <Wallet className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-display">DompetKu</CardTitle>
          <CardDescription>Kelola keuangan Anda dengan mudah &amp; aman</CardDescription>
        </CardHeader>

        <CardContent>
          {registered ? (
            <Alert className="border-income/30 bg-income/5">
              <AlertCircle className="h-4 w-4 text-income" />
              <AlertDescription className="text-sm">
                <strong>Akun berhasil dibuat!</strong><br />
                Cek email <strong>{confirmationEmail}</strong> dan klik link konfirmasi untuk mengaktifkan akun Anda.
              </AlertDescription>
            </Alert>
          ) : (
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "login" | "register")} className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Masuk</TabsTrigger>
                <TabsTrigger value="register">Daftar</TabsTrigger>
              </TabsList>

              {pendingConfirmationEmail && (
                <Alert className="border-warning/30 bg-warning/5">
                  <AlertCircle className="h-4 w-4 text-warning" />
                  <AlertDescription className="space-y-3 text-sm">
                    <p>
                      Akun untuk <strong>{pendingConfirmationEmail}</strong> sudah terdaftar, tetapi belum aktif sampai email
                      diverifikasi.
                    </p>
                    <Button type="button" variant="outline" size="sm" onClick={handleResendConfirmation} disabled={loading}>
                      Kirim Ulang Email Verifikasi
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {/* ─── LOGIN TAB ─── */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="nama@email.com"
                        className="pl-10"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10 pr-10"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        Memproses...
                      </span>
                    ) : "Masuk"}
                  </Button>
                </form>
              </TabsContent>

              {/* ─── REGISTER TAB ─── */}
              <TabsContent value="register">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-name">Nama Lengkap</Label>
                    <Input
                      id="reg-name"
                      placeholder="Nama lengkap Anda"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      autoComplete="name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="reg-email"
                        type="email"
                      placeholder="nama@email.com"
                      className="pl-10"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="reg-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Minimal 6 karakter"
                        className="pl-10 pr-10"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        required
                        minLength={6}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Hidden admin code toggle */}
                  {showAdminCode ? (
                    <div className="space-y-2">
                      <Label htmlFor="reg-admin-code" className="flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                        Kode Akses Admin (Opsional)
                      </Label>
                      <Input
                        id="reg-admin-code"
                        placeholder="Kode rahasia"
                        type="password"
                        value={adminCode}
                        onChange={(e) => setAdminCode(e.target.value)}
                        autoComplete="off"
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                      onClick={() => setShowAdminCode(true)}
                    >
                      Punya kode admin?
                    </button>
                  )}

                  <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        Mendaftarkan...
                      </span>
                    ) : "Buat Akun"}
                  </Button>
                </form>
              </TabsContent>

              {/* ─── GOOGLE ─── */}
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">atau</span>
                </div>
              </div>

              <Button variant="outline" className="w-full h-11" onClick={handleGoogleLogin}>
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Masuk dengan Google
              </Button>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
