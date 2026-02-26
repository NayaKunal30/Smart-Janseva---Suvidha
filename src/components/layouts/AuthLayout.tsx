import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

import ChatBot, { ChatMessage } from '@/components/common/ChatBot';
import VoiceAssistant from '@/components/common/VoiceAssistant';

type LanguageCode = string;

type I18nKey =
  | 'select_service' | 'citizen_login' | 'new_registration' | 'track'
  | 'receipts' | 'help' | 'secure' | 'encrypted' | 'dpdp' | 'keyboard'
  | 'close' | 'backspace' | 'space' | 'enter' | 'no_services'
  | 'loading_services' | 'services_unavailable' | 'senior';

const I18N: Record<LanguageCode, Record<I18nKey, string>> = {
  en: {
    select_service: 'Select a Service to Begin', citizen_login: 'Citizen Login',
    new_registration: 'New Registration', track: 'Track', receipts: 'Receipts',
    help: 'Help', secure: 'Secure', encrypted: 'Encrypted', dpdp: 'DPDP Act',
    keyboard: 'Virtual Keyboard', close: '✕', backspace: '⌫', space: 'Space',
    enter: 'Enter ↵', no_services: 'No services found.',
    loading_services: 'Loading services…', services_unavailable: 'Services unavailable', senior: 'Senior',
  },
  hi: {
    select_service: 'सेवा चुनें', citizen_login: 'नागरिक लॉगिन',
    new_registration: 'नया पंजीकरण', track: 'स्थिति', receipts: 'रसीदें',
    help: 'सहायता', secure: 'सुरक्षित', encrypted: 'एन्क्रिप्टेड', dpdp: 'डीपीडीपी अधिनियम',
    keyboard: 'कीबोर्ड', close: '✕', backspace: '⌫', space: 'स्पेस',
    enter: 'एंटर ↵', no_services: 'कोई सेवा नहीं मिली.',
    loading_services: 'सेवाएँ लोड हो रही हैं…', services_unavailable: 'सेवाएँ उपलब्ध नहीं हैं', senior: 'वरिष्ठ',
  },
  mr: {
    select_service: 'सेवा निवडा', citizen_login: 'नागरिक लॉगिन',
    new_registration: 'नवीन नोंदणी', track: 'स्थिती', receipts: 'पावत्या',
    help: 'मदत', secure: 'सुरक्षित', encrypted: 'एन्क्रिप्टेड', dpdp: 'डीपीडीपी कायदा',
    keyboard: 'कीबोर्ड', close: '✕', backspace: '⌫', space: 'स्पेस',
    enter: 'एंटर ↵', no_services: 'सेवा सापडली नाही.',
    loading_services: 'सेवा लोड होत आहेत…', services_unavailable: 'सेवा उपलब्ध नहीत', senior: 'ज्येष्ठ',
  },
  ta: {
    select_service: 'சேவையை தேர்வு செய்யவும்', citizen_login: 'குடிமகன் உள்நுழைவு',
    new_registration: 'புதிய பதிவு', track: 'நிலை', receipts: 'ரசீதுகள்',
    help: 'உதவி', secure: 'பாதுகாப்பானது', encrypted: 'குறியாக்கம்', dpdp: 'DPDP சட்டம்',
    keyboard: 'விசைப்பலகை', close: '✕', backspace: '⌫', space: 'இடைவெளி',
    enter: 'என்டர் ↵', no_services: 'சேவைகள் கிடைக்கவில்லை.',
    loading_services: 'சேவைகள் ஏற்றப்படுகின்றன…', services_unavailable: 'சேவைகள் கிடைக்கவில்லை', senior: 'மூத்த',
  },
};

const AuthI18nContext = createContext<{ lang: LanguageCode; t: (key: I18nKey) => string } | null>(null);

export function useAuthI18n() {
  const ctx = useContext(AuthI18nContext);
  if (!ctx) return { lang: 'en', t: (k: I18nKey) => I18N.en?.[k] || I18N.hi?.[k] || I18N.mr?.[k] || k };
  return ctx;
}

