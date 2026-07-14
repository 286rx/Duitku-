import React from 'react';

interface LoadingProps {
  fullScreen?: boolean;
  message?: string;
}

export default function Loading({ fullScreen = false, message = 'Loading...' }: LoadingProps) {
  if (fullScreen) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'var(--bg-primary)', zIndex: 9999
      }}>
        <div className="spinner"></div>
        {message && <p style={{ marginTop: 'var(--spacing-md)', color: 'var(--text-secondary)' }}>{message}</p>}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--spacing-xl)' }}>
      <div className="spinner"></div>
      {message && <p style={{ marginTop: 'var(--spacing-md)', color: 'var(--text-secondary)' }}>{message}</p>}
      <style>{`
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid var(--border);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
