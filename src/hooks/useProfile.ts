import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Tables, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";

type Profile = Tables<"profiles">;

// ─── READ ─────────────────────────────────────────────────────
export const useProfile = () =>
  useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.user.id)
        .single();

      if (error) {
        if (error.code !== "PGRST116") {
          throw error;
        }

        // Profile might not exist yet — create it
        const { data: created, error: createErr } = await supabase
          .from("profiles")
          .insert({
            id: user.user.id,
            full_name: user.user.user_metadata?.full_name ?? user.user.email ?? "",
            is_admin: user.user.user_metadata?.is_admin ?? false,
          })
          .select()
          .single();
        if (createErr) throw createErr;
        return created as Profile;
      }

      return data as Profile;
    },
  });

// ─── UPDATE ───────────────────────────────────────────────────
export const useUpdateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Omit<TablesUpdate<"profiles">, "id">) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");

      const nextFullName = updates.full_name?.trim();

      const { data, error } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.user.id,
            ...updates,
            ...(nextFullName ? { full_name: nextFullName } : {}),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        )
        .select()
        .single();

      if (error) throw error;

      if (nextFullName) {
        const { error: authError } = await supabase.auth.updateUser({
          data: {
            ...user.user.user_metadata,
            full_name: nextFullName,
          },
        });

        if (authError) throw authError;
      }

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: "✅ Berhasil!", description: "Profil berhasil diperbarui" });
    },
    onError: (err: Error) => {
      toast({ title: "Gagal", description: err.message, variant: "destructive" });
    },
  });
};

// ─── TRANSFERS ────────────────────────────────────────────────
export const useCreateTransfer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (transfer: {
      from_wallet_id: string;
      to_wallet_id: string;
      amount: number;
      description?: string;
      date?: string;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("transfers")
        .insert({ ...transfer, user_id: user.user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wallets"] });
      qc.invalidateQueries({ queryKey: ["total-balance"] });
      toast({ title: "✅ Berhasil!", description: "Transfer berhasil dilakukan" });
    },
    onError: (err: Error) => {
      toast({ title: "Gagal", description: err.message, variant: "destructive" });
    },
  });
};
