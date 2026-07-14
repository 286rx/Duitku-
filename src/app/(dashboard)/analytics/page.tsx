'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, getMonthName } from '@/lib/utils';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend, Filler);

type TimeView = 'daily' | 'monthly' | 'yearly';

export default function AnalyticsPage() {
  const supabase = createClient();
  const [view, setView] = useState<TimeView>('monthly');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [barData, setBarData] = useState<{ labels: string[]; income: number[]; expense: number[] }>({ labels: [], income: [], expense: [] });
  const [catData, setCatData] = useState<{ labels: string[]; values: number[]; colors: string[] }>({ labels: [], values: [], colors: [] });
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let startDate: string;
      let endDate: string;

      if (view === 'daily') {
        startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
      } else if (view === 'monthly') {
        startDate = `${year}-01-01`;
        endDate = `${year}-12-31`;
      } else {
        startDate = `${year - 4}-01-01`;
        endDate = `${year}-12-31`;
      }

      const { data: txData } = await supabase
        .from('transactions')
        .select('*, category:categories(*)')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date');

      const transactions = txData || [];

      // Calculate bar chart data
      const incomeMap: Record<string, number> = {};
      const expenseMap: Record<string, number> = {};
      let labels: string[] = [];

      if (view === 'daily') {
        const lastDay = new Date(year, month, 0).getDate();
        for (let d = 1; d <= lastDay; d++) {
          const key = String(d);
          labels.push(key);
          incomeMap[key] = 0;
          expenseMap[key] = 0;
        }
        transactions.forEach(t => {
          const day = String(new Date(t.date).getDate());
          if (t.type === 'income') incomeMap[day] = (incomeMap[day] || 0) + Number(t.amount);
          if (t.type === 'expense') expenseMap[day] = (expenseMap[day] || 0) + Number(t.amount);
        });
      } else if (view === 'monthly') {
        for (let m = 1; m <= 12; m++) {
          const key = getMonthName(m).substring(0, 3);
          labels.push(key);
          incomeMap[key] = 0;
          expenseMap[key] = 0;
        }
        transactions.forEach(t => {
          const m = new Date(t.date).getMonth() + 1;
          const key = getMonthName(m).substring(0, 3);
          if (t.type === 'income') incomeMap[key] = (incomeMap[key] || 0) + Number(t.amount);
          if (t.type === 'expense') expenseMap[key] = (expenseMap[key] || 0) + Number(t.amount);
        });
      } else {
        for (let y = year - 4; y <= year; y++) {
          const key = String(y);
          labels.push(key);
          incomeMap[key] = 0;
          expenseMap[key] = 0;
        }
        transactions.forEach(t => {
          const y = String(new Date(t.date).getFullYear());
          if (t.type === 'income') incomeMap[y] = (incomeMap[y] || 0) + Number(t.amount);
          if (t.type === 'expense') expenseMap[y] = (expenseMap[y] || 0) + Number(t.amount);
        });
      }

      setBarData({
        labels,
        income: labels.map(l => incomeMap[l] || 0),
        expense: labels.map(l => expenseMap[l] || 0),
      });

      // Category breakdown
      const catMap: Record<string, { amount: number; color: string }> = {};
      transactions.filter(t => t.type === 'expense').forEach(t => {
        const name = t.category?.name || 'Lainnya';
        const color = t.category?.color || '#90A4AE';
        if (!catMap[name]) catMap[name] = { amount: 0, color };
        catMap[name].amount += Number(t.amount);
      });

      const sorted = Object.entries(catMap).sort((a, b) => b[1].amount - a[1].amount);
      setCatData({
        labels: sorted.map(([n]) => n),
        values: sorted.map(([, v]) => v.amount),
        colors: sorted.map(([, v]) => v.color),
      });

      setTotalIncome(transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0));
      setTotalExpense(transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [view, year, month]);

  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

  const barChartData = {
    labels: barData.labels,
    datasets: [
      {
        label: 'Income',
        data: barData.income,
        backgroundColor: 'rgba(0, 210, 160, 0.7)',
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        label: 'Expense',
        data: barData.expense,
        backgroundColor: 'rgba(255, 107, 107, 0.7)',
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#B0B0CC', usePointStyle: true, pointStyle: 'circle' as const, padding: 20 } },
      tooltip: {
        backgroundColor: '#1A1A3E',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        callbacks: {
          label: (ctx: { dataset: { label?: string }; parsed: { y: number } }) => `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}`,
        },
      },
    },
    scales: {
      x: { ticks: { color: '#6E6E8A' }, grid: { color: 'rgba(255,255,255,0.05)' } },
      y: {
        ticks: {
          color: '#6E6E8A',
          callback: (value: string | number) => {
            const num = typeof value === 'string' ? parseFloat(value) : value;
            if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
            if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
            return num.toString();
          },
        },
        grid: { color: 'rgba(255,255,255,0.05)' },
      },
    },
  };

  const doughnutChartData = {
    labels: catData.labels,
    datasets: [{
      data: catData.values,
      backgroundColor: catData.colors,
      borderColor: 'transparent',
      borderWidth: 2,
      hoverOffset: 8,
    }],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: { position: 'right' as const, labels: { color: '#B0B0CC', usePointStyle: true, pointStyle: 'circle' as const, padding: 12, font: { size: 11 } } },
      tooltip: {
        backgroundColor: '#1A1A3E',
        callbacks: {
          label: (ctx: { label?: string; parsed: number }) => `${ctx.label}: ${formatCurrency(ctx.parsed)}`,
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-spinner" />
        <p style={{ color: 'var(--text-tertiary)' }}>Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Monitoring pengeluaran & pemasukan</p>
        </div>
      </div>

      {/* Controls */}
      <div className="filter-bar">
        <div className="tabs">
          {(['daily', 'monthly', 'yearly'] as const).map(v => (
            <button key={v} className={`tab ${view === v ? 'active' : ''}`} onClick={() => setView(v)}>
              {v === 'daily' ? 'Harian' : v === 'monthly' ? 'Bulanan' : 'Tahunan'}
            </button>
          ))}
        </div>
        <select className="form-select" value={year} onChange={(e) => setYear(Number(e.target.value))} style={{ width: 100 }}>
          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        {view === 'daily' && (
          <select className="form-select" value={month} onChange={(e) => setMonth(Number(e.target.value))} style={{ width: 140 }}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>{getMonthName(m)}</option>
            ))}
          </select>
        )}
      </div>

      {/* Summary Cards */}
      <div className="stat-cards" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div className="stat-card income">
          <div className="stat-card-header">
            <span className="stat-card-label">Total Income</span>
            <div className="stat-card-icon">💰</div>
          </div>
          <div className="stat-card-value" style={{ color: 'var(--accent-green)' }}>{formatCurrency(totalIncome)}</div>
        </div>
        <div className="stat-card expense">
          <div className="stat-card-header">
            <span className="stat-card-label">Total Expense</span>
            <div className="stat-card-icon">💸</div>
          </div>
          <div className="stat-card-value" style={{ color: 'var(--accent-red)' }}>{formatCurrency(totalExpense)}</div>
        </div>
        <div className="stat-card net">
          <div className="stat-card-header">
            <span className="stat-card-label">Net</span>
            <div className="stat-card-icon">⚡</div>
          </div>
          <div className="stat-card-value" style={{ color: totalIncome - totalExpense >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
            {totalIncome - totalExpense >= 0 ? '+' : ''}{formatCurrency(totalIncome - totalExpense)}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid-2" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div className="chart-container">
          <div className="chart-header">
            <h3 className="chart-title">Income vs Expense</h3>
          </div>
          <div className="chart-wrapper">
            <Bar data={barChartData} options={barOptions} />
          </div>
        </div>

        <div className="chart-container">
          <div className="chart-header">
            <h3 className="chart-title">Expense by Category</h3>
          </div>
          <div className="chart-wrapper">
            {catData.labels.length > 0 ? (
              <Doughnut data={doughnutChartData} options={doughnutOptions} />
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📊</div>
                <p className="empty-state-text">Belum ada data</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Categories Table */}
      {catData.labels.length > 0 && (
        <div className="card">
          <h3 className="chart-title" style={{ marginBottom: 'var(--spacing-lg)' }}>Top Pengeluaran</h3>
          {catData.labels.map((name, i) => {
            const pct = totalExpense > 0 ? (catData.values[i] / totalExpense) * 100 : 0;
            return (
              <div key={name} className="budget-item" style={{ marginBottom: 'var(--spacing-sm)' }}>
                <div className="budget-item-header">
                  <div className="budget-item-category">
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: catData.colors[i], display: 'inline-block' }} />
                    {name}
                  </div>
                  <div className="budget-item-amounts">
                    {formatCurrency(catData.values[i])} ({pct.toFixed(1)}%)
                  </div>
                </div>
                <div className="budget-progress">
                  <div className="budget-progress-bar safe" style={{ width: `${pct}%`, background: catData.colors[i] }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
