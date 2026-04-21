import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ProtectedAccessGate } from "@/components/auth/ProtectedAccessGate";
import {
  ensureAppUserProfile,
  getDefaultOnboardingForm,
  hasRequiredAppUserProfile,
  isAuthUserEmailVerified,
  readAppUser,
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

function getAuthRedirectUrl() {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.location.href;
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

function isVerificationError(error) {
  const errorText = [error?.message, error?.code].filter(Boolean).join(" ").toLowerCase();

  return errorText.includes("email not confirmed") || errorText.includes("email_not_confirmed");
}

function buildAccessState({
  session,
  user,
  isAuthLoading,
  isAppUserLoading,
  appUser,
  appUserError,
  pendingVerificationEmail,
}) {
  if (isAuthLoading) {
    return "loading_user";
  }

  if (!session?.user) {
    return pendingVerificationEmail ? "verification_pending" : "anonymous";
  }

  if (!isAuthUserEmailVerified(user)) {
    return "verification_pending";
  }

  if (isAppUserLoading) {
    return "loading_user";
  }

  if (appUserError) {
    return "error";
  }

  return hasRequiredAppUserProfile(appUser) ? "ready" : "onboarding_required";
}

export function AuthProvider({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [appUser, setAppUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAppUserLoading, setIsAppUserLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [appUserError, setAppUserError] = useState("");
  const [pendingIntent, setPendingIntent] = useState(readStoredProtectedIntent);
  const [resolvedIntent, setResolvedIntent] = useState(null);
  const [isAccessGateOpen, setIsAccessGateOpen] = useState(false);
  const [isCompletingOnboarding, setIsCompletingOnboarding] = useState(false);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState("");
  const [verificationMessage, setVerificationMessage] = useState("");

  const accessState = useMemo(
    () =>
      buildAccessState({
        session,
        user,
        isAuthLoading,
        isAppUserLoading,
        appUser,
        appUserError,
        pendingVerificationEmail,
      }),
    [
      appUser,
      appUserError,
      isAppUserLoading,
      isAuthLoading,
      pendingVerificationEmail,
      session,
      user,
    ],
  );
  const defaultOnboardingForm = useMemo(
    () => getDefaultOnboardingForm(user, appUser),
    [appUser, user],
  );
  const isAuthenticated = Boolean(session?.user);

  const applySession = useCallback((nextSession) => {
    setSession(nextSession ?? null);
    setUser(nextSession?.user ?? null);

    if (!nextSession?.user) {
      setAppUser(null);
      setAppUserError("");
      setIsAppUserLoading(false);
      return;
    }

    if (isAuthUserEmailVerified(nextSession.user)) {
      setPendingVerificationEmail("");
      setVerificationMessage("");
    } else if (nextSession.user.email) {
      setPendingVerificationEmail(nextSession.user.email);
    }
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

  const dismissVerificationPending = useCallback(() => {
    if (!session?.user) {
      setPendingVerificationEmail("");
      setVerificationMessage("");
    }
  }, [session?.user]);

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

      if (normalizedIntent.type === "toggle_favorite") {
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
    let isMounted = true;

    if (!user?.id || !isAuthUserEmailVerified(user)) {
      setAppUser(null);
      setAppUserError("");
      setIsAppUserLoading(false);
      return undefined;
    }

    const loadAppUser = async () => {
      setIsAppUserLoading(true);
      setAppUserError("");

      try {
        const nextAppUser = await readAppUser(user);

        if (!isMounted) {
          return;
        }

        setAppUser(nextAppUser);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setAppUser(null);
        setAppUserError(
          error instanceof Error
            ? error.message
            : "No pudimos cargar el perfil del usuario.",
        );
      } finally {
        if (isMounted) {
          setIsAppUserLoading(false);
        }
      }
    };

    void loadAppUser();

    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    if (pendingIntent && accessState === "ready") {
      executeProtectedIntent(pendingIntent);
      return;
    }

    if (
      pendingIntent &&
      ["anonymous", "verification_pending", "onboarding_required", "error"].includes(
        accessState,
      )
    ) {
      setIsAccessGateOpen(true);
      return;
    }

    if (
      ["verification_pending", "onboarding_required", "error"].includes(
        accessState,
      ) &&
      isAuthenticated
    ) {
      setIsAccessGateOpen(true);
      return;
    }

    if (!pendingIntent && accessState === "ready") {
      setIsAccessGateOpen(false);
    }
  }, [accessState, executeProtectedIntent, isAuthenticated, pendingIntent]);

  const signInWithGoogle = useCallback(async () => {
    const supabase = getSupabaseClient();

    if (!supabase) {
      const error = new Error(getDefaultAuthError());
      setAuthError(error.message);
      return { data: null, error };
    }

    setAuthError("");
    setVerificationMessage("");

    const response = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getAuthRedirectUrl(),
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

  const signInWithPassword = useCallback(async ({ email, password }) => {
    const supabase = getSupabaseClient();

    if (!supabase) {
      const error = new Error(getDefaultAuthError());
      setAuthError(error.message);
      return { data: null, error };
    }

    setAuthError("");
    setVerificationMessage("");

    const response = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (response.error) {
      if (isVerificationError(response.error)) {
        setPendingVerificationEmail(email);
      }

      setAuthError(
        response.error.message ||
          "No pudimos iniciar sesion con email y password.",
      );
    }

    return response;
  }, []);

  const signUpWithPassword = useCallback(async ({ email, password }) => {
    const supabase = getSupabaseClient();

    if (!supabase) {
      const error = new Error(getDefaultAuthError());
      setAuthError(error.message);
      return { data: null, error };
    }

    setAuthError("");
    setVerificationMessage("");

    const response = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: getAuthRedirectUrl(),
      },
    });

    if (response.error) {
      setAuthError(
        response.error.message ||
          "No pudimos crear la cuenta con email y password.",
      );
      return response;
    }

    setPendingVerificationEmail(email);
    setVerificationMessage(
      "Te enviamos un email de verificacion. Confirma tu cuenta antes de continuar.",
    );

    return response;
  }, []);

  const resendVerificationEmail = useCallback(async (email) => {
    const supabase = getSupabaseClient();

    if (!supabase) {
      const error = new Error(getDefaultAuthError());
      setAuthError(error.message);
      return { data: null, error };
    }

    setAuthError("");
    setVerificationMessage("");

    const response = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: getAuthRedirectUrl(),
      },
    });

    if (response.error) {
      setAuthError(
        response.error.message ||
          "No pudimos reenviar el email de verificacion.",
      );
      return response;
    }

    setVerificationMessage(
      "Te reenviamos el email de verificacion. Revisa tu bandeja de entrada.",
    );

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
    setAppUser(null);
    setAppUserError("");
    setResolvedIntent(null);
    setIsAccessGateOpen(false);
    setPendingVerificationEmail("");
    setVerificationMessage("");
    clearPendingIntent();
    navigate("/", { replace: true });

    return response;
  }, [clearPendingIntent, navigate]);

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

    if (!data.user) {
      const resolvedError = new Error("No hay una sesion autenticada activa.");
      setAppUserError(resolvedError.message);
      return { data: null, error: resolvedError };
    }

    setUser(data.user);
    setSession((currentSession) =>
      currentSession
        ? {
            ...currentSession,
            user: data.user,
          }
        : currentSession,
    );

    try {
      setIsAppUserLoading(true);
      const nextAppUser = await readAppUser(data.user);
      setAppUser(nextAppUser);
      setAppUserError("");
      return { data: nextAppUser, error: null };
    } catch (readError) {
      const resolvedError =
        readError instanceof Error
          ? readError
          : new Error("No pudimos refrescar el perfil del usuario.");
      setAppUser(null);
      setAppUserError(resolvedError.message);
      return { data: null, error: resolvedError };
    } finally {
      setIsAppUserLoading(false);
    }
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

      if (accessState === "ready") {
        executeProtectedIntent(normalizedIntent);
        return { data: normalizedIntent, error: null };
      }

      setIsAccessGateOpen(true);
      return { data: null, error: null };
    },
    [accessState, executeProtectedIntent, persistPendingIntent],
  );

  const completeOnboarding = useCallback(async (profileInput) => {
    setIsCompletingOnboarding(true);
    setAppUserError("");

    try {
      const nextAppUser = await ensureAppUserProfile(profileInput);
      setAppUser(nextAppUser);
      setIsAccessGateOpen(false);

      return { data: nextAppUser, error: null };
    } catch (error) {
      const resolvedError =
        error instanceof Error
          ? error
          : new Error("No pudimos completar el perfil del usuario.");

      setAppUserError(resolvedError.message);
      return { data: null, error: resolvedError };
    } finally {
      setIsCompletingOnboarding(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        accessState,
        appUser,
        appUserError,
        authError,
        closeAccessGate,
        completeOnboarding,
        consumeResolvedIntent,
        defaultOnboardingForm,
        dismissVerificationPending,
        isAccessGateOpen,
        isAuthenticated,
        isAuthLoading,
        isCompletingOnboarding,
        isEmailVerified: isAuthUserEmailVerified(user),
        openAccessGate,
        pendingIntent,
        pendingVerificationEmail,
        refreshAppUser,
        resendVerificationEmail,
        resolvedIntent,
        session,
        signInWithGoogle,
        signInWithPassword,
        signOut,
        signUpWithPassword,
        startProtectedAction,
        user,
        verificationMessage,
      }}
    >
      {children}
      <ProtectedAccessGate />
    </AuthContext.Provider>
  );
}
