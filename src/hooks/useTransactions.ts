import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";

export type Transaction = Tables<"transactions"> & {
  categories?: Tables<"categories"> | null;
  wallets?: Tables<"wallets"> | null;
};

export type TransactionFilters = {
  type?: "income" | "expense" | "all";
  wallet_id?: string;
  category_id?: string;
  from_date?: string;
  to_date?: string;
  search?: string;
  limit?: number;
};

// ─── READ (with related data) ─────────────────────────────────
export const useTransactions = (filters: TransactionFilters = {}) =>
  useQuery({
    queryKey: ["transactions", filters],
    queryFn: async () => {
      let query = supabase
        .from("transactions")
        .select(`
          *,
          categories (id, name, icon, color),
          wallets (id, name, icon)
        `)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });

      if (filters.type && filters.type !== "all") {
        query = query.eq("type", filters.type);
      }
      if (filters.wallet_id) {
        query = query.eq("wallet_id", filters.wallet_id);
      }
      if (filters.category_id) {
        query = query.eq("category_id", filters.category_id);
      }
      if (filters.from_date) {
        query = query.gte("date", filters.from_date);
      }
      if (filters.to_date) {
        query = query.lte("date", filters.to_date);
      }
      if (filters.search) {
        query = query.ilike("description", `%${filters.search}%`);
      }
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Transaction[];
    },
  });

// ─── RECENT (for dashboard) ───────────────────────────────────
export const useRecentTransactions = (limit = 5) =>
  useTransactions({ limit });

// ─── MONTHLY SUMMARY ─────────────────────────────────────────
export const useMonthlyStats = (year?: number, months?: number) =>
  useQuery({
    queryKey: ["monthly-stats", year, months],
    queryFn: async () => {
      const currentDate = new Date();
      const targetYear = year ?? currentDate.getFullYear();
      const numMonths = months ?? 6;

      const fromDate = new Date(targetYear, currentDate.getMonth() - numMonths + 1, 1)
        .toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("transactions")
        .select("type, amount, date")
        .gte("date", fromDate)
        .order("date");

      if (error) throw error;

      // Group by month
      const grouped: Record<string, { income: number; expense: number; month: string }> = {};
      (data as { type: string; amount: number; date: string }[]).forEach((tx) => {
        const monthKey = tx.date.slice(0, 7); // "2026-04"
        if (!grouped[monthKey]) {
          const [y, m] = monthKey.split("-");
          const monthNames = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
          grouped[monthKey] = { income: 0, expense: 0, month: monthNames[parseInt(m) - 1] };
        }
        if (tx.type === "income") grouped[monthKey].income += tx.amount;
        if (tx.type === "expense") grouped[monthKey].expense += tx.amount;
      });

      return Object.entries(grouped)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, v]) => v);
    },
  });

// ─── EXPENSE BY CATEGORY (for pie chart) ─────────────────────
export const useExpenseByCategory = (fromDate?: string) =>
  useQuery({
    queryKey: ["expense-by-category", fromDate],
    queryFn: async () => {
      const from = fromDate ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("transactions")
        .select("amount, categories(name, color)")
        .eq("type", "expense")
        .gte("date", from);

      if (error) throw error;

      const grouped: Record<string, { name: string; value: number; color: string }> = {};
      (data as { amount: number; categories: { name: string; color: string } | null }[]).forEach((tx) => {
        const catName = tx.categories?.name ?? "Lainnya";
        const catColor = tx.categories?.color ?? "#6b7280";
        if (!grouped[catName]) grouped[catName] = { name: catName, value: 0, color: catColor };
        grouped[catName].value += tx.amount;
      });

      return Object.values(grouped).sort((a, b) => b.value - a.value);
    },
  });

// ─── CREATE ───────────────────────────────────────────────────
export const useCreateTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tx: Omit<TablesInsert<"transactions">, "user_id">) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("transactions")
        .insert({ ...tx, user_id: user.user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["wallets"] });
      qc.invalidateQueries({ queryKey: ["total-balance"] });
      qc.invalidateQueries({ queryKey: ["monthly-stats"] });
      qc.invalidateQueries({ queryKey: ["expense-by-category"] });
      qc.invalidateQueries({ queryKey: ["budgets"] });
      toast({ title: "✅ Berhasil!", description: "Transaksi berhasil ditambahkan" });
    },
    onError: (err: Error) => {
      toast({ title: "Gagal", description: err.message, variant: "destructive" });
    },
  });
};

// ─── UPDATE ───────────────────────────────────────────────────
export const useUpdateTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<"transactions"> & { id: string }) => {
      const { data, error } = await supabase
        .from("transactions")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["wallets"] });
      qc.invalidateQueries({ queryKey: ["total-balance"] });
      qc.invalidateQueries({ queryKey: ["monthly-stats"] });
      qc.invalidateQueries({ queryKey: ["expense-by-category"] });
      qc.invalidateQueries({ queryKey: ["budgets"] });
      toast({ title: "✅ Berhasil!", description: "Transaksi berhasil diperbarui" });
    },
    onError: (err: Error) => {
      toast({ title: "Gagal", description: err.message, variant: "destructive" });
    },
  });
};

// ─── DELETE ───────────────────────────────────────────────────
export const useDeleteTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["wallets"] });
      qc.invalidateQueries({ queryKey: ["total-balance"] });
      qc.invalidateQueries({ queryKey: ["monthly-stats"] });
      qc.invalidateQueries({ queryKey: ["expense-by-category"] });
      qc.invalidateQueries({ queryKey: ["budgets"] });
      toast({ title: "✅ Berhasil!", description: "Transaksi berhasil dihapus" });
    },
    onError: (err: Error) => {
      toast({ title: "Gagal", description: err.message, variant: "destructive" });
    },
  });
};
