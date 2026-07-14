'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import WalletCard from '@/components/WalletCard';
import Loading from '@/components/Loading';
import Modal from '@/components/Modal';

export default function WalletsPage() {
  const [loading, setLoading] = useState(true);
  const [wallets, setWallets] = useState<any[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newWallet, setNewWallet] = useState({ name: '', type: 'bank', balance: '', color: '#6C5CE7', icon: '🏦' });

  const supabase = createClient();

  useEffect(() => {
    fetchWallets();
  }, []);

  const fetchWallets = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
        
      if (data) {
        setWallets(data);
        setTotalBalance(data.reduce((acc, curr) => acc + Number(curr.balance), 0));
      }
    }
    setLoading(false);
  };

  const handleAddWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const rawBalance = Number(newWallet.balance.toString().replace(/\D/g, ''));
      await supabase.from('wallets').insert({
        user_id: user.id,
        name: newWallet.name,
        type: newWallet.type,
        balance: rawBalance,
        color: newWallet.color,
        icon: newWallet.icon
      });
      setIsModalOpen(false);
      setNewWallet({ name: '', type: 'bank', balance: '', color: '#6C5CE7', icon: '🏦' });
      fetchWallets();
    }
  };

  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (!rawValue) {
      setNewWallet({ ...newWallet, balance: '' });
      return;
    }
    const formatted = new Intl.NumberFormat('id-ID').format(Number(rawValue));
    setNewWallet({ ...newWallet, balance: formatted });
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
        <h1 className="page-title">Wallets</h1>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>+ Add Wallet</button>
      </header>

      <div className="card" style={{ background: 'var(--gradient-card)', marginBottom: 'var(--spacing-xl)', textAlign: 'center', padding: 'var(--spacing-xl)' }}>
        <div style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Total Combined Balance</div>
        <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          {formatter.format(totalBalance)}
        </div>
      </div>

      <div style={{ display: 'grid', gap: 'var(--spacing-md)', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {wallets.map(wallet => (
          <WalletCard key={wallet.id} wallet={wallet} />
        ))}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Add New Wallet"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" form="add-wallet-form" type="submit">Save Wallet</button>
          </>
        }
      >
        <form onSubmit={handleAddWallet} id="add-wallet-form">
          <div className="form-group">
            <label className="form-label">Wallet Name</label>
            <input className="form-input" required value={newWallet.name} onChange={e => setNewWallet({...newWallet, name: e.target.value})} placeholder="e.g. BCA, Cash" />
          </div>
          <div className="form-group">
            <label className="form-label">Type</label>
            <select 
              className="form-input" 
              value={newWallet.type} 
              onChange={e => setNewWallet({...newWallet, type: e.target.value})}
              style={{ appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23ffffff%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px top 50%', backgroundSize: '12px auto' }}
            >
              <option value="cash">Cash</option>
              <option value="bank">Bank Account</option>
              <option value="ewallet">E-Wallet</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Initial Balance</label>
            <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
              <span style={{ position: 'absolute', left: '16px', color: 'var(--text-secondary)' }}>Rp</span>
              <input 
                className="form-input" 
                type="text" 
                required 
                value={newWallet.balance} 
                onChange={handleBalanceChange}
                style={{ paddingLeft: '45px' }}
                placeholder="10.000.000"
              />
            </div>
          </div>
          <div className="form-group" style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label className="form-label">Color</label>
              <input type="color" className="form-input" style={{ padding: '0', height: '40px' }} value={newWallet.color} onChange={e => setNewWallet({...newWallet, color: e.target.value})} />
            </div>
            <div style={{ flex: 1 }}>
              <label className="form-label">Icon (Emoji)</label>
              <input className="form-input" value={newWallet.icon} onChange={e => setNewWallet({...newWallet, icon: e.target.value})} maxLength={2} />
            </div>
          </div>
        </form>
      </Modal>

    </div>
  );
}
