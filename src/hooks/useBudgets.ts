import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";

type Budget = Tables<"budgets"> & {
  categories?: Tables<"categories"> | null;
  spent?: number;
};

// ─── READ with spent calculation ─────────────────────────────
export const useBudgets = (month?: number, year?: number) =>
  useQuery({
    queryKey: ["budgets", month, year],
    queryFn: async () => {
      const now = new Date();
      const targetMonth = month ?? now.getMonth() + 1;
      const targetYear = year ?? now.getFullYear();

      // Fetch budgets with category info
      const { data: budgets, error: bErr } = await supabase
        .from("budgets")
        .select("*, categories(id, name, icon, color)")
        .eq("period_month", targetMonth)
        .eq("period_year", targetYear);

      if (bErr) throw bErr;

      // Fetch spending per category for this month
      const firstDay = `${targetYear}-${String(targetMonth).padStart(2, "0")}-01`;
      const lastDay = new Date(targetYear, targetMonth, 0).toISOString().split("T")[0];

      const { data: spending, error: sErr } = await supabase
        .from("transactions")
        .select("category_id, amount")
        .eq("type", "expense")
        .gte("date", firstDay)
        .lte("date", lastDay);

      if (sErr) throw sErr;

      // Calculate spent per category
      const spentByCat: Record<string, number> = {};
      (spending as { category_id: string | null; amount: number }[]).forEach((tx) => {
        if (tx.category_id) {
          spentByCat[tx.category_id] = (spentByCat[tx.category_id] ?? 0) + tx.amount;
        }
      });

      return (budgets as Budget[]).map((b) => ({
        ...b,
        spent: spentByCat[b.category_id] ?? 0,
      }));
    },
  });

// ─── CREATE ───────────────────────────────────────────────────
export const useCreateBudget = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (budget: Omit<TablesInsert<"budgets">, "user_id">) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("budgets")
        .insert({ ...budget, user_id: user.user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
      toast({ title: "✅ Berhasil!", description: "Anggaran berhasil dibuat" });
    },
    onError: (err: Error) => {
      const msg = err.message.includes("unique")
        ? "Anggaran untuk kategori ini sudah ada di bulan ini"
        : err.message;
      toast({ title: "Gagal", description: msg, variant: "destructive" });
    },
  });
};

// ─── UPDATE ───────────────────────────────────────────────────
export const useUpdateBudget = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<"budgets"> & { id: string }) => {
      const { data, error } = await supabase
        .from("budgets")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
      toast({ title: "✅ Berhasil!", description: "Anggaran berhasil diperbarui" });
    },
    onError: (err: Error) => {
      toast({ title: "Gagal", description: err.message, variant: "destructive" });
    },
  });
};

// ─── DELETE ───────────────────────────────────────────────────
export const useDeleteBudget = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("budgets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
      toast({ title: "✅ Berhasil!", description: "Anggaran berhasil dihapus" });
    },
    onError: (err: Error) => {
      toast({ title: "Gagal", description: err.message, variant: "destructive" });
    },
  });
};
