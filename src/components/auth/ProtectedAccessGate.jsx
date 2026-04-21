import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, MailCheck, MapPin, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { listCatalogCityChoices } from "@/services/catalogCityChoicesService";
import "./ProtectedAccessGate.css";

function getIntentLabel(intent) {
  if (!intent?.type) {
    return "continuar";
  }

  if (intent.type === "view_more") {
    return "ver el detalle";
  }

  if (intent.type === "open_favorites") {
    return "entrar en favoritos";
  }

  if (intent.type === "open_profile") {
    return "entrar en tu perfil";
  }

  if (intent.type === "toggle_favorite") {
    return "guardar esta actividad";
  }

  return "continuar";
}

export function ProtectedAccessGate() {
  const {
    accessState,
    appUserError,
    authError,
    closeAccessGate,
    completeOnboarding,
    defaultOnboardingForm,
    dismissVerificationPending,
    isAccessGateOpen,
    isCompletingOnboarding,
    pendingVerificationEmail,
    pendingIntent,
    refreshAppUser,
    resendVerificationEmail,
    signInWithGoogle,
    signInWithPassword,
    signUpWithPassword,
    verificationMessage,
  } = useAuth();
  const [authMode, setAuthMode] = useState("sign_in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [profileName, setProfileName] = useState("");
  const [profileLastName, setProfileLastName] = useState("");
  const [cityChoices, setCityChoices] = useState([]);
  const [cityChoicesError, setCityChoicesError] = useState("");
  const [isLoadingCityChoices, setIsLoadingCityChoices] = useState(false);
  const [selectedCityId, setSelectedCityId] = useState("");
  const [formError, setFormError] = useState("");
  const [isStartingGoogleSignIn, setIsStartingGoogleSignIn] = useState(false);
  const [isSubmittingCredentials, setIsSubmittingCredentials] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);

  useEffect(() => {
    if (!isAccessGateOpen || accessState !== "onboarding_required") {
      return undefined;
    }

    let isMounted = true;

    const loadCityChoices = async () => {
      setIsLoadingCityChoices(true);
      setCityChoicesError("");

      try {
        const nextCityChoices = await listCatalogCityChoices();

        if (!isMounted) {
          return;
        }

        setCityChoices(nextCityChoices);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setCityChoicesError(
          error instanceof Error
            ? error.message
            : "No pudimos cargar las ciudades disponibles ahora mismo.",
        );
      } finally {
        if (isMounted) {
          setIsLoadingCityChoices(false);
        }
      }
    };

    void loadCityChoices();

    return () => {
      isMounted = false;
    };
  }, [accessState, isAccessGateOpen]);

  useEffect(() => {
    if (!isAccessGateOpen) {
      setEmail("");
      setPassword("");
      setPasswordConfirm("");
      setProfileName("");
      setProfileLastName("");
      setSelectedCityId("");
      setFormError("");
      setIsStartingGoogleSignIn(false);
      setIsSubmittingCredentials(false);
      setIsResendingVerification(false);
      setAuthMode("sign_in");
    }
  }, [isAccessGateOpen]);

  useEffect(() => {
    if (!isAccessGateOpen || accessState !== "onboarding_required") {
      return;
    }

    setProfileName(defaultOnboardingForm.name || "");
    setProfileLastName(defaultOnboardingForm.lastName || "");
    setSelectedCityId(defaultOnboardingForm.cityId || "");
  }, [accessState, defaultOnboardingForm, isAccessGateOpen]);

  const currentIntentLabel = useMemo(
    () => getIntentLabel(pendingIntent),
    [pendingIntent],
  );
  const selectedCity =
    cityChoices.find((cityChoice) => String(cityChoice.id) === selectedCityId) ?? null;
  const feedbackMessage = formError || appUserError || authError || cityChoicesError;
  const infoMessage = verificationMessage;

  if (!isAccessGateOpen) {
    return null;
  }

  const handleGoogleSignIn = async () => {
    setIsStartingGoogleSignIn(true);
    const { error } = await signInWithGoogle();

    if (error) {
      setIsStartingGoogleSignIn(false);
    }
  };

  const handleSubmitCredentials = async (event) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setFormError("Email y password son obligatorios.");
      return;
    }

    if (authMode === "sign_up" && password !== passwordConfirm) {
      setFormError("La confirmacion del password no coincide.");
      return;
    }

    setFormError("");
    setIsSubmittingCredentials(true);

    const { error } =
      authMode === "sign_up"
        ? await signUpWithPassword({
            email: email.trim(),
            password,
          })
        : await signInWithPassword({
            email: email.trim(),
            password,
          });

    if (error) {
      setIsSubmittingCredentials(false);
      return;
    }

    setPassword("");
    setPasswordConfirm("");
    setIsSubmittingCredentials(false);
  };

  const handleResendVerification = async () => {
    const targetEmail = pendingVerificationEmail || email.trim();

    if (!targetEmail) {
      setFormError("Necesitamos un email para reenviar la verificacion.");
      return;
    }

    setFormError("");
    setIsResendingVerification(true);
    await resendVerificationEmail(targetEmail);
    setIsResendingVerification(false);
  };

  const handleSubmitOnboarding = async (event) => {
    event.preventDefault();

    if (!profileName.trim()) {
      setFormError("El nombre es obligatorio para completar el perfil.");
      return;
    }

    if (!selectedCity) {
      setFormError("Selecciona una ciudad para completar el acceso.");
      return;
    }

    setFormError("");

    const { error } = await completeOnboarding({
      name: profileName,
      lastName: profileLastName,
      cityId: selectedCity.id,
    });

    if (error) {
      setFormError(error.message);
    }
  };

  return (
    <div className="protected-access-gate" role="presentation">
      <div
        className="protected-access-gate__overlay"
        onClick={closeAccessGate}
      />

      <Card
        className="protected-access-gate__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="protected-access-gate-title"
      >
        <CardContent className="protected-access-gate__content">
          <button
            type="button"
            className="protected-access-gate__close"
            onClick={closeAccessGate}
            aria-label="Cerrar acceso"
          >
            <X />
          </button>

          {accessState === "anonymous" ? (
            <>
              <div className="protected-access-gate__icon-wrap" aria-hidden="true">
                <ShieldCheck />
              </div>
              <p className="protected-access-gate__eyebrow">Acceso minimo</p>
              <h2
                id="protected-access-gate-title"
                className="protected-access-gate__title"
              >
                Accede con Google para {currentIntentLabel}
              </h2>
              <p className="protected-access-gate__description">
                El catalogo puede explorarse en abierto, pero esta accion necesita
                una cuenta identificada y una ciudad asociada.
              </p>

              {feedbackMessage ? (
                <p
                  className="protected-access-gate__feedback protected-access-gate__feedback--error"
                  role="alert"
                >
                  {feedbackMessage}
                </p>
              ) : null}

              <div className="protected-access-gate__auth-actions">
                <Button
                  type="button"
                  className="protected-access-gate__primary-action"
                  onClick={handleGoogleSignIn}
                  disabled={isStartingGoogleSignIn}
                >
                  {isStartingGoogleSignIn
                    ? "Conectando con Google..."
                    : "Continuar con Google"}
                </Button>

                <div className="protected-access-gate__divider">
                  <span>o usa email y password</span>
                </div>

                <div className="protected-access-gate__toggle-row">
                  <Button
                    type="button"
                    variant={authMode === "sign_in" ? "default" : "outline"}
                    className="protected-access-gate__toggle-button"
                    onClick={() => setAuthMode("sign_in")}
                  >
                    Entrar
                  </Button>
                  <Button
                    type="button"
                    variant={authMode === "sign_up" ? "default" : "outline"}
                    className="protected-access-gate__toggle-button"
                    onClick={() => setAuthMode("sign_up")}
                  >
                    Crear cuenta
                  </Button>
                </div>

                <form
                  className="protected-access-gate__form"
                  onSubmit={handleSubmitCredentials}
                >
                  <label className="protected-access-gate__label" htmlFor="access-email">
                    Email
                  </label>
                  <Input
                    id="access-email"
                    type="email"
                    className="protected-access-gate__input"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                  />

                  <label
                    className="protected-access-gate__label"
                    htmlFor="access-password"
                  >
                    Password
                  </label>
                  <Input
                    id="access-password"
                    type="password"
                    className="protected-access-gate__input"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete={
                      authMode === "sign_up" ? "new-password" : "current-password"
                    }
                  />

                  {authMode === "sign_up" ? (
                    <>
                      <label
                        className="protected-access-gate__label"
                        htmlFor="access-password-confirm"
                      >
                        Confirmar password
                      </label>
                      <Input
                        id="access-password-confirm"
                        type="password"
                        className="protected-access-gate__input"
                        value={passwordConfirm}
                        onChange={(event) => setPasswordConfirm(event.target.value)}
                        autoComplete="new-password"
                      />
                      <p className="protected-access-gate__hint">
                        La cuenta clasica requiere verificacion de email antes de
                        poder usar la app.
                      </p>
                    </>
                  ) : null}

                  <Button
                    type="submit"
                    className="protected-access-gate__primary-action"
                    disabled={isSubmittingCredentials}
                  >
                    {isSubmittingCredentials
                      ? authMode === "sign_up"
                        ? "Creando cuenta..."
                        : "Entrando..."
                      : authMode === "sign_up"
                        ? "Crear cuenta"
                        : "Entrar con email"}
                  </Button>
                </form>
              </div>
            </>
          ) : null}

          {accessState === "loading_user" ? (
            <>
              <div className="protected-access-gate__icon-wrap" aria-hidden="true">
                <LoaderCircle className="protected-access-gate__spinner" />
              </div>
              <p className="protected-access-gate__eyebrow">Preparando acceso</p>
              <h2
                id="protected-access-gate-title"
                className="protected-access-gate__title"
              >
                Estamos resolviendo tu cuenta
              </h2>
              <p className="protected-access-gate__description">
                Estamos leyendo los datos minimos asociados a tu cuenta
                autenticada para comprobar si ya podemos continuar.
              </p>
            </>
          ) : null}

          {accessState === "verification_pending" ? (
            <>
              <div className="protected-access-gate__icon-wrap" aria-hidden="true">
                <MailCheck />
              </div>
              <p className="protected-access-gate__eyebrow">Verificacion requerida</p>
              <h2
                id="protected-access-gate-title"
                className="protected-access-gate__title"
              >
                Revisa tu email antes de continuar
              </h2>
              <p className="protected-access-gate__description">
                La cuenta clasica necesita verificacion de email antes de pasar
                al onboarding obligatorio y al flujo normal de la app.
              </p>

              {infoMessage ? (
                <p
                  className="protected-access-gate__feedback protected-access-gate__feedback--success"
                  role="status"
                >
                  {infoMessage}
                </p>
              ) : null}

              {feedbackMessage ? (
                <p
                  className="protected-access-gate__feedback protected-access-gate__feedback--error"
                  role="alert"
                >
                  {feedbackMessage}
                </p>
              ) : null}

              {pendingVerificationEmail ? (
                <p className="protected-access-gate__hint">
                  Email pendiente: <strong>{pendingVerificationEmail}</strong>
                </p>
              ) : null}

              <div className="protected-access-gate__stack-actions">
                <Button
                  type="button"
                  className="protected-access-gate__primary-action"
                  onClick={handleResendVerification}
                  disabled={isResendingVerification}
                >
                  {isResendingVerification
                    ? "Reenviando email..."
                    : "Reenviar verificacion"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="protected-access-gate__secondary-action"
                  onClick={dismissVerificationPending}
                >
                  Ya verifique mi email
                </Button>
              </div>
            </>
          ) : null}

          {accessState === "onboarding_required" ? (
            <>
              <div className="protected-access-gate__icon-wrap" aria-hidden="true">
                <MapPin />
              </div>
              <p className="protected-access-gate__eyebrow">Onboarding obligatorio</p>
              <h2
                id="protected-access-gate-title"
                className="protected-access-gate__title"
              >
                Completa tu perfil para continuar
              </h2>
              <p className="protected-access-gate__description">
                La cuenta ya esta autenticada, pero todavia no tiene el perfil de
                app listo o le falta la ciudad obligatoria.
              </p>

              {feedbackMessage ? (
                <p
                  className="protected-access-gate__feedback protected-access-gate__feedback--error"
                  role="alert"
                >
                  {feedbackMessage}
                </p>
              ) : null}

              <form
                className="protected-access-gate__form"
                onSubmit={handleSubmitOnboarding}
              >
                <label className="protected-access-gate__label" htmlFor="profile-name">
                  Nombre
                </label>
                <Input
                  id="profile-name"
                  className="protected-access-gate__input"
                  value={profileName}
                  onChange={(event) => setProfileName(event.target.value)}
                />

                <label
                  className="protected-access-gate__label"
                  htmlFor="profile-last-name"
                >
                  Apellido
                </label>
                <Input
                  id="profile-last-name"
                  className="protected-access-gate__input"
                  value={profileLastName}
                  onChange={(event) => setProfileLastName(event.target.value)}
                />

                <label
                  className="protected-access-gate__label"
                  htmlFor="protected-access-gate-city"
                >
                  Tu ciudad
                </label>
                <select
                  id="protected-access-gate-city"
                  className="protected-access-gate__select"
                  value={selectedCityId}
                  onChange={(event) => setSelectedCityId(event.target.value)}
                  disabled={isLoadingCityChoices || isCompletingOnboarding}
                >
                  <option value="">Selecciona una ciudad</option>
                  {cityChoices.map((cityChoice) => (
                    <option key={cityChoice.id} value={cityChoice.id}>
                      {cityChoice.name}
                    </option>
                  ))}
                </select>

                <Button
                  type="submit"
                  className="protected-access-gate__primary-action"
                  disabled={
                    isLoadingCityChoices ||
                    isCompletingOnboarding ||
                    cityChoices.length === 0
                  }
                >
                  {isLoadingCityChoices
                    ? "Cargando ciudades..."
                    : isCompletingOnboarding
                      ? "Guardando perfil..."
                      : "Guardar y continuar"}
                </Button>
              </form>
            </>
          ) : null}

          {accessState === "error" ? (
            <>
              <div className="protected-access-gate__icon-wrap" aria-hidden="true">
                <ShieldCheck />
              </div>
              <p className="protected-access-gate__eyebrow">Acceso no listo</p>
              <h2
                id="protected-access-gate-title"
                className="protected-access-gate__title"
              >
                No pudimos preparar tu acceso
              </h2>
              <p className="protected-access-gate__description">
                La autenticacion ya existe, pero no hemos podido dejar listo el
                perfil de aplicacion con la configuracion actual.
              </p>

              {feedbackMessage ? (
                <p
                  className="protected-access-gate__feedback protected-access-gate__feedback--error"
                  role="alert"
                >
                  {feedbackMessage}
                </p>
              ) : null}

              <Button
                type="button"
                className="protected-access-gate__primary-action"
                onClick={refreshAppUser}
              >
                Reintentar
              </Button>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
