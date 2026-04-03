import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

const OFFLINE_TRANSACTION_QUEUE_KEY = "dompetku-offline-transactions";

export type TransactionPayload = Omit<TablesInsert<"transactions">, "user_id">;
export type TransactionUpdatePayload = TablesUpdate<"transactions"> & { id: string };
export type TransactionDeletePayload = { id: string };

export type QueuedCreateTransaction = {
  action: "create";
  client_id: string;
  queued_at: string;
  payload: TransactionPayload;
};

export type QueuedUpdateTransaction = {
  action: "update";
  client_id: string;
  queued_at: string;
  payload: TransactionUpdatePayload;
};

export type QueuedDeleteTransaction = {
  action: "delete";
  client_id: string;
  queued_at: string;
  payload: TransactionDeletePayload;
};

export type QueuedTransactionAction =
  | QueuedCreateTransaction
  | QueuedUpdateTransaction
  | QueuedDeleteTransaction;

export type TransactionLike = Tables<"transactions"> & {
  categories?: Tables<"categories"> | null;
  wallets?: Tables<"wallets"> | null;
};

const isBrowser = typeof window !== "undefined";

const readQueue = (): QueuedTransactionAction[] => {
  if (!isBrowser) return [];

  try {
    const raw = window.localStorage.getItem(OFFLINE_TRANSACTION_QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueuedTransactionAction[]) : [];
  } catch {
    return [];
  }
};

const writeQueue = (items: QueuedTransactionAction[]) => {
  if (!isBrowser) return;
  window.localStorage.setItem(OFFLINE_TRANSACTION_QUEUE_KEY, JSON.stringify(items));
};

export const getQueuedTransactions = () => readQueue();

export const enqueueOfflineTransactionCreate = (payload: TransactionPayload) => {
  const queued: QueuedCreateTransaction = {
    action: "create",
    client_id: `offline-${crypto.randomUUID()}`,
    queued_at: new Date().toISOString(),
    payload,
  };

  writeQueue([...readQueue(), queued]);
  return queued;
};

export const enqueueOfflineTransactionUpdate = (payload: TransactionUpdatePayload) => {
  const queue = readQueue();

  if (payload.id.startsWith("offline-")) {
    const nextQueue = queue.map((item) => {
      if (item.action === "create" && item.client_id === payload.id) {
        return {
          ...item,
          payload: {
            ...item.payload,
            ...payload,
            wallet_id: payload.wallet_id ?? item.payload.wallet_id,
            amount: payload.amount ?? item.payload.amount,
            description: payload.description ?? item.payload.description,
            type: payload.type ?? item.payload.type,
          },
        };
      }

      return item;
    });

    writeQueue(nextQueue);
    return null;
  }

  const queued: QueuedUpdateTransaction = {
    action: "update",
    client_id: `offline-update-${crypto.randomUUID()}`,
    queued_at: new Date().toISOString(),
    payload,
  };

  writeQueue([...queue, queued]);
  return queued;
};

export const enqueueOfflineTransactionDelete = (payload: TransactionDeletePayload) => {
  const queue = readQueue();

  if (payload.id.startsWith("offline-")) {
    writeQueue(
      queue.filter(
        (item) =>
          !(
            item.action === "create" &&
            item.client_id === payload.id
          )
      )
    );
    return null;
  }

  const nextQueue = queue.filter((item) => {
    if (item.action === "update" && item.payload.id === payload.id) return false;
    return true;
  });

  const queued: QueuedDeleteTransaction = {
    action: "delete",
    client_id: `offline-delete-${crypto.randomUUID()}`,
    queued_at: new Date().toISOString(),
    payload,
  };

  writeQueue([...nextQueue, queued]);
  return queued;
};

export const removeQueuedTransaction = (clientId: string) => {
  writeQueue(readQueue().filter((item) => item.client_id !== clientId));
};

export const buildOptimisticTransaction = (queued: QueuedCreateTransaction): TransactionLike => ({
  id: queued.client_id,
  user_id: "offline",
  wallet_id: queued.payload.wallet_id,
  category_id: queued.payload.category_id ?? null,
  type: queued.payload.type,
  amount: queued.payload.amount,
  description: queued.payload.description,
  note: queued.payload.note ?? null,
  date: queued.payload.date ?? new Date().toISOString().split("T")[0],
  created_at: queued.queued_at,
  updated_at: queued.queued_at,
  categories: null,
  wallets: null,
});
