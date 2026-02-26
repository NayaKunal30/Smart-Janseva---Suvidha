import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import IntersectObserver from '@/components/common/IntersectObserver';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { RouteGuard } from '@/components/common/RouteGuard';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import Loader from '@/components/common/Loader';
import routes from './routes';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <RouteGuard>
            <IntersectObserver />
            <Suspense fallback={<Loader />}>
              <Routes>
                {routes.map((route, index) => (
                  <Route
                    key={index}
                    path={route.path}
                    element={route.element}
                  />
                ))}
                <Route path="*" element={<Navigate to="/404" replace />} />
              </Routes>
            </Suspense>
            <Toaster />
          </RouteGuard>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
