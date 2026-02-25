import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '@/db/supabase';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/types/types';
import { getProfile } from '@/utils/auth-utils';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signInWithPhone: (phone: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithPhone: (phone: string, password: string, fullName: string, role?: string) => Promise<{ error: Error | null }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string, fullName: string, phone?: string, role?: string) => Promise<{ error: Error | null }>;
  sendOTP: (identifier: string, type: 'email' | 'phone') => Promise<{ error: Error | null }>;
  verifyOTP: (identifier: string, otp: string, fullName?: string, mode?: 'login' | 'register') => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  timeLeft: number;
  resetTimer: (ignoreModes?: boolean) => void;
  isSpeaking: boolean;
  setIsSpeaking: (speaking: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const refreshProfile = async () => {
    if (!user) {
      setProfile(null);
      return;
    }

    const profileData = await getProfile(user.id);
    setProfile(profileData);
  };

  useEffect(() => {
    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('Auth loading timeout - forcing completion');
        setLoading(false);
      }
    }, 5000);

    supabase.auth.getSession()
      .then(({ data: { session } }: any) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          getProfile(session.user.id).then(setProfile);
        }
      })
      .catch((error: any) => {
        console.error('Auth initialization error:', error);
        // Don't block the app if auth fails
        setUser(null);
        setProfile(null);
      })
      .finally(() => {
        clearTimeout(timeout);
        setLoading(false);
      });
    
    // In this function, do NOT use any await calls. Use `.then()` instead to avoid deadlocks.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        getProfile(session.user.id).then(setProfile);
      } else {
        setProfile(null);
      }
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const signInWithPhone = async (phone: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        phone,
        password,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUpWithPhone = async (phone: string, password: string, fullName: string, role: string = 'citizen') => {
    try {
      const { data, error } = await supabase.auth.signUp({
        phone,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          },
        },
      });

      if (error) {
        console.error('Supabase phone signup error:', error);
        throw error;
      }

      // Create profile manually if trigger fails
      if (data.user) {
        setTimeout(async () => {
          try {
            const { error: profileError } = await (supabase
              .from('profiles') as any)
              .upsert({
                id: data.user!.id,
                phone: phone,
                full_name: fullName,
                role: role,
              }, {
                onConflict: 'id'
              });
            
            if (profileError) {
              console.error('Phone profile creation error:', profileError);
            } else {
              console.log('Phone profile created successfully');
            }
          } catch (err) {
            console.error('Phone profile creation failed:', err);
          }
        }, 2000);
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUpWithEmail = async (email: string, password: string, fullName: string, phone?: string, role: string = 'citizen') => {
    try {
      // First, try to create user without metadata to avoid trigger issues
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone || '',
            role: role,
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (error) {
        console.error('Supabase signup error:', error);
        
        // Handle email confirmation errors gracefully
        if (error.message.includes('confirm') || 
            error.message.includes('email') ||
            error.message.includes('SMTP')) {
          
          const customError = new Error('Supabase SMTP Error: Please disable "Confirm Email" in your Supabase Dashboard -> Authentication -> Providers -> Email or use Phone login.');
          (customError as any).isSmtpError = true;
          return { error: customError };
        }
        
        throw error;
      }

      if (data.user) {
        console.log('👤 User created, waiting for trigger to create profile...');
        setTimeout(async () => {
          try {
            // Check if profile exists (meaning trigger worked)
            const { data: profileCheck } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', data.user!.id)
              .maybeSingle();

            if (!profileCheck) {
              console.log('⚠️ Profile not created by trigger, attempting manual creation...');
              const { error: profileError } = await (supabase
                .from('profiles') as any)
                .upsert({
                  id: data.user!.id,
                  email: email,
                  phone: phone || '',
                  full_name: fullName,
                  role: role,
                }, {
                  onConflict: 'id'
                });

              if (profileError) {
                console.error('❌ Manual profile creation failed:', profileError.message);
              } else {
                console.log('✅ Profile created manually');
                // Refresh profile in context
                await refreshProfile();
              }
            } else {
              console.log('✅ Profile created successfully by database trigger');
              await refreshProfile();
            }
          } catch (profileErr: any) {
            console.error('❌ Error in profile creation fallback:', profileErr.message);
          }
        }, 3000); // 3 seconds to be safe
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const sendOTP = async (identifier: string, type: 'email' | 'phone') => {
    try {
      const { error } = await supabase.functions.invoke('send_otp', {
        body: { identifier, type },
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const verifyOTP = async (identifier: string, otp: string, fullName?: string, mode: 'login' | 'register' = 'login') => {
    try {
      const { data, error } = await supabase.functions.invoke('verify_otp', {
        body: { identifier, otp, fullName, mode },
      });

      if (error) throw error;
      
      // After OTP verification, if the edge function says we can login, 
      // it provides the deterministic password for us to sign in securely.
      if (data?.canLogin && data?.secretPassword) {
        console.log('OTP verified, attempting secure login...', { 
          type: data.type, 
          useIdentifier: data.loginIdentifier 
        });
        
        let signInResult;
        const loginId = data.loginIdentifier || identifier;
        
        // Determine if we should sign in with phone or email based on the returned identifier
        if (loginId.includes('@')) {
          console.log('Signing in with email credential:', loginId);
          signInResult = await supabase.auth.signInWithPassword({
            email: loginId,
            password: data.secretPassword,
          });
        } else {
          // Ensure phone has + prefix for Supabase consistency
          const e164Phone = loginId.startsWith('+') ? loginId : `+${loginId}`;
          console.log('Signing in with phone credential:', e164Phone);
          signInResult = await supabase.auth.signInWithPassword({
            phone: e164Phone,
            password: data.secretPassword,
          });
        }

        if (signInResult.error) {
          console.error('Login with secret password failed:', signInResult.error);
          throw signInResult.error;
        }
        
        console.log('Login successful with secure deterministic password');
      }

      return { error: null };
    } catch (error) {
      console.error('Verify OTP error:', error);
      return { error: error as Error };
    }
  };


  const signOut = async () => {
    localStorage.removeItem('sj-session-expiry');
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setTimeLeft(0);
    setIsSpeaking(false);
  };

  const getInitialDuration = useCallback(() => {
    const isSenior = localStorage.getItem('sj-senior-mode') === '1';
    const isScreenReader = localStorage.getItem('sj-screen-reader') === '1';
    return (isSenior || isScreenReader) ? 15 * 60 : 5 * 60;
  }, []);

  const resetTimer = useCallback(() => {
    const duration = getInitialDuration();
    const expiry = Date.now() + duration * 1000;
    localStorage.setItem('sj-session-expiry', expiry.toString());
    setTimeLeft(duration);
  }, [getInitialDuration]);

  // Initialize timer on mount or login
  useEffect(() => {
    if (!user) {
      localStorage.removeItem('sj-session-expiry');
      setTimeLeft(0);
      return;
    }

    const expiryStr = localStorage.getItem('sj-session-expiry');
    if (expiryStr) {
      const expiry = parseInt(expiryStr);
      const remaining = Math.max(0, Math.floor((expiry - Date.now()) / 1000));
      if (remaining <= 0) {
        signOut();
      } else {
        setTimeLeft(remaining);
      }
    } else {
      resetTimer();
    }
  }, [user]);

  // Countdown effect
  useEffect(() => {
    if (!user || timeLeft <= 0) return;

    const interval = setInterval(() => {
      const expiryStr = localStorage.getItem('sj-session-expiry');
      if (expiryStr) {
        const expiry = parseInt(expiryStr);
        const remaining = Math.max(0, Math.floor((expiry - Date.now()) / 1000));
        
        if (remaining <= 0) {
          setTimeLeft(0);
          signOut();
        } else {
          setTimeLeft(remaining);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [user, timeLeft]);

  // Sync timer when accessibility modes change (e.g. Senior Mode toggle)
  useEffect(() => {
    const handleModeChange = () => {
      if (user) resetTimer();
    };
    window.addEventListener('sj-mode-change', handleModeChange);
    return () => window.removeEventListener('sj-mode-change', handleModeChange);
  }, [user, resetTimer]);

  // Global speech sync
  useEffect(() => {
    const interval = setInterval(() => {
      const currentlySpeaking = window.speechSynthesis?.speaking || false;
      if (currentlySpeaking !== isSpeaking) {
        setIsSpeaking(currentlySpeaking);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [isSpeaking]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      signInWithPhone, 
      signUpWithPhone, 
      signInWithEmail,
      signUpWithEmail,
      sendOTP, 
      verifyOTP, 
      signOut, 
      refreshProfile,
      timeLeft,
      resetTimer,
      isSpeaking,
      setIsSpeaking
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
