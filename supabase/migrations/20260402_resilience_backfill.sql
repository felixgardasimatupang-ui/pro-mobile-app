-- =====================================================
-- Resilience, seed backfill, and stricter RLS policies
-- =====================================================

-- Recreate wallet policies with explicit checks for every write path.
DROP POLICY IF EXISTS "Users can manage own wallets" ON public.wallets;
CREATE POLICY "Users can view own wallets"
  ON public.wallets FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wallets"
  ON public.wallets FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own wallets"
  ON public.wallets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own wallets"
  ON public.wallets FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions"
  ON public.transactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions"
  ON public.transactions FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own budgets" ON public.budgets;
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

DROP POLICY IF EXISTS "Users can manage own transfers" ON public.transfers;
CREATE POLICY "Users can view own transfers"
  ON public.transfers FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transfers"
  ON public.transfers FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transfers"
  ON public.transfers FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own transfers"
  ON public.transfers FOR DELETE
  USING (auth.uid() = user_id);

-- Backfill missing system categories without creating duplicates.
INSERT INTO public.categories (user_id, name, type, icon, color)
SELECT NULL, 'Gaji', 'income', '💼', '#22c55e'
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories WHERE user_id IS NULL AND name = 'Gaji' AND type = 'income'
);

INSERT INTO public.categories (user_id, name, type, icon, color)
SELECT NULL, 'Pendapatan Lain', 'income', '💰', '#10b981'
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories WHERE user_id IS NULL AND name = 'Pendapatan Lain' AND type = 'income'
);

INSERT INTO public.categories (user_id, name, type, icon, color)
SELECT NULL, 'Investasi', 'income', '📈', '#06b6d4'
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories WHERE user_id IS NULL AND name = 'Investasi' AND type = 'income'
);

INSERT INTO public.categories (user_id, name, type, icon, color)
SELECT NULL, 'Bonus', 'income', '🎁', '#84cc16'
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories WHERE user_id IS NULL AND name = 'Bonus' AND type = 'income'
);

INSERT INTO public.categories (user_id, name, type, icon, color)
SELECT NULL, 'Makanan', 'expense', '🍽️', '#f97316'
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories WHERE user_id IS NULL AND name = 'Makanan' AND type = 'expense'
);

INSERT INTO public.categories (user_id, name, type, icon, color)
SELECT NULL, 'Transport', 'expense', '🚗', '#3b82f6'
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories WHERE user_id IS NULL AND name = 'Transport' AND type = 'expense'
);

INSERT INTO public.categories (user_id, name, type, icon, color)
SELECT NULL, 'Belanja', 'expense', '🛍️', '#a855f7'
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories WHERE user_id IS NULL AND name = 'Belanja' AND type = 'expense'
);

INSERT INTO public.categories (user_id, name, type, icon, color)
SELECT NULL, 'Tagihan', 'expense', '⚡', '#eab308'
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories WHERE user_id IS NULL AND name = 'Tagihan' AND type = 'expense'
);

INSERT INTO public.categories (user_id, name, type, icon, color)
SELECT NULL, 'Hiburan', 'expense', '🎮', '#ec4899'
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories WHERE user_id IS NULL AND name = 'Hiburan' AND type = 'expense'
);

INSERT INTO public.categories (user_id, name, type, icon, color)
SELECT NULL, 'Kesehatan', 'expense', '🏥', '#ef4444'
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories WHERE user_id IS NULL AND name = 'Kesehatan' AND type = 'expense'
);

INSERT INTO public.categories (user_id, name, type, icon, color)
SELECT NULL, 'Pendidikan', 'expense', '📚', '#8b5cf6'
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories WHERE user_id IS NULL AND name = 'Pendidikan' AND type = 'expense'
);

INSERT INTO public.categories (user_id, name, type, icon, color)
SELECT NULL, 'Transfer', 'both', '↔️', '#6b7280'
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories WHERE user_id IS NULL AND name = 'Transfer' AND type = 'both'
);

-- Backfill a starter wallet for existing users that do not have one yet.
INSERT INTO public.wallets (user_id, name, type, balance, icon, color)
SELECT u.id, 'Cash', 'cash', 0, '💵', '#22c55e'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.wallets w WHERE w.user_id = u.id
);

-- Update signup trigger so new users always have a profile and one starter wallet.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'is_admin')::BOOLEAN, false)
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.wallets (user_id, name, type, balance, icon, color)
  VALUES (NEW.id, 'Cash', 'cash', 0, '💵', '#22c55e')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
