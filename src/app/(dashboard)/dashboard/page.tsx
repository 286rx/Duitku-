'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import TransactionCard, { Transaction } from '@/components/TransactionCard';
import Loading from '@/components/Loading';
import Link from 'next/link';
import Chart from '@/components/Chart';
import { Wallet } from '@/lib/types';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);
  
  // For chart
  const [chartData, setChartData] = useState<{labels: string[], values: number[], colors: string[]}>({ labels: [], values: [], colors: [] });

  const supabase = createClient();

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch User profile/metadata for Greeting
        const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
        setUserName(name);

        // Fetch Wallets
        const { data: wData } = await supabase
          .from('wallets')
          .select('*')
          .eq('user_id', user.id);
        
        if (wData) {
          setWallets(wData as Wallet[]);
          const balance = wData.reduce((acc, curr) => acc + Number(curr.balance), 0);
          setTotalBalance(balance);
        }

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

        // Calculate this month's stats and chart data
        const date = new Date();
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
        const { data: monthTxs } = await supabase
          .from('transactions')
          .select('*, categories(*)')
          .eq('user_id', user.id)
          .gte('date', startOfMonth);

        if (monthTxs) {
          let inc = 0;
          let exp = 0;
          const categoryTotals: Record<string, { total: number, color: string, name: string }> = {};

          monthTxs.forEach((tx: any) => {
            if (tx.type === 'income') inc += Number(tx.amount);
            if (tx.type === 'expense') {
              exp += Number(tx.amount);
              // Aggregate for chart
              const catId = tx.category_id;
              if (catId && tx.categories) {
                if (!categoryTotals[catId]) {
                  categoryTotals[catId] = { total: 0, color: tx.categories.color || '#4ade80', name: tx.categories.name };
                }
                categoryTotals[catId].total += Number(tx.amount);
              }
            }
          });
          setIncome(inc);
          setExpense(exp);

          // Prepare chart data
          const labels = [];
          const values = [];
          const colors = [];
          for (const key in categoryTotals) {
            labels.push(categoryTotals[key].name);
            values.push(categoryTotals[key].total);
            colors.push(categoryTotals[key].color);
          }
          setChartData({ labels, values, colors });
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

  const monthName = new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' });

  if (loading) return <Loading fullScreen />;

  return (
    <div className="page-container animate-in" style={{ paddingBottom: '100px' }}>
      
      {/* 🌟 Personalized Greeting */}
      <header style={{ marginBottom: 'var(--spacing-xl)' }}>
        <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-size-sm)', marginBottom: '4px' }}>Welcome back,</p>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, margin: 0, background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {userName} 👋
        </h1>
      </header>

      {/* 💳 Swipeable Wallet Carousel */}
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
          <h2 style={{ fontSize: 'var(--font-size-md)', color: 'var(--text-secondary)', margin: 0 }}>Dompet Anda</h2>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>Geser ➔</span>
        </div>
        
        {/* Scrollable Container */}
        <div style={{ 
          display: 'flex', 
          overflowX: 'auto', 
          gap: 'var(--spacing-md)', 
          paddingBottom: 'var(--spacing-sm)',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none', // IE
        }} className="hide-scrollbar">
          
          {/* Card 1: Total Balance (Glassmorphism) */}
          <div style={{ 
            flex: '0 0 85%', // Takes up 85% of mobile screen width
            scrollSnapAlign: 'start',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(168,85,247,0.1) 100%)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '20px',
            padding: 'var(--spacing-xl)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Background Blob decoration */}
            <div style={{ position: 'absolute', top: '-50%', right: '-20%', width: '150px', height: '150px', background: 'var(--primary)', filter: 'blur(50px)', opacity: 0.3, borderRadius: '50%' }} />
            
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: '8px' }}>Total Semua Saldo</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'white', textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
              {formatter.format(totalBalance)}
            </div>
          </div>

          {/* Individual Wallet Cards */}
          {wallets.map((wallet) => (
            <div key={wallet.id} style={{ 
              flex: '0 0 75%',
              scrollSnapAlign: 'start',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '20px',
              padding: 'var(--spacing-xl)',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>{wallet.icon}</span>
                <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>{wallet.name}</span>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white' }}>
                {formatter.format(Number(wallet.balance))}
              </div>
              <div style={{ position: 'absolute', top: '16px', right: '16px', width: '12px', height: '12px', borderRadius: '50%', background: wallet.color || '#90A4AE' }} />
            </div>
          ))}

          {/* Add Wallet Prompt */}
          <Link href="/wallets" style={{ 
              flex: '0 0 40%',
              scrollSnapAlign: 'start',
              background: 'var(--bg-card)',
              border: '2px dashed var(--border)',
              borderRadius: '20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              color: 'var(--text-secondary)'
            }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>+</div>
            <div style={{ fontSize: 'var(--font-size-sm)' }}>Tambah</div>
          </Link>
        </div>
      </div>

      {/* 📊 Income & Expense Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: 'var(--spacing-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div style={{ background: 'rgba(74, 222, 128, 0.1)', padding: '6px', borderRadius: '8px', color: 'var(--accent-green)' }}>↓</div>
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)' }}>Pemasukan</span>
          </div>
          <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'white' }}>
            {formatter.format(income)}
          </div>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: 'var(--spacing-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div style={{ background: 'rgba(248, 113, 113, 0.1)', padding: '6px', borderRadius: '8px', color: 'var(--accent-red)' }}>↑</div>
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)' }}>Pengeluaran</span>
          </div>
          <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'white' }}>
            {formatter.format(expense)}
          </div>
        </div>
      </div>

      {/* 📈 Analytics Chart */}
      <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
        <Chart data={chartData} title={`Pengeluaran per Kategori (${monthName})`} />
      </div>

      {/* 📝 Recent Transactions */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
          <h2 style={{ fontSize: 'var(--font-size-md)', color: 'var(--text-secondary)', margin: 0 }}>Transaksi Terakhir</h2>
          <Link href="/transactions" style={{ color: 'var(--primary-light)', textDecoration: 'none', fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>
            Lihat Semua
          </Link>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
          {transactions.length > 0 ? (
            transactions.map(tx => (
              <TransactionCard key={tx.id} transaction={tx} />
            ))
          ) : (
            <div className="empty-state" style={{ textAlign: 'center', padding: 'var(--spacing-2xl) var(--spacing-md)', color: 'var(--text-tertiary)', background: 'var(--bg-card)', borderRadius: '16px', border: '1px dashed var(--border)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 'var(--spacing-sm)' }}>💸</div>
              <p style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>Belum ada transaksi bulan ini.</p>
              <Link href="/transactions/add" className="btn btn-primary" style={{ display: 'inline-block', marginTop: 'var(--spacing-md)' }}>+ Catat Sekarang</Link>
            </div>
          )}
        </div>
      </div>

      {/* Inline styles for hiding scrollbar globally in this component */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}} />
    </div>
  );
}
