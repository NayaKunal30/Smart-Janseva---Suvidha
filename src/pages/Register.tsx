import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AuthLayout from '@/components/layouts/AuthLayout';
import { useAuthI18n } from '@/components/layouts/AuthLayout';
import { toast } from 'sonner';
import { devBypassEmail } from '@/utils/email-confirmation-fix';

// Attaches virtual keyboard open/close to all inputs inside a container
function useVirtualKeyboard(containerRef: React.RefObject<HTMLElement>) {
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    let kbBtn: HTMLButtonElement | null = null;
    let currentInput: HTMLInputElement | null = null;

    const createBtn = () => {
      if (kbBtn) return;
      kbBtn = document.createElement('button');
      kbBtn.innerHTML = '⌨️';
      kbBtn.type = 'button';
      kbBtn.style.position = 'absolute';
      kbBtn.style.zIndex = '9999';
      kbBtn.style.background = 'white';
      kbBtn.style.border = '1px solid rgba(14,13,11,.13)';
      kbBtn.style.borderRadius = '6px';
      kbBtn.style.cursor = 'pointer';
      kbBtn.style.padding = '2px 4px';
      kbBtn.style.fontSize = '1.1rem';
      kbBtn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
      kbBtn.style.transition = 'opacity 0.2s';
      
      kbBtn.onmousedown = (evt) => {
         evt.preventDefault(); // keep focus on input
         if (currentInput && (window as any).openVirtualKeyboard) {
           (window as any).openVirtualKeyboard(currentInput);
           kbBtn!.style.display = 'none'; // hide icon when keyboard opens
         }
      };
      document.body.appendChild(kbBtn);
    };

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLInputElement;
      if (target.tagName === 'INPUT') {
        currentInput = target;
        createBtn();
        
        // Ensure accurate positioning in case of scrolling
        const updatePosition = () => {
          if (!kbBtn || !currentInput) return;
          const rect = currentInput.getBoundingClientRect();
          kbBtn.style.top = `${rect.top + window.scrollY + Math.floor((rect.height - 28) / 2)}px`;
          kbBtn.style.left = `${rect.right + window.scrollX - 34}px`;
          kbBtn.style.display = 'block';
        };
        
        updatePosition();
        window.addEventListener('scroll', updatePosition, { passive: true });
        window.addEventListener('resize', updatePosition, { passive: true });
      }
    };

    const handleBlur = () => {
      setTimeout(() => {
        const activeEl = document.activeElement;
        const onVKB = activeEl?.closest('[data-virtual-keyboard]');
        
        if (!onVKB) {
           if (kbBtn) kbBtn.style.display = 'none';
        }
        
        if (!onVKB && (window as any).closeVirtualKeyboard) {
          (window as any).closeVirtualKeyboard();
        }
      }, 120);
    };

    container.addEventListener('focusin', handleFocus);
    container.addEventListener('focusout', handleBlur);
    return () => {
      container.removeEventListener('focusin', handleFocus);
      container.removeEventListener('focusout', handleBlur);
      if (kbBtn) {
        kbBtn.remove();
      }
    };
  }, [containerRef]);
}

const ADMIN_CODE = 'ADMIN2026';

