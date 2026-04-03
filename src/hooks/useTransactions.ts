import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";
import {
  buildOptimisticTransaction,
  enqueueOfflineTransactionCreate,
  enqueueOfflineTransactionDelete,
  enqueueOfflineTransactionUpdate,
  type TransactionPayload,
  type TransactionUpdatePayload,
} from "@/lib/offlineTransactionQueue";

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

const updateTransactionCaches = (qc: ReturnType<typeof useQueryClient>, transaction: Transaction) => {
  const matchesFilter = (filters?: TransactionFilters) => {
    if (!filters) return true;
    if (filters.type && filters.type !== "all" && filters.type !== transaction.type) return false;
    if (filters.wallet_id && filters.wallet_id !== transaction.wallet_id) return false;
    if (filters.category_id && filters.category_id !== transaction.category_id) return false;
    if (filters.from_date && transaction.date < filters.from_date) return false;
    if (filters.to_date && transaction.date > filters.to_date) return false;
    if (
      filters.search &&
      !transaction.description.toLowerCase().includes(filters.search.toLowerCase())
    ) return false;
    return true;
  };

  const cachedQueries = qc.getQueriesData<Transaction[]>({ queryKey: ["transactions"] });

  cachedQueries.forEach(([queryKey, existing]) => {
    const filters = queryKey[1] as TransactionFilters | undefined;
    if (!matchesFilter(filters)) return;

    const next = [transaction, ...(existing ?? [])];
    qc.setQueryData(queryKey, filters?.limit ? next.slice(0, filters.limit) : next);
  });
};

const patchTransactionCaches = (
  qc: ReturnType<typeof useQueryClient>,
  transactionId: string,
  updates: Partial<Transaction>
) => {
  const cachedQueries = qc.getQueriesData<Transaction[]>({ queryKey: ["transactions"] });

  cachedQueries.forEach(([queryKey, existing]) => {
    if (!existing) return;

    qc.setQueryData(
      queryKey,
      existing.map((item) =>
        item.id === transactionId
          ? {
              ...item,
              ...updates,
              updated_at: new Date().toISOString(),
            }
          : item
      )
    );
  });
};

const removeTransactionFromCaches = (qc: ReturnType<typeof useQueryClient>, transactionId: string) => {
  const cachedQueries = qc.getQueriesData<Transaction[]>({ queryKey: ["transactions"] });

  cachedQueries.forEach(([queryKey, existing]) => {
    if (!existing) return;
    qc.setQueryData(
      queryKey,
      existing.filter((item) => item.id !== transactionId)
    );
  });
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
    mutationFn: async (tx: TransactionPayload) => {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        const queued = enqueueOfflineTransactionCreate(tx);
        const optimistic = buildOptimisticTransaction(queued) as Transaction;
        updateTransactionCaches(qc, optimistic);
        return optimistic;
      }

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
    onSuccess: (data) => {
      const isQueued = typeof data?.id === "string" && data.id.startsWith("offline-");

      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["wallets"] });
      qc.invalidateQueries({ queryKey: ["total-balance"] });
      qc.invalidateQueries({ queryKey: ["monthly-stats"] });
      qc.invalidateQueries({ queryKey: ["expense-by-category"] });
      qc.invalidateQueries({ queryKey: ["budgets"] });
      toast({
        title: isQueued ? "Disimpan offline" : "✅ Berhasil!",
        description: isQueued
          ? "Transaksi disimpan ke antrean offline dan akan disinkronkan saat online."
          : "Transaksi berhasil ditambahkan",
      });
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
    mutationFn: async ({ id, ...updates }: TransactionUpdatePayload) => {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        enqueueOfflineTransactionUpdate({ id, ...updates });
        patchTransactionCaches(qc, id, updates as Partial<Transaction>);
        return { id, ...updates } as Tables<"transactions">;
      }

      const { data, error } = await supabase
        .from("transactions")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["wallets"] });
      qc.invalidateQueries({ queryKey: ["total-balance"] });
      qc.invalidateQueries({ queryKey: ["monthly-stats"] });
      qc.invalidateQueries({ queryKey: ["expense-by-category"] });
      qc.invalidateQueries({ queryKey: ["budgets"] });
      const isOfflineQueued = data && !("user_id" in data);
      toast({
        title: isOfflineQueued ? "Perubahan disimpan offline" : "✅ Berhasil!",
        description: isOfflineQueued
          ? "Edit transaksi akan disinkronkan saat koneksi kembali."
          : "Transaksi berhasil diperbarui",
      });
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
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        enqueueOfflineTransactionDelete({ id });
        removeTransactionFromCaches(qc, id);
        return;
      }

      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, id) => {
      const isOfflineQueued = typeof navigator !== "undefined" && !navigator.onLine;
      if (!isOfflineQueued) {
        removeTransactionFromCaches(qc, id);
      }

      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["wallets"] });
      qc.invalidateQueries({ queryKey: ["total-balance"] });
      qc.invalidateQueries({ queryKey: ["monthly-stats"] });
      qc.invalidateQueries({ queryKey: ["expense-by-category"] });
      qc.invalidateQueries({ queryKey: ["budgets"] });
      toast({
        title: isOfflineQueued ? "Hapus disimpan offline" : "✅ Berhasil!",
        description: isOfflineQueued
          ? "Penghapusan transaksi akan disinkronkan saat koneksi kembali."
          : "Transaksi berhasil dihapus",
      });
    },
    onError: (err: Error) => {
      toast({ title: "Gagal", description: err.message, variant: "destructive" });
    },
  });
};