const LANGUAGES: { code: string; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'mr', label: 'मराठी' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'gu', label: 'ગુજરાતી' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'മലയാളം' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ' },
  { code: 'or', label: 'ଓଡ଼ିଆ' },
];

// ─── Clock ────────────────────────────────────────────────────────────────────
function useClock() {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setTime(n.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDate(n.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase());
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return { time, date };
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback((message: string) => {
    setMsg(message);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setMsg(null), 2800);
  }, []);
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);
  return { msg, show };
}

// ─── Virtual Keyboard Component ───────────────────────────────────────────────
const LETTER_ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['Z','X','C','V','B','N','M'],
];
const SYMBOL_ROW   = ['@','.', '-','_','#','!','?'];
const NUMBER_ROW   = ['1','2','3','4','5','6','7','8','9','0'];
const NUMBER_SYM   = ['!','@','#','$','%','^','&','*','(',')'];

function VirtualKeyboard({
  open, onClose, onKey, onBackspace, onSpace, onEnter, onClear, inputValue, labels,
}: {
  open: boolean;
  onClose: () => void;
  onKey: (ch: string) => void;
  onBackspace: () => void;
  onSpace: () => void;
  onEnter: () => void;
  onClear: () => void;
  inputValue: string;
  setInputValue: (v: string) => void;
  labels: { keyboard: string; close: string; backspace: string; space: string; enter: string; clear: string };
}) {
  const [caps, setCaps] = useState(true);
  const [numMode, setNumMode] = useState(false);

  if (!open) return null;

  // Shared key styles
  const K: React.CSSProperties = {
    height: '29px', minWidth: '29px', borderRadius: '5px', fontSize: '0.64rem',
    fontWeight: 800, border: '1.5px solid rgba(14,13,11,.13)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '0 3px', userSelect: 'none', transition: 'filter 0.08s',
  };
  const kNormal  = { ...K, background: '#f3f3f1', color: '#0e0d0b' };
  const kAction  = { ...K, background: '#e6e3dc', color: '#3a3733', minWidth: '42px' };
  const kOn      = { ...K, background: '#0e0d0b', color: 'white',   minWidth: '42px' };
  const kGreen   = { ...K, background: 'linear-gradient(135deg,#cc5500,#c8991e)', color: 'white', border: 'none', minWidth: '60px' };
  const kRed     = { ...K, background: '#dc2626', color: 'white',   border: 'none', minWidth: '38px' };
  const kTeal    = { ...K, background: 'transparent', border: '1.5px solid #0e5e65', color: '#0e5e65', minWidth: '38px' };
  const kSpace   = { ...K, background: '#eceae5', color: '#0e0d0b', minWidth: '110px' };

  const rc = (ch: string) => (numMode ? ch : caps ? ch.toUpperCase() : ch.toLowerCase());

  return (
    <div
      data-virtual-keyboard
      style={{
        position: 'fixed', bottom: '50px', left: '50%', transform: 'translateX(-50%)',
        zIndex: 300, width: 'min(548px, 99vw)',
        background: 'rgba(252,251,249,0.98)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1.5px solid rgba(14,13,11,.10)',
        borderLeft: '1.5px solid rgba(14,13,11,.06)',
        borderRight: '1.5px solid rgba(14,13,11,.06)',
        borderRadius: '14px 14px 0 0',
        boxShadow: '0 -6px 32px rgba(14,13,11,.14)',
        padding: '7px 10px 9px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
        <span style={{ fontSize: '0.56rem', fontWeight: 800, color: '#7a7368', letterSpacing: '.06em', textTransform: 'uppercase', flexShrink: 0 }}>
          {labels.keyboard}
        </span>
        {/* Live preview */}
        <div style={{
          flex: 1, background: '#f0ede8', borderRadius: '5px', padding: '2px 7px',
          fontSize: '0.74rem', fontWeight: 700, color: '#0e0d0b', border: '1px solid rgba(14,13,11,.09)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          minHeight: '22px', textAlign: 'right', direction: 'rtl', fontFamily: 'monospace',
        }}>
          {inputValue
            ? <>{inputValue}<span style={{ opacity: 0.4 }}>|</span></>
            : <span style={{ color: '#bbb', direction: 'ltr', fontFamily: 'inherit' }}>tap a key…</span>}
        </div>
        <button type="button" onClick={onClose} style={{ ...K, minWidth: '26px', height: '24px', background: '#f0ede8', color: '#7a7368', border: '1px solid rgba(14,13,11,.09)' }}>
          {labels.close}
        </button>
      </div>

      {/* Key grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        {numMode ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '3px' }}>
              {NUMBER_ROW.map(ch => <button key={ch} type="button" onClick={() => onKey(ch)} style={kNormal}>{ch}</button>)}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '3px' }}>
              {NUMBER_SYM.map(ch => <button key={ch} type="button" onClick={() => onKey(ch)} style={kNormal}>{ch}</button>)}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '3px' }}>
              {SYMBOL_ROW.map(ch => <button key={ch} type="button" onClick={() => onKey(ch)} style={kNormal}>{ch}</button>)}
            </div>
          </>
        ) : (
          <>
            {LETTER_ROWS.map((row, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'center', gap: '3px' }}>
                {row.map(ch => <button key={ch} type="button" onClick={() => onKey(rc(ch))} style={kNormal}>{rc(ch)}</button>)}
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '3px' }}>
              {SYMBOL_ROW.map(ch => <button key={ch} type="button" onClick={() => onKey(ch)} style={{ ...kNormal, minWidth: '30px' }}>{ch}</button>)}
            </div>
          </>
        )}

        {/* Action row */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', marginTop: '2px', flexWrap: 'nowrap' }}>
          <button type="button" onClick={() => setNumMode(p => !p)} style={numMode ? kOn : kAction}>
            {numMode ? 'ABC' : '123'}
          </button>
          {!numMode && (
            <button type="button" onClick={() => setCaps(p => !p)} style={caps ? kOn : kAction} title="Caps Lock">
              {caps ? '⇧ ON' : '⇧ OFF'}
            </button>
          )}
          <button type="button" onClick={onClear} style={kRed}>{labels.clear}</button>
          <button type="button" onClick={onBackspace} style={kTeal}>{labels.backspace}</button>
          <button type="button" onClick={onSpace} style={kSpace}>{labels.space}</button>
          <button type="button" onClick={onEnter} style={kGreen}>{labels.enter}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Emblem ───────────────────────────────────────────────────────────────────
function Emblem() {
  return (
    <div style={{ position: 'relative', display: 'flex', height: '42px', width: '42px', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <img 
        src="/logo.png" 
        alt="National Emblem of India" 
        title="National Emblem of India"
        style={{ height: '42px', width: '42px', objectFit: 'contain' }} 
      />
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return (
    <div style={{
      position: 'fixed', top: '74px', left: '50%', transform: 'translateX(-50%)',
      zIndex: 500, display: 'flex', alignItems: 'center', gap: '7px',
      whiteSpace: 'nowrap', borderRadius: '10px', padding: '7px 18px',
      fontSize: '0.74rem', fontWeight: 700, color: 'white', background: '#0e0d0b',
      boxShadow: '0 8px 32px rgba(14,13,11,.25)', animation: 'sj-toast-in .3s cubic-bezier(.4,0,.2,1) both',
    }}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1b8f99" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      {msg}
    </div>
  );
}

// ─── Helper: write value into a React-controlled input ────────────────────────
function writeToInput(input: HTMLInputElement, value: string) {
  const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
  if (nativeSetter) nativeSetter.call(input, value);
  else input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

// ─── AuthLayout ───────────────────────────────────────────────────────────────
export default function AuthLayout({ children, title }: { children: ReactNode; title?: ReactNode }) {
  const { time, date } = useClock();
  const { msg: toastMsg, show: showToast } = useToast();

  const [activeLang, setActiveLang] = useState<LanguageCode>('en');
  const [seniorMode, setSeniorMode] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [chatBotOpen, setChatBotOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [activeInput, setActiveInput] = useState<HTMLInputElement | null>(null);
  const [keyboardInput, setKeyboardInput] = useState('');

  // Stable ref so callbacks always see latest input without stale closures
  const activeInputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => { activeInputRef.current = activeInput; }, [activeInput]);

  useEffect(() => {
    const lang = localStorage.getItem('sj-lang') as LanguageCode | null;
    if (lang && LANGUAGES.some(l => l.code === lang)) { setActiveLang(lang); document.documentElement.lang = lang; }
    const sm = localStorage.getItem('sj-senior-mode') === '1';
    setSeniorMode(sm);
    document.documentElement.classList.toggle('sj-senior-mode', sm);
  }, []);

  const toggleSeniorMode = useCallback(() => {
    setSeniorMode(prev => {
      const next = !prev;
      localStorage.setItem('sj-senior-mode', next ? '1' : '0');
      document.documentElement.classList.toggle('sj-senior-mode', next);
      showToast(next ? 'Senior mode enabled' : 'Senior mode disabled');
      return next;
    });
  }, [showToast]);

  const onLangChange = useCallback((code: LanguageCode) => {
    setActiveLang(code);
    localStorage.setItem('sj-lang', code);
    document.documentElement.lang = code;
    showToast(`Language — ${LANGUAGES.find(l => l.code === code)?.label}`);
    
    // Google translate hack to trigger change without reload
    setTimeout(() => {
      const selectElement = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
      if (selectElement) {
        selectElement.value = code;
        selectElement.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
      }
    }, 50);
  }, [showToast]);

  const t = useCallback((key: I18nKey) => I18N[activeLang]?.[key] ?? I18N.en?.[key] ?? I18N.hi?.[key] ?? key, [activeLang]);

  // ── Virtual keyboard: click handlers ─────────────────────────────────────
  const handleVirtualKey = useCallback((ch: string) => {
    const inp = activeInputRef.current;
    if (!inp) return;
    const newVal = inp.value + ch;
    writeToInput(inp, newVal);
    setKeyboardInput(newVal);
  }, []);

  const handleBackspace = useCallback(() => {
    const inp = activeInputRef.current;
    if (!inp || !inp.value.length) return;
    const newVal = inp.value.slice(0, -1);
    writeToInput(inp, newVal);
    setKeyboardInput(newVal);
  }, []);

  const handleSpace  = useCallback(() => handleVirtualKey(' '), [handleVirtualKey]);

  const handleEnter  = useCallback(() => {
    const inp = activeInputRef.current;
    setKeyboardOpen(false);
    setActiveInput(null);
    setKeyboardInput('');
    if (inp) {
      const form = inp.closest('form');
      if (form) form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    }
  }, []);

  const handleClear = useCallback(() => {
    const inp = activeInputRef.current;
    if (!inp) return;
    writeToInput(inp, '');
    setKeyboardInput('');
  }, []);

  const closeKeyboard = useCallback(() => { setKeyboardOpen(false); setActiveInput(null); setKeyboardInput(''); }, []);

  const openKeyboard = useCallback((input: HTMLInputElement) => {
    setActiveInput(input);
    setKeyboardInput(input.value);
    setKeyboardOpen(true);
    // Focus the real input so physical keyboard natively types into it
    input.focus();
  }, []);

  // ── Physical keyboard: sync preview + Escape ──────────────────────────────
  // We do NOT intercept keystrokes — the browser types natively into the focused input.
  // We only listen on 'input' events to sync our preview, and on 'keydown' for Escape.
  useEffect(() => {
    if (!keyboardOpen || !activeInput) return;

    const syncPreview = () => setKeyboardInput(activeInput.value);
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); closeKeyboard(); }
    };

    activeInput.addEventListener('input', syncPreview);
    document.addEventListener('keydown', handleEsc);

    return () => {
      activeInput.removeEventListener('input', syncPreview);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [keyboardOpen, activeInput, closeKeyboard]);

  // ── Expose to child components ────────────────────────────────────────────
  useEffect(() => {
    (window as any).openVirtualKeyboard  = openKeyboard;
    (window as any).closeVirtualKeyboard = closeKeyboard;
    (window as any).isVirtualKeyboardOpen = () => keyboardOpen;
    return () => {
      delete (window as any).openVirtualKeyboard;
      delete (window as any).closeVirtualKeyboard;
      delete (window as any).isVirtualKeyboardOpen;
    };
  }, [openKeyboard, closeKeyboard, keyboardOpen]);

  const HEADER_H = 62;
  const FOOTER_H = 50;
  const KBD_H = keyboardOpen ? 152 : 0;

  return (
    <AuthI18nContext.Provider value={{ lang: activeLang, t }}>
      {/* ── Global CSS ── */}
      <style>{`
        @keyframes sj-emblem-spin { to { transform: rotate(360deg); } }
        @keyframes sj-toast-in { from { opacity:0; transform:translateX(-50%) translateY(-6px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
        *, *::before, *::after { box-sizing: border-box; }
        html, body { 
          overflow: hidden !important; 
          height: 100vh !important; 
          width: 100vw !important; 
          margin: 0 !important; 
          padding: 0 !important; 
          touch-action: manipulation;
        }
        .sj-input:focus { outline:none; border-color:#cc5500 !important; box-shadow:0 0 0 2px rgba(204,85,0,.13) !important; }
        .sj-input-teal:focus { outline:none; border-color:#0e5e65 !important; box-shadow:0 0 0 2px rgba(14,94,101,.13) !important; }

        /* Senior mode */
        .sj-senior-mode .sj-form-input  { height:38px !important; font-size:0.9rem !important; }
        .sj-senior-mode .sj-form-label  { font-size:0.76rem !important; }
        .sj-senior-mode .sj-form-submit { height:40px !important; font-size:0.88rem !important; }
        .sj-senior-mode .sj-form-hint   { font-size:0.72rem !important; }
        .sj-senior-mode .sj-brand-title { font-size:1.4rem !important; }
        .sj-senior-mode .sj-brand-sub   { font-size:0.82rem !important; }
        .sj-senior-mode .sj-feat-title  { font-size:0.82rem !important; }
        .sj-senior-mode .sj-feat-desc   { font-size:0.7rem !important; }
      `}</style>

      {/* Backgrounds */}
      <div style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none', background:'radial-gradient(ellipse 60% 50% at 0% 0%, rgba(204,85,0,.08) 0%, transparent 60%), radial-gradient(ellipse 50% 60% at 100% 100%, rgba(14,94,101,.1) 0%, transparent 60%)' }} />
      <div style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none', opacity:0.28, backgroundImage:'linear-gradient(rgba(14,13,11,.028) 1px, transparent 1px), linear-gradient(90deg, rgba(14,13,11,.028) 1px, transparent 1px)', backgroundSize:'52px 52px' }} />

      {/* Root shell */}
      <a href="#main-content" className="skip-link" title="Skip to content">
        Skip to main content
      </a>
      <div style={{ position:'fixed', inset:0, zIndex:2, display:'flex', flexDirection:'column', height:'100vh', width:'100vw', overflow:'hidden' }}>

        <header style={{ flexShrink:0, height:`${HEADER_H}px`, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 22px', background:'rgba(255,255,255,.88)', backdropFilter:'blur(32px)', WebkitBackdropFilter:'blur(32px)', borderBottom:'1px solid rgba(14,13,11,.09)', zIndex:10 }} role="banner">
          <div className="flex items-center gap-3">
            <Link to="/" style={{ display:'flex', alignItems:'center', gap:'10px', textDecoration:'none' }} aria-label="Smart Janseva Home">
              <Emblem />
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                  <span style={{ fontSize:'1.08rem', fontWeight:800, fontFamily:"'Fraunces',serif", color:'#0e0d0b', letterSpacing:'-.01em' }}>Smart Janseva</span>
                  <span style={{ display:'inline-block', height:'12px', width:'1.5px', opacity:0.55, background:'#c8991e' }} />
                  <span style={{ fontSize:'0.85rem', fontWeight:600, color:'#7a7368' }}>Suvidha</span>
                </div>
                <div style={{ marginTop:'1px', fontSize:'0.55rem', fontWeight:700, textTransform:'uppercase', fontFamily:"'Noto Sans Devanagari',sans-serif", color:'#7a7368', letterSpacing:'.05em' }}>
                  स्मार्ट जनसेवा · नागरिक सेवा पोर्टल · Government of India
                </div>
              </div>
            </Link>
          </div>

          {/* Language Selector properly aligned to right alongside time */}
          <div className="flex items-center gap-4 ml-auto mr-0">
            <div
              className="flex items-center gap-2 rounded-[12px] px-2 py-1"
              style={{ background: '#f8f8f8', border: '1px solid rgba(14,13,11,.08)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7a7368" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              <select
                 value={activeLang}
                 onChange={(e) => onLangChange(e.target.value)}
                 className="py-1 text-[0.75rem] font-extrabold outline-none cursor-pointer bg-transparent"
                 style={{
                    color: '#0e0d0b',
                    fontFamily: "'Plus Jakarta Sans',sans-serif",
                 }}
                 aria-label="Select Language"
              >
                {LANGUAGES.map((l) => (
                   <option key={l.code} value={l.code} className="text-[#0e0d0b] font-bold">
                      {l.label}
                   </option>
                ))}
              </select>
            </div>

            <div className="h-8 w-px" style={{ background: 'rgba(14,13,11,.09)' }} />
            
            <div className="text-right">
              <div style={{ fontSize:'1.15rem', fontWeight:800, color:'#0e0d0b', letterSpacing:'-.02em', fontVariantNumeric:'tabular-nums', lineHeight:1 }}>{time}</div>
              <div style={{ marginTop:'2px', fontSize:'0.55rem', fontWeight:700, textTransform:'uppercase', color:'#7a7368', letterSpacing:'.06em' }}>{date}</div>
            </div>

            <button
              type="button"
              onClick={toggleSeniorMode}
              className="rounded-xl px-4 py-[10px] text-[0.72rem] font-extrabold transition-colors"
              style={{
                background: seniorMode ? '#0e0d0b' : '#f5f1ea',
                color: seniorMode ? 'white' : '#7a7368',
                border: '1.5px solid rgba(14,13,11,.09)',
                letterSpacing: '.04em',
              }}
            >
              {t('senior')}
            </button>
          </div>
        </header>

        {/* ── MAIN ── */}
        <main id="main-content" style={{
          flex:1, minHeight:0,
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          padding:'5px 10px',
          paddingBottom: keyboardOpen ? `${KBD_H + 5}px` : '5px',
          transition:'padding-bottom 0.22s ease',
          overflow:'hidden',
        }}>
          <div style={{ width:'100%', maxWidth:'1280px', height:'100%', display:'flex', flexDirection:'column', overflow:'hidden' }}>
            {title && (
              <div style={{ flexShrink:0, display:'flex', justifyContent:'center', marginBottom:'8px' }} className="sj-auth-header-title">
                <div style={{ position:'relative', overflow:'hidden', borderRadius:'11px', border:'1px solid rgba(14,13,11,.09)', background:'white', boxShadow:'0 2px 10px rgba(14,13,11,.07)', padding:'6px 18px', textAlign:'center', maxWidth:'500px' }}>
                  <div style={{ fontSize:'1.2rem', fontWeight:800, fontFamily:"'Fraunces',serif", letterSpacing:'-.03em', color:'#0e0d0b', lineHeight:1.1 }}>{title}</div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'5px', marginTop:'2px' }}>
                    <div style={{ height:'3px', width:'3px', borderRadius:'50%', background:'#cc5500' }} />
                    <p style={{ fontSize:'0.55rem', fontWeight:700, fontFamily:"'Noto Sans Devanagari',sans-serif", color:'#7a7368', letterSpacing:'.07em', margin:0 }}>24×7 · सरल · सुरक्षित · सुविधाजनक</p>
                    <div style={{ height:'3px', width:'3px', borderRadius:'50%', background:'#1b8f99' }} />
                  </div>
                </div>
              </div>
            )}
            <div style={{ flex:1, minHeight:0, display:'flex', alignItems:'center', justifyContent: 'center', overflow:'hidden' }}>
              {children}
            </div>
          </div>
        </main>

        {/* ── FOOTER ── */}
        <footer style={{ flexShrink:0, height:`${FOOTER_H}px`, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 22px', background:'rgba(255,255,255,.88)', backdropFilter:'blur(32px)', WebkitBackdropFilter:'blur(32px)', borderTop:'1px solid rgba(14,13,11,.09)', zIndex:10 }} role="contentinfo">
          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            {[{color:'#cc5500',label:'SECURE'},{color:'#1b8f99',label:'ENCRYPTED'},{color:'#c8991e',label:'DPDP ACT'}].map(({color,label}) => (
              <div key={label} style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                <div style={{ height:'6px', width:'6px', borderRadius:'50%', background:color }} />
                <span style={{ fontSize:'0.59rem', fontWeight:800, color:'#0e0d0b' }}>{label}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col items-center">
            <div style={{ fontSize:'0.55rem', fontWeight:700, color:'#7a7368' }}>© 2026 Smart Janseva Suvidha · Government of India</div>
            <div className="flex gap-3 mt-1">
              <Link to="/accessibility" style={{ fontSize:'0.5rem', fontWeight:700, color:'#1b8f99' }} className="hover:underline">Accessibility Statement</Link>
              <span style={{ fontSize:'0.5rem', color:'#7a7368' }}>|</span>
              <Link to="/sitemap" style={{ fontSize:'0.5rem', fontWeight:700, color:'#1b8f99' }} className="hover:underline">Sitemap</Link>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <VoiceAssistant 
              onSendMessage={(msg) => {
                setChatMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: msg }]);
                setChatBotOpen(true);
              }}
              onReceiveResponse={(msg) => {
                setChatMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: msg }]);
                setChatBotOpen(true);
              }}
            />
            <button
              type="button"
              className="rounded-xl px-4 py-[8px] text-[0.74rem] font-extrabold text-white"
              style={{
                background: 'linear-gradient(135deg,#0e5e65 0%,#1b8f99 100%)',
                boxShadow: '0 4px 18px rgba(14,94,101,.35)',
                animation: 'sj-ai-glow 3s ease-in-out infinite',
                fontFamily: "'Plus Jakarta Sans',sans-serif",
                whiteSpace: 'nowrap',
              }}
              onClick={() => setChatBotOpen(!chatBotOpen)}
            >
              AI सहायक
            </button>
          </div>
        </footer>
      </div>

      <ChatBot 
        open={chatBotOpen} 
        onClose={() => setChatBotOpen(false)} 
        messages={chatMessages}
        setMessages={setChatMessages}
      />

      <Toast msg={toastMsg} />

      <VirtualKeyboard
        open={keyboardOpen} onClose={closeKeyboard}
        onKey={handleVirtualKey} onBackspace={handleBackspace}
        onSpace={handleSpace} onEnter={handleEnter} onClear={handleClear}
        inputValue={keyboardInput} setInputValue={setKeyboardInput}
        labels={{ keyboard:t('keyboard'), close:t('close'), backspace:t('backspace'), space:t('space'), enter:t('enter'), clear:'CLR' }}
      />
    </AuthI18nContext.Provider>
  );
}