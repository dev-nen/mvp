import { createContext, useEffect, useState } from "react";
import {
  getSupabaseClient,
  getSupabaseClientError,
} from "@/services/supabaseClient";

export const AuthContext = createContext(null);

function getDefaultAuthError() {
  return (
    getSupabaseClientError() ||
    "No pudimos conectar la autenticacion con la configuracion actual."
  );
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    let isMounted = true;
    const supabase = getSupabaseClient();

    const applySession = (nextSession) => {
      setSession(nextSession ?? null);
      setUser(nextSession?.user ?? null);
    };

    if (!supabase) {
      setAuthError(getDefaultAuthError());
      setIsAuthLoading(false);
      return undefined;
    }

    const bootstrapAuth = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      if (error) {
        applySession(null);
        setAuthError(
          error.message ||
            "No pudimos recuperar la sesion actual de autenticacion.",
        );
      } else {
        applySession(data.session);
        setAuthError("");
      }

      setIsAuthLoading(false);
    };

    void bootstrapAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) {
        return;
      }

      applySession(nextSession);
      setAuthError("");
      setIsAuthLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    const supabase = getSupabaseClient();

    if (!supabase) {
      const error = new Error(getDefaultAuthError());
      setAuthError(error.message);
      return { data: null, error };
    }

    setAuthError("");

    const response = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.href,
      },
    });

    if (response.error) {
      setAuthError(
        response.error.message ||
          "No pudimos iniciar el acceso con Google en este momento.",
      );
    }

    return response;
  };

  const signOut = async () => {
    const supabase = getSupabaseClient();

    if (!supabase) {
      const error = new Error(getDefaultAuthError());
      setAuthError(error.message);
      return { error };
    }

    setAuthError("");

    const response = await supabase.auth.signOut();

    if (response.error) {
      setAuthError(
        response.error.message ||
          "No pudimos cerrar la sesion. Prueba de nuevo en unos segundos.",
      );
      return response;
    }

    setSession(null);
    setUser(null);

    return response;
  };

  return (
    <AuthContext.Provider
      value={{
        authError,
        isAuthenticated: Boolean(session?.user),
        isAuthLoading,
        session,
        signInWithGoogle,
        signOut,
        user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
