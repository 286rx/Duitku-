-- ============================================
-- DuitKu Database Schema for Supabase
-- Run this in the Supabase SQL Editor
-- ============================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  currency TEXT DEFAULT 'IDR',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. WALLETS TABLE
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'bank',
  balance DECIMAL(15,2) DEFAULT 0,
  icon TEXT,
  color TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own wallets" ON wallets FOR ALL USING (auth.uid() = user_id);

-- 3. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  icon TEXT,
  color TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own and default categories" ON categories
  FOR SELECT USING (auth.uid() = user_id OR is_default = true);
CREATE POLICY "Users can manage own categories" ON categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories" ON categories
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories" ON categories
  FOR DELETE USING (auth.uid() = user_id);

-- 4. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  amount DECIMAL(15,2) NOT NULL,
  description TEXT,
  notes TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_url TEXT,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own transactions" ON transactions FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON transactions(wallet_id);

-- 5. BUDGETS TABLE
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category_id, month, year)
);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own budgets" ON budgets FOR ALL USING (auth.uid() = user_id);

-- SEED DEFAULT CATEGORIES
INSERT INTO categories (user_id, name, type, icon, color, is_default) VALUES
  (NULL, 'Makanan & Minuman', 'expense', '🍔', '#FF6B6B', true),
  (NULL, 'Transportasi', 'expense', '🚗', '#4ECDC4', true),
  (NULL, 'Tempat Tinggal', 'expense', '🏠', '#45B7D1', true),
  (NULL, 'Listrik & Air', 'expense', '⚡', '#FFA726', true),
  (NULL, 'Pulsa & Internet', 'expense', '📱', '#AB47BC', true),
  (NULL, 'Belanja', 'expense', '🛒', '#66BB6A', true),
  (NULL, 'Fashion', 'expense', '👕', '#EC407A', true),
  (NULL, 'Kesehatan', 'expense', '💊', '#26A69A', true),
  (NULL, 'Hiburan', 'expense', '🎮', '#7E57C2', true),
  (NULL, 'Pendidikan', 'expense', '📚', '#5C6BC0', true),
  (NULL, 'Hadiah & Donasi', 'expense', '🎁', '#EF5350', true),
  (NULL, 'Cicilan', 'expense', '🏦', '#78909C', true),
  (NULL, 'Bisnis', 'expense', '💼', '#8D6E63', true),
  (NULL, 'Pet', 'expense', '🐱', '#FF7043', true),
  (NULL, 'Perawatan Diri', 'expense', '✂️', '#F06292', true),
  (NULL, 'Lainnya', 'expense', '🔧', '#90A4AE', true),
  (NULL, 'Gaji', 'income', '💰', '#4CAF50', true),
  (NULL, 'Freelance', 'income', '💸', '#66BB6A', true),
  (NULL, 'Investasi', 'income', '📈', '#26A69A', true),
  (NULL, 'Hadiah', 'income', '🎁', '#FFA726', true),
  (NULL, 'Bisnis', 'income', '🏪', '#42A5F5', true),
  (NULL, 'Cashback', 'income', '🔄', '#7E57C2', true),
  (NULL, 'Penjualan', 'income', '📦', '#EC407A', true),
  (NULL, 'Lainnya', 'income', '🔧', '#90A4AE', true)
ON CONFLICT DO NOTHING;
