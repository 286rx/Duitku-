import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'DuitKu - Personal Money Manager',
  description: 'Kelola keuangan pribadimu dengan mudah. Track pengeluaran, pemasukan, tabungan, dan budget dalam satu aplikasi.',
  keywords: 'money manager, finance tracker, budget, duitku, pengelola keuangan',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
