import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import AuthLayout from '@/components/layouts/AuthLayout';

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

export default function Login() {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lastAttemptTime, setLastAttemptTime] = useState(0);
  const { signInWithEmail, sendOTP, verifyOTP } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);

  useVirtualKeyboard(containerRef as React.RefObject<HTMLElement>);

  const from = (location.state as any)?.from || '/dashboard';

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const handleSendOTP = async () => {
    if (!phone) {
      setError('Please enter your phone number');
      return;
    }
    if (!validatePhone(phone)) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await sendOTP(phone, 'phone');
      if (result.error) {
        setError(result.error.message);
      } else {
        setOtpSent(true);
        toast.success('OTP sent successfully!');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Rate limiting
    const now = Date.now();
    const timeSinceLastAttempt = now - lastAttemptTime;
    const maxAttempts = 5;
    const lockoutDuration = 5 * 60 * 1000;
    
    if (loginAttempts >= maxAttempts && timeSinceLastAttempt < lockoutDuration) {
      const remainingTime = Math.ceil((lockoutDuration - timeSinceLastAttempt) / 1000 / 60);
      setError(`Too many attempts. Please try again in ${remainingTime} minutes.`);
      return;
    }
    
    setLoading(true);

    try {
      let result;
      if (authMethod === 'email') {
        if (!email || !password) { setError('Please enter email and password'); setLoading(false); return; }
        if (!validateEmail(email)) { setError('Please enter a valid email address'); setLoading(false); return; }
        if (!validatePassword(password)) { setError('Password must be at least 6 characters'); setLoading(false); return; }
        result = await signInWithEmail(email, password);
      } else {
        if (otpSent) {
          if (!otp) { setError('Please enter the OTP'); setLoading(false); return; }
          result = await verifyOTP(phone, otp);
        } else {
          // If they haven't sent OTP yet but clicked sign in, send it now
          await handleSendOTP();
          setLoading(false);
          return;
        }
      }

      if (result && result.error) {
        setError(result.error.message);
        setLoginAttempts(prev => prev + 1);
        setLastAttemptTime(now);
      } else if (result) {
        toast.success('Login successful!');
        setLoginAttempts(0);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profileData } = await (supabase.from('profiles').select('role').eq('id', user.id).single() as any);
          if (profileData && ['admin', 'officer'].includes(profileData.role)) {
            navigate('/admin', { replace: true });
          } else {
            navigate(from, { replace: true });
          }
        } else {
          navigate(from, { replace: true });
        }
      }
    } catch (err: any) {
      console.error('Login error detail:', err);
      let msg = err.message || 'Login failed';
      
      // Specifically catch network/Supabase reachability issues
      if (msg.includes('Failed to fetch') || msg.includes('timeout') || !navigator.onLine) {
        msg = 'Connection Error: Cannot reach Supabase. Please check if your Supabase project is "Paused" in the dashboard, or check your internet connection.';
      }

      setError(msg);
      setLoginAttempts(prev => prev + 1);
      setLastAttemptTime(now);
    } finally {
      setLoading(false);
    }
  };

  const fieldStyle: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', gap: '5px',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: '0.8rem', fontWeight: 800, color: '#7a7368', textTransform: 'uppercase', letterSpacing: '.04em',
  };
  const inputStyle: React.CSSProperties = {
    height: '46px', borderRadius: '10px', fontSize: '0.95rem', border: '1.5px solid rgba(14,13,11,.12)',
    padding: '0 14px', width: '100%', outline: 'none', transition: 'border-color 0.15s',
    background: '#fafafa', color: '#0e0d0b',
  };
  const submitBtnStyle: React.CSSProperties = {
    width: '100%', height: '48px', borderRadius: '10px', border: 'none', cursor: 'pointer',
    fontSize: '0.95rem', fontWeight: 800, color: 'white', letterSpacing: '.02em',
    background: 'linear-gradient(135deg,#cc5500 0%,#c8991e 100%)',
    transition: 'opacity 0.15s', marginTop: '10px'
  };

  const EmailForm = (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '6px 10px', fontSize: '0.8rem', color: '#dc2626', fontWeight: 600 }}>
          {error}
        </div>
      )}
      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '5px 10px', fontSize: '0.75rem', color: '#166534', fontWeight: 600 }}>
        ✅ Recommended: Email login
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', alignItems: 'end' }}>
        <div style={fieldStyle}>
          <label htmlFor="email" style={labelStyle}>Email Address</label>
          <input id="email" type="email" placeholder="your.email@example.com" value={email} onChange={e => setEmail(e.target.value)} required aria-required="true" style={inputStyle} className="sj-input" />
        </div>
        <div style={fieldStyle}>
          <label htmlFor="password" style={labelStyle}>Password</label>
          <input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required aria-required="true" style={inputStyle} className="sj-input" />
        </div>
      </div>
      <button type="submit" disabled={loading} style={{ ...submitBtnStyle, opacity: loading ? 0.7 : 1 }}>
        {loading ? 'Signing in…' : 'Sign In'}
      </button>
      <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#7a7368', marginTop: '5px' }}>
        No account?{' '}
        <button type="button" onClick={() => navigate('/register')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1b8f99', fontWeight: 800, fontSize: '0.8rem', padding: 0 }}>
          Register
        </button>
      </div>
    </form>
  );

  const PhoneForm = (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '6px 10px', fontSize: '0.8rem', color: '#dc2626', fontWeight: 600 }}>
          {error}
        </div>
      )}
      <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '6px', padding: '5px 10px', fontSize: '0.75rem', color: '#9a3412', fontWeight: 600 }}>
        📱 OTP-based secure login
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', alignItems: 'end' }}>
        <div style={fieldStyle}>
          <label htmlFor="phone" style={labelStyle}>Phone Number</label>
          <input 
            id="phone"
            type="tel" 
            placeholder="+91 1234567890" 
            value={phone} 
            onChange={e => setPhone(e.target.value)} 
            disabled={otpSent}
            required 
            aria-required="true"
            style={inputStyle} 
            className="sj-input" 
          />
        </div>
        
        {otpSent && (
          <div style={fieldStyle}>
            <label htmlFor="otp" style={labelStyle}>Enter OTP</label>
            <input 
              id="otp"
              type="text" 
              placeholder="6-digit OTP" 
              value={otp} 
              onChange={e => setOtp(e.target.value)} 
              required 
              aria-required="true"
              style={inputStyle} 
              className="sj-input" 
            />
          </div>
        )}
      </div>

      {otpSent && (
        <button 
          type="button" 
          onClick={() => setOtpSent(false)} 
          style={{ background: 'none', border: 'none', padding: 0, color: '#cc5500', fontSize: '0.75rem', textAlign: 'right', cursor: 'pointer', fontWeight: 600 }}
        >
          Change Phone Number
        </button>
      )}

      <button 
        type="submit" 
        disabled={loading} 
        style={{ ...submitBtnStyle, opacity: loading ? 0.7 : 1 }}
      >
        {loading ? 'Processing…' : (otpSent ? 'Verify & Login' : 'Send OTP')}
      </button>
      
      <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#7a7368', marginTop: '5px' }}>
        No account?{' '}
        <button type="button" onClick={() => navigate('/register')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1b8f99', fontWeight: 800, fontSize: '0.8rem', padding: 0 }}>
          Register
        </button>
      </div>
    </form>
  );


  return (
    <AuthLayout title={<>Citizen Login</>}>
      <div
        ref={containerRef}
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.3fr',
          gap: '24px',
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto',
          height: '100%',
          alignItems: 'stretch',
        }}
        className="sj-auth-grid"
      >
        {/* ── Left: Branding ── */}
        <div
          className="sj-auth-brand-card"
          style={{
            position: 'relative', overflow: 'hidden', borderRadius: '18px',
            border: '1px solid rgba(14,13,11,.09)', background: 'white',
            boxShadow: '0 2px 8px rgba(14,13,11,.05)', padding: '30px',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <img src="/logo.png" alt="Smart Janseva" style={{ height: '64px', margin: '0 auto', marginBottom: '8px' }} />
            <div className="brand-title" style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0e0d0b', marginBottom: '2px' }}>SMART JANSEVA</div>
            <div className="brand-subtitle" style={{ fontSize: '0.9rem', fontWeight: 600, color: '#7a7368' }}>Government of India Digital Services</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { icon: '🔒', title: 'Secure Authentication', desc: 'Encrypted & protected', bg: 'rgba(204,85,0,.1)' },
              { icon: '📱', title: 'Multiple Options', desc: 'Email & Phone login', bg: 'rgba(14,94,101,.1)' },
              { icon: '⚡', title: 'Quick Access', desc: 'Instant login', bg: 'rgba(168,120,32,.1)' },
            ].map(f => (
              <div key={f.title} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ height: '42px', width: '42px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', background: f.bg, fontSize: '1.2rem' }}>{f.icon}</div>
                <div>
                  <div className="feature-title" style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0e0d0b' }}>{f.title}</div>
                  <div className="feature-desc" style={{ fontSize: '0.8rem', color: '#7a7368' }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Form ── */}
        <div
          className="sj-auth-form-card"
          style={{
            position: 'relative', overflow: 'hidden', borderRadius: '18px',
            border: '1px solid rgba(14,13,11,.09)', background: 'white',
            boxShadow: '0 2px 8px rgba(14,13,11,.05)', padding: '24px 30px',
            display: 'flex', flexDirection: 'column',
          }}
        >
          {/* Tab header */}
          <div style={{ display: 'flex', gap: 0, marginBottom: '20px', borderRadius: '10px', overflow: 'hidden', border: '1.5px solid rgba(14,13,11,.09)', flexShrink: 0 }}>
            {['email', 'phone'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setAuthMethod(tab as 'email' | 'phone')}
                style={{
                  flex: 1, padding: '10px 0', fontSize: '0.9rem', fontWeight: 800, border: 'none', cursor: 'pointer',
                  background: authMethod === tab ? '#0e0d0b' : '#f5f1ea',
                  color: authMethod === tab ? 'white' : '#7a7368',
                  transition: 'all 0.15s',
                  textTransform: 'capitalize',
                }}
              >
                {tab === 'email' ? '✉️ Email' : '📱 Phone'}
              </button>
            ))}
          </div>

          {/* Form body — scrollable independently */}
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', overflowY: 'auto', paddingRight: '10px' }} className="scrollbar-hide">
            {authMethod === 'email' ? EmailForm : PhoneForm}
          </div>
        </div>
      </div>

      {/* Responsive: stack on small screens */}
      <style>{`
        @media (max-width: 640px) {
          .sj-auth-grid {
            grid-template-columns: 1fr !important;
            maxHeight: unset !important;
          }
          .sj-auth-brand-card {
            display: none !important;
          }
        }
        .sj-input:focus {
          border-color: #cc5500 !important;
          box-shadow: 0 0 0 2px rgba(204,85,0,.12) !important;
        }
      `}</style>
    </AuthLayout>
  );
}