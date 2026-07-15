'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Tesseract from 'tesseract.js';
import { createClient } from '@/lib/supabase/client';

export default function ScanReceiptPage() {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [resultText, setResultText] = useState('');
  
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
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
        'eng+ind',
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
    let amount = 0;
    const text = resultText.toUpperCase();
    
    // Smart parse for total
    const lines = text.split('\n');
    let foundTotalLine = false;
    let validNumbers: number[] = [];

    for (const line of lines) {
      // Abaikan baris yang terindikasi sebagai alamat (menghindari salah baca kode pos/RT/RW)
      if (line.includes('KEC') || line.includes('KOTA') || line.includes('KAB') || line.includes('RT') || line.includes('RW') || line.includes('JL.') || line.includes('JALAN')) {
        continue;
      }

      const isTotalLine = line.includes('TOTAL') || line.includes('TDTAL') || line.includes('T0TAL') || line.includes('TL') || line.includes('BAYAR') || line.includes('TUNAI') || line.includes('NET') || line.includes('CASH') || line.includes('JUMLAH');
      const numbersInLine = line.match(/\d{1,3}(?:[.,]\d{3})*(?:[.,]\d+)?/g);
      
      if (numbersInLine) {
        const parsed = numbersInLine.map(n => Number(n.replace(/[,.]/g, ''))).filter(n => !isNaN(n) && n > 0);
        if (parsed.length > 0) {
          if (isTotalLine) {
            amount = Math.max(amount, Math.max(...parsed));
            foundTotalLine = true;
          }
          validNumbers.push(...parsed);
        }
      }
    }

    // Fallback: Jika gagal menemukan kata TOTAL, ambil angka paling besar yang masuk akal
    if (!foundTotalLine || amount === 0) {
      const safeNumbers = validNumbers.filter(n => n > 100 && n < 50000000 && n !== 15000);
      if (safeNumbers.length > 0) {
        amount = Math.max(...safeNumbers);
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

    router.push(`/transactions/add?amount=${amount > 0 ? amount : ''}&category=${categoryKeyword}&notes=${encodeURIComponent(resultText.substring(0, 100))}`);
  };

  return (
    <div className="page-container animate-in">
      <header className="page-header">
        <h1 className="page-title">Scan Receipt 📷 (v2)</h1>
        <p className="page-subtitle">Extract text from your receipts using OCR</p>
      </header>

      <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
        {!image ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
            <div 
              onClick={() => cameraRef.current?.click()}
              style={{
                border: '2px dashed var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--spacing-xl) var(--spacing-sm)',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'var(--bg-secondary)',
                transition: 'var(--transition-fast)'
              }}
              onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--primary-light)')}
              onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: 'var(--spacing-sm)' }}>📸</div>
              <h3 style={{ fontSize: 'var(--font-size-md)', marginBottom: '4px' }}>Kamera</h3>
              <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-size-xs)' }}>Foto struk baru</p>
            </div>
            
            <div 
              onClick={() => galleryRef.current?.click()}
              style={{
                border: '2px dashed var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--spacing-xl) var(--spacing-sm)',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'var(--bg-secondary)',
                transition: 'var(--transition-fast)'
              }}
              onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--primary-light)')}
              onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: 'var(--spacing-sm)' }}>🖼️</div>
              <h3 style={{ fontSize: 'var(--font-size-md)', marginBottom: '4px' }}>Galeri</h3>
              <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-size-xs)' }}>Pilih foto tersimpan</p>
            </div>
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
          ref={cameraRef} 
          style={{ display: 'none' }}
          onChange={handleImageUpload}
        />
        <input 
          type="file" 
          accept="image/*" 
          ref={galleryRef} 
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
          
          <div style={{ 
            marginTop: 'var(--spacing-lg)',
            padding: 'var(--spacing-md)', 
            background: 'var(--bg-secondary)', 
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-active)'
          }}>
            <p style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>
              <strong>Note:</strong> Kami mendeteksi total angka dan kategori secara otomatis. Anda bisa mengeditnya dan memilih Wallet di langkah selanjutnya.
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
