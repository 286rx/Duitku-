'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import TransactionCard, { Transaction } from '@/components/TransactionCard';
import Loading from '@/components/Loading';
import Link from 'next/link';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);

  const supabase = createClient();

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch Wallets for Total Balance
        const { data: wallets } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', user.id);
        
        const balance = wallets?.reduce((acc, curr) => acc + Number(curr.balance), 0) || 0;
        setTotalBalance(balance);

        // Fetch Recent Transactions
        const { data: txs } = await supabase
          .from('transactions')
          .select('*, categories(*)')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .limit(5);

        if (txs) {
          setTransactions(txs as Transaction[]);
        }

        // Calculate this month's income and expense (naive approach for MVP)
        const date = new Date();
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
        const { data: monthTxs } = await supabase
          .from('transactions')
          .select('type, amount')
          .eq('user_id', user.id)
          .gte('date', startOfMonth);

        if (monthTxs) {
          let inc = 0;
          let exp = 0;
          monthTxs.forEach(tx => {
            if (tx.type === 'income') inc += Number(tx.amount);
            if (tx.type === 'expense') exp += Number(tx.amount);
          });
          setIncome(inc);
          setExpense(exp);
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const formatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  });

  if (loading) return <Loading fullScreen />;

  return (
    <div className="page-container animate-in">
      <header className="page-header">
        <h1 className="page-title">Dashboard</h1>
      </header>

      {/* Overview Cards */}
      <div style={{ display: 'grid', gap: 'var(--spacing-md)', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', marginBottom: 'var(--spacing-xl)' }}>
        <div className="card" style={{ background: 'var(--gradient-primary)', color: 'white' }}>
          <div style={{ fontSize: 'var(--font-size-sm)', opacity: 0.8, marginBottom: '8px' }}>Total Balance</div>
          <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800 }}>{formatter.format(totalBalance)}</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
          <div className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)', marginBottom: '8px' }}>Income</div>
            <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--accent-green)' }}>
              {formatter.format(income)}
            </div>
          </div>
          <div className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)', marginBottom: '8px' }}>Expense</div>
            <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--accent-red)' }}>
              {formatter.format(expense)}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
        <h2 style={{ fontSize: 'var(--font-size-lg)', margin: 0 }}>Recent Transactions</h2>
        <Link href="/transactions" style={{ color: 'var(--primary-light)', textDecoration: 'none', fontSize: 'var(--font-size-sm)' }}>
          View All
        </Link>
      </div>

      <div>
        {transactions.length > 0 ? (
          transactions.map(tx => (
            <TransactionCard key={tx.id} transaction={tx} />
          ))
        ) : (
          <div className="empty-state" style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--text-tertiary)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-sm)' }}>📝</div>
            <p>No recent transactions</p>
          </div>
        )}
      </div>
    </div>
  );
}
