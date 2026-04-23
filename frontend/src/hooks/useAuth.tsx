import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  apiRequest,
  AUTH_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  clearSessionTokens,
  saveSessionTokens,
} from "../lib/api";
import { supabase } from "../lib/supabase";

type AuthUser = {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
};

interface AuthContextType {
  user: AuthUser | null;
  session: { access_token: string; refresh_token: string } | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>; // kept for UI compatibility
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (
    email: string,
    password: string,
    fullName?: string
  ) => Promise<{ needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<{
    access_token: string;
    refresh_token: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      const queryParams = new URLSearchParams(window.location.search);
      const oauthCode = queryParams.get("code");
      if (oauthCode) {
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(oauthCode);
          if (error) {
            throw error;
          }
          if (data.session?.access_token && data.session?.refresh_token) {
            saveSessionTokens(data.session.access_token, data.session.refresh_token);
          }
          // Remove OAuth params from URL after exchange
          window.history.replaceState(null, "", window.location.pathname);
        } catch {
          // Ignore; fallback logic below handles missing/invalid session.
        }
      }

      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : "";
      const hashParams = new URLSearchParams(hash);
      const hashAccessToken = hashParams.get("access_token");
      const hashRefreshToken = hashParams.get("refresh_token");
      if (hashAccessToken && hashRefreshToken) {
        saveSessionTokens(hashAccessToken, hashRefreshToken);
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }

      const accessToken = localStorage.getItem(AUTH_TOKEN_KEY);
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

      if (!accessToken || !refreshToken) {
        setLoading(false);
        return;
      }

      try {
        const meResponse = await apiRequest<{ user: AuthUser }>("/api/v1/auth/me");
        setUser(meResponse.user);
        setSession({ access_token: accessToken, refresh_token: refreshToken });
      } catch {
        try {
          const refreshed = await apiRequest<{
            session: { access_token: string; refresh_token: string };
            user: AuthUser;
          }>("/api/v1/auth/refresh", {
            method: "POST",
            body: JSON.stringify({ refresh_token: refreshToken }),
          });
          saveSessionTokens(
            refreshed.session.access_token,
            refreshed.session.refresh_token
          );
          setSession(refreshed.session);
          setUser(refreshed.user);
        } catch {
          clearSessionTokens();
          setSession(null);
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/login` },
    });
    if (error) {
      throw error;
    }
  };

  const signInWithPassword = async (email: string, password: string) => {
    const response = await apiRequest<{
      session: { access_token: string; refresh_token: string };
      user: AuthUser;
    }>("/api/v1/auth/signin", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    saveSessionTokens(response.session.access_token, response.session.refresh_token);
    setSession(response.session);
    setUser(response.user);
  };

  const signUpWithPassword = async (
    email: string,
    password: string,
    fullName?: string
  ) => {
    const response = await apiRequest<{
      needs_email_confirmation: boolean;
      session?: { access_token: string; refresh_token: string };
      user?: AuthUser;
    }>("/api/v1/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        full_name: fullName,
      }),
    });

    if (response.session && response.user) {
      saveSessionTokens(response.session.access_token, response.session.refresh_token);
      setSession(response.session);
      setUser(response.user);
    }

    return { needsEmailConfirmation: response.needs_email_confirmation };
  };

  const signOut = async () => {
    try {
      await apiRequest("/api/v1/auth/signout", { method: "POST" });
    } catch {
      // ignore sign-out API failures and clear local session anyway
    } finally {
      clearSessionTokens();
      setUser(null);
      setSession(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signInWithGoogle,
        signInWithPassword,
        signUpWithPassword,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
