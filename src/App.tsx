import { lazy, Suspense, useEffect, useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
  dehydrate,
  hydrate,
  onlineManager,
} from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";
import AppLayout from "@/components/AppLayout";
import OfflineBanner from "@/components/OfflineBanner";
import { useOfflineTransactionSync } from "@/hooks/useOfflineTransactionSync";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

const Auth = lazy(() => import("@/pages/Auth"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Transactions = lazy(() => import("@/pages/Transactions"));
const Budget = lazy(() => import("@/pages/Budget"));
const Reports = lazy(() => import("@/pages/Reports"));
const Settings = lazy(() => import("@/pages/Settings"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const QUERY_CACHE_STORAGE_KEY = "dompetku-react-query-cache";

// ─── Query Client with optimized defaults ─────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,       // 2 minutes
      gcTime: 1000 * 60 * 10,          // 10 minutes
      retry: 1,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

if (typeof window !== "undefined") {
  const persistedState = window.localStorage.getItem(QUERY_CACHE_STORAGE_KEY);

  if (persistedState) {
    try {
      hydrate(queryClient, JSON.parse(persistedState));
    } catch (error) {
      console.warn("Failed to hydrate query cache:", error);
      window.localStorage.removeItem(QUERY_CACHE_STORAGE_KEY);
    }
  }
}

// ─── Protected Route ───────────────────────────────────────────
const ProtectedRoute = ({ session, loading, children }: {
  session: Session | null;
  loading: boolean;
  children: React.ReactNode;
}) => {
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }
  if (!session) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

// ─── Public Route (redirect if already logged in) ─────────────
const PublicRoute = ({ session, loading, children }: {
  session: Session | null;
  loading: boolean;
  children: React.ReactNode;
}) => {
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Memeriksa sesi...</p>
        </div>
      </div>
    );
  }
  if (session) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const AppShell = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const isOnline = useOnlineStatus();

  useOfflineTransactionSync({ enabled: Boolean(session) && isOnline });

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      // Invalidate all queries when auth changes
      if (!session) {
        queryClient.clear();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    onlineManager.setOnline(isOnline);
  }, [isOnline]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const unsubscribe = queryClient.getQueryCache().subscribe(() => {
      const dehydratedState = dehydrate(queryClient, {
        shouldDehydrateQuery: (query) => query.state.status === "success",
      });
      window.localStorage.setItem(
        QUERY_CACHE_STORAGE_KEY,
        JSON.stringify(dehydratedState)
      );
    });

    return unsubscribe;
  }, []);

  const routeFallback = (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Memuat halaman...</p>
      </div>
    </div>
  );

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <OfflineBanner visible={!isOnline} />
        <Suspense fallback={routeFallback}>
          <Routes>
            <Route
              path="/auth"
              element={
                <PublicRoute session={session} loading={loading}>
                  <Auth />
                </PublicRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              element={
                <ProtectedRoute session={session} loading={loading}>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/budget" element={<Budget />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  );
};

// ─── App ──────────────────────────────────────────────────────
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppShell />
    </QueryClientProvider>
  );
};

export default App;
