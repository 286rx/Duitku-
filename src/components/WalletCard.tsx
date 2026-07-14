import React from 'react';

interface Wallet {
  id: string;
  name: string;
  type: string;
  balance: number;
  icon?: string;
  color?: string;
}

interface WalletCardProps {
  wallet: Wallet;
  onClick?: (wallet: Wallet) => void;
}

export default function WalletCard({ wallet, onClick }: WalletCardProps) {
  const formatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  });

  return (
    <div 
      className="card wallet-card" 
      onClick={() => onClick && onClick(wallet)}
      style={{
        padding: 'var(--spacing-lg)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'var(--transition-base)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-md)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Glow effect based on wallet color */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        right: '-20%',
        width: '100px',
        height: '100px',
        background: wallet.color || 'var(--primary)',
        filter: 'blur(50px)',
        opacity: 0.2,
        borderRadius: '50%',
        zIndex: 0
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          <div style={{ 
            width: '40px', height: '40px', 
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-secondary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 'var(--font-size-xl)'
          }}>
            {wallet.icon || '👛'}
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 'var(--font-size-md)', fontWeight: 600 }}>{wallet.name}</h3>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>
              {wallet.type}
            </span>
          </div>
        </div>
      </div>

      <div style={{ zIndex: 1 }}>
        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: '4px' }}>Balance</div>
        <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700 }}>
          {formatter.format(wallet.balance)}
        </div>
      </div>
    </div>
  );
}
