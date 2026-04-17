import { useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  LoaderCircle,
  LogOut,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import "./ProfilePage.css";

function formatUserDisplayName(user) {
  return (
    user?.user_metadata?.full_name?.trim() ||
    user?.user_metadata?.name?.trim() ||
    user?.email?.split("@")[0] ||
    "Tu cuenta"
  );
}

function ProfileLoadingState() {
  return (
    <Card className="profile-page__card profile-page__card--loading">
      <CardContent className="profile-page__card-content profile-page__card-content--loading">
        <div className="profile-page__loading-badge">
          <LoaderCircle className="profile-page__loading-icon" />
          <span>Comprobando tu sesion</span>
        </div>
        <h2 className="profile-page__section-title">
          Estamos recuperando el estado de autenticacion.
        </h2>
        <p className="profile-page__section-description">
          Espera un instante. No mostraremos estados anonimos o autenticados
          hasta resolver la sesion actual.
        </p>
      </CardContent>
    </Card>
  );
}

export function ProfilePage() {
  const navigate = useNavigate();
  const [isStartingGoogleSignIn, setIsStartingGoogleSignIn] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const {
    appUser,
    authError,
    isAuthenticated,
    isAuthLoading,
    session,
    signInWithGoogle,
    signOut,
    user,
  } = useAuth();

  const handleGoBack = () => {
    navigate("/", { replace: true });
  };

  const handleGoogleSignIn = async () => {
    setIsStartingGoogleSignIn(true);

    const { error } = await signInWithGoogle();

    if (error) {
      setIsStartingGoogleSignIn(false);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    setIsSigningOut(false);
  };

  const userDisplayName = formatUserDisplayName(user);
  const providerName =
    session?.user?.app_metadata?.provider === "google"
      ? "Google"
      : (session?.user?.app_metadata?.provider ?? "Google");
  const sessionStateLabel = isAuthenticated ? "Activa" : "Anonima";

  return (
    <div className="profile-page">
      <Navbar />

      <main className="profile-page__main">
        <div className="page-container profile-page__container">
          <header className="profile-page__header">
            <Button
              variant="ghost"
              className="profile-page__back-button"
              onClick={handleGoBack}
            >
              <ArrowLeft />
              Volver
            </Button>

            <div className="profile-page__intro">
              <p className="profile-page__eyebrow">Perfil</p>
              <h1 className="profile-page__title">Tu cuenta</h1>
              <p className="profile-page__description">
                Esta pantalla solo refleja el estado real de autenticacion base
                para MVP 2.0.
              </p>
            </div>
          </header>

          {isAuthLoading ? (
            <ProfileLoadingState />
          ) : isAuthenticated ? (
            <div className="profile-page__grid">
              <Card className="profile-page__card profile-page__card--highlight">
                <CardContent className="profile-page__card-content">
                  <div className="profile-page__status-pill">
                    <BadgeCheck />
                    <span>Cuenta autenticada</span>
                  </div>

                  <div className="profile-page__identity-block">
                    <h2 className="profile-page__section-title">{userDisplayName}</h2>
                    <p className="profile-page__section-description">
                      La app ya reconoce tu identidad social y los datos minimos
                      asociados a tu cuenta autenticada.
                    </p>
                  </div>

                  <dl className="profile-page__details-list">
                    <div className="profile-page__detail-item">
                      <dt>
                        <UserRound />
                        Nombre visible
                      </dt>
                      <dd>{userDisplayName}</dd>
                    </div>

                    <div className="profile-page__detail-item">
                      <dt>
                        <Mail />
                        Email
                      </dt>
                      <dd>{user?.email ?? "No disponible"}</dd>
                    </div>

                    <div className="profile-page__detail-item">
                      <dt>
                        <ShieldCheck />
                        Estado
                      </dt>
                      <dd>{sessionStateLabel}</dd>
                    </div>

                    <div className="profile-page__detail-item">
                      <dt>
                        <BadgeCheck />
                        Ciudad
                      </dt>
                      <dd>{appUser?.cityName || "Sin ciudad asociada"}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              <Card className="profile-page__card">
                <CardContent className="profile-page__card-content">
                  <p className="profile-page__eyebrow">Sesion</p>
                  <h2 className="profile-page__section-title">
                    Google conectado a Supabase Auth
                  </h2>
                  <p className="profile-page__section-description">
                    Tu sesion se restaura al recargar mientras siga siendo
                    valida y queda disponible para el resto del frontend.
                  </p>

                  <dl className="profile-page__details-list profile-page__details-list--compact">
                    <div className="profile-page__detail-item">
                      <dt>Proveedor</dt>
                      <dd>{providerName}</dd>
                    </div>
                    <div className="profile-page__detail-item">
                      <dt>Usuario Auth</dt>
                      <dd>{user?.id ?? "No disponible"}</dd>
                    </div>
                    <div className="profile-page__detail-item">
                      <dt>Usuario app</dt>
                      <dd>{appUser?.id ?? "No disponible"}</dd>
                    </div>
                  </dl>

                  {authError ? (
                    <p
                      className="profile-page__feedback profile-page__feedback--error"
                      role="alert"
                    >
                      {authError}
                    </p>
                  ) : null}

                  <Button
                    type="button"
                    variant="outline"
                    className="profile-page__action-button"
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                  >
                    <LogOut />
                    {isSigningOut ? "Cerrando sesion..." : "Cerrar sesion"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="profile-page__card profile-page__card--anonymous">
              <CardContent className="profile-page__card-content">
                <p className="profile-page__eyebrow">Cuenta</p>
                <h2 className="profile-page__section-title">
                  Todavia estas en modo anonimo
                </h2>
                <p className="profile-page__section-description">
                  Conecta Google para que NensGo reconozca una identidad real y
                  mantenga la sesion entre recargas.
                </p>

                <dl className="profile-page__details-list profile-page__details-list--compact">
                  <div className="profile-page__detail-item">
                    <dt>Estado</dt>
                    <dd>{sessionStateLabel}</dd>
                  </div>
                  <div className="profile-page__detail-item">
                    <dt>Metodo</dt>
                    <dd>Google con Supabase Auth</dd>
                  </div>
                </dl>

                {authError ? (
                  <p
                    className="profile-page__feedback profile-page__feedback--error"
                    role="alert"
                  >
                    {authError}
                  </p>
                ) : null}

                <Button
                  type="button"
                  className="profile-page__action-button"
                  onClick={handleGoogleSignIn}
                  disabled={isStartingGoogleSignIn}
                >
                  {isStartingGoogleSignIn
                    ? "Conectando con Google..."
                    : "Continue with Google"}
                </Button>

                <p className="profile-page__hint">
                  Volveras a esta misma ruta despues de completar el login.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
