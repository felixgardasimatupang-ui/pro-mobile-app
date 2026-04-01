-- =====================================================
-- DompetKu - Full Database Schema with Security
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PROFILES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  currency TEXT NOT NULL DEFAULT 'IDR',
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- WALLETS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cash', 'bank', 'ewallet', 'other')),
  balance NUMERIC(20, 2) NOT NULL DEFAULT 0,
  icon TEXT DEFAULT '💰',
  color TEXT DEFAULT '#6366f1',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own wallets"
  ON public.wallets FOR ALL
  USING (auth.uid() = user_id);

-- =====================================================
-- CATEGORIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL = system/default category
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'both')),
  icon TEXT DEFAULT '📁',
  color TEXT DEFAULT '#6366f1',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own and system categories"
  ON public.categories FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can manage own categories"
  ON public.categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
  ON public.categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
  ON public.categories FOR DELETE
  USING (auth.uid() = user_id);

-- Insert default system categories
INSERT INTO public.categories (user_id, name, type, icon, color) VALUES
  (NULL, 'Gaji', 'income', '💼', '#22c55e'),
  (NULL, 'Pendapatan Lain', 'income', '💰', '#10b981'),
  (NULL, 'Investasi', 'income', '📈', '#06b6d4'),
  (NULL, 'Bonus', 'income', '🎁', '#84cc16'),
  (NULL, 'Makanan', 'expense', '🍽️', '#f97316'),
  (NULL, 'Transport', 'expense', '🚗', '#3b82f6'),
  (NULL, 'Belanja', 'expense', '🛍️', '#a855f7'),
  (NULL, 'Tagihan', 'expense', '⚡', '#eab308'),
  (NULL, 'Hiburan', 'expense', '🎮', '#ec4899'),
  (NULL, 'Kesehatan', 'expense', '🏥', '#ef4444'),
  (NULL, 'Pendidikan', 'expense', '📚', '#8b5cf6'),
  (NULL, 'Transfer', 'both', '↔️', '#6b7280')
ON CONFLICT DO NOTHING;

-- =====================================================
-- TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  amount NUMERIC(20, 2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  note TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own transactions"
  ON public.transactions FOR ALL
  USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON public.transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions(category_id);

-- =====================================================
-- BUDGETS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  amount_limit NUMERIC(20, 2) NOT NULL CHECK (amount_limit > 0),
  period_month INT NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  period_year INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, category_id, period_month, period_year)
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own budgets"
  ON public.budgets FOR ALL
  USING (auth.uid() = user_id);

-- =====================================================
-- TRANSFERS TABLE (for wallet-to-wallet transfers)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  to_wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  amount NUMERIC(20, 2) NOT NULL CHECK (amount > 0),
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT different_wallets CHECK (from_wallet_id != to_wallet_id)
);

ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own transfers"
  ON public.transfers FOR ALL
  USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Auto-create profile on sign up
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
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_budgets_updated_at
  BEFORE UPDATE ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function: Update wallet balance when transaction is inserted/updated/deleted
CREATE OR REPLACE FUNCTION public.update_wallet_balance_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.type = 'income' THEN
      UPDATE public.wallets SET balance = balance + NEW.amount WHERE id = NEW.wallet_id;
    ELSIF NEW.type = 'expense' THEN
      UPDATE public.wallets SET balance = balance - NEW.amount WHERE id = NEW.wallet_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.type = 'income' THEN
      UPDATE public.wallets SET balance = balance - OLD.amount WHERE id = OLD.wallet_id;
    ELSIF OLD.type = 'expense' THEN
      UPDATE public.wallets SET balance = balance + OLD.amount WHERE id = OLD.wallet_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Reverse the old transaction
    IF OLD.type = 'income' THEN
      UPDATE public.wallets SET balance = balance - OLD.amount WHERE id = OLD.wallet_id;
    ELSIF OLD.type = 'expense' THEN
      UPDATE public.wallets SET balance = balance + OLD.amount WHERE id = OLD.wallet_id;
    END IF;
    -- Apply the new transaction
    IF NEW.type = 'income' THEN
      UPDATE public.wallets SET balance = balance + NEW.amount WHERE id = NEW.wallet_id;
    ELSIF NEW.type = 'expense' THEN
      UPDATE public.wallets SET balance = balance - NEW.amount WHERE id = NEW.wallet_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER transaction_wallet_balance_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_wallet_balance_on_transaction();

-- Function: Handle transfers (debit from + credit to)
CREATE OR REPLACE FUNCTION public.update_wallet_balance_on_transfer()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.wallets SET balance = balance - NEW.amount WHERE id = NEW.from_wallet_id;
    UPDATE public.wallets SET balance = balance + NEW.amount WHERE id = NEW.to_wallet_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.wallets SET balance = balance + OLD.amount WHERE id = OLD.from_wallet_id;
    UPDATE public.wallets SET balance = balance - OLD.amount WHERE id = OLD.to_wallet_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER transfer_wallet_balance_trigger
  AFTER INSERT OR DELETE ON public.transfers
  FOR EACH ROW EXECUTE FUNCTION public.update_wallet_balance_on_transfer();

-- =====================================================
-- VIEWS
-- =====================================================

-- Monthly summary view per user
CREATE OR REPLACE VIEW public.monthly_summary AS
SELECT
  user_id,
  date_trunc('month', date) AS month,
  SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS total_income,
  SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expense,
  COUNT(*) AS transaction_count
FROM public.transactions
GROUP BY user_id, date_trunc('month', date);
