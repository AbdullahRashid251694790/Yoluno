/**
 * Auth Context
 *
 * Provides authentication state and methods throughout the app.
 * Uses self-hosted JWT authentication instead of Supabase Auth.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  getSession,
  forgotPassword,
  updatePassword as apiUpdatePassword,
  isApiError,
  type User,
} from '@/integrations/api';
import {
  initSocket,
  disconnectSocket,
  reconnectSocket,
} from '@/integrations/api/socket';
import { onTokenRefresh } from '@/integrations/api/client';
import { handleError } from '@/lib/errors';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Check for existing session on mount (uses httpOnly cookie for refresh)
  useEffect(() => {
    async function checkSession() {
      try {
        const session = await getSession();
        if (session?.user) {
          setState({
            user: session.user,
            isLoading: false,
            isAuthenticated: true,
          });
          // Initialize socket connection
          initSocket();
        } else {
          setState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
          });
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    }

    checkSession();

    // Reconnect socket whenever tokens are refreshed (proactive or reactive)
    onTokenRefresh(() => {
      reconnectSocket();
    });

    // Cleanup socket on unmount
    return () => {
      disconnectSocket();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const response = await apiLogin(email, password);
      setState({
        user: response.user,
        isLoading: false,
        isAuthenticated: true,
      });
      // Socket reconnect is handled automatically by onTokenRefresh callback
    } catch (error) {
      // Let EMAIL_NOT_VERIFIED pass through so LoginPage can handle it
      if (
        isApiError(error) &&
        error.response?.status === 403 &&
        error.response?.data?.error === 'EMAIL_NOT_VERIFIED'
      ) {
        throw { code: 'EMAIL_NOT_VERIFIED', message: error.response.data.message };
      }
      throw handleError(error, {
        context: 'AuthContext.signIn',
        strategy: 'throw',
      });
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      await apiRegister(email, password);
      // No login — user must verify email first
    } catch (error) {
      console.error('Signup error:', error);
      throw handleError(error, {
        context: 'AuthContext.signUp',
        strategy: 'throw',
      });
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await apiLogout();
    } catch (error) {
      handleError(error, {
        context: 'AuthContext.signOut',
        userMessage: 'Failed to sign out',
      });
    } finally {
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
      disconnectSocket();
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      await forgotPassword(email);
    } catch (error) {
      throw handleError(error, {
        context: 'AuthContext.resetPassword',
        strategy: 'throw',
      });
    }
  }, []);

  const updatePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    try {
      await apiUpdatePassword(currentPassword, newPassword);
      // After password change, user is logged out
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
      disconnectSocket();
    } catch (error) {
      throw handleError(error, {
        context: 'AuthContext.updatePassword',
        strategy: 'throw',
      });
    }
  }, []);

  const value: AuthContextValue = {
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

export function useUser(): User | null {
  const { user } = useAuth();
  return user;
}

export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}
