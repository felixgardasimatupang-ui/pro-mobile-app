import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";

type Wallet = Tables<"wallets">;
type WalletInsert = TablesInsert<"wallets">;
type WalletUpdate = TablesUpdate<"wallets">;

// ─── READ ─────────────────────────────────────────────────────
export const useWallets = () =>
  useQuery({
    queryKey: ["wallets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Wallet[];
    },
  });

// ─── CREATE ───────────────────────────────────────────────────
export const useCreateWallet = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (wallet: Omit<WalletInsert, "user_id">) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("wallets")
        .insert({ ...wallet, user_id: user.user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wallets"] });
      toast({ title: "✅ Berhasil!", description: "Wallet berhasil ditambahkan" });
    },
    onError: (err: Error) => {
      toast({ title: "Gagal", description: err.message, variant: "destructive" });
    },
  });
};

// ─── UPDATE ───────────────────────────────────────────────────
export const useUpdateWallet = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: WalletUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("wallets")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wallets"] });
      toast({ title: "✅ Berhasil!", description: "Wallet berhasil diperbarui" });
    },
    onError: (err: Error) => {
      toast({ title: "Gagal", description: err.message, variant: "destructive" });
    },
  });
};

// ─── DELETE (soft delete) ─────────────────────────────────────
export const useDeleteWallet = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("wallets")
        .update({ is_active: false })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wallets"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast({ title: "✅ Berhasil!", description: "Wallet berhasil dihapus" });
    },
    onError: (err: Error) => {
      toast({ title: "Gagal", description: err.message, variant: "destructive" });
    },
  });
};

// ─── TOTAL BALANCE ────────────────────────────────────────────
export const useTotalBalance = () =>
  useQuery({
    queryKey: ["total-balance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wallets")
        .select("balance")
        .eq("is_active", true);
      if (error) throw error;
      return (data as { balance: number }[]).reduce((sum, w) => sum + w.balance, 0);
    },
  });
