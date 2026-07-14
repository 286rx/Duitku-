'use client';

import { useState, useRef, useEffect } from 'react';

interface Option {
  value: string;
  label: React.ReactNode;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export default function CustomSelect({ options, value, onChange, placeholder = 'Pilih...' }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="custom-select-wrapper" ref={wrapperRef} style={{ position: 'relative' }}>
      <div 
        className="form-input" 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          cursor: 'pointer',
          background: 'var(--bg-secondary)',
          color: selectedOption ? 'inherit' : 'var(--text-muted)',
          userSelect: 'none'
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <span style={{ fontSize: '0.8em', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          ▼
        </span>
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '4px',
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-active)',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          zIndex: 50,
          maxHeight: '200px',
          overflowY: 'auto'
        }}>
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              style={{
                padding: 'var(--spacing-sm) var(--spacing-md)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: value === opt.value ? 'var(--primary-glow)' : 'transparent',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => {
                if (value !== opt.value) e.currentTarget.style.background = 'var(--bg-hover)';
              }}
              onMouseLeave={(e) => {
                if (value !== opt.value) e.currentTarget.style.background = 'transparent';
              }}
            >
              {opt.label}
            </div>
          ))}
          {options.length === 0 && (
            <div style={{ padding: 'var(--spacing-sm) var(--spacing-md)', color: 'var(--text-muted)' }}>
              Tidak ada pilihan
            </div>
          )}
        </div>
      )}
    </div>
  );
}
