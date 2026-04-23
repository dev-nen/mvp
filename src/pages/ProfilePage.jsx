import { useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  LoaderCircle,
  LogOut,
  Mail,
  MapPin,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { useInternalToolAccess } from "@/hooks/useInternalToolAccess";
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
        <div className="profile-page__loading-row">
          <LoaderCircle className="profile-page__loading-icon" />
          <span>Preparando tu cuenta</span>
        </div>
        <h2 className="profile-page__section-title">
          Ya casi puedes revisar tu cuenta.
        </h2>
        <p className="profile-page__section-description">
          Estamos cargando tus datos para mostrarte tu perfil en un momento.
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
    isEmailVerified,
    isAuthenticated,
    isAuthLoading,
    openAccessGate,
    signInWithGoogle,
    signOut,
    user,
  } = useAuth();
  const {
    hasAccess: hasDraftInboxAccess,
  } = useInternalToolAccess();

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
  const appProfileState = appUser?.cityId ? "Completo" : "Pendiente";

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
              <h1 className="profile-page__title">Tu cuenta</h1>
              <p className="profile-page__description">
                Revisa los datos basicos de tu cuenta y cierra sesion cuando lo
                necesites.
              </p>
            </div>
          </header>

          {isAuthLoading ? (
            <ProfileLoadingState />
          ) : isAuthenticated ? (
            <div className="profile-page__grid profile-page__grid--single">
              <Card className="profile-page__card profile-page__card--highlight">
                <CardContent className="profile-page__card-content">
                  <div className="profile-page__identity-block">
                    <h2 className="profile-page__section-title">{userDisplayName}</h2>
                    <p className="profile-page__section-description">
                      Aqui puedes revisar los datos principales asociados a tu
                      cuenta dentro de NensGo.
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
                        Email verificado
                      </dt>
                      <dd>{isEmailVerified ? "Si" : "No"}</dd>
                    </div>

                    <div className="profile-page__detail-item">
                      <dt>
                        <MapPin />
                        Ciudad
                      </dt>
                      <dd>{appUser?.cityName || "Sin ciudad asociada"}</dd>
                    </div>

                    <div className="profile-page__detail-item">
                      <dt>
                        <BadgeCheck />
                        Perfil
                      </dt>
                      <dd>{appProfileState}</dd>
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

                  {hasDraftInboxAccess ? (
                    <div className="profile-page__internal-tool">
                      <p className="profile-page__internal-tool-description">
                        Si formas parte del equipo, puedes abrir el Draft Inbox
                        desde aqui.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        className="profile-page__action-button"
                        onClick={() => navigate("/internal/drafts")}
                      >
                        Abrir Draft Inbox
                      </Button>
                    </div>
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
                <h2 className="profile-page__section-title">
                  Accede para ver tu cuenta
                </h2>
                <p className="profile-page__section-description">
                  Entra con Google o con tu email para revisar tus datos y
                  recuperar tus actividades guardadas.
                </p>

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
                    : "Continuar con Google"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="profile-page__action-button"
                  onClick={() => openAccessGate()}
                >
                  Abrir acceso con email
                </Button>

                <p className="profile-page__hint">
                  Volveras aqui despues de completar el acceso.
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
