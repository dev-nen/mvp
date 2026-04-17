import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ProtectedAccessGate } from "@/components/auth/ProtectedAccessGate";
import {
  hasRequiredAppUserCity,
  syncAppUserFromAuth,
  updateAppUserRequiredCity,
} from "@/services/appUsersService";
import {
  getSupabaseClient,
  getSupabaseClientError,
} from "@/services/supabaseClient";

export const AuthContext = createContext(null);

const PENDING_INTENT_STORAGE_KEY = "nensgo.pending_protected_intent";

function getDefaultAuthError() {
  return (
    getSupabaseClientError() ||
    "No pudimos conectar la autenticacion con la configuracion actual."
  );
}

function normalizeProtectedIntent(intent) {
  if (!intent || typeof intent.type !== "string") {
    return null;
  }

  const nextIntent = {
    ...intent,
    type: intent.type.trim(),
  };

  if (!nextIntent.type) {
    return null;
  }

  if (nextIntent.activityId !== undefined && nextIntent.activityId !== null) {
    nextIntent.activityId = String(nextIntent.activityId);
  }

  return nextIntent;
}

function readStoredProtectedIntent() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedIntent = window.sessionStorage.getItem(PENDING_INTENT_STORAGE_KEY);

    if (!storedIntent) {
      return null;
    }

    return normalizeProtectedIntent(JSON.parse(storedIntent));
  } catch {
    return null;
  }
}

function writeStoredProtectedIntent(intent) {
  if (typeof window === "undefined") {
    return;
  }

  const normalizedIntent = normalizeProtectedIntent(intent);

  if (!normalizedIntent) {
    window.sessionStorage.removeItem(PENDING_INTENT_STORAGE_KEY);
    return;
  }

  window.sessionStorage.setItem(
    PENDING_INTENT_STORAGE_KEY,
    JSON.stringify(normalizedIntent),
  );
}

function buildAccessState({ appUser, isAuthLoading, isAuthorizedForApp, session }) {
  if (isAuthLoading) {
    return "loading_user";
  }

  if (!session?.user) {
    return "anonymous";
  }

  if (!isAuthorizedForApp) {
    return "unauthorized";
  }

  if (!appUser) {
    return "loading_user";
  }

  return hasRequiredAppUserCity(appUser) ? "ready" : "missing_city";
}

