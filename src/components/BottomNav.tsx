'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  LayoutDashboard,
  CreditCard,
  Wallet as WalletIcon,
  Camera,
  Settings
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Home' },
  { href: '/transactions', icon: <CreditCard size={20} />, label: 'Transaksi' },
  { href: '/wallets', icon: <WalletIcon size={20} />, label: 'Wallet' },
  { href: '/scan', icon: <Camera size={20} />, label: 'Scan' },
  { href: '/settings', icon: <Settings size={20} />, label: 'Settings' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-items">
        {navItems.slice(0, 2).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`bottom-nav-item ${pathname === item.href ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}

        <Link href="/transactions/add" className="bottom-nav-add">
          +
        </Link>

        {navItems.slice(2).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`bottom-nav-item ${pathname === item.href ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
