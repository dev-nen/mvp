import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import "./MaintenanceLoginPage.css";

export function MaintenanceLoginPage() {
  const location = useLocation();
  const { accessState, authError, isMaintenanceOperator, signInWithGoogle, signInWithPassword, signOut, refreshAccess } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const returnTo = typeof location.state?.returnTo === "string" && /^\/internal(?:\/|$)/.test(location.state.returnTo) ? location.state.returnTo : "/internal/import";
  if (accessState === "ready" && isMaintenanceOperator) return <Navigate to={returnTo} replace />;
  const submit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    try { await signInWithPassword({ email, password }); } finally { setIsSubmitting(false); }
  };
  return <main className="maintenance-login page-container">
    <Link to="/" className="maintenance-login__back">Volver a NensGo</Link>
    <section className="maintenance-login__panel">
      <h1>Administración</h1>
      <p>Accede con una de las cuentas administradoras del catálogo.</p>
      {accessState === "loading_user" ? <p role="status">Comprobando sesión…</p> : accessState === "forbidden" ? <>
        <p role="alert">Esta cuenta no tiene acceso de administración.</p>
        <Button onClick={signOut}>Usar otra cuenta</Button>
      </> : <>
        <form onSubmit={submit}>
          <label htmlFor="maintenance-email">Email</label>
          <Input id="maintenance-email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <label htmlFor="maintenance-password">Contraseña</label>
          <Input id="maintenance-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Accediendo…" : "Acceder"}</Button>
        </form>
        <Button variant="outline" disabled={isSubmitting} onClick={signInWithGoogle}>Acceder con Google</Button>
      </>}
      {authError ? <p role="alert">{authError}</p> : null}
      {accessState === "error" ? <Button variant="outline" onClick={refreshAccess}>Reintentar comprobación</Button> : null}
    </section>
  </main>;
}
