import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { getQueuedTransactions, removeQueuedTransaction } from "@/lib/offlineTransactionQueue";

type UseOfflineTransactionSyncParams = {
  enabled: boolean;
};

export const useOfflineTransactionSync = ({ enabled }: UseOfflineTransactionSyncParams) => {
  const qc = useQueryClient();
  const syncingRef = useRef(false);

  useEffect(() => {
    if (!enabled || syncingRef.current) return;

    const syncQueuedTransactions = async () => {
      const queue = getQueuedTransactions();
      if (queue.length === 0) return;

      syncingRef.current = true;
      let syncedCount = 0;

      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return;

        for (const item of queue) {
          if (item.action === "create") {
            const { error } = await supabase
              .from("transactions")
              .insert({
                ...item.payload,
                user_id: userData.user.id,
              });

            if (error) throw error;
          }

          if (item.action === "update") {
            const { id, ...updates } = item.payload;
            const { error } = await supabase
              .from("transactions")
              .update(updates)
              .eq("id", id);

            if (error) throw error;
          }

          if (item.action === "delete") {
            const { error } = await supabase
              .from("transactions")
              .delete()
              .eq("id", item.payload.id);

            if (error) throw error;
          }

          removeQueuedTransaction(item.client_id);
          syncedCount += 1;
        }

        if (syncedCount > 0) {
          qc.invalidateQueries({ queryKey: ["transactions"] });
          qc.invalidateQueries({ queryKey: ["wallets"] });
          qc.invalidateQueries({ queryKey: ["total-balance"] });
          qc.invalidateQueries({ queryKey: ["monthly-stats"] });
          qc.invalidateQueries({ queryKey: ["expense-by-category"] });
          qc.invalidateQueries({ queryKey: ["budgets"] });
          toast({
            title: "Koneksi kembali",
            description: `${syncedCount} perubahan offline berhasil disinkronkan.`,
          });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Sinkronisasi gagal";
        toast({
          title: "Sinkronisasi offline gagal",
          description: message,
          variant: "destructive",
        });
      } finally {
        syncingRef.current = false;
      }
    };

    void syncQueuedTransactions();
  }, [enabled, qc]);
};
