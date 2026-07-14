'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Transaction } from '@/lib/types';
import Link from 'next/link';

export default function TransactionsPage() {
  const supabase = createClient();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadTransactions = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('transactions')
        .select('*, category:categories(*), wallet:wallets(*)')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('type', filter);
      }

      const { data } = await query.limit(100);
      setTransactions(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus transaksi ini?')) return;
    await supabase.from('transactions').delete().eq('id', id);
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const filteredTx = transactions.filter(tx => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      tx.description?.toLowerCase().includes(q) ||
      tx.category?.name?.toLowerCase().includes(q) ||
      tx.wallet?.name?.toLowerCase().includes(q) ||
      tx.notes?.toLowerCase().includes(q)
    );
  });

  // Group by date
  const grouped: Record<string, Transaction[]> = {};
  filteredTx.forEach(tx => {
    const key = tx.date;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(tx);
  });

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-spinner" />
        <p style={{ color: 'var(--text-tertiary)' }}>Loading transactions...</p>
      </div>
    );
  }

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="page-subtitle">{transactions.length} transaksi ditemukan</p>
        </div>
        <Link href="/transactions/add" className="btn btn-primary">
          + Tambah
        </Link>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            className="form-input"
            type="text"
            placeholder="Cari transaksi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="tabs">
          {(['all', 'income', 'expense'] as const).map(f => (
            <button
              key={f}
              className={`tab ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'Semua' : f === 'income' ? 'Income' : 'Expense'}
            </button>
          ))}
        </div>
      </div>

      <div className="transaction-list">
        {Object.keys(grouped).length > 0 ? (
          Object.entries(grouped).map(([date, txs]) => (
            <div key={date}>
              <div className="transaction-group-date">
                {formatDate(date)}
                <span style={{ float: 'right', fontWeight: 400 }}>
                  {formatCurrency(txs.reduce((sum, t) => sum + (t.type === 'income' ? 1 : -1) * Number(t.amount), 0))}
                </span>
              </div>
              {txs.map(tx => (
                <div key={tx.id} className="transaction-item">
                  <div
                    className="transaction-icon"
                    style={{ background: `${tx.category?.color || '#90A4AE'}20` }}
                  >
                    {tx.category?.icon || '🔧'}
                  </div>
                  <div className="transaction-info">
                    <div className="transaction-name">{tx.description || tx.category?.name || 'Transaction'}</div>
                    <div className="transaction-category">
                      {tx.category?.name || 'Uncategorized'} {tx.notes ? `• ${tx.notes}` : ''}
                    </div>
                  </div>
                  <div>
                    <div className={`transaction-amount ${tx.type}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(Number(tx.amount))}
                    </div>
                    <div className="transaction-wallet">{tx.wallet?.name || ''}</div>
                  </div>
                  <button
                    className="btn btn-ghost btn-icon btn-sm"
                    onClick={(e) => { e.stopPropagation(); handleDelete(tx.id); }}
                    title="Hapus"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">💸</div>
            <p className="empty-state-title">Belum ada transaksi</p>
            <p className="empty-state-text">Mulai catat keuanganmu sekarang</p>
            <Link href="/transactions/add" className="btn btn-primary">+ Tambah Transaksi</Link>
          </div>
        )}
      </div>
    </div>
  );
}
