import { useEffect, useState } from 'react';
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

export default function Debug() {
  const { user, profile, loading } = useAuth();
  const [dbTest, setDbTest] = useState<any>(null);
  const [envVars, setEnvVars] = useState<any>({});

  useEffect(() => {
    // Test database connection
    const testDb = async () => {
      try {
        const { error, count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        setDbTest({ success: !error, count, error: error?.message });
      } catch (err: any) {
        setDbTest({ success: false, error: err.message });
      }
    };
    testDb();

    // Check environment variables
    setEnvVars({
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing',
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
      MODE: import.meta.env.MODE,
      DEV: import.meta.env.DEV,
    });
  }, []);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Debug Information</h1>
          <p className="text-muted-foreground">System status and diagnostics</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Authentication Status</CardTitle>
            <CardDescription>Current user and auth state</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="font-medium">Loading:</div>
              <div>{loading ? '✅ Yes' : '❌ No'}</div>
              
              <div className="font-medium">User Logged In:</div>
              <div>{user ? '✅ Yes' : '❌ No'}</div>
              
              <div className="font-medium">User ID:</div>
              <div className="font-mono text-xs">{user?.id || 'N/A'}</div>
              
              <div className="font-medium">Profile Loaded:</div>
              <div>{profile ? '✅ Yes' : '❌ No'}</div>
              
              <div className="font-medium">User Role:</div>
              <div>{(profile?.role as string) || 'N/A'}</div>
              
              <div className="font-medium">User Name:</div>
              <div>{(profile?.full_name as string) || 'N/A'}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Database Connection</CardTitle>
            <CardDescription>Supabase connectivity test</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="font-medium">Connection Status:</div>
              <div>{dbTest?.success ? '✅ Connected' : '❌ Failed'}</div>
              
              {dbTest?.error && (
                <>
                  <div className="font-medium">Error:</div>
                  <div className="text-destructive text-xs">{dbTest.error}</div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Environment Variables</CardTitle>
            <CardDescription>Configuration status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(envVars).map(([key, value]) => (
                <React.Fragment key={key}>
                  <div className="font-medium">{key}:</div>
                  <div>{String(value)}</div>
                </React.Fragment>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Navigate to different pages</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Link to="/">
              <Button variant="outline">Home</Button>
            </Link>
            <Link to="/login">
              <Button variant="outline">Login</Button>
            </Link>
            <Link to="/register">
              <Button variant="outline">Register</Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="outline">Dashboard</Button>
            </Link>
            <Link to="/bills">
              <Button variant="outline">Bills</Button>
            </Link>
            <Link to="/complaints">
              <Button variant="outline">Complaints</Button>
            </Link>
            <Button
              variant="destructive"
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = '/';
              }}
            >
              Clear Storage & Reload
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Browser Information</CardTitle>
            <CardDescription>Client details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="font-medium">User Agent:</div>
              <div className="text-xs break-all">{navigator.userAgent}</div>
              
              <div className="font-medium">Window Size:</div>
              <div>{window.innerWidth} x {window.innerHeight}</div>
              
              <div className="font-medium">Current Path:</div>
              <div>{window.location.pathname}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
