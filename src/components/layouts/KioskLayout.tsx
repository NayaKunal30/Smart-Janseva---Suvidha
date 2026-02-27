import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getUnreadNotificationsCount } from '@/db/api';
import { supabase } from '@/db/supabase';
import ChatBot, { ChatMessage } from '@/components/common/ChatBot';
import VoiceAssistant from '@/components/common/VoiceAssistant';
import { useAccessibility } from '@/hooks/useAccessibility';
import SessionTimer from '@/components/common/SessionTimer';
import { 
  LayoutDashboard, Receipt, FileText, Landmark, BarChart3, UserCircle, 
  Settings, Users, ClipboardList, ScrollText, FileStack, Megaphone 
} from 'lucide-react';

type LanguageCode = string;

type I18nKey =
  | 'select_service'
  | 'citizen_login'
  | 'new_registration'
  | 'track'
  | 'receipts'
  | 'help'
  | 'secure'
  | 'encrypted'
  | 'dpdp'
  | 'keyboard'
  | 'close'
  | 'backspace'
  | 'space'
  | 'enter'
  | 'no_services'
  | 'loading_services'
  | 'services_unavailable'
  | 'senior';

const I18N: Record<LanguageCode, Record<I18nKey, string>> = {
  en: {
    select_service: 'Select a Service to Begin',
    citizen_login: 'Citizen Login',
    new_registration: 'New Registration',
    track: 'Track',
    receipts: 'Receipts',
    help: 'Help',
    secure: 'Secure',
    encrypted: 'Encrypted',
    dpdp: 'DPDP Act',
    keyboard: 'Keyboard',
    close: 'Close',
    backspace: 'Backspace',
    space: 'Space',
    enter: 'Enter',
    no_services: 'No services found.',
    loading_services: 'Loading services…',
    services_unavailable: 'Services unavailable',
    senior: 'Senior',
  },
  hi: {
    select_service: 'सेवा चुनें',
    citizen_login: 'नागरिक लॉगिन',
    new_registration: 'नया पंजीकरण',
    track: 'स्थिति',
    receipts: 'रसीदें',
    help: 'सहायता',
    secure: 'सुरक्षित',
    encrypted: 'एन्क्रिप्टेड',
    dpdp: 'डीपीडीपी अधिनियम',
    keyboard: 'कीबोर्ड',
    close: 'बंद करें',
    backspace: 'बैकस्पेस',
    space: 'स्पेस',
    enter: 'एंटर',
    no_services: 'कोई सेवा नहीं मिली।',
    loading_services: 'सेवाएँ लोड हो रही हैं…',
    services_unavailable: 'सेवाएँ उपलब्ध नहीं हैं',
    senior: 'वरिष्ठ',
  },
  mr: {
    select_service: 'सेवा निवडा',
    citizen_login: 'नागरिक लॉगिन',
    new_registration: 'नवीन नोंदणी',
    track: 'स्थिती',
    receipts: 'पावत्या',
    help: 'मदत',
    secure: 'सुरक्षित',
    encrypted: 'एन्क्रिप्टेड',
    dpdp: 'डीपीडीपी कायदा',
    keyboard: 'कीबोर्ड',
    close: 'बंद',
    backspace: 'बॅकस्पेस',
    space: 'स्पेस',
    enter: 'एंटर',
    no_services: 'सेवा सापडली नाही.',
    loading_services: 'सेवा लोड होत आहेत…',
    services_unavailable: 'सेवा उपलब्ध नाहीत',
    senior: 'ज्येष्ठ',
  },
  ta: {
    select_service: 'சேவையை தேர்வு செய்யவும்',
    citizen_login: 'குடிமகன் உள்நுழைவு',
    new_registration: 'புதிய பதிவு',
    track: 'நிலை',
    receipts: 'ரசீதுகள்',
    help: 'உதவி',
    secure: 'பாதுகாப்பானது',
    encrypted: 'குறியாக்கம்',
    dpdp: 'DPDP சட்டம்',
    keyboard: 'விசைப்பலகை',
    close: 'மூடு',
    backspace: 'பின்செல்',
    space: 'இடைவெளி',
    enter: 'என்டர்',
    no_services: 'சேவைகள் கிடைக்கவில்லை.',
    loading_services: 'சேவைகள் ஏற்றப்படுகின்றன…',
    services_unavailable: 'சேவைகள் கிடைக்கவில்லை',
    senior: 'மூத்த',
  },
};

const KioskI18nContext = createContext<{
  lang: LanguageCode;
  t: (key: I18nKey) => string;
} | null>(null);

