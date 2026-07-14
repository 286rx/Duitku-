'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { Category, Wallet } from '@/lib/types';

export default function AddTransactionPage() {
  const supabase = createClient();
  const router = useRouter();
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState('');
  const [walletId, setWalletId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: cats }, { data: walls }] = await Promise.all([
        supabase.from('categories').select('*').or(`user_id.eq.${user.id},is_default.eq.true`),
        supabase.from('wallets').select('*').eq('user_id', user.id).eq('is_active', true),
      ]);

      setCategories(cats || []);
      setWallets(walls || []);
      if (walls && walls.length > 0) setWalletId(walls[0].id);
    };
    loadData();
  }, []);

  const filteredCategories = categories.filter(c => c.type === type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !categoryId || !walletId) {
      setError('Lengkapi semua field yang diperlukan');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const amountNum = parseFloat(amount);

      // Insert transaction
      const { error: txError } = await supabase.from('transactions').insert({
        user_id: user.id,
        wallet_id: walletId,
        category_id: categoryId,
        type,
        amount: amountNum,
        description: description || null,
        notes: notes || null,
        date,
        source: 'manual',
      });

      if (txError) throw txError;

      // Update wallet balance
      const wallet = wallets.find(w => w.id === walletId);
      if (wallet) {
        const newBalance = type === 'income'
          ? Number(wallet.balance) + amountNum
          : Number(wallet.balance) - amountNum;

        await supabase
          .from('wallets')
          .update({ balance: newBalance, updated_at: new Date().toISOString() })
          .eq('id', walletId);
      }

      router.push('/transactions');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in" style={{ maxWidth: 600 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tambah Transaksi</h1>
          <p className="page-subtitle">Catat pemasukan atau pengeluaran baru</p>
        </div>
      </div>

      <div className="card">
        {/* Type Tabs */}
        <div className="type-tabs">
          <button
            className={`type-tab ${type === 'expense' ? 'active expense' : ''}`}
            onClick={() => { setType('expense'); setCategoryId(''); }}
          >
            💸 Expense
          </button>
          <button
            className={`type-tab ${type === 'income' ? 'active income' : ''}`}
            onClick={() => { setType('income'); setCategoryId(''); }}
          >
            💰 Income
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Amount */}
          <div className="form-group">
            <label className="form-label">Jumlah</label>
            <div className="amount-input-wrapper">
              <span className="currency-prefix">Rp</span>
              <input
                className="form-input"
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                step="100"
                required
              />
            </div>
          </div>

          {/* Category */}
          <div className="form-group">
            <label className="form-label">Kategori</label>
            <div className="category-grid">
              {filteredCategories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  className={`category-pill ${categoryId === cat.id ? 'selected' : ''}`}
                  onClick={() => setCategoryId(cat.id)}
                >
                  <span className="category-pill-icon">{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
            {filteredCategories.length === 0 && (
              <p className="form-hint">Belum ada kategori. Tambahkan di Settings.</p>
            )}
          </div>

          {/* Wallet */}
          <div className="form-group">
            <label className="form-label">Wallet</label>
            <select
              className="form-select"
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              required
            >
              <option value="">Pilih wallet...</option>
              {wallets.map(w => (
                <option key={w.id} value={w.id}>{w.icon} {w.name}</option>
              ))}
            </select>
            {wallets.length === 0 && (
              <p className="form-hint">Belum ada wallet. Buat di halaman Wallets.</p>
            )}
          </div>

          {/* Date & Description */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tanggal</label>
              <input
                className="form-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Deskripsi</label>
              <input
                className="form-input"
                type="text"
                placeholder="Beli kopi..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label">Notes (optional)</label>
            <textarea
              className="form-textarea"
              placeholder="Catatan tambahan..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {error && <p className="form-error" style={{ marginBottom: 'var(--spacing-md)' }}>{error}</p>}

          <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ flex: 1 }}>
              {loading ? 'Saving...' : '💾 Simpan Transaksi'}
            </button>
            <button type="button" className="btn btn-secondary btn-lg" onClick={() => router.back()}>
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
