'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const navItems = [
  { href: '/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/transactions', icon: '💳', label: 'Transactions' },
  { href: '/wallets', icon: '👛', label: 'Wallets' },
  { href: '/scan', icon: '📷', label: 'Scan Receipt' },
  { href: '/analytics', icon: '📈', label: 'Analytics' },
  { href: '/budget', icon: '🎯', label: 'Budget' },
  { href: '/settings', icon: '⚙️', label: 'Settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<{ email?: string; name?: string; avatar?: string } | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        setUser({
          email: authUser.email,
          name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0],
          avatar: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture,
        });
      }
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">💰</div>
        <h1>DuitKu</h1>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-title">Menu</div>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`sidebar-link ${pathname === item.href || pathname?.startsWith(item.href + '/') ? 'active' : ''}`}
          >
            <span className="link-icon">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-user">
        <div className="sidebar-avatar">
          {user?.avatar ? (
            <img src={user.avatar} alt="avatar" />
          ) : (
            user?.name?.[0]?.toUpperCase() || '?'
          )}
        </div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">{user?.name || 'Loading...'}</div>
          <div className="sidebar-user-email">{user?.email || ''}</div>
        </div>
        <button className="btn btn-ghost btn-icon" onClick={handleLogout} title="Logout">
          🚪
        </button>
      </div>
    </aside>
  );
}
