-- =====================================================
-- Security hardening and performance indexes
-- =====================================================

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own wallets" ON public.wallets;
DROP POLICY IF EXISTS "Users can view own wallets" ON public.wallets;
DROP POLICY IF EXISTS "Users can insert own wallets" ON public.wallets;
DROP POLICY IF EXISTS "Users can update own wallets" ON public.wallets;
DROP POLICY IF EXISTS "Users can delete own wallets" ON public.wallets;
DROP POLICY IF EXISTS "User hanya bisa melihat wallet miliknya sendiri" ON public.wallets;
CREATE POLICY "User hanya bisa melihat wallet miliknya sendiri"
  ON public.wallets FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "User hanya bisa menambah wallet miliknya sendiri" ON public.wallets;
CREATE POLICY "User hanya bisa menambah wallet miliknya sendiri"
  ON public.wallets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "User hanya bisa mengubah wallet miliknya sendiri" ON public.wallets;
CREATE POLICY "User hanya bisa mengubah wallet miliknya sendiri"
  ON public.wallets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "User hanya bisa menghapus wallet miliknya sendiri" ON public.wallets;
CREATE POLICY "User hanya bisa menghapus wallet miliknya sendiri"
  ON public.wallets FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON public.transactions;
DROP POLICY IF EXISTS "User hanya bisa melihat datanya sendiri" ON public.transactions;
CREATE POLICY "User hanya bisa melihat datanya sendiri"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "User hanya bisa menambah transaksi miliknya sendiri" ON public.transactions;
CREATE POLICY "User hanya bisa menambah transaksi miliknya sendiri"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "User hanya bisa mengubah transaksi miliknya sendiri" ON public.transactions;
CREATE POLICY "User hanya bisa mengubah transaksi miliknya sendiri"
  ON public.transactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "User hanya bisa menghapus transaksi miliknya sendiri" ON public.transactions;
CREATE POLICY "User hanya bisa menghapus transaksi miliknya sendiri"
  ON public.transactions FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can view own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can insert own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can update own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can delete own budgets" ON public.budgets;
CREATE POLICY "Users can view own budgets"
  ON public.budgets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budgets"
  ON public.budgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets"
  ON public.budgets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets"
  ON public.budgets FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_user_created_at
  ON public.transactions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_user_category_date
  ON public.transactions(user_id, category_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_user_type_date
  ON public.transactions(user_id, type, date DESC);

CREATE INDEX IF NOT EXISTS idx_wallets_user_active_created
  ON public.wallets(user_id, is_active, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_budgets_user_period
  ON public.budgets(user_id, period_year, period_month);
