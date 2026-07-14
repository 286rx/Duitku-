import React from 'react';
import { format, parseISO } from 'date-fns';

export interface Category {
  name: string;
  icon?: string;
  color?: string;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  description: string;
  date: string;
  categories?: Category; // Assuming joined in query
}

interface TransactionCardProps {
  transaction: Transaction;
  onClick?: (transaction: Transaction) => void;
}

export default function TransactionCard({ transaction, onClick }: TransactionCardProps) {
  const formatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  });

  const isIncome = transaction.type === 'income';
  const amountColor = isIncome ? 'var(--accent-green)' : 'var(--text-primary)';
  const amountPrefix = isIncome ? '+' : '-';

  return (
    <div 
      className="transaction-card"
      onClick={() => onClick && onClick(transaction)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--spacing-md)',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border)',
        cursor: onClick ? 'pointer' : 'default',
        marginBottom: 'var(--spacing-sm)',
        transition: 'var(--transition-fast)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
        <div style={{
          width: '48px', height: '48px',
          borderRadius: '50%',
          background: transaction.categories?.color ? `${transaction.categories.color}20` : 'var(--bg-secondary)',
          color: transaction.categories?.color || 'var(--text-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 'var(--font-size-xl)'
        }}>
          {transaction.categories?.icon || (isIncome ? '💰' : '💸')}
        </div>
        
        <div>
          <div style={{ fontWeight: 600, fontSize: 'var(--font-size-md)', color: 'var(--text-primary)' }}>
            {transaction.description || transaction.categories?.name || 'Unknown'}
          </div>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
            {transaction.categories?.name} • {format(parseISO(transaction.date), 'MMM d, yyyy')}
          </div>
        </div>
      </div>

      <div style={{
        fontWeight: 700,
        fontSize: 'var(--font-size-md)',
        color: amountColor
      }}>
        {amountPrefix}{formatter.format(Math.abs(transaction.amount))}
      </div>
    </div>
  );
}
