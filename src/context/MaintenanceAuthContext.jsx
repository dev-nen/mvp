import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "@/context/AuthContext";
import { getSupabaseClient } from "@/services/supabaseClient";

const ACCESS_ERROR = "No pudimos comprobar el acceso de administración. Inténtalo de nuevo.";

// This provider is mounted only on private routes. It never creates profiles,
// offers registration, resumes public intents or opens onboarding dialogs.
export function MaintenanceAuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [accessState, setAccessState] = useState("loading_user");
  const [isMaintenanceOperator, setIsMaintenanceOperator] = useState(false);
  const [authError, setAuthError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const supabase = getSupabaseClient();
    let active = true;
    let revision = 0;
    const applySession = async (nextSession) => {
      const currentRevision = ++revision;
      setSession(nextSession ?? null);
      setIsMaintenanceOperator(false);
      setAuthError("");
      if (!nextSession?.user) {
        setAccessState("anonymous");
        return;
      }
      setAccessState("loading_user");
      try {
        const { data: identity, error: identityError } = await supabase.auth.getUser();
        if (identityError || !identity?.user) throw new Error(ACCESS_ERROR);
        const { data, error } = await supabase.rpc("is_maintenance_operator");
        if (error) throw new Error(ACCESS_ERROR);
        if (!active || currentRevision !== revision) return;
        setIsMaintenanceOperator(data === true);
        setAccessState(data === true ? "ready" : "forbidden");
      } catch {
        if (!active || currentRevision !== revision) return;
        setAuthError(ACCESS_ERROR);
        setAccessState("error");
      }
    };
    if (!supabase) {
      setAuthError(ACCESS_ERROR);
      setAccessState("error");
      return undefined;
    }
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active || revision !== 0) return;
      if (error) {
        setAuthError(ACCESS_ERROR);
        setAccessState("error");
      } else void applySession(data.session);
    }).catch(() => {
      if (active) { setAuthError(ACCESS_ERROR); setAccessState("error"); }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      // Do not await Supabase calls inside its auth-state callback lock.
      queueMicrotask(() => { if (active) void applySession(nextSession); });
    });
    return () => { active = false; revision += 1; subscription.unsubscribe(); };
  }, [reloadKey]);

  const refreshAccess = useCallback(() => setReloadKey((value) => value + 1), []);
  const signInWithPassword = useCallback(async ({ email, password }) => {
    const supabase = getSupabaseClient();
    setAuthError("");
    if (!supabase) { setAuthError(ACCESS_ERROR); return { error: new Error(ACCESS_ERROR) }; }
    try {
      const response = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (response.error) setAuthError("No pudimos iniciar sesión. Revisa tus datos de acceso.");
      return response;
    } catch {
      setAuthError(ACCESS_ERROR);
      return { error: new Error(ACCESS_ERROR) };
    }
  }, []);
  const signInWithGoogle = useCallback(async () => {
    const supabase = getSupabaseClient();
    setAuthError("");
    if (!supabase) { setAuthError(ACCESS_ERROR); return { error: new Error(ACCESS_ERROR) }; }
    try {
      const response = await supabase.auth.signInWithOAuth({ provider: "google", options: {
        redirectTo: `${window.location.origin}/usuario`,
      } });
      if (response.error) setAuthError("No pudimos iniciar el acceso con Google.");
      return response;
    } catch {
      setAuthError(ACCESS_ERROR);
      return { error: new Error(ACCESS_ERROR) };
    }
  }, []);
  const signOut = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return { error: new Error(ACCESS_ERROR) };
    try {
      const response = await supabase.auth.signOut();
      if (response.error) setAuthError("No pudimos cerrar la sesión. Inténtalo de nuevo.");
      else { setSession(null); setIsMaintenanceOperator(false); setAccessState("anonymous"); }
      return response;
    } catch { setAuthError(ACCESS_ERROR); return { error: new Error(ACCESS_ERROR) }; }
  }, []);
  const value = useMemo(() => ({
    session, user: session?.user ?? null, accessState, authError,
    isMaintenanceOperator, isAuthenticated: Boolean(session?.user),
    isAuthLoading: accessState === "loading_user", refreshAccess,
    signInWithGoogle, signInWithPassword, signOut,
  }), [session, accessState, authError, isMaintenanceOperator, refreshAccess, signInWithGoogle, signInWithPassword, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
