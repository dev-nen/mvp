import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ClipboardList,
  LoaderCircle,
  LogOut,
  Mail,
  MapPin,
  Plus,
  Save,
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
import { Input } from "@/components/ui/input";
import {
  getMunicipalityChoiceById,
  getMunicipalityChoiceLabel,
  normalizeMunicipalityQuery,
  searchMunicipalityChoices,
} from "@/services/municipalityService";
import "./ProfilePage.css";

const MUNICIPALITY_SEARCH_DEBOUNCE_MS = 250;
const MUNICIPALITY_SEARCH_MIN_LENGTH = 2;

function getTrimmedText(value) {
  return typeof value === "string" ? value.trim() : "";
}

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
  const [profileName, setProfileName] = useState("");
  const [municipalityQuery, setMunicipalityQuery] = useState("");
  const [municipalityChoices, setMunicipalityChoices] = useState([]);
  const [municipalityChoicesError, setMunicipalityChoicesError] = useState("");
  const [isLoadingMunicipalityChoices, setIsLoadingMunicipalityChoices] =
    useState(false);
  const [selectedMunicipality, setSelectedMunicipality] = useState(null);
  const [fieldError, setFieldError] = useState("");
  const [profileFeedback, setProfileFeedback] = useState("");
  const [profileFeedbackStatus, setProfileFeedbackStatus] = useState("");
  const {
    appUser,
    appUserError,
    authError,
    isAuthenticated,
    isAuthLoading,
    isUpdatingAppUserProfile,
    openAccessGate,
    signInWithGoogle,
    signOut,
    updateAppUserProfile,
    user,
  } = useAuth();
  const { hasAccess: hasDraftInboxAccess } = useInternalToolAccess();

  const userDisplayName = getShortUserDisplayName({ appUser, user });
  const accountEmail = user?.email || appUser?.email || t("profile.unavailable");
  const normalizedMunicipalityQuery = useMemo(
    () => normalizeMunicipalityQuery(municipalityQuery),
    [municipalityQuery],
  );
  const selectedMunicipalityLabel = getMunicipalityChoiceLabel(selectedMunicipality);
  const shouldSearchMunicipalities =
    isAuthenticated &&
    normalizedMunicipalityQuery.length >= MUNICIPALITY_SEARCH_MIN_LENGTH &&
    municipalityQuery !== selectedMunicipalityLabel;
  const isMunicipalityOptionsOpen =
    shouldSearchMunicipalities &&
    (isLoadingMunicipalityChoices ||
      municipalityChoices.length > 0 ||
      municipalityChoicesError ||
      normalizedMunicipalityQuery.length >= MUNICIPALITY_SEARCH_MIN_LENGTH);
  const savedCityId = appUser?.cityId ? String(appUser.cityId) : "";
  const selectedCityId = selectedMunicipality?.id
    ? String(selectedMunicipality.id)
    : "";
  const isProfileDirty =
    getTrimmedText(profileName) !== getTrimmedText(appUser?.name) ||
    selectedCityId !== savedCityId;

  useEffect(() => {
    if (!isAuthenticated) {
      setProfileName("");
      setMunicipalityQuery("");
      setSelectedMunicipality(null);
      setMunicipalityChoices([]);
      setMunicipalityChoicesError("");
      setFieldError("");
      setProfileFeedback("");
      setProfileFeedbackStatus("");
      return undefined;
    }

    let isMounted = true;

    setProfileName(appUser?.name || userDisplayName || "");
    setSelectedMunicipality(null);
    setMunicipalityQuery(appUser?.cityName || "");
    setMunicipalityChoices([]);
    setMunicipalityChoicesError("");
    setFieldError("");

    if (!appUser?.cityId) {
      return () => {
        isMounted = false;
      };
    }

    getMunicipalityChoiceById(appUser.cityId)
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
  }, [
    appUser?.cityId,
    appUser?.cityName,
    appUser?.name,
    isAuthenticated,
    userDisplayName,
  ]);

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

  const handleMunicipalityQueryChange = (event) => {
    const nextQuery = event.target.value;

    setMunicipalityQuery(nextQuery);
    setMunicipalityChoicesError("");
    setFieldError("");
    setProfileFeedback("");
    setProfileFeedbackStatus("");

    if (selectedMunicipality && nextQuery !== selectedMunicipalityLabel) {
      setSelectedMunicipality(null);
    }
  };

  const handleSelectMunicipality = (municipalityChoice) => {
    setSelectedMunicipality(municipalityChoice);
    setMunicipalityQuery(getMunicipalityChoiceLabel(municipalityChoice));
    setMunicipalityChoices([]);
    setMunicipalityChoicesError("");
    setFieldError("");
    setProfileFeedback("");
    setProfileFeedbackStatus("");
  };

  const handleSubmitProfile = async (event) => {
    event.preventDefault();

    const nextName = getTrimmedText(profileName);

    if (!nextName) {
      setFieldError("name");
      setProfileFeedback(t("profile.nameRequired"));
      setProfileFeedbackStatus("error");
      return;
    }

    if (!selectedMunicipality) {
      setFieldError("city");
      setProfileFeedback(t("profile.cityRequired"));
      setProfileFeedbackStatus("error");
      return;
    }

    setFieldError("");
    setProfileFeedback("");
    setProfileFeedbackStatus("");

    const { error } = await updateAppUserProfile({
      name: nextName,
      lastName: appUser?.lastName || "",
      cityId: selectedMunicipality.id,
    });

    if (error) {
      setProfileFeedback(t("profile.saveError"));
      setProfileFeedbackStatus("error");
      return;
    }

    setProfileFeedback(t("profile.saveSuccess"));
    setProfileFeedbackStatus("success");
  };

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

                  <form
                    className="profile-page__form"
                    onSubmit={handleSubmitProfile}
                    noValidate
                  >
                    <fieldset
                      className="profile-page__fieldset"
                      disabled={isUpdatingAppUserProfile}
                    >
                      <div className="profile-page__field">
                        <label className="profile-page__field-label" htmlFor="profile-name">
                          <UserRound />
                          {t("auth.common.name")}
                        </label>
                        <Input
                          id="profile-name"
                          className="profile-page__input"
                          value={profileName}
                          onChange={(event) => {
                            setProfileName(event.target.value);
                            setFieldError("");
                            setProfileFeedback("");
                            setProfileFeedbackStatus("");
                          }}
                          aria-invalid={fieldError === "name"}
                          autoComplete="given-name"
                        />
                      </div>

                      <div className="profile-page__field">
                        <label className="profile-page__field-label" htmlFor="profile-email">
                          <Mail />
                          {t("profile.email")}
                        </label>
                        <Input
                          id="profile-email"
                          className="profile-page__input profile-page__input--readonly"
                          value={accountEmail}
                          readOnly
                          disabled
                        />
                        <p className="profile-page__field-help">
                          {t("profile.emailReadonlyHelp")}
                        </p>
                      </div>

                      <div className="profile-page__field">
                        <label className="profile-page__field-label" htmlFor="profile-city">
                          <MapPin />
                          {t("profile.city")}
                        </label>
                        <div className="profile-page__autocomplete">
                          <Input
                            id="profile-city"
                            type="search"
                            role="combobox"
                            aria-autocomplete="list"
                            aria-expanded={Boolean(isMunicipalityOptionsOpen)}
                            aria-controls="profile-city-options"
                            className="profile-page__input"
                            placeholder={t("profile.cityPlaceholder")}
                            value={municipalityQuery}
                            onChange={handleMunicipalityQueryChange}
                            aria-invalid={fieldError === "city"}
                            autoComplete="off"
                          />

                          {isMunicipalityOptionsOpen ? (
                            <div
                              id="profile-city-options"
                              className="profile-page__autocomplete-panel"
                              role="listbox"
                            >
                              {isLoadingMunicipalityChoices ? (
                                <p className="profile-page__autocomplete-status">
                                  {t("auth.onboarding.searching")}
                                </p>
                              ) : null}

                              {!isLoadingMunicipalityChoices &&
                              municipalityChoices.length === 0 &&
                              !municipalityChoicesError ? (
                                <p className="profile-page__autocomplete-status">
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
                                      className="profile-page__autocomplete-option"
                                      role="option"
                                      aria-selected={
                                        selectedMunicipality?.id ===
                                          municipalityChoice.id &&
                                        selectedMunicipality?.displayName ===
                                          municipalityChoice.displayName
                                      }
                                      onClick={() =>
                                        handleSelectMunicipality(municipalityChoice)
                                      }
                                    >
                                      <span className="profile-page__autocomplete-option-name">
                                        {municipalityChoice.displayName}
                                      </span>
                                      {municipalityChoice.provinceName ? (
                                        <span className="profile-page__autocomplete-option-meta">
                                          {municipalityChoice.provinceName}
                                        </span>
                                      ) : null}
                                    </button>
                                  ))
                                : null}
                            </div>
                          ) : null}
                        </div>
                        <p className="profile-page__field-help">
                          {t("profile.cityHelp")}
                        </p>
                      </div>

                      {profileFeedback || authError || appUserError ? (
                        <p
                          className={`profile-page__feedback ${
                            profileFeedbackStatus === "success"
                              ? "profile-page__feedback--success"
                              : "profile-page__feedback--error"
                          }`}
                          role={
                            profileFeedbackStatus === "success"
                              ? "status"
                              : "alert"
                          }
                        >
                          {profileFeedback || t("profile.authError")}
                        </p>
                      ) : null}

                      <div className="profile-page__form-actions">
                        <Button
                          type="submit"
                          className="profile-page__action-button"
                          disabled={
                            isUpdatingAppUserProfile ||
                            !isProfileDirty ||
                            !selectedMunicipality
                          }
                        >
                          <Save />
                          {isUpdatingAppUserProfile
                            ? t("profile.saving")
                            : t("profile.save")}
                        </Button>
                      </div>
                    </fieldset>
                  </form>

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
