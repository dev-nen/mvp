import { useEffect, useMemo, useState } from "react";
import {
  Eye,
  EyeOff,
  Heart,
  LoaderCircle,
  Lock,
  Mail,
  MailCheck,
  MapPin,
  ShieldCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n/useI18n";
import {
  getMunicipalityChoiceById,
  getMunicipalityChoiceLabel,
  normalizeMunicipalityQuery,
  searchMunicipalityChoices,
} from "@/services/municipalityService";
import "./ProtectedAccessGate.css";

const MUNICIPALITY_SEARCH_DEBOUNCE_MS = 250;
const MUNICIPALITY_SEARCH_MIN_LENGTH = 2;

export function ProtectedAccessGate() {
  const { t } = useI18n();
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
  const [municipalityQuery, setMunicipalityQuery] = useState("");
  const [municipalityChoices, setMunicipalityChoices] = useState([]);
  const [municipalityChoicesError, setMunicipalityChoicesError] = useState("");
  const [isLoadingMunicipalityChoices, setIsLoadingMunicipalityChoices] =
    useState(false);
  const [selectedMunicipality, setSelectedMunicipality] = useState(null);
  const [formError, setFormError] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isStartingGoogleSignIn, setIsStartingGoogleSignIn] = useState(false);
  const [isSubmittingCredentials, setIsSubmittingCredentials] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);

  const normalizedMunicipalityQuery = useMemo(
    () => normalizeMunicipalityQuery(municipalityQuery),
    [municipalityQuery],
  );
  const shouldSearchMunicipalities =
    accessState === "onboarding_required" &&
    isAccessGateOpen &&
    normalizedMunicipalityQuery.length >= MUNICIPALITY_SEARCH_MIN_LENGTH &&
    municipalityQuery !== getMunicipalityChoiceLabel(selectedMunicipality);
  const isMunicipalityOptionsOpen =
    shouldSearchMunicipalities &&
    (isLoadingMunicipalityChoices ||
      municipalityChoices.length > 0 ||
      municipalityChoicesError ||
      normalizedMunicipalityQuery.length >= MUNICIPALITY_SEARCH_MIN_LENGTH);

  useEffect(() => {
    if (!shouldSearchMunicipalities) {
      setMunicipalityChoices([]);
      setIsLoadingMunicipalityChoices(false);
      return undefined;
    }

    let isCancelled = false;

    setIsLoadingMunicipalityChoices(true);
    setMunicipalityChoicesError("");

    const timeoutId = window.setTimeout(() => {
      searchMunicipalityChoices(municipalityQuery)
        .then((nextMunicipalityChoices) => {
          if (isCancelled) {
            return;
          }

          setMunicipalityChoices(nextMunicipalityChoices);
        })
        .catch(() => {
          if (isCancelled) {
            return;
          }

          setMunicipalityChoices([]);
          setMunicipalityChoicesError("municipality");
        })
        .finally(() => {
          if (!isCancelled) {
            setIsLoadingMunicipalityChoices(false);
          }
        });
    }, MUNICIPALITY_SEARCH_DEBOUNCE_MS);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [municipalityQuery, shouldSearchMunicipalities]);

  useEffect(() => {
    if (!isAccessGateOpen) {
      setEmail("");
      setPassword("");
      setPasswordConfirm("");
      setProfileName("");
      setProfileLastName("");
      setMunicipalityQuery("");
      setMunicipalityChoices([]);
      setMunicipalityChoicesError("");
      setSelectedMunicipality(null);
      setFormError("");
      setIsPasswordVisible(false);
      setIsStartingGoogleSignIn(false);
      setIsSubmittingCredentials(false);
      setIsResendingVerification(false);
      setAuthMode("sign_in");
    }
  }, [isAccessGateOpen]);

  useEffect(() => {
    if (!isAccessGateOpen || accessState !== "onboarding_required") {
      return undefined;
    }

    let isMounted = true;

    setProfileName(defaultOnboardingForm.name || "");
    setProfileLastName(defaultOnboardingForm.lastName || "");
    setSelectedMunicipality(null);
    setMunicipalityQuery("");

    if (!defaultOnboardingForm.cityId) {
      return () => {
        isMounted = false;
      };
    }

    getMunicipalityChoiceById(defaultOnboardingForm.cityId)
      .then((municipalityChoice) => {
        if (!isMounted || !municipalityChoice) {
          return;
        }

        setSelectedMunicipality(municipalityChoice);
        setMunicipalityQuery(getMunicipalityChoiceLabel(municipalityChoice));
      })
      .catch(() => {
        if (isMounted) {
          setMunicipalityChoicesError("saved_city");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [accessState, defaultOnboardingForm, isAccessGateOpen]);

  const feedbackMessage =
    formError ||
    (municipalityChoicesError === "saved_city"
      ? t("auth.feedback.savedCityError")
      : municipalityChoicesError
        ? t("auth.feedback.municipalityError")
        : "") ||
    (appUserError ? t("auth.feedback.profileError") : "") ||
    (authError ? t("auth.feedback.authError") : "");
  const infoMessage = verificationMessage
    ? t("auth.feedback.verificationSent")
    : "";

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

  const handleSwitchAuthMode = (nextAuthMode) => {
    setAuthMode(nextAuthMode);
    setFormError("");
    setPasswordConfirm("");
  };

  const handleSubmitCredentials = async (event) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setFormError(t("auth.anonymous.emailPasswordRequired"));
      return;
    }

    if (authMode === "sign_up" && password !== passwordConfirm) {
      setFormError(t("auth.anonymous.passwordMismatch"));
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
      setFormError(t("auth.verification.resendMissingEmail"));
      return;
    }

    setFormError("");
    setIsResendingVerification(true);
    await resendVerificationEmail(targetEmail);
    setIsResendingVerification(false);
  };

  const handleMunicipalityQueryChange = (event) => {
    const nextQuery = event.target.value;

    setMunicipalityQuery(nextQuery);
    setMunicipalityChoicesError("");

    if (
      selectedMunicipality &&
      nextQuery !== getMunicipalityChoiceLabel(selectedMunicipality)
    ) {
      setSelectedMunicipality(null);
    }
  };

  const handleSelectMunicipality = (municipalityChoice) => {
    setSelectedMunicipality(municipalityChoice);
    setMunicipalityQuery(getMunicipalityChoiceLabel(municipalityChoice));
    setMunicipalityChoices([]);
    setMunicipalityChoicesError("");
    setFormError("");
  };

  const handleSubmitOnboarding = async (event) => {
    event.preventDefault();

    if (!profileName.trim()) {
      setFormError(t("auth.onboarding.nameRequired"));
      return;
    }

    if (!selectedMunicipality) {
      setFormError(t("auth.onboarding.cityRequired"));
      return;
    }

    setFormError("");

    const { error } = await completeOnboarding({
      name: profileName,
      lastName: profileLastName,
      cityId: selectedMunicipality.id,
    });

    if (error) {
      setFormError(t("auth.feedback.profileError"));
    }
  };

  const canCloseAccessGate = accessState !== "onboarding_required";
  const handleDismissAccessGate = () => {
    if (canCloseAccessGate) {
      closeAccessGate();
    }
  };

  return (
    <div className="protected-access-gate" role="presentation">
      <div
        className="protected-access-gate__overlay"
        onClick={handleDismissAccessGate}
      />

      <Card
        className="protected-access-gate__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="protected-access-gate-title"
      >
        <CardContent className="protected-access-gate__content">
          {canCloseAccessGate ? (
            <button
              type="button"
              className="protected-access-gate__close"
              onClick={closeAccessGate}
              aria-label={t("auth.common.closeAccess")}
            >
              <X />
            </button>
          ) : null}

          {accessState === "anonymous" ? (
            <>
              <div className="protected-access-gate__brand">
                <img
                  src="/nensgo-navbar-mark.png"
                  alt=""
                  className="protected-access-gate__brand-mark"
                />
                <span className="protected-access-gate__brand-wordmark" aria-label="NensGo">
                  <span className="protected-access-gate__brand-wordmark-nens">
                    Nens
                  </span>
                  <span className="protected-access-gate__brand-wordmark-go">Go</span>
                </span>
              </div>

              <header className="protected-access-gate__header">
                <h2
                  id="protected-access-gate-title"
                  className="protected-access-gate__title"
                >
                  {authMode === "sign_up"
                    ? t("auth.anonymous.createTitle")
                    : t("auth.anonymous.welcome")}
                </h2>
              </header>

              <section
                className="protected-access-gate__trust"
                aria-labelledby="protected-access-gate-trust-title"
              >
                <h3
                  id="protected-access-gate-trust-title"
                  className="protected-access-gate__trust-title"
                >
                  {t("auth.trust.title")}
                </h3>
                <div className="protected-access-gate__trust-list">
                  <div className="protected-access-gate__trust-item">
                    <span
                      className="protected-access-gate__trust-icon"
                      aria-hidden="true"
                    >
                      <MapPin />
                    </span>
                    <span className="protected-access-gate__trust-copy">
                      <strong>{t("auth.trust.data.title")}</strong>
                      <span>{t("auth.trust.data.description")}</span>
                    </span>
                  </div>
                  <div className="protected-access-gate__trust-item">
                    <span
                      className="protected-access-gate__trust-icon"
                      aria-hidden="true"
                    >
                      <ShieldCheck />
                    </span>
                    <span className="protected-access-gate__trust-copy">
                      <strong>{t("auth.trust.privacy.title")}</strong>
                      <span>{t("auth.trust.privacy.description")}</span>
                    </span>
                  </div>
                  <div className="protected-access-gate__trust-item">
                    <span
                      className="protected-access-gate__trust-icon"
                      aria-hidden="true"
                    >
                      <Heart />
                    </span>
                    <span className="protected-access-gate__trust-copy">
                      <strong>{t("auth.trust.account.title")}</strong>
                      <span>{t("auth.trust.account.description")}</span>
                    </span>
                  </div>
                </div>
              </section>

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
                  variant="outline"
                  className="protected-access-gate__google-action"
                  onClick={handleGoogleSignIn}
                  disabled={isStartingGoogleSignIn}
                >
                  <span className="protected-access-gate__google-mark" aria-hidden="true">
                    G
                  </span>
                  <span>
                    {isStartingGoogleSignIn
                      ? t("auth.common.googleConnecting")
                      : t("auth.common.googleContinue")}
                  </span>
                </Button>

                <div className="protected-access-gate__divider">
                  <span>
                    {authMode === "sign_up"
                      ? t("auth.anonymous.signUpDivider")
                      : t("auth.anonymous.signInDivider")}
                  </span>
                </div>

                <form
                  className="protected-access-gate__form"
                  onSubmit={handleSubmitCredentials}
                >
                  <label className="protected-access-gate__label" htmlFor="access-email">
                    {t("auth.common.email")}
                  </label>
                  <div className="protected-access-gate__field">
                    <Mail
                      className="protected-access-gate__field-icon"
                      aria-hidden="true"
                    />
                    <Input
                      id="access-email"
                      type="email"
                      className="protected-access-gate__input protected-access-gate__input--with-icon"
                      placeholder={t("auth.common.email")}
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      autoComplete="email"
                    />
                  </div>

                  <label
                    className="protected-access-gate__label"
                    htmlFor="access-password"
                  >
                    {t("auth.common.password")}
                  </label>
                  <div className="protected-access-gate__field">
                    <Lock
                      className="protected-access-gate__field-icon"
                      aria-hidden="true"
                    />
                    <Input
                      id="access-password"
                      type={isPasswordVisible ? "text" : "password"}
                      className="protected-access-gate__input protected-access-gate__input--with-icon protected-access-gate__input--with-action"
                      placeholder={t("auth.common.password")}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete={
                        authMode === "sign_up" ? "new-password" : "current-password"
                      }
                    />
                    <button
                      type="button"
                      className="protected-access-gate__password-toggle"
                      onClick={() => setIsPasswordVisible((current) => !current)}
                      aria-label={
                        isPasswordVisible
                          ? t("auth.common.hidePassword")
                          : t("auth.common.showPassword")
                      }
                    >
                      {isPasswordVisible ? <EyeOff /> : <Eye />}
                    </button>
                  </div>

                  {authMode === "sign_up" ? (
                    <>
                      <label
                        className="protected-access-gate__label"
                        htmlFor="access-password-confirm"
                      >
                        {t("auth.common.confirmPassword")}
                      </label>
                      <div className="protected-access-gate__field">
                        <Lock
                          className="protected-access-gate__field-icon"
                          aria-hidden="true"
                        />
                        <Input
                          id="access-password-confirm"
                          type={isPasswordVisible ? "text" : "password"}
                          className="protected-access-gate__input protected-access-gate__input--with-icon protected-access-gate__input--with-action"
                          placeholder={t("auth.common.confirmPassword")}
                          value={passwordConfirm}
                          onChange={(event) => setPasswordConfirm(event.target.value)}
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          className="protected-access-gate__password-toggle"
                          onClick={() => setIsPasswordVisible((current) => !current)}
                          aria-label={
                            isPasswordVisible
                              ? t("auth.common.hidePassword")
                              : t("auth.common.showPassword")
                          }
                        >
                          {isPasswordVisible ? <EyeOff /> : <Eye />}
                        </button>
                      </div>
                      <p className="protected-access-gate__hint">
                        {t("auth.anonymous.signUpHint")}
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
                        ? t("auth.anonymous.creatingAccount")
                        : t("auth.anonymous.entering")
                      : authMode === "sign_up"
                        ? t("auth.common.createAccount")
                        : t("auth.common.signIn")}
                  </Button>
                </form>

                <div className="protected-access-gate__switch">
                  <span>
                    {authMode === "sign_up"
                      ? t("auth.anonymous.alreadyHaveAccount")
                      : t("auth.anonymous.noAccount")}
                  </span>
                  <button
                    type="button"
                    className="protected-access-gate__switch-button"
                    onClick={() =>
                      handleSwitchAuthMode(
                        authMode === "sign_up" ? "sign_in" : "sign_up",
                      )
                    }
                  >
                    {authMode === "sign_up"
                      ? t("auth.common.signIn")
                      : t("auth.common.createAccount")}
                  </button>
                </div>
              </div>
            </>
          ) : null}

          {accessState === "loading_user" ? (
            <>
              <div className="protected-access-gate__icon-wrap" aria-hidden="true">
                <LoaderCircle className="protected-access-gate__spinner" />
              </div>
              <p className="protected-access-gate__eyebrow">
                {t("auth.loading.eyebrow")}
              </p>
              <h2
                id="protected-access-gate-title"
                className="protected-access-gate__title"
              >
                {t("auth.loading.title")}
              </h2>
              <p className="protected-access-gate__description">
                {t("auth.loading.description")}
              </p>
            </>
          ) : null}

          {accessState === "verification_pending" ? (
            <>
              <div className="protected-access-gate__icon-wrap" aria-hidden="true">
                <MailCheck />
              </div>
              <p className="protected-access-gate__eyebrow">
                {t("auth.verification.eyebrow")}
              </p>
              <h2
                id="protected-access-gate-title"
                className="protected-access-gate__title"
              >
                {t("auth.verification.title")}
              </h2>
              <p className="protected-access-gate__description">
                {t("auth.verification.description")}
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
                  {t("auth.verification.pendingEmail")}{" "}
                  <strong>{pendingVerificationEmail}</strong>
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
                    ? t("auth.verification.resending")
                    : t("auth.verification.resend")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="protected-access-gate__secondary-action"
                  onClick={dismissVerificationPending}
                >
                  {t("auth.verification.alreadyVerified")}
                </Button>
              </div>
            </>
          ) : null}

          {accessState === "onboarding_required" ? (
            <>
              <div className="protected-access-gate__icon-wrap" aria-hidden="true">
                <MapPin />
              </div>
              <p className="protected-access-gate__eyebrow">
                {t("auth.onboarding.eyebrow")}
              </p>
              <h2
                id="protected-access-gate-title"
                className="protected-access-gate__title"
              >
                {t("auth.onboarding.title")}
              </h2>
              <p className="protected-access-gate__description">
                {t("auth.onboarding.description")}
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
                  {t("auth.common.name")}
                </label>
                <Input
                  id="profile-name"
                  className="protected-access-gate__input"
                  value={profileName}
                  onChange={(event) => setProfileName(event.target.value)}
                />

                <label
                  className="protected-access-gate__label"
                  htmlFor="protected-access-gate-city"
                >
                  {t("auth.onboarding.cityLabel")}
                </label>
                <div className="protected-access-gate__autocomplete">
                  <Input
                    id="protected-access-gate-city"
                    type="search"
                    role="combobox"
                    aria-autocomplete="list"
                    aria-expanded={Boolean(isMunicipalityOptionsOpen)}
                    aria-controls="protected-access-gate-city-options"
                    className="protected-access-gate__input"
                    placeholder={t("auth.onboarding.cityPlaceholder")}
                    value={municipalityQuery}
                    onChange={handleMunicipalityQueryChange}
                    autoComplete="off"
                    disabled={isCompletingOnboarding}
                  />

                  {isMunicipalityOptionsOpen ? (
                    <div
                      id="protected-access-gate-city-options"
                      className="protected-access-gate__autocomplete-panel"
                      role="listbox"
                    >
                      {isLoadingMunicipalityChoices ? (
                        <p className="protected-access-gate__autocomplete-status">
                          {t("auth.onboarding.searching")}
                        </p>
                      ) : null}

                      {!isLoadingMunicipalityChoices &&
                      municipalityChoices.length === 0 &&
                      !municipalityChoicesError ? (
                        <p className="protected-access-gate__autocomplete-status">
                          {t("auth.onboarding.noResults")}
                        </p>
                      ) : null}

                      {!isLoadingMunicipalityChoices
                        ? municipalityChoices.map((municipalityChoice) => (
                            <button
                              key={
                                municipalityChoice.isSynthetic
                                  ? municipalityChoice.syntheticKey
                                  : municipalityChoice.id
                              }
                              type="button"
                              className="protected-access-gate__autocomplete-option"
                              role="option"
                              aria-selected={
                                selectedMunicipality?.id === municipalityChoice.id &&
                                selectedMunicipality?.displayName ===
                                  municipalityChoice.displayName
                              }
                              onClick={() =>
                                handleSelectMunicipality(municipalityChoice)
                              }
                            >
                              <span className="protected-access-gate__autocomplete-option-name">
                                {municipalityChoice.displayName}
                              </span>
                              {municipalityChoice.provinceName ? (
                                <span className="protected-access-gate__autocomplete-option-meta">
                                  {municipalityChoice.provinceName}
                                </span>
                              ) : null}
                            </button>
                          ))
                        : null}
                    </div>
                  ) : null}
                </div>
                <p className="protected-access-gate__hint">
                  {t("auth.onboarding.hint")}
                </p>

                <Button
                  type="submit"
                  className="protected-access-gate__primary-action"
                  disabled={isCompletingOnboarding || !selectedMunicipality}
                >
                  {isCompletingOnboarding
                    ? t("auth.onboarding.saving")
                    : t("auth.onboarding.save")}
                </Button>
              </form>
            </>
          ) : null}

          {accessState === "error" ? (
            <>
              <div className="protected-access-gate__icon-wrap" aria-hidden="true">
                <ShieldCheck />
              </div>
              <p className="protected-access-gate__eyebrow">
                {t("auth.error.eyebrow")}
              </p>
              <h2
                id="protected-access-gate-title"
                className="protected-access-gate__title"
              >
                {t("auth.error.title")}
              </h2>
              <p className="protected-access-gate__description">
                {t("auth.error.description")}
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
                {t("auth.error.retry")}
              </Button>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
