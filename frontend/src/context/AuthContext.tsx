'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export interface UserPreferences {
  enable2FA: boolean;
  emailNotification: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  isAdmin?: boolean;
  isEmailVerified: boolean;
  userPreferences: UserPreferences;
}

export interface ParsedSession {
  id: string;
  userId: string;
  userAgent: string;
  ipAddress: string;
  createdAt: string;
  expiredAt: string;
  isCurrent?: boolean;
  deviceType: string;
  browser: string;
  os: string;
  formattedDate: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionId: string | null;
  sessions: ParsedSession[];
  isSessionsLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; mfaRequired?: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  verifyEmail: (code: string, email?: string) => Promise<{ success: boolean; error?: string }>;
  verifyMFALogin: (email: string, code: string) => Promise<{ success: boolean; error?: string }>;
  setupMFA: () => Promise<{ secret: string; qrImageUrl: string } | null>;
  verifyMFASetup: (code: string, secretKey?: string) => Promise<{ success: boolean; error?: string }>;
  revokeMFA: () => Promise<{ success: boolean; error?: string }>;
  revokeSession: (sessionId: string) => Promise<{ success: boolean; error?: string }>;
  revokeAllOtherSessions: () => Promise<{ success: boolean; revokedCount?: number; error?: string }>;
  refreshSessions: () => Promise<void>;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function safeJson(res: Response): Promise<{ ok: boolean; data: any; error?: string }> {
  try {
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      return { ok: res.ok, data, error: !res.ok ? (data?.error || `Request failed (${res.status})`) : undefined };
    }
    return { ok: res.ok, data: null, error: !res.ok ? `Server error (${res.status})` : undefined };
  } catch (err: any) {
    return { ok: false, data: null, error: err?.message || 'Failed to process server response' };
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [sessions, setSessions] = useState<ParsedSession[]>([]);
  const [isSessionsLoading, setIsSessionsLoading] = useState<boolean>(false);
  const router = useRouter();
  const pathname = usePathname();
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Check auth session
  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/auth/me', {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' },
      });
      const parsed = await safeJson(res);
      if (!parsed.ok || !parsed.data) {
        setUser(null);
        setSessionId(null);
        return;
      }
      if (parsed.data.authenticated && parsed.data.user) {
        setUser(parsed.data.user);
        setSessionId(parsed.data.sessionId || null);
      } else {
        setUser(null);
        setSessionId(null);
      }
    } catch (err) {
      console.warn('[AuthContext] checkAuth error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh active sessions list
  const refreshSessions = useCallback(async () => {
    try {
      setIsSessionsLoading(true);
      const res = await fetch('/api/v1/session/all', {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' },
      });
      const parsed = await safeJson(res);
      if (parsed.ok && parsed.data) {
        setSessions(parsed.data.sessions || []);
      }
    } catch (err) {
      console.warn('[AuthContext] refreshSessions error:', err);
    } finally {
      setIsSessionsLoading(false);
    }
  }, []);

  // Initial Auth Check
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Real-Time Polling: Check session validity and active devices every 6s when authenticated
  useEffect(() => {
    if (!user) {
      if (pollingRef.current) clearInterval(pollingRef.current);
      return;
    }

    refreshSessions();

    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch('/api/v1/session/all', {
          headers: { 'Cache-Control': 'no-cache' },
        });

        if (res.status === 401) {
          // Session was revoked on another device or expired!
          setUser(null);
          setSessionId(null);
          setSessions([]);
          if (pathname.includes('/orchestrator-agent')) {
            router.push('/login?message=session_revoked');
          }
          return;
        }

        const parsed = await safeJson(res);
        if (parsed.ok && parsed.data) {
          setSessions(parsed.data.sessions || []);
        }
      } catch (e) {
        // Polling network issue
      }
    }, 6000);

    const handleFocus = () => {
      checkAuth();
      refreshSessions();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, checkAuth, refreshSessions, pathname, router]);

  // Register — does NOT set user state. Email must be verified first.
  const register = async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const parsed = await safeJson(res);
      if (!parsed.ok) {
        return { success: false, error: parsed.error || 'Failed to create account' };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration request failed' };
    } finally {
      setIsLoading(false);
    }
  };

  // Verify Email with code
  const verifyEmail = async (code: string, email?: string) => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/v1/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), email: email?.trim() }),
      });
      const parsed = await safeJson(res);
      if (!parsed.ok) {
        return { success: false, error: parsed.error || 'Email verification failed' };
      }
      setUser(parsed.data.user);
      setSessionId(parsed.data.sessionId);
      await refreshSessions();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Verification request failed' };
    } finally {
      setIsLoading(false);
    }
  };

  // Login
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const parsed = await safeJson(res);
      if (!parsed.ok) {
        return { success: false, error: parsed.error || 'Login failed' };
      }

      // If MFA is required
      if (parsed.data?.mfaRequired) {
        return { success: true, mfaRequired: true };
      }

      setUser(parsed.data.user);
      setSessionId(parsed.data.sessionId);
      await refreshSessions();
      return { success: true, mfaRequired: false };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login request failed' };
    } finally {
      setIsLoading(false);
    }
  };

  // Verify MFA During Login
  const verifyMFALogin = async (email: string, code: string) => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/v1/mfa/verify-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const parsed = await safeJson(res);
      if (!parsed.ok) {
        return { success: false, error: parsed.error || 'MFA verification failed' };
      }
      setUser(parsed.data.user);
      setSessionId(parsed.data.sessionId);
      await refreshSessions();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'MFA login failed' };
    } finally {
      setIsLoading(false);
    }
  };

  // Setup MFA
  const setupMFA = async () => {
    try {
      const res = await fetch('/api/v1/mfa/setup');
      const parsed = await safeJson(res);
      if (!parsed.ok) return null;
      return parsed.data;
    } catch (err) {
      console.error('setupMFA error:', err);
      return null;
    }
  };

  // Verify MFA Setup
  const verifyMFASetup = async (code: string, secretKey?: string) => {
    try {
      const res = await fetch('/api/v1/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, secretKey }),
      });
      const parsed = await safeJson(res);
      if (!parsed.ok) {
        return { success: false, error: parsed.error || 'Invalid code' };
      }
      await checkAuth();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'MFA setup verification failed' };
    }
  };

  // Revoke MFA
  const revokeMFA = async () => {
    try {
      const res = await fetch('/api/v1/mfa/revoke', {
        method: 'PUT',
      });
      const parsed = await safeJson(res);
      if (!parsed.ok) {
        return { success: false, error: parsed.error || 'Failed to revoke MFA' };
      }
      await checkAuth();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Revoke MFA failed' };
    }
  };

  // Revoke Single Session
  const revokeSession = async (targetSessionId: string) => {
    try {
      const res = await fetch(`/api/v1/session/${targetSessionId}`, {
        method: 'DELETE',
      });
      const parsed = await safeJson(res);
      if (!parsed.ok) {
        return { success: false, error: parsed.error || 'Failed to terminate session' };
      }
      if (parsed.data?.loggedOut) {
        setUser(null);
        setSessionId(null);
        setSessions([]);
        router.push('/login');
      } else {
        await refreshSessions();
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Revoke session error' };
    }
  };

  // Revoke All Other Sessions
  const revokeAllOtherSessions = async () => {
    try {
      const res = await fetch('/api/v1/session/all-others', {
        method: 'DELETE',
      });
      const parsed = await safeJson(res);
      if (!parsed.ok) {
        return { success: false, error: parsed.error || 'Failed to terminate other sessions' };
      }
      await refreshSessions();
      return { success: true, revokedCount: parsed.data?.revokedCount };
    } catch (err: any) {
      return { success: false, error: err.message || 'Revoke other sessions error' };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST' });
    } catch (e) {
      // Ignore
    } finally {
      setUser(null);
      setSessionId(null);
      setSessions([]);
      router.push('/');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        sessionId,
        sessions,
        isSessionsLoading,
        login,
        register,
        verifyEmail,
        verifyMFALogin,
        setupMFA,
        verifyMFASetup,
        revokeMFA,
        revokeSession,
        revokeAllOtherSessions,
        refreshSessions,
        checkAuth,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
