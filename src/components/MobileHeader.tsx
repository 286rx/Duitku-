'use client';

import Link from 'next/link';
import { Settings, Coins } from 'lucide-react';

export default function MobileHeader() {
  return (
    <div className="mobile-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '32px',
          height: '32px',
          background: 'var(--gradient-primary)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-glow)',
          color: 'white'
        }}>
          <Coins size={20} />
        </div>
        <h1 style={{ 
          fontSize: '1.2rem', 
          fontWeight: 800, 
          margin: 0, 
          background: 'var(--gradient-primary)', 
          WebkitBackgroundClip: 'text', 
          WebkitTextFillColor: 'transparent' 
        }}>
          DuitKu
        </h1>
      </div>
      <Link href="/settings" style={{ color: 'var(--text-secondary)' }}>
        <Settings size={24} />
      </Link>
    </div>
  );
}
