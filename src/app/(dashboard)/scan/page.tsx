'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Tesseract from 'tesseract.js';
import Loading from '@/components/Loading';

export default function ScanReceiptPage() {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [resultText, setResultText] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        setResultText('');
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async () => {
    if (!image) return;
    setLoading(true);
    setStatus('Initializing OCR engine...');
    setProgress(0);

    try {
      const result = await Tesseract.recognize(
        image,
        'eng',
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              setStatus('Scanning receipt...');
              setProgress(Math.round(m.progress * 100));
            } else {
              setStatus(m.status);
            }
          }
        }
      );
      setResultText(result.data.text);
      
      // Basic naive parsing logic to try to find Total
      // In a real app we'd use regex or an LLM here.
    } catch (error) {
      console.error('OCR Error:', error);
      setStatus('Failed to process image');
    } finally {
      setLoading(false);
    }
  };

  const proceedToManualEntry = () => {
    let amount = '';
    const text = resultText.toUpperCase();
    
    // Naive parse for biggest number (likely total)
    const numbers = resultText.match(/\d+(?:[.,]\d+)?/g);
    if (numbers) {
      const parsed = numbers.map(n => Number(n.replace(/,/g, ''))).filter(n => !isNaN(n) && n > 0);
      if (parsed.length > 0) {
        amount = Math.max(...parsed).toString();
      }
    }

    // Naive category guessing
    let categoryKeyword = '';
    if (text.includes('COFFEE') || text.includes('KOPI') || text.includes('KFC') || text.includes('MCD') || text.includes('FOOD') || text.includes('RESTO')) {
      categoryKeyword = 'makan';
    } else if (text.includes('GRAB') || text.includes('GOJEK') || text.includes('PARKIR') || text.includes('TOL') || text.includes('STASIUN')) {
      categoryKeyword = 'transportasi';
    } else if (text.includes('MART') || text.includes('SUPERINDO') || text.includes('INDOMARET') || text.includes('ALFAMART') || text.includes('BCA')) {
      categoryKeyword = 'belanja';
    }

    router.push(`/transactions/add?amount=${amount}&category=${categoryKeyword}&notes=${encodeURIComponent(resultText.substring(0, 100))}`);
  };

  return (
    <div className="page-container animate-in">
      <header className="page-header">
        <h1 className="page-title">Scan Receipt 📷</h1>
        <p className="page-subtitle">Extract text from your receipts using OCR</p>
      </header>

      <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
        {!image ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--spacing-3xl) var(--spacing-md)',
              textAlign: 'center',
              cursor: 'pointer',
              background: 'var(--bg-secondary)',
              transition: 'var(--transition-fast)'
            }}
            onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--primary-light)')}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>📸</div>
            <h3 style={{ marginBottom: 'var(--spacing-xs)' }}>Upload or take a photo</h3>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-size-sm)' }}>Supported formats: JPG, PNG, WEBP</p>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              maxHeight: '300px', 
              overflow: 'hidden', 
              borderRadius: 'var(--radius-md)', 
              marginBottom: 'var(--spacing-md)',
              border: '1px solid var(--border)'
            }}>
              <img src={image} alt="Receipt preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'center' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => { setImage(null); setResultText(''); }}
                disabled={loading}
              >
                Retake
              </button>
              <button 
                className="btn btn-primary" 
                onClick={processImage}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Scan Now'}
              </button>
            </div>
          </div>
        )}

        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          ref={fileInputRef} 
          style={{ display: 'none' }}
          onChange={handleImageUpload}
        />
      </div>

      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-lg)' }}>
          <div style={{ marginBottom: 'var(--spacing-md)', color: 'var(--primary-light)' }}>{status}</div>
          <div style={{ width: '100%', height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'var(--gradient-primary)', width: `${progress}%`, transition: 'width 0.2s' }} />
          </div>
        </div>
      )}

      {resultText && !loading && (
        <div className="card animate-in">
          <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Extracted Text</h3>
          <div style={{ 
            background: 'var(--bg-secondary)', 
            padding: 'var(--spacing-md)', 
            borderRadius: 'var(--radius-md)',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            fontSize: 'var(--font-size-sm)',
            maxHeight: '200px',
            overflowY: 'auto',
            marginBottom: 'var(--spacing-md)',
            border: '1px solid var(--border)'
          }}>
            {resultText}
          </div>
          
          <div className="alert" style={{ 
            padding: 'var(--spacing-md)', 
            background: 'var(--primary-glow)', 
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--spacing-md)',
            border: '1px solid var(--border-active)'
          }}>
            <p style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>
              <strong>Note:</strong> Tesseract extracts raw text. You can copy relevant values and enter them manually in the next step.
            </p>
          </div>
          
          <button className="btn btn-primary btn-full" onClick={proceedToManualEntry}>
            Proceed to Add Transaction
          </button>
        </div>
      )}
    </div>
  );
}
