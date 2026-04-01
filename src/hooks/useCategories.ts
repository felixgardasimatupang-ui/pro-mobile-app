import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";

type Category = Tables<"categories">;

// ─── READ ─────────────────────────────────────────────────────
export const useCategories = (type?: "income" | "expense") =>
  useQuery({
    queryKey: ["categories", type],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      let query = supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (type) {
        query = query.in("type", [type, "both"]);
      }

      const { data, error } = await query;
      if (error) throw error;
      // Return system categories + user's own categories
      return (data as Category[]).filter(
        (c) => c.user_id === null || c.user_id === user.user?.id
      );
    },
  });

// ─── CREATE ───────────────────────────────────────────────────
export const useCreateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cat: Omit<TablesInsert<"categories">, "user_id">) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("categories")
        .insert({ ...cat, user_id: user.user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: "✅ Berhasil!", description: "Kategori berhasil dibuat" });
    },
    onError: (err: Error) => {
      toast({ title: "Gagal", description: err.message, variant: "destructive" });
    },
  });
};

// ─── DELETE ───────────────────────────────────────────────────
export const useDeleteCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("categories")
        .update({ is_active: false })
        .eq("id", id)
        .not("user_id", "is", null); // Only allow deleting user-created categories
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: "✅ Berhasil!", description: "Kategori berhasil dihapus" });
    },
    onError: (err: Error) => {
      toast({ title: "Gagal", description: err.message, variant: "destructive" });
    },
  });
};
