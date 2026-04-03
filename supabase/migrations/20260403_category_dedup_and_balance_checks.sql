-- =====================================================
-- Category dedupe, uniqueness, and balance verification
-- =====================================================

-- Remove duplicated categories while keeping the oldest row.
DELETE FROM public.categories a
USING public.categories b
WHERE a.ctid < b.ctid
  AND COALESCE(a.user_id, '00000000-0000-0000-0000-000000000000'::uuid)
      = COALESCE(b.user_id, '00000000-0000-0000-0000-000000000000'::uuid)
  AND a.type = b.type
  AND lower(trim(a.name)) = lower(trim(b.name));

-- Prevent future duplicate categories for the same owner/type/name.
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_unique_owner_type_name
  ON public.categories (
    COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid),
    type,
    lower(trim(name))
  );

-- Helpful indexes for category usage lookups.
CREATE INDEX IF NOT EXISTS idx_categories_user_type_active
  ON public.categories(user_id, type, is_active);

-- Helper view for checking wallet balances after insert/update/delete transactions.
CREATE OR REPLACE VIEW public.wallet_balance_audit AS
SELECT
  w.id AS wallet_id,
  w.user_id,
  w.name AS wallet_name,
  w.balance AS recorded_balance,
  COALESCE(
    SUM(
      CASE
        WHEN t.type = 'income' THEN t.amount
        WHEN t.type = 'expense' THEN -t.amount
        ELSE 0
      END
    ),
    0
  ) AS computed_from_transactions
FROM public.wallets w
LEFT JOIN public.transactions t ON t.wallet_id = w.id
GROUP BY w.id, w.user_id, w.name, w.balance;
