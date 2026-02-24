import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Bell, Menu, User, LogOut, LayoutDashboard, Receipt, FileText, Landmark, 
  BarChart3, UserCircle, Settings, Users, ClipboardList, ScrollText, Megaphone 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { getUnreadNotificationsCount } from '@/db/api';
import { useAccessibility } from '@/hooks/useAccessibility';
import SessionTimer from '@/components/common/SessionTimer';

const LANGUAGES = [
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

export function Header() {
  const { user, profile, signOut } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const { highContrast, screenReader, toggleHighContrast, toggleScreenReader } = useAccessibility();
  const [activeLang, setActiveLang] = useState(() => localStorage.getItem('sj-lang') || 'en');

  const onLangChange = (code: string) => {
    setActiveLang(code);
    localStorage.setItem('sj-lang', code);
    document.documentElement.lang = code;
    
    setTimeout(() => {
      const selectElement = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
      if (selectElement) {
        selectElement.value = code;
        selectElement.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
      }
    }, 50);
  };

  useEffect(() => {
    if (user) {
      getUnreadNotificationsCount(user.id).then(setUnreadCount);
    }
  }, [user]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-sidebar text-sidebar-foreground" role="banner">
      <a href="#main-content" className="skip-link" title="Skip to content">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
          <circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/><path d="M15 7l-3-3-3 3"/>
        </svg>
        Skip to main content
      </a>
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <a href="#main-content" className="flex items-center justify-center w-7 h-7 rounded-full bg-sidebar-accent/50 text-sidebar-foreground hover:bg-primary hover:text-primary-foreground transition-all" title="Skip to main content (WCAG 2.4.1)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"/><path d="M9 10h6"/><path d="M12 10v4"/><path d="M12 14v4M12 14l-3 4M12 14l3 4M9 10l-1-2M15 10l1-2"/>
            </svg>
          </a>
          <Sheet>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" aria-label="Open Navigation Menu">
                <Menu className="h-5 w-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0" aria-label="Main Navigation">
              <Sidebar />
            </SheetContent>
          </Sheet>
          
          <Link to="/" className="flex items-center gap-2" aria-label="Smart Janseva Home">
            <img 
              src="/logo.png" 
              alt="National Emblem of India" 
              title="National Emblem of India"
              className="h-8 w-8" 
            />
            <div>
              <div className="text-lg font-extrabold tracking-tight">SMART JANSEVA</div>
              <p className="text-[0.65rem] font-bold uppercase tracking-wider text-sidebar-foreground/70">Government of India</p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div
            className="hidden md:flex items-center gap-2 rounded-lg px-2 py-1 mr-2"
            style={{ background: 'var(--sidebar-accent)', border: '1px solid var(--sidebar-border)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            <select
               value={activeLang}
               onChange={(e) => onLangChange(e.target.value)}
               className="py-1 text-xs font-bold outline-none cursor-pointer bg-transparent text-foreground"
               aria-label="Select Language"
            >
              {LANGUAGES.map((l) => (
                 <option key={l.code} value={l.code} className="text-black font-bold">
                    {l.label}
                 </option>
              ))}
            </select>
          </div>

          {/* High Contrast Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleHighContrast}
            className={highContrast ? 'text-yellow-400 bg-black' : ''}
            aria-label="Toggle High Contrast"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 18a6 6 0 0 0 0-12v12z" fill="currentColor" fillOpacity={highContrast ? "1" : "0.2"} />
            </svg>
          </Button>

          {/* Screen Reader Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleScreenReader}
            className={screenReader ? 'text-primary' : ''}
            aria-label="Toggle Screen Reader"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 10s3-3 3-8" /><path d="M22 10s-3-3-3-8" /><path d="M14 15a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" /><path d="M2 22v-3a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v3" /><path d="M12 15V7" />
            </svg>
          </Button>

          <SessionTimer />

          <Link to="/notifications">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-secondary">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{(profile?.full_name ?? 'User') as string}</p>
                  <p className="text-xs text-muted-foreground">{String(profile?.email ?? profile?.phone ?? '')}</p>
                  <Badge variant="outline" className="w-fit text-xs">{String(profile?.role ?? 'citizen')}</Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile">Profile Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/notifications">Notifications</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

function Sidebar() {
  const { profile } = useAuth();
  const userRole = (profile?.role as string) || 'citizen';
  
  const citizenItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Bills', path: '/bills', icon: <Receipt size={18} /> },
    { name: 'Complaints', path: '/complaints', icon: <FileText size={18} /> },
    { name: 'Services', path: '/services', icon: <Landmark size={18} /> },
    { name: 'My Reports', path: '/my-reports', icon: <BarChart3 size={18} /> },
    { name: 'Profile', path: '/profile', icon: <UserCircle size={18} /> },
  ];

  const adminItems = [
    { name: 'Admin Dashboard', path: '/admin', icon: <Settings size={18} />, roles: ['admin', 'officer'] },
    { name: 'User Management', path: '/admin/users', icon: <Users size={18} />, roles: ['admin'] },
    { name: 'Manage Complaints', path: '/admin/complaints', icon: <ClipboardList size={18} />, roles: ['admin', 'officer'] },
    { name: 'Manage Services', path: '/admin/services', icon: <ScrollText size={18} />, roles: ['admin', 'officer'] },
    { name: 'Manage Broadcasts', path: '/admin/announcements', icon: <Megaphone size={18} />, roles: ['admin', 'officer'] },
  ];

  // Show citizen features only for citizens
  const showCitizenFeatures = userRole === 'citizen';
  // Show admin features for admin and officer
  const showAdminFeatures = ['admin', 'officer'].includes(userRole);

  return (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      <div className="p-4 border-b border-sidebar-border">
        <h2 className="font-semibold">Navigation</h2>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {showCitizenFeatures && citizenItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-accent transition-colors"
          >
            <div className="flex h-5 w-5 items-center justify-center text-muted-foreground">{item.icon}</div>
            <span className="text-sm font-semibold">{item.name}</span>
          </Link>
        ))}
        
        {!showCitizenFeatures && (
          <Link
            to="/dashboard"
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-accent transition-colors"
          >
            <div className="flex h-5 w-5 items-center justify-center text-muted-foreground"><LayoutDashboard size={18} /></div>
            <span className="text-sm font-semibold">Dashboard</span>
          </Link>
        )}
        
        {showAdminFeatures && (
          <>
            <div className="pt-4 pb-2">
              <h3 className="px-3 text-xs font-semibold text-sidebar-foreground/70 uppercase">Administration</h3>
            </div>
            {adminItems.map((item) => {
              if (item.roles && !item.roles.includes(userRole)) return null;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-accent transition-colors"
                >
                  <div className="flex h-5 w-5 items-center justify-center text-muted-foreground">{item.icon}</div>
                  <span className="text-sm font-semibold">{item.name}</span>
                </Link>
              );
            })}
          </>
        )}
      </nav>
    </div>
  );
}
