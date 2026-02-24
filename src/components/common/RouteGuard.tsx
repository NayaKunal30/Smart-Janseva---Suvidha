import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface RouteGuardProps {
  children: React.ReactNode;
}

// Public routes that can be accessed without logging in
const PUBLIC_ROUTES = ['/login', '/register', '/403', '/404', '/', '/debug'];

// Admin-only routes
const ADMIN_ROUTES = ['/admin', '/admin/*'];

// Officer and Admin routes
const OFFICER_ROUTES = ['/admin/complaints', '/admin/services', '/admin/users'];

function matchRoute(path: string, patterns: string[]) {
  return patterns.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
      return regex.test(path);
    }
    return path === pattern;
  });
}

export function RouteGuard({ children }: RouteGuardProps) {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Don't do anything while loading
    if (loading) return;

    const isPublic = matchRoute(location.pathname, PUBLIC_ROUTES);
    const isAdminRoute = matchRoute(location.pathname, ADMIN_ROUTES);
    const isOfficerRoute = matchRoute(location.pathname, OFFICER_ROUTES);

    // Redirect to login if not authenticated and trying to access protected route
    if (!user && !isPublic) {
      navigate('/login', { state: { from: location.pathname }, replace: true });
      return;
    }

    // Redirect authenticated users from home to dashboard
    if (user && location.pathname === '/') {
      navigate('/dashboard', { replace: true });
      return;
    }

    // Check role-based access
    if (user && profile) {
      if (isAdminRoute && profile.role !== 'admin' && profile.role !== 'officer') {
        navigate('/403', { replace: true });
        return;
      }

      if (isOfficerRoute && !['officer', 'admin'].includes(profile.role as string)) {
        navigate('/403', { replace: true });
        return;
      }
    }
  }, [user, profile, loading, location.pathname, navigate]);

  // Show loading screen only briefly
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading SMART JANSEVA...</p>
          <p className="text-xs text-muted-foreground">If this takes too long, please refresh the page</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}