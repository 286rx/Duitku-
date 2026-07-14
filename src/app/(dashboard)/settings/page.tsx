'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Loading from '@/components/Loading';

// Premium Toggle Switch Component
const Toggle = ({ active, onChange }: { active: boolean, onChange: () => void }) => (
  <div 
    onClick={onChange}
    style={{
      width: '50px',
      height: '28px',
      borderRadius: '20px',
      background: active ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
      cursor: 'pointer',
      position: 'relative',
      transition: 'background 0.3s ease',
      border: '1px solid ' + (active ? 'var(--primary-light)' : 'var(--border)'),
      boxShadow: active ? '0 0 10px var(--primary-glow)' : 'none',
    }}
  >
    <div style={{
      width: '24px',
      height: '24px',
      background: '#fff',
      borderRadius: '50%',
      position: 'absolute',
      top: '1px',
      left: active ? '23px' : '1px',
      transition: 'left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
    }} />
  </div>
);

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // User Data State
  const [user, setUser] = useState<{ email?: string; name?: string; avatar?: string } | null>(null);
  
  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  
  // Settings Toggles State
  const [notifActive, setNotifActive] = useState(true);
  const [biometricActive, setBiometricActive] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const name = authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0];
        setUser({
          email: authUser.email,
          name: name,
          avatar: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture,
        });
        setEditName(name);
      }
      setLoading(false);
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: editName }
      });
      
      if (error) throw error;
      
      setUser(prev => prev ? { ...prev, name: editName } : null);
      setIsEditing(false);
      setToast({ message: 'Profil berhasil diperbarui!', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (error: any) {
      setToast({ message: error.message || 'Gagal menyimpan', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading fullScreen />;

  return (
    <div className="page-container animate-in" style={{ paddingBottom: '100px' }}>
      {toast && (
        <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: toast.type === 'error' ? 'var(--accent-red)' : 'var(--accent-green)', color: '#fff', padding: '12px 24px', borderRadius: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{toast.type === 'error' ? '❌' : '✅'}</span>
          {toast.message}
        </div>
      )}

      <header className="page-header" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 className="page-title">Pengaturan</h1>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
        
        {/* 🌟 Glowing Profile Card (Glassmorphism) */}
        <div style={{ 
          padding: 'var(--spacing-xl)', 
          textAlign: 'center',
          background: 'linear-gradient(180deg, rgba(26,26,62,0.8) 0%, rgba(10,10,26,0.9) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '24px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
        }}>
          {/* Animated Background Glow */}
          <div className="avatar-glow" style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translate(-50%, 0)', width: '120px', height: '120px', background: 'var(--primary)', filter: 'blur(60px)', opacity: 0.4, borderRadius: '50%' }} />

          {/* Avatar Container */}
          <div style={{ 
            width: '90px', 
            height: '90px', 
            borderRadius: '50%', 
            background: 'var(--gradient-primary)', 
            margin: '0 auto var(--spacing-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.5rem',
            position: 'relative',
            zIndex: 2,
            border: '3px solid rgba(255,255,255,0.1)',
            boxShadow: '0 8px 24px rgba(108, 92, 231, 0.4)'
          }}>
            {user?.avatar ? (
              <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            ) : (
              '👤'
            )}
          </div>

          {/* Editable Name Section */}
          <div style={{ position: 'relative', zIndex: 2 }}>
            {isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="form-input"
                  style={{ textAlign: 'center', width: '80%', maxWidth: '250px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}
                  autoFocus
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-primary btn-sm" onClick={handleSaveProfile} disabled={saving}>
                    {saving ? 'Menyimpan...' : 'Simpan'}
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => { setIsEditing(false); setEditName(user?.name || ''); }}>
                    Batal
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h2 style={{ margin: '0 0 4px 0', fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: '#fff' }}>
                  {user?.name}
                  <button 
                    onClick={() => setIsEditing(true)}
                    style={{ background: 'none', border: 'none', color: 'var(--primary-light)', cursor: 'pointer', marginLeft: '8px', fontSize: '1rem' }}
                  >
                    ✏️
                  </button>
                </h2>
                <p style={{ color: 'var(--text-tertiary)', margin: 0, fontSize: 'var(--font-size-sm)' }}>{user?.email}</p>
              </div>
            )}
          </div>
        </div>

        {/* 🎛️ Interactive Settings Menu */}
        <div>
          <h3 style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 'var(--spacing-sm)', paddingLeft: 'var(--spacing-md)' }}>
            Preferensi Aplikasi
          </h3>
          <div style={{ 
            background: 'var(--bg-card)', 
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--border)', 
            borderRadius: '20px',
            overflow: 'hidden'
          }}>
            
            {/* Theme (Static for now, just visual) */}
            <div style={{ padding: 'var(--spacing-lg)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '10px' }}>🌓</div>
                <span style={{ fontWeight: 500 }}>Tema Tampilan</span>
              </div>
              <span style={{ color: 'var(--primary-light)', fontSize: 'var(--font-size-sm)', background: 'var(--primary-glow)', padding: '4px 12px', borderRadius: '12px' }}>Mode Gelap</span>
            </div>

            {/* Notifications Toggle */}
            <div style={{ padding: 'var(--spacing-lg)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '10px' }}>🔔</div>
                <span style={{ fontWeight: 500 }}>Notifikasi Pengingat</span>
              </div>
              <Toggle active={notifActive} onChange={() => setNotifActive(!notifActive)} />
            </div>

            {/* Biometrics Toggle */}
            <div style={{ padding: 'var(--spacing-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '10px' }}>🔐</div>
                <span style={{ fontWeight: 500 }}>Login dengan Sidik Jari</span>
              </div>
              <Toggle active={biometricActive} onChange={() => setBiometricActive(!biometricActive)} />
            </div>
          </div>
        </div>

        {/* 🚪 Logout Button (Premium Red) */}
        <button 
          onClick={handleLogout}
          style={{ 
            background: 'linear-gradient(135deg, rgba(248, 113, 113, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%)', 
            color: 'var(--accent-red)', 
            border: '1px solid rgba(248, 113, 113, 0.3)',
            borderRadius: '16px',
            width: '100%',
            padding: 'var(--spacing-lg)',
            fontSize: 'var(--font-size-md)',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(220, 38, 38, 0.1)',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(248, 113, 113, 0.2)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
          onMouseOut={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(248, 113, 113, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%)'; e.currentTarget.style.transform = 'translateY(0)' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          Logout Aplikasi
        </button>

      </div>

      {/* Breathing Animation CSS */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes breathe {
          0% { transform: translate(-50%, 0) scale(1); opacity: 0.3; }
          50% { transform: translate(-50%, 0) scale(1.1); opacity: 0.5; }
          100% { transform: translate(-50%, 0) scale(1); opacity: 0.3; }
        }
        .avatar-glow {
          animation: breathe 4s ease-in-out infinite;
        }
      `}} />
    </div>
  );
}