export function useKioskI18n() {
  const ctx = useContext(KioskI18nContext);
  if (!ctx) {
    return { lang: 'en', t: (k: I18nKey) => I18N.en?.[k] || I18N.hi?.[k] || I18N.mr?.[k] || k };
  }
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

function useClock() {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setTime(
        n.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      );
      setDate(
        n
          .toLocaleDateString('en-IN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
          .toUpperCase(),
      );
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return { time, date };
}

function KioskKeyboard({
  open,
  onClose,
  onKey,
  onBackspace,
  onSpace,
  onEnter,
  labels,
}: {
  open: boolean;
  onClose: () => void;
  onKey: (ch: string) => void;
  onBackspace: () => void;
  onSpace: () => void;
  onEnter: () => void;
  labels: {
    keyboard: string;
    close: string;
    backspace: string;
    space: string;
    enter: string;
  };
}) {
  const [caps, setCaps] = useState(true);
  const [numMode, setNumMode] = useState(false);

  if (!open) return null;

  const rowS: React.CSSProperties = { display: 'flex', justifyContent: 'center', gap: '3px' };
  const keyBase: React.CSSProperties = {
    height: '32px', minWidth: '32px', borderRadius: '6px', fontSize: '0.75rem',
    fontWeight: 800, border: '1.5px solid rgba(14,13,11,.13)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '0 4px', userSelect: 'none', transition: 'all 0.1s',
    background: '#f8f8f8', color: '#0e0d0b',
  };

  const LETTER_ROWS = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M', '.', '@'],
  ];
  const NUMBER_ROW = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
  const SYMBOL_ROW = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+', '=', '-'];

  const handleChar = (ch: string) => {
    onKey(numMode ? ch : caps ? ch.toUpperCase() : ch.toLowerCase());
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[1000] pointer-events-none">
      <div
        className="mx-auto w-[560px] max-w-[98vw] rounded-t-[18px] p-3 pointer-events-auto"
        style={{
          background: 'rgba(255,255,255,.98)',
          border: '1.5px solid rgba(14,13,11,.12)',
          boxShadow: '0 -10px 40px rgba(14,13,11,.15)',
          backdropFilter: 'blur(25px)',
          WebkitBackdropFilter: 'blur(25px)',
        }}
      >
        <div className="mb-2.5 flex items-center justify-between px-1">
          <div className="text-[0.65rem] font-extrabold uppercase tracking-widest text-[#7a7368]">
            {labels.keyboard}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ background: '#f0ede8', border: '1.5px solid rgba(14,13,11,.09)' }}
            aria-label={labels.close}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7a7368" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="grid gap-1.5">
          {numMode ? (
            <>
              <div style={rowS}>
                {NUMBER_ROW.map(ch => (
                  <button key={ch} type="button" onClick={() => handleChar(ch)} style={keyBase}>{ch}</button>
                ))}
              </div>
              <div style={rowS}>
                {SYMBOL_ROW.slice(0, 7).map(ch => (
                  <button key={ch} type="button" onClick={() => handleChar(ch)} style={keyBase}>{ch}</button>
                ))}
              </div>
              <div style={rowS}>
                {SYMBOL_ROW.slice(7).map(ch => (
                  <button key={ch} type="button" onClick={() => handleChar(ch)} style={keyBase}>{ch}</button>
                ))}
              </div>
            </>
          ) : (
            LETTER_ROWS.map((row, idx) => (
              <div key={idx} style={rowS}>
                {row.map(ch => (
                  <button key={ch} type="button" onClick={() => handleChar(ch)} style={keyBase}>{ch}</button>
                ))}
              </div>
            ))
          )}

          <div className="mt-1 flex items-center justify-center gap-1.5 px-2">
            <button
              type="button"
              onClick={() => setNumMode(!numMode)}
              style={{ ...keyBase, minWidth: '50px', background: numMode ? '#0e0d0b' : '#eceae5', color: numMode ? 'white' : '#0e0d0b' }}
            >
              {numMode ? 'ABC' : '123'}
            </button>
            {!numMode && (
              <button
                type="button"
                onClick={() => setCaps(!caps)}
                style={{ ...keyBase, minWidth: '50px', background: caps ? '#0e0d0b' : '#eceae5', color: caps ? 'white' : '#0e0d0b' }}
              >
                ⇧
              </button>
            )}
            <button
              type="button"
              onClick={onBackspace}
              style={{ ...keyBase, flex: 1, background: '#fef2f2', border: '1.5px solid #fecaca', color: '#dc2626' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><line x1="18" y1="9" x2="12" y2="15"/><line x1="12" y1="9" x2="18" y2="15"/>
              </svg>
            </button>
            <button
              type="button"
              onClick={onSpace}
              style={{ ...keyBase, flex: 2.5, minWidth: '140px' }}
            >
              {labels.space}
            </button>
            <button
              type="button"
              onClick={onEnter}
              style={{ ...keyBase, minWidth: '80px', background: 'linear-gradient(135deg,#cc5500 0%,#c8991e 100%)', border: 'none', color: 'white' }}
            >
              {labels.enter}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((message: string) => {
    setMsg(message);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setMsg(null), 2800);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { msg, show };
}

function Emblem() {
  return (
    <div className="relative flex h-[50px] w-[50px] items-center justify-center">
      <img 
        src="/logo.png" 
        alt="National Emblem of India" 
        title="National Emblem of India"
        style={{ height: '50px', width: '50px', objectFit: 'contain' }} 
      />
    </div>
  );
}

function Toast({ msg }: { msg: string | null }) {
  if (!msg) return null;

  return (
    <div
      className="fixed bottom-[90px] left-1/2 z-[1000] flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-[14px] px-6 py-3 text-[0.82rem] font-bold text-white"
      style={{
        background: '#0e0d0b',
        boxShadow: '0 16px 56px rgba(14,13,11,.25)',
        animation: 'sj-toast-in .3s cubic-bezier(.4,0,.2,1) both',
      }}
    >
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#1b8f99"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
      {msg}
    </div>
  );
}

function SearchInput({
  value,
  onChange,
  onSubmit,
  onFocusK,
  onFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onFocusK: () => void;
  onFocus: () => void;
}) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute left-[15px] top-1/2 -translate-y-1/2">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#7a7368"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>
      <input
        type="text"
        placeholder="Search services"
        onFocus={() => {
          onFocusK();
          onFocus();
        }}
        value={value}
        data-sj-search="1"
        className="w-full rounded-[14px] border-2 bg-white py-[15px] pl-12 pr-[52px] text-[0.92rem] font-bold outline-none"
        style={{ borderColor: 'rgba(14,13,11,.09)', color: '#0e0d0b' }}
        onBlur={(e) => {
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.borderColor = 'rgba(14,13,11,.09)';
        }}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onSubmit();
          }
        }}
      />

      <button
        type="button"
        onClick={onSubmit}
        className="absolute right-[10px] top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-[10px]"
        style={{ background: '#f5f1ea', border: '1.5px solid rgba(14,13,11,.09)' }}
        aria-label="Search"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#7a7368"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>
      <span
        className="pointer-events-none absolute right-[56px] top-1/2 -translate-y-1/2 rounded-md px-[8px] py-[3px] text-[0.6rem] font-extrabold"
        style={{
          color: '#7a7368',
          background: '#f5f1ea',
          border: '1.5px solid rgba(14,13,11,.09)',
          letterSpacing: '.06em',
        }}
      >
        ⌘K
      </span>
    </div>
  );
}