export function AuthProvider({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthorizedForApp] = useState(true);
  const [authError, setAuthError] = useState("");
  const [appUserError, setAppUserError] = useState("");
  const [pendingIntent, setPendingIntent] = useState(readStoredProtectedIntent);
  const [resolvedIntent, setResolvedIntent] = useState(null);
  const [isAccessGateOpen, setIsAccessGateOpen] = useState(false);
  const [isCompletingCity, setIsCompletingCity] = useState(false);

  const appUser = useMemo(() => syncAppUserFromAuth(user), [user]);
  const accessState = useMemo(
    () =>
      buildAccessState({
        appUser,
        isAuthLoading,
        isAuthorizedForApp,
        session,
      }),
    [appUser, isAuthLoading, isAuthorizedForApp, session],
  );
  const isAuthenticated = Boolean(session?.user);

  const applySession = useCallback((nextSession) => {
    setSession(nextSession ?? null);
    setUser(nextSession?.user ?? null);
  }, []);

  const persistPendingIntent = useCallback((nextIntent) => {
    const normalizedIntent = normalizeProtectedIntent(nextIntent);

    setPendingIntent(normalizedIntent);
    writeStoredProtectedIntent(normalizedIntent);

    return normalizedIntent;
  }, []);

  const clearPendingIntent = useCallback(() => {
    setPendingIntent(null);
    writeStoredProtectedIntent(null);
  }, []);

  const consumeResolvedIntent = useCallback(() => {
    setResolvedIntent(null);
  }, []);

  const closeAccessGate = useCallback(() => {
    setIsAccessGateOpen(false);
    clearPendingIntent();
  }, [clearPendingIntent]);

  const executeProtectedIntent = useCallback(
    (nextIntent) => {
      const normalizedIntent = normalizeProtectedIntent(nextIntent);

      if (!normalizedIntent) {
        clearPendingIntent();
        setIsAccessGateOpen(false);
        return;
      }

      clearPendingIntent();
      setIsAccessGateOpen(false);

      if (normalizedIntent.type === "view_more") {
        if (location.pathname !== "/") {
          navigate("/");
        }

        setResolvedIntent(normalizedIntent);
        return;
      }

      setResolvedIntent(null);

      if (
        normalizedIntent.type === "open_favorites" &&
        location.pathname !== "/favoritos"
      ) {
        navigate("/favoritos");
      }

      if (
        normalizedIntent.type === "open_profile" &&
        location.pathname !== "/perfil"
      ) {
        navigate("/perfil");
      }
    },
    [clearPendingIntent, location.pathname, navigate],
  );

  useEffect(() => {
    let isMounted = true;
    const supabase = getSupabaseClient();

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
      setAppUserError("");
      setIsAuthLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [applySession]);

  useEffect(() => {
    if (pendingIntent && accessState === "ready") {
      executeProtectedIntent(pendingIntent);
      return;
    }

    if (accessState === "missing_city") {
      setIsAccessGateOpen(true);
      return;
    }

    if (accessState === "unauthorized") {
      setIsAccessGateOpen(true);
      return;
    }

    if (pendingIntent && accessState === "anonymous") {
      setIsAccessGateOpen(true);
      return;
    }

    if (!pendingIntent && accessState === "ready") {
      setIsAccessGateOpen(false);
    }
  }, [accessState, executeProtectedIntent, pendingIntent]);

  const signInWithGoogle = useCallback(async () => {
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
  }, []);

  const signOut = useCallback(async () => {
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
    setAppUserError("");
    setResolvedIntent(null);
    setIsAccessGateOpen(false);
    clearPendingIntent();

    return response;
  }, [clearPendingIntent]);

  const refreshAppUser = useCallback(async () => {
    const supabase = getSupabaseClient();

    if (!supabase) {
      const error = new Error(getDefaultAuthError());
      setAppUserError(error.message);
      return { data: null, error };
    }

    setAppUserError("");

    const { data, error } = await supabase.auth.getUser();

    if (error) {
      const resolvedError = new Error(
        error.message || "No pudimos refrescar la cuenta autenticada.",
      );

      setAppUserError(resolvedError.message);
      return { data: null, error: resolvedError };
    }

    if (data.user) {
      setUser(data.user);
      setSession((currentSession) =>
        currentSession
          ? {
              ...currentSession,
              user: data.user,
            }
          : currentSession,
      );
    }

    return { data: data.user, error: null };
  }, []);

  const openAccessGate = useCallback(
    (intent = null) => {
      if (intent) {
        persistPendingIntent(intent);
      }

      setIsAccessGateOpen(true);
    },
    [persistPendingIntent],
  );

  const startProtectedAction = useCallback(
    async (intent) => {
      const normalizedIntent = persistPendingIntent(intent);

      if (!normalizedIntent) {
        return { error: new Error("La accion protegida no es valida.") };
      }

      if (!isAuthenticated) {
        setIsAccessGateOpen(true);
        return { data: null, error: null };
      }

      if (accessState === "ready") {
        executeProtectedIntent(normalizedIntent);
        return { data: normalizedIntent, error: null };
      }

      setIsAccessGateOpen(true);
      return { data: null, error: null };
    },
    [accessState, executeProtectedIntent, isAuthenticated, persistPendingIntent],
  );

  const completeRequiredCity = useCallback(
    async (cityChoice) => {
      if (!user?.id) {
        const error = new Error(
          "Necesitamos una sesion activa para completar la ciudad.",
        );

        setAppUserError(error.message);
        return { data: null, error };
      }

      setIsCompletingCity(true);
      setAppUserError("");

      try {
        const { appUser: nextAppUser, user: nextUser } =
          await updateAppUserRequiredCity(user, cityChoice);

        setUser(nextUser);
        setSession((currentSession) =>
          currentSession
            ? {
                ...currentSession,
                user: nextUser,
              }
            : currentSession,
        );
        setIsAccessGateOpen(false);

        return { data: nextAppUser, error: null };
      } catch (error) {
        const resolvedError =
          error instanceof Error
            ? error
            : new Error("No pudimos guardar la ciudad del usuario.");

        setAppUserError(resolvedError.message);

        return { data: null, error: resolvedError };
      } finally {
        setIsCompletingCity(false);
      }
    },
    [user],
  );

  return (
    <AuthContext.Provider
      value={{
        accessState,
        appUser,
        appUserError,
        authError,
        closeAccessGate,
        completeRequiredCity,
        consumeResolvedIntent,
        isAccessGateOpen,
        isAuthenticated,
        isAuthLoading,
        isAuthorizedForApp,
        isCompletingCity,
        openAccessGate,
        pendingIntent,
        refreshAppUser,
        resolvedIntent,
        session,
        signInWithGoogle,
        signOut,
        startProtectedAction,
        user,
      }}
    >
      {children}
      <ProtectedAccessGate />
    </AuthContext.Provider>
  );
}
