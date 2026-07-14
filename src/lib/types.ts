export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  name: string;
  type: 'cash' | 'bank' | 'ewallet' | 'other';
  balance: number;
  icon: string | null;
  color: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string | null;
  name: string;
  type: 'income' | 'expense';
  icon: string | null;
  color: string | null;
  is_default: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  wallet_id: string | null;
  category_id: string | null;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  description: string | null;
  notes: string | null;
  date: string;
  receipt_url: string | null;
  source: 'manual' | 'ocr';
  created_at: string;
  updated_at: string;
  // Joined fields
  category?: Category;
  wallet?: Wallet;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  month: number;
  year: number;
  created_at: string;
  category?: Category;
}

export interface DashboardStats {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  netAmount: number;
}

export const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'user_id' | 'created_at'>[] = [
  // Expense categories
  { name: 'Makanan & Minuman', type: 'expense', icon: '🍔', color: '#FF6B6B', is_default: true },
  { name: 'Transportasi', type: 'expense', icon: '🚗', color: '#4ECDC4', is_default: true },
  { name: 'Tempat Tinggal', type: 'expense', icon: '🏠', color: '#45B7D1', is_default: true },
  { name: 'Listrik & Air', type: 'expense', icon: '⚡', color: '#FFA726', is_default: true },
  { name: 'Pulsa & Internet', type: 'expense', icon: '📱', color: '#AB47BC', is_default: true },
  { name: 'Belanja', type: 'expense', icon: '🛒', color: '#66BB6A', is_default: true },
  { name: 'Fashion', type: 'expense', icon: '👕', color: '#EC407A', is_default: true },
  { name: 'Kesehatan', type: 'expense', icon: '💊', color: '#26A69A', is_default: true },
  { name: 'Hiburan', type: 'expense', icon: '🎮', color: '#7E57C2', is_default: true },
  { name: 'Pendidikan', type: 'expense', icon: '📚', color: '#5C6BC0', is_default: true },
  { name: 'Hadiah & Donasi', type: 'expense', icon: '🎁', color: '#EF5350', is_default: true },
  { name: 'Cicilan', type: 'expense', icon: '🏦', color: '#78909C', is_default: true },
  { name: 'Bisnis', type: 'expense', icon: '💼', color: '#8D6E63', is_default: true },
  { name: 'Pet', type: 'expense', icon: '🐱', color: '#FF7043', is_default: true },
  { name: 'Perawatan Diri', type: 'expense', icon: '✂️', color: '#F06292', is_default: true },
  { name: 'Lainnya', type: 'expense', icon: '🔧', color: '#90A4AE', is_default: true },
  // Income categories
  { name: 'Gaji', type: 'income', icon: '💰', color: '#4CAF50', is_default: true },
  { name: 'Freelance', type: 'income', icon: '💸', color: '#66BB6A', is_default: true },
  { name: 'Investasi', type: 'income', icon: '📈', color: '#26A69A', is_default: true },
  { name: 'Hadiah', type: 'income', icon: '🎁', color: '#FFA726', is_default: true },
  { name: 'Bisnis', type: 'income', icon: '🏪', color: '#42A5F5', is_default: true },
  { name: 'Cashback', type: 'income', icon: '🔄', color: '#7E57C2', is_default: true },
  { name: 'Penjualan', type: 'income', icon: '📦', color: '#EC407A', is_default: true },
  { name: 'Lainnya', type: 'income', icon: '🔧', color: '#90A4AE', is_default: true },
];