function NavList() {
  const location = useLocation();
  const { profile } = useAuth();

  const userRole = (profile?.role as string) || 'citizen';
  const showCitizenFeatures = userRole === 'citizen';
  const showAdminFeatures = ['admin', 'officer'].includes(userRole);

  const citizenItems = useMemo(
    () => [
      { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={22} /> },
      { name: 'Bills', path: '/bills', icon: <Receipt size={22} /> },
      { name: 'Complaints', path: '/complaints', icon: <FileText size={22} /> },
      { name: 'Services', path: '/services', icon: <Landmark size={22} /> },
      { name: 'My Reports', path: '/my-reports', icon: <BarChart3 size={22} /> },
      { name: 'Profile', path: '/profile', icon: <UserCircle size={22} /> },
    ],
    [],
  );

  const adminItems = useMemo(
    () => [
      { name: 'Admin Dashboard', path: '/admin', icon: <Settings size={22} />, roles: ['admin', 'officer'] },
      { name: 'User Management', path: '/admin/users', icon: <Users size={22} />, roles: ['admin'] },
      { name: 'Manage Complaints', path: '/admin/complaints', icon: <ClipboardList size={22} />, roles: ['admin', 'officer'] },
      { name: 'Manage Services', path: '/admin/services', icon: <ScrollText size={22} />, roles: ['admin', 'officer'] },
      { name: 'Manage Bills', path: '/admin/bills', icon: <FileStack size={22} />, roles: ['admin'] },
      { name: 'Manage Broadcasts', path: '/admin/announcements', icon: <Megaphone size={22} />, roles: ['admin', 'officer'] },
    ],
    [],
  );

  const items = useMemo(() => {
    const out: { name: string; path: string; icon: ReactNode; roles?: string[] }[] = [];

    if (showCitizenFeatures) out.push(...citizenItems);

    if (showAdminFeatures) {
      out.push(...adminItems.filter((i) => !i.roles || i.roles.includes(userRole)));
    }

    return out;
  }, [adminItems, citizenItems, showAdminFeatures, showCitizenFeatures, userRole]);

  return (
    <nav className="flex-1 overflow-hidden pr-1">
      <div className="grid gap-2">
        {items.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center gap-3 rounded-[14px] px-4 py-3 text-[0.9rem] font-extrabold transition-colors"
              style={{
                background: active ? '#0e0d0b' : 'transparent',
                color: active ? 'white' : '#0e0d0b',
                border: active ? '1.5px solid #0e0d0b' : '1.5px solid rgba(14,13,11,.09)',
              }}
            >
              <div className="flex h-5 w-5 items-center justify-center" aria-hidden>
                {item.icon}
              </div>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default function KioskLayout({
  children,
  title,
}: {
  children: ReactNode;
  title?: ReactNode;
}) {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { time, date } = useClock();
  const { msg: toastMsg, show: showToast } = useToast();

  const [activeLang, setActiveLang] = useState<LanguageCode>('en');
  const [unreadCount, setUnreadCount] = useState(0);
  const { highContrast, screenReader, seniorMode, toggleHighContrast, toggleScreenReader, toggleSeniorMode } = useAccessibility();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [services, setServices] = useState<{ id: string; name: string; description: string; is_active?: boolean | null }[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState<string | null>(null);
  const [chatBotOpen, setChatBotOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const searchWrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!searchWrapRef.current) return;
      const target = e.target as Node;
      if (!searchWrapRef.current.contains(target)) {
        setSearchOpen(false);
      }
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, []);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      try {
        setServicesLoading(true);
        setServicesError(null);

        const { data, error } = await supabase
          .from('service_types')
          .select('id,name,description,is_active')
          .order('name');

        if (!alive) return;

        if (error) {
          console.error('Failed to load services for search:', error);
          setServices([]);
          if (error.code === 'PGRST116' || error.message?.includes('not found') || error.message?.includes('404')) {
            setServicesError('Services table missing. Run migrations.');
          } else {
            setServicesError(error.message || 'Failed to load services');
          }
          return;
        }

        const cleaned = ((data || []) as any[]).filter((s) => s && s.id && s.name);
        setServices(cleaned as any);
      } catch (e: any) {
        if (!alive) return;
        console.error('Failed to load services for search:', e);
        setServices([]);
        setServicesError(String(e?.message || e || 'Failed to load services'));
      } finally {
        if (!alive) return;
        setServicesLoading(false);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, []);

  const normalize = useCallback((s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ''), []);

  const filteredServices = useMemo(() => {
    const qRaw = searchTerm.trim();
    const q = normalize(qRaw);

    const activeOnly = services.filter((s) => s.is_active !== false);

    const base = q
      ? activeOnly.filter((s) => {
          const n = normalize(String(s.name || ''));
          const d = normalize(String(s.description || ''));
          return n.includes(q) || d.includes(q);
        })
      : activeOnly;

    return base.slice(0, 40);
  }, [normalize, searchTerm, services]);

  const openService = useCallback(
    (serviceId: string) => {
      const target = `/services/${serviceId}/apply`;
      if (!user) {
        navigate('/login', { state: { from: target } });
        return;
      }
      navigate(target);
    },
    [navigate, user],
  );

  useEffect(() => {
    const storedLang = localStorage.getItem('sj-lang') as LanguageCode | null;
    if (storedLang && LANGUAGES.some((l) => l.code === storedLang)) {
      setActiveLang(storedLang);
      document.documentElement.lang = storedLang;
    }
  }, []);

  const handleToggleSenior = useCallback(() => {
    const next = toggleSeniorMode();
    showToast(next ? 'Senior citizen mode enabled' : 'Senior citizen mode disabled');
  }, [toggleSeniorMode, showToast]);

  useEffect(() => {
    if (user) {
      const fetchCount = () => {
        getUnreadNotificationsCount(user.id).then(setUnreadCount).catch(() => setUnreadCount(0));
      };
      
      fetchCount();

      // Custom event for when user manually clears notifications via Notifications page
      window.addEventListener('sj-notif-change', fetchCount);

      // Setup realtime listener for new notifications to update badge and play sound
      const channel = supabase.channel('realtime:notifications')
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, 
          (payload) => {
            fetchCount();
            // Play notification sound
            try {
              const audio = new Audio('/notification.mp3');
              audio.play().catch(console.error);
            } catch (e) {
              console.error('Audio play failed', e);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
        window.removeEventListener('sj-notif-change', fetchCount);
      };

    } else {
      setUnreadCount(0);
    }
  }, [user]);

  const onLangChange = useCallback(
    (code: string) => {
      setActiveLang(code);
      localStorage.setItem('sj-lang', code);
      document.documentElement.lang = code;

      // Google translate hack to trigger change without reload
      setTimeout(() => {
        const selectElement = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
        if (selectElement) {
          selectElement.value = code;
          selectElement.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
        }
      }, 50);

      const lang = LANGUAGES.find((l) => l.code === code);
      showToast(`Language switched — ${lang?.label}`);
    },
    [showToast],
  );

  const t = useCallback((key: I18nKey) => I18N[activeLang]?.[key] ?? I18N.en[key], [activeLang]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const el = document.querySelector('input[data-sj-search="1"]') as HTMLInputElement | null;
        el?.focus();
        el?.select();
        setSearchOpen(true);
        setKeyboardOpen(true);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <KioskI18nContext.Provider value={{ lang: activeLang, t }}>
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 0% 0%, rgba(204,85,0,.1) 0%, transparent 60%), radial-gradient(ellipse 50% 60% at 100% 100%, rgba(14,94,101,.12) 0%, transparent 60%), radial-gradient(ellipse 80% 80% at 50% 50%, rgba(168,120,32,.05) 0%, transparent 55%)',
        }}
      />
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(rgba(14,13,11,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(14,13,11,.025) 1px, transparent 1px)',
          backgroundSize: '52px 52px',
        }}
      />

      <a href="#main-content" className="skip-link" title="Skip to content">
        Skip to main content
      </a>
      <div className="relative z-[2] grid h-screen w-screen grid-rows-[80px_1fr_72px] overflow-hidden">
        <header
          className="relative z-10 flex h-[80px] items-center justify-between px-10"
          role="banner"
          style={{
            background: 'rgba(255,255,255,.75)',
            backdropFilter: 'blur(32px)',
            WebkitBackdropFilter: 'blur(32px)',
            borderBottom: '1px solid rgba(14,13,11,.09)',
          }}
        >
          <div className="flex items-center gap-5">
            <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-[14px]" aria-label="Smart Janseva Home" title="National Emblem of India">
              <Emblem />
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="text-[1.28rem] font-extrabold"
                    style={{ fontFamily: "'Fraunces',serif", color: '#0e0d0b', letterSpacing: '-.01em' }}
                  >
                    Smart Janseva
                  </span>
                  <span className="inline-block h-4 w-[1.5px] opacity-60" style={{ background: '#c8991e' }} aria-hidden="true" />
                  <span className="text-[1.05rem] font-semibold" style={{ color: '#7a7368' }}>
                    Suvidha
                  </span>
                </div>
                <div
                  className="mt-[2px] text-[0.65rem] font-bold uppercase"
                  style={{
                    fontFamily: "'Noto Sans Devanagari',sans-serif",
                    color: '#7a7368',
                    letterSpacing: '.06em',
                  }}
                >
                  स्मार्ट जनसेवा · नागरिक सेवा पोर्टल · Government of India
                </div>
              </div>
            </Link>
          </div>

          {/* Accessibility & Language Controls */}
          <div className="flex items-center gap-3 ml-auto mr-0">
            {/* High Contrast Toggle */}
            <button
              type="button"
              onClick={toggleHighContrast}
              className="group relative flex h-11 w-11 items-center justify-center rounded-xl transition-all"
              style={{ 
                background: highContrast ? '#60ff8033' : '#f5f1ea', 
                border: highContrast ? '2.5px solid #60ff50' : '1.5px solid rgba(14,13,11,.09)' 
              }}
              title="High Contrast Mode"
              aria-label="Toggle High Contrast Mode"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={highContrast ? '#eeff00' : '#7a7368'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 18a6 6 0 0 0 0-12v12z" fill={highContrast ? '#eeff00' : 'currentColor'} fillOpacity={highContrast ? "1" : "0.2"} />
              </svg>
            </button>

            {/* Screen Reader Toggle */}
            <button
              type="button"
              onClick={toggleScreenReader}
              className="group relative flex h-11 w-11 items-center justify-center rounded-xl transition-all"
              style={{ 
                background: screenReader ? '#1b8f9922' : '#f5f1ea', 
                border: screenReader ? '2.5px solid #1b8f99' : '1.5px solid rgba(14,13,11,.09)' 
              }}
              title="Screen Reader"
              aria-label="Toggle Screen Reader focus-to-speech"
            >
              <img 
                src="/screen.png" 
                alt="Screen Reader" 
                style={{ width: '20px', height: '20px', objectFit: 'contain' }} 
              />
            </button>

            <div className="h-8 w-px" style={{ background: 'rgba(14,13,11,.09)' }} />

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
              <div
                className="text-[1.3rem] font-extrabold leading-none"
                style={{ color: '#0e0d0b', letterSpacing: '-.02em', fontVariantNumeric: 'tabular-nums' }}
              >
                {time}
              </div>
              <div
                className="mt-[2px] text-[0.6rem] font-bold uppercase"
                style={{ color: '#7a7368', letterSpacing: '.07em' }}
              >
                {date}
              </div>
            </div>
            <SessionTimer />
            <button
              type="button"
              onClick={handleToggleSenior}
              aria-label="Toggle Senior Citizen Mode"
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

            <button
              type="button"
              onClick={() => {
                if (!user) {
                  showToast('Please login to view notifications');
                  navigate('/login');
                  return;
                }
                navigate('/notifications');
              }}
              className="relative flex h-11 w-11 items-center justify-center rounded-xl"
              style={{ background: '#f5f1ea', border: '1.5px solid rgba(14,13,11,.09)' }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#7a7368"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
              {unreadCount > 0 && (
                <span
                  className="absolute -right-[6px] -top-[6px] flex items-center justify-center rounded-full px-1.5 min-w-[20px] h-[20px] text-[10px] font-black text-white shadow-md animate-bounce"
                  style={{
                    background: '#cc5500',
                    border: '2px solid #f5f1ea'
                  }}
                  title={`${unreadCount} New notifications`}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                if (!user) {
                  navigate('/login');
                  return;
                }
                navigate('/profile');
              }}
              className="flex h-11 w-11 items-center justify-center rounded-xl"
              style={{ background: '#f5f1ea', border: '1.5px solid rgba(14,13,11,.09)' }}
              aria-label="User profile"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#7a7368"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </button>
          </div>
        </header>

        <main id="main-content" className="grid min-h-0 grid-cols-[420px_1fr] overflow-hidden">
          <aside
            className="flex min-h-0 flex-col gap-6 overflow-y-auto px-7 py-8 scrollbar-hide"
            style={{
              borderRight: '1px solid rgba(14,13,11,.09)',
              background: 'rgba(255,255,255,.55)',
              backdropFilter: 'blur(20px)',
            }}
          >
            {(location.pathname === '/' || title) && (
              <div>
                <div
                  className="mb-3 flex items-center gap-[10px] text-[0.65rem] font-extrabold uppercase"
                  style={{ letterSpacing: '.2em', color: '#cc5500' }}
                >
                  <span className="inline-block h-[2.5px] w-[22px] rounded-sm" style={{ background: '#cc5500' }} />
                  Digital Governance Kiosk
                </div>

                {title ? (
                  <div className="text-[2.1rem] font-extrabold leading-[1.05]" style={{ fontFamily: "'Fraunces',serif" }}>
                    {title}
                  </div>
                ) : (
                  <div className="flex flex-col">
                    <h1
                      className="text-[2.6rem] font-extrabold leading-[1.05]"
                      style={{ 
                        fontFamily: "'Fraunces',serif", 
                        letterSpacing: '-.03em', 
                        color: '#0e0d0b',
                      }}
                    >
                      <span className="animate-typing-1 block overflow-hidden whitespace-nowrap border-r-4 border-transparent">
                        Citizen
                      </span>
                      <span
                        className="animate-typing-2 block overflow-hidden whitespace-nowrap border-r-4 border-transparent"
                        style={{
                          background:
                            'linear-gradient(135deg,#cc5500 0%,#c8991e 50%,#1b8f99 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                        }}
                      >
                        Services
                      </span>
                      <span className="animate-typing-3 block overflow-hidden whitespace-nowrap border-r-4 border-transparent">
                        At One Touch
                      </span>
                    </h1>
                  </div>
                )}

                <p
                  className="mt-2 text-[0.9rem] font-bold"
                  style={{ fontFamily: "'Noto Sans Devanagari',sans-serif", color: '#7a7368' }}
                >
                  24×7 · सरल · सुरक्षित · सुविधाजनक
                </p>
              </div>
            )}

            {user ? (
              <div className="flex flex-col gap-3">
                <div
                  className="rounded-2xl p-4"
                  style={{ background: '#f5f1ea', border: '1.5px solid rgba(14,13,11,.09)' }}
                >
                  <div className="text-[0.78rem] font-extrabold" style={{ color: '#0e0d0b', letterSpacing: '.02em' }}>
                    Signed in as
                  </div>
                  <div className="mt-1 text-[0.95rem] font-extrabold" style={{ color: '#0e0d0b' }}>
                    {(profile?.full_name ?? 'User') as string}
                  </div>
                  <div className="mt-1 text-[0.75rem] font-semibold" style={{ color: '#7a7368' }}>
                    {String(profile?.email ?? profile?.phone ?? '')}
                  </div>
                </div>

                <NavList />

                <button
                  type="button"
                  onClick={async () => {
                    await signOut();
                    showToast('Signed out');
                    navigate('/');
                  }}
                  className="rounded-2xl px-5 py-4 text-left text-[0.95rem] font-extrabold transition-all"
                  style={{
                    border: '2px solid rgba(168,40,40,.25)',
                    color: '#a82828',
                    background: 'transparent',
                  }}
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="flex items-center gap-4 rounded-2xl px-[22px] py-[16px] text-left text-[1rem] font-extrabold text-white transition-all"
                  style={{
                    background: 'linear-gradient(135deg,#cc5500 0%,#c8991e 100%)',
                    boxShadow: '0 6px 28px rgba(204,85,0,.4)',
                    fontFamily: "'Plus Jakarta Sans',sans-serif",
                  }}
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-[10px]"
                    style={{ background: 'rgba(255,255,255,.2)' }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                  </div>
                  <div>
                    <span className="block text-[0.97rem] font-extrabold">Citizen Login</span>
                    <span className="mt-[1px] block text-[0.68rem] font-semibold opacity-75" style={{ letterSpacing: '.03em' }}>
                      Email · Mobile OTP
                    </span>
                  </div>
                </button>

                <div
                  className="flex items-center justify-center gap-[10px] text-[0.68rem] font-bold uppercase"
                  style={{ color: '#7a7368', letterSpacing: '.1em' }}
                >
                  <span>{t('secure')}</span>
                  <span
                    className="inline-block h-1 w-1 rounded-full"
                    style={{ background: 'rgba(14,13,11,.15)' }}
                  />
                  <span>{t('encrypted')}</span>
                  <span
                    className="inline-block h-1 w-1 rounded-full"
                    style={{ background: 'rgba(14,13,11,.15)' }}
                  />
                  <span>{t('dpdp')}</span>
                </div>
              </div>
            )}
          </aside>

          <section className="flex min-h-0 flex-col overflow-hidden px-7 py-4">
            <div
              className="flex items-center gap-3 text-[0.63rem] font-extrabold uppercase"
              style={{ color: '#7a7368', letterSpacing: '.2em' }}
            >
              {t('select_service')}
              <span className="h-px flex-1" style={{ background: 'rgba(14,13,11,.09)' }} />
              <div className="relative w-[420px] max-w-[42vw]" ref={searchWrapRef}>
                <SearchInput
                  value={searchTerm}
                  onChange={(v) => {
                    setSearchTerm(v);
                    setSearchOpen(true);
                  }}
                  onSubmit={() => {
                    if (filteredServices.length === 1) {
                      openService(filteredServices[0].id);
                      setSearchOpen(false);
                      return;
                    }
                    setSearchOpen(true);
                  }}
                  onFocus={() => {
                    setSearchOpen(true);
                    setKeyboardOpen(true);
                  }}
                  onFocusK={() => {
                    const el = document.querySelector('input[data-sj-search="1"]') as HTMLInputElement | null;
                    if (el) {
                      el.style.borderColor = '#1b8f99';
                      el.style.boxShadow = '0 0 0 4px rgba(27,143,153,.14)';
                    }
                  }}
                />

                {searchOpen && (
                  <div
                    className="absolute left-0 right-0 top-[58px] z-[1100] overflow-hidden rounded-2xl"
                    style={{
                      background: 'white',
                      border: '1.5px solid rgba(14,13,11,.09)',
                      boxShadow: '0 22px 60px rgba(14,13,11,.18)',
                    }}
                  >
                    <div className="p-2">
                      {servicesLoading ? (
                        <div className="rounded-xl p-4 text-[0.8rem] font-bold" style={{ color: '#7a7368' }}>
                          {t('loading_services')}
                        </div>
                      ) : servicesError ? (
                        <div className="rounded-xl p-4 text-[0.8rem] font-bold" style={{ color: '#7a7368' }}>
                          {t('services_unavailable')}
                          <div className="mt-2 text-[0.72rem] font-semibold" style={{ color: '#7a7368' }}>
                            {servicesError}
                          </div>
                        </div>
                      ) : filteredServices.length > 0 ? (
                        <div className="grid gap-2">
                          {filteredServices.map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => {
                                openService(s.id);
                                setSearchOpen(false);
                              }}
                              className="w-full rounded-xl px-4 py-3 text-left"
                              style={{
                                background: '#f5f1ea',
                                border: '1.5px solid rgba(14,13,11,.09)',
                              }}
                            >
                              <div className="text-[0.92rem] font-extrabold" style={{ color: '#0e0d0b' }}>
                                {s.name}
                              </div>
                              <div className="mt-1 line-clamp-1 text-[0.72rem] font-semibold" style={{ color: '#7a7368' }}>
                                {s.description}
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-xl p-4 text-[0.8rem] font-bold" style={{ color: '#7a7368' }}>
                          {t('no_services')}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div
              className="mt-4 flex-1 overflow-y-auto rounded-2xl p-5 scrollbar-hide"
              style={{
                background: 'rgba(255,255,255,.75)',
                border: '1.5px solid rgba(14,13,11,.09)',
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
              }}
            >
              <div className="min-h-full w-full">{children}</div>
            </div>
          </section>
        </main>

        <footer
          className="relative z-10 flex h-[72px] items-center justify-between gap-5 px-10"
          style={{
            background: 'rgba(255,255,255,.8)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderTop: '1px solid rgba(14,13,11,.09)',
          }}
        >
          <div className="flex items-center gap-2">
            {(
              user
                ? [
                    { id: 'track', label: t('track'), href: '/my-reports' },
                    { id: 'receipt', label: t('receipts'), href: '/bills' },
                    { id: 'help', label: t('help'), href: '/services' },
                  ]
                : [
                    { id: 'track', label: t('track'), href: '/login' },
                    { id: 'help', label: t('help'), href: '/services' },
                  ]
            ).map((qa) => (
              <Link
                key={qa.id}
                to={qa.href}
                className="rounded-xl px-4 py-[10px] text-[0.72rem] font-extrabold transition-colors"
                style={{
                  background: '#f5f1ea',
                  border: '1.5px solid rgba(14,13,11,.09)',
                  color: '#7a7368',
                }}
              >
                {qa.label}
              </Link>
            ))}
          </div>

          <div className="min-w-0 flex-1 text-center">
            <div className="text-[0.68rem] font-bold" style={{ color: '#7a7368' }}>
              © 2026 Ministry of Electronics & IT, Government of India
            </div>
            <div className="mt-1 flex justify-center gap-4">
              <Link to="/accessibility" className="text-[0.6rem] font-extrabold text-[#116d75] hover:underline">Accessibility Statement</Link>
              <Link to="/sitemap" className="text-[0.6rem] font-extrabold text-[#116d75] hover:underline">Sitemap</Link>
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
              className="rounded-xl px-5 py-[10px] text-[0.74rem] font-extrabold text-white"
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

      <KioskKeyboard
        open={keyboardOpen}
        onClose={() => setKeyboardOpen(false)}
        onKey={(ch) => {
          setSearchTerm((p) => p + ch);
          setSearchOpen(true);
        }}
        onBackspace={() => {
          setSearchTerm((p) => p.slice(0, -1));
          setSearchOpen(true);
        }}
        onSpace={() => {
          setSearchTerm((p) => (p ? p + ' ' : p));
          setSearchOpen(true);
        }}
        onEnter={() => {
          if (filteredServices.length === 1) {
            openService(filteredServices[0].id);
            setSearchOpen(false);
          } else {
            setSearchOpen(true);
          }
        }}
        labels={{
          keyboard: t('keyboard'),
          close: t('close'),
          backspace: t('backspace'),
          space: t('space'),
          enter: t('enter'),
        }}
      />
      <style>{`
        html, body {
          overflow: hidden !important;
          height: 100vh !important;
          width: 100vw !important;
          margin: 0 !important;
          padding: 0 !important;
          touch-action: manipulation;
        }
        @keyframes sj-typing {
          from { width: 0 }
          to { width: 100% }
        }
        @keyframes sj-blink {
          from, to { border-color: transparent }
          50% { border-color: #cc5500; }
        }
        .animate-typing-1 {
          width: 0;
          animation: sj-typing 1s steps(15) forwards, sj-blink .7s step-end 2;
        }
        .animate-typing-2 {
          width: 0;
          animation: sj-typing 1.2s steps(15) 1s forwards, sj-blink .7s step-end 1s 2;
        }
        .animate-typing-3 {
          width: 0;
          animation: sj-typing 1.5s steps(20) 2.2s forwards, sj-blink .7s step-end 2.2s infinite;
        }
      `}</style>
    </KioskI18nContext.Provider>
  );
}
