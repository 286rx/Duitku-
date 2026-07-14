import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(5px)',
      padding: 'var(--spacing-md)'
    }}>
      <div className="modal-content animate-in" onClick={e => e.stopPropagation()} style={{
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        width: '100%', maxWidth: '500px',
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border)'
      }}>
        <div className="modal-header" style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: 'var(--spacing-md) var(--spacing-lg)',
          borderBottom: '1px solid var(--border)'
        }}>
          <h2 style={{ fontSize: 'var(--font-size-lg)', margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: 'var(--text-tertiary)',
            fontSize: 'var(--font-size-xl)', cursor: 'pointer',
            padding: '4px'
          }}>&times;</button>
        </div>
        
        <div className="modal-body" style={{ padding: 'var(--spacing-lg)' }}>
          {children}
        </div>
        
        {footer && (
          <div className="modal-footer" style={{
            padding: 'var(--spacing-md) var(--spacing-lg)',
            borderTop: '1px solid var(--border)',
            display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)'
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