export default function Register() {
  const [phone, setPhone]             = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [fullName, setFullName]       = useState('');
  const [adminCode, setAdminCode]     = useState('');
  const [isAdmin, setIsAdmin]         = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [tab, setTab]                 = useState<'email' | 'phone'>('email');
  const { signUpWithPhone, signUpWithEmail } = useAuth();
  const navigate  = useNavigate();
  useAuthI18n();
  const container = useRef<HTMLDivElement>(null);

  useVirtualKeyboard(container as React.RefObject<HTMLElement>);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6)              { setError('Password must be at least 6 characters'); return; }
    if (isAdmin && adminCode !== ADMIN_CODE) { setError('Invalid admin registration code'); return; }

    setLoading(true);
    try {
      const role = isAdmin ? 'admin' : 'citizen';
      let result;

      if (tab === 'email') {
        if (!email || !fullName) {
          setError('Please fill in all fields');
          setLoading(false);
          return;
        }
        
        result = await signUpWithEmail(email, password, fullName, phone, role);
        
        // If email confirmation fails, try development bypass
        if (result.error && result.error.message.includes('email')) {
          console.log('🔧 Email confirmation failed, trying development bypass...');
          const bypassResult = await devBypassEmail(email, password, fullName, phone, role);
          
          if (bypassResult.success) {
            if (bypassResult.warning) {
              toast.success(`Account created! ${bypassResult.warning}`);
            } else {
              toast.success(`Registered as ${isAdmin ? 'Admin' : 'Citizen'}! Account created successfully.`);
            }
            navigate('/login');
            return;
          } else {
            setError(bypassResult.error || 'Registration failed');
            toast.error('Registration failed: ' + bypassResult.error);
            return;
          }
        }
      } else {
        if (!phone || !fullName) {
          setError('Please fill in all fields');
          setLoading(false);
          return;
        }
        result = await signUpWithPhone(phone, password, fullName, role);
      }

      if (!result) return;
      if (result.error) {
        if ((result.error as any).isSmtpError) {
          setError('Supabase Email Error: Your project is trying to send a confirmation email but the SMTP server is failing. ACTION: Please go to your Supabase Dashboard -> Authentication -> Providers -> Email and turn OFF "Confirm Email".');
          toast.error('Supabase SMTP issue detected. See the error message for instructions.');
        } else {
          setError(result.error.message);
          toast.error('Registration failed: ' + result.error.message);
        }
      } else {
        toast.success(`Registered as ${isAdmin ? 'Admin' : 'Citizen'}! Please login.`);
        navigate('/login');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // ── Styles (kiosk friendly — robust sizing) ─────────────────
  const cardStyle: React.CSSProperties = {
    position: 'relative', overflow: 'hidden', borderRadius: '18px',
    border: '1px solid rgba(14,13,11,.09)', background: 'white',
    boxShadow: '0 2px 8px rgba(14,13,11,.05)',
  };
  const fw: React.CSSProperties  = { display: 'flex', flexDirection: 'column', gap: '5px' };
  const lS: React.CSSProperties  = { fontSize: '0.8rem', fontWeight: 800, color: '#7a7368', textTransform: 'uppercase', letterSpacing: '.04em' };
  const iS: React.CSSProperties  = {
    height: '46px', borderRadius: '10px', fontSize: '0.95rem', fontWeight: 600,
    border: '1.5px solid rgba(14,13,11,.13)', padding: '0 14px', width: '100%',
    background: '#fafaf9', color: '#0e0d0b', transition: 'border-color 0.15s', outline: 'none'
  };
  const btnS: React.CSSProperties = {
    width: '100%', height: '48px', borderRadius: '10px', border: 'none', cursor: 'pointer',marginTop:'8px',
    fontSize: '0.95rem', fontWeight: 800, color: 'white', letterSpacing: '.02em',
    background: 'linear-gradient(135deg,#0e5e65 0%,#1b8f99 100%)', transition: 'opacity 0.15s',
  };

  // Full form — same for both tabs, only email/phone field changes
  const FormBody = (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      {/* Error banner */}
      {error && (
        <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'5px', padding:'4px 8px', fontSize:'0.68rem', color:'#dc2626', fontWeight:600 }}>
          {error}
        </div>
      )}

      {/* Info banner */}
      {tab === 'email' ? (
        <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:'5px', padding:'3px 8px', fontSize:'0.63rem', color:'#166534', fontWeight:600 }}>
          ✅ Recommended: Email registration
        </div>
      ) : (
        <div style={{ background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:'5px', padding:'3px 8px', fontSize:'0.63rem', color:'#9a3412', fontWeight:600 }}>
          ⚠️ Phone registration requires SMS service
        </div>
      )}

      {/* Multiple Column Layout Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', alignItems: 'start' }}>
        {/* Full name */}
        <div style={fw}>
          <label htmlFor="reg-name" style={lS} className="sj-form-label">Full Name</label>
          <input id="reg-name" type="text" placeholder="Enter your full name" value={fullName} onChange={e => setFullName(e.target.value)} required aria-required="true" style={iS} className="sj-input-teal sj-form-input" />
        </div>

        {/* Email or Phone */}
        {tab === 'email' ? (
          <>
            <div style={fw}>
              <label htmlFor="reg-email" style={lS} className="sj-form-label">Email Address</label>
              <input id="reg-email" type="email" placeholder="your.email@example.com" value={email} onChange={e => setEmail(e.target.value)} required aria-required="true" style={iS} className="sj-input-teal sj-form-input" />
            </div>
            <div style={fw}>
              <label htmlFor="reg-phone-opt" style={lS} className="sj-form-label">Phone (Optional)</label>
              <input id="reg-phone-opt" type="tel" placeholder="+91 1234567890" value={phone} onChange={e => setPhone(e.target.value)} style={iS} className="sj-input-teal sj-form-input" />
            </div>
          </>
        ) : (
          <div style={fw}>
            <label htmlFor="reg-phone" style={lS} className="sj-form-label">Phone Number</label>
            <input id="reg-phone" type="tel" placeholder="+91 1234567890" value={phone} onChange={e => setPhone(e.target.value)} required aria-required="true" style={iS} className="sj-input-teal sj-form-input" />
          </div>
        )}

        {/* Password + Confirm */}
        <div style={fw}>
          <label htmlFor="reg-password" style={lS} className="sj-form-label">Password</label>
          <input id="reg-password" type="password" placeholder="Min 6 chars" value={password} onChange={e => setPassword(e.target.value)} required aria-required="true" minLength={6} style={iS} className="sj-input-teal sj-form-input" />
        </div>
      </div>

      {/* Admin toggle */}
      <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'5px 9px', borderRadius:'6px', background:'#f5f1ea', border:'1.5px solid rgba(14,13,11,.09)' }}>
        <input type="checkbox" id="sj-admin" checked={isAdmin} onChange={e => setIsAdmin(e.target.checked)} style={{ width:'13px', height:'13px', cursor:'pointer', accentColor:'#cc5500', flexShrink:0 }} />
        <label htmlFor="sj-admin" style={{ cursor:'pointer', fontSize:'0.68rem', fontWeight:700, color:'#0e0d0b', lineHeight:1.2 }}>
          Register as Admin/Officer <span style={{ fontWeight:400, color:'#7a7368', fontSize:'0.62rem' }}>(requires code)</span>
        </label>
      </div>

      {/* Admin code — shown only if isAdmin */}
      {isAdmin && (
        <div style={fw}>
          <label htmlFor="reg-admin-code" style={lS} className="sj-form-label">Admin Code</label>
          <input id="reg-admin-code" type="password" placeholder="Enter admin code" value={adminCode} onChange={e => setAdminCode(e.target.value)} required aria-required="true" style={iS} className="sj-input-teal sj-form-input" />
        </div>
      )}

      {/* Submit */}
      <button type="submit" disabled={loading} style={{ ...btnS, opacity: loading ? 0.72 : 1 }} className="sj-form-submit">
        {loading ? 'Creating Account…' : 'Register'}
      </button>

      {/* Login link */}
      <div style={{ textAlign:'center', fontSize:'0.8rem', color:'#7a7368', marginTop:'5px' }} className="sj-form-hint">
        Have account?{' '}
        <button type="button" onClick={() => navigate('/login')} style={{ background:'none', border:'none', cursor:'pointer', color:'#cc5500', fontWeight:800, fontSize:'0.8rem', padding:0 }}>
          Login
        </button>
      </div>
    </form>
  );

  return (
    <AuthLayout title={<>New Registration</>}>
      <div
        ref={container}
        style={{ display:'grid', gridTemplateColumns:'1fr 1.5fr', gap:'24px', width:'100%', maxWidth:'1280px', margin:'0 auto', height:'100%', alignItems:'stretch' }}
        className="sj-auth-grid"
      >
        {/* ── Branding ── */}
        <div style={{ ...cardStyle, padding:'30px', display:'flex', flexDirection:'column', justifyContent:'center' }} className="sj-auth-brand-card">
          <div style={{ textAlign:'center', marginBottom:'24px' }}>
            <img src="/logo.png" alt="National Emblem of India" style={{ height: '64px', margin: '0 auto', marginBottom: '8px' }} />
            <div style={{ fontSize:'1.6rem', fontWeight:800, color:'#0e0d0b', marginBottom:'2px' }} className="sj-brand-title">SMART JANSEVA</div>
            <div style={{ fontSize:'0.9rem', fontWeight:600, color:'#7a7368' }} className="sj-brand-sub">Government of India Digital Services</div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            {[
              { icon:'🪪', title:'Secure Registration', desc:'Create account safely',         bg:'rgba(14,94,101,.1)' },
              { icon:'👤', title:'Citizen & Admin',     desc:'Register as citizen or officer', bg:'rgba(204,85,0,.1)' },
              { icon:'🏛️', title:'Access Services',     desc:'All services in one place',      bg:'rgba(168,120,32,.1)' },
            ].map(f => (
              <div key={f.title} style={{ display:'flex', alignItems:'center', gap:'14px' }}>
                <div style={{ height:'42px', width:'42px', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'10px', background:f.bg, fontSize:'1.2rem' }}>{f.icon}</div>
                <div>
                  <div style={{ fontWeight:800, fontSize:'0.95rem', color:'#0e0d0b' }} className="sj-feat-title">{f.title}</div>
                  <div style={{ fontSize:'0.8rem', color:'#7a7368' }} className="sj-feat-desc">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Form ── */}
        <div style={{ ...cardStyle, padding:'24px 30px', display:'flex', flexDirection:'column' }} className="sj-auth-form-card">
          {/* Tab switcher */}
          <div style={{ display:'flex', marginBottom:'20px', borderRadius:'10px', overflow:'hidden', border:'1.5px solid rgba(14,13,11,.09)', flexShrink:0 }}>
            {(['email','phone'] as const).map(v => (
              <button key={v} type="button" onClick={() => { setTab(v); setError(''); }} style={{
                flex:1, padding:'10px 0', fontSize:'0.9rem', fontWeight:800, border:'none', cursor:'pointer',
                background: tab===v ? '#0e0d0b' : '#f5f1ea',
                color: tab===v ? 'white' : '#7a7368',
                transition:'all 0.15s',
              }}>
                {v === 'email' ? '✉️ Email' : '📱 Phone'}
              </button>
            ))}
          </div>

          {/* Form body — scrollable independently */}
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', overflowY: 'auto', paddingRight: '10px' }} className="scrollbar-hide">
            {FormBody}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width:600px) {
          .sj-auth-grid { grid-template-columns:1fr !important; max-height:unset !important; }
          .sj-auth-brand-card { display:none !important; }
        }
        /* Senior mode overrides for register */
        .sj-senior-mode .sj-auth-form-card .sj-form-input  { height:37px !important; font-size:0.88rem !important; }
        .sj-senior-mode .sj-auth-form-card .sj-form-label  { font-size:0.74rem !important; }
        .sj-senior-mode .sj-auth-form-card .sj-form-submit { height:39px !important; font-size:0.86rem !important; }
        .sj-senior-mode .sj-auth-form-card .sj-form-hint   { font-size:0.72rem !important; }
      `}</style>
    </AuthLayout>
  );
}