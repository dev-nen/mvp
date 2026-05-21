import { useState } from "react";
import {
  ArrowLeft,
  ClipboardList,
  LoaderCircle,
  LogOut,
  Mail,
  MapPin,
  Plus,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { getShortUserDisplayName } from "@/helpers/userDisplayName";
import { useInternalToolAccess } from "@/hooks/useInternalToolAccess";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n/useI18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import "./ProfilePage.css";

function ProfileLoadingState() {
  const { t } = useI18n();

  return (
    <Card className="profile-page__card profile-page__card--loading">
      <CardContent className="profile-page__card-content profile-page__card-content--loading">
        <div className="profile-page__loading-row">
          <LoaderCircle className="profile-page__loading-icon" />
          <span>{t("profile.loadingLabel")}</span>
        </div>
        <h2 className="profile-page__section-title">
          {t("profile.loadingTitle")}
        </h2>
        <p className="profile-page__section-description">
          {t("profile.loadingDescription")}
        </p>
      </CardContent>
    </Card>
  );
}

export function ProfilePage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [isStartingGoogleSignIn, setIsStartingGoogleSignIn] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const {
    appUser,
    authError,
    isAuthenticated,
    isAuthLoading,
    openAccessGate,
    signInWithGoogle,
    signOut,
    user,
  } = useAuth();
  const { hasAccess: hasDraftInboxAccess } = useInternalToolAccess();

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

  const userDisplayName = getShortUserDisplayName({ appUser, user });

  return (
    <div className="profile-page">
      <main className="profile-page__main">
        <div className="page-container profile-page__container">
          <header className="profile-page__header">
            <Button
              variant="ghost"
              className="profile-page__back-button"
              onClick={handleGoBack}
            >
              <ArrowLeft />
              {t("profile.back")}
            </Button>

            <div className="profile-page__intro">
              <h1 className="profile-page__title">{t("profile.title")}</h1>
              <p className="profile-page__description">
                {t("profile.description")}
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
                      {t("profile.identityDescription")}
                    </p>
                  </div>

                  <dl className="profile-page__details-list">
                    <div className="profile-page__detail-item">
                      <dt>
                        <UserRound />
                        {t("profile.visibleName")}
                      </dt>
                      <dd>{userDisplayName}</dd>
                    </div>

                    <div className="profile-page__detail-item">
                      <dt>
                        <Mail />
                        {t("profile.email")}
                      </dt>
                      <dd>{user?.email ?? t("profile.unavailable")}</dd>
                    </div>

                    <div className="profile-page__detail-item">
                      <dt>
                        <MapPin />
                        {t("profile.city")}
                      </dt>
                      <dd>{appUser?.cityName || t("profile.noCity")}</dd>
                    </div>
                  </dl>

                  {authError ? (
                    <p
                      className="profile-page__feedback profile-page__feedback--error"
                      role="alert"
                    >
                      {t("profile.authError")}
                    </p>
                  ) : null}

                  <div className="profile-page__publication-tool">
                    <div>
                      <h3 className="profile-page__tool-title">
                        {t("profile.publicationsTitle")}
                      </h3>
                      <p className="profile-page__tool-description">
                        {t("profile.publicationsDescription")}
                      </p>
                    </div>
                    <div className="profile-page__publication-actions">
                      <Button
                        type="button"
                        variant="outline"
                        className="profile-page__action-button"
                        onClick={() => navigate("/perfil/publicaciones")}
                      >
                        <ClipboardList />
                        {t("profile.publicationsAction")}
                      </Button>
                      <Button
                        type="button"
                        className="profile-page__action-button"
                        onClick={() => navigate("/perfil/publicaciones/nueva")}
                      >
                        <Plus />
                        {t("profile.submitActivityAction")}
                      </Button>
                    </div>
                  </div>

                  {hasDraftInboxAccess ? (
                    <div className="profile-page__internal-tool">
                      <p className="profile-page__internal-tool-description">
                        {t("profile.internalDescription")}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        className="profile-page__action-button"
                        onClick={() => navigate("/internal/drafts")}
                      >
                        {t("profile.internalAction")}
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
                    {isSigningOut ? t("profile.signingOut") : t("profile.signOut")}
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="profile-page__card profile-page__card--anonymous">
              <CardContent className="profile-page__card-content">
                <h2 className="profile-page__section-title">
                  {t("profile.anonymousTitle")}
                </h2>
                <p className="profile-page__section-description">
                  {t("profile.anonymousDescription")}
                </p>

                {authError ? (
                  <p
                    className="profile-page__feedback profile-page__feedback--error"
                    role="alert"
                  >
                    {t("profile.authError")}
                  </p>
                ) : null}

                <Button
                  type="button"
                  className="profile-page__action-button"
                  onClick={handleGoogleSignIn}
                  disabled={isStartingGoogleSignIn}
                >
                  {isStartingGoogleSignIn
                    ? t("auth.common.googleConnecting")
                    : t("auth.common.googleContinue")}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="profile-page__action-button"
                  onClick={() => openAccessGate()}
                >
                  {t("profile.openEmailAccess")}
                </Button>

                <p className="profile-page__hint">{t("profile.returnHint")}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
