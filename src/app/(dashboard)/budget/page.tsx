'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Loading from '@/components/Loading';
import Modal from '@/components/Modal';

export default function BudgetPage() {
  const [loading, setLoading] = useState(true);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBudget, setNewBudget] = useState({ category_id: '', amount: 0 });

  const supabase = createClient();
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Fetch expense categories
      const { data: cats } = await supabase
        .from('categories')
        .select('*')
        .or(`user_id.eq.${user.id},is_default.eq.true`)
        .eq('type', 'expense');
      
      if (cats) setCategories(cats);

      // Fetch budgets for current month
      const { data: buds } = await supabase
        .from('budgets')
        .select('*, category:categories(*)')
        .eq('user_id', user.id)
        .eq('month', currentMonth)
        .eq('year', currentYear);

      // Fetch actual spending this month
      const startOfMonth = new Date(currentYear, currentMonth - 1, 1).toISOString();
      const { data: txs } = await supabase
        .from('transactions')
        .select('category_id, amount')
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .gte('date', startOfMonth);

      // Calculate spent amount per budget
      const budgetsWithSpent = buds?.map(b => {
        const spent = txs?.filter(t => t.category_id === b.category_id)
                          .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
        return { ...b, spent };
      }) || [];

      setBudgets(budgetsWithSpent);
    }
    setLoading(false);
  };

  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (user && newBudget.category_id && newBudget.amount > 0) {
      // check if budget exists
      const existing = budgets.find(b => b.category_id === newBudget.category_id);
      if (existing) {
        await supabase.from('budgets').update({ amount: newBudget.amount }).eq('id', existing.id);
      } else {
        await supabase.from('budgets').insert({
          user_id: user.id,
          category_id: newBudget.category_id,
          amount: newBudget.amount,
          month: currentMonth,
          year: currentYear
        });
      }
      setIsModalOpen(false);
      setNewBudget({ category_id: '', amount: 0 });
      fetchBudgets();
    }
  };

  const formatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  });

  if (loading) return <Loading fullScreen />;

  return (
    <div className="page-container animate-in">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Budgets</h1>
          <p className="page-subtitle">Bulan {new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' })}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>+ Set Budget</button>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        {budgets.length > 0 ? budgets.map(budget => {
          const percent = Math.min((budget.spent / budget.amount) * 100, 100);
          const isOver = budget.spent > budget.amount;
          const color = isOver ? 'var(--accent-red)' : (percent > 80 ? 'var(--accent-orange)' : 'var(--accent-green)');

          return (
            <div key={budget.id} className="card" style={{ padding: 'var(--spacing-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                  <span style={{ fontSize: '1.5rem' }}>{budget.category?.icon}</span>
                  <strong style={{ fontSize: 'var(--font-size-md)' }}>{budget.category?.name}</strong>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'bold', color }}>
                    {formatter.format(budget.spent)}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)' }}>
                    of {formatter.format(budget.amount)}
                  </div>
                </div>
              </div>
              
              <div style={{ height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ 
                  height: '100%', 
                  background: color, 
                  width: `${percent}%`,
                  transition: 'width 0.5s ease'
                }} />
              </div>
              
              {isOver && (
                <div style={{ marginTop: 'var(--spacing-sm)', fontSize: 'var(--font-size-xs)', color: 'var(--accent-red)', textAlign: 'right' }}>
                  Over budget by {formatter.format(budget.spent - budget.amount)}
                </div>
              )}
            </div>
          );
        }) : (
          <div className="empty-state" style={{ textAlign: 'center', padding: 'var(--spacing-3xl) 0', color: 'var(--text-tertiary)' }}>
            <div style={{ fontSize: '4rem', marginBottom: 'var(--spacing-md)' }}>🎯</div>
            <h3>No budgets set for this month</h3>
            <p>Set a budget to control your spending.</p>
          </div>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Set Budget"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" form="budget-form" type="submit">Save</button>
          </>
        }
      >
        <form id="budget-form" onSubmit={handleAddBudget}>
          <div className="form-group">
            <label className="form-label">Kategori</label>
            <select 
              className="form-input" 
              value={newBudget.category_id} 
              onChange={e => setNewBudget({...newBudget, category_id: e.target.value})}
              required
            >
              <option value="">Pilih Kategori...</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Limit Budget (Rp)</label>
            <input 
              className="form-input" 
              type="number" 
              required 
              min="0"
              value={newBudget.amount || ''} 
              onChange={e => setNewBudget({...newBudget, amount: Number(e.target.value)})} 
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
