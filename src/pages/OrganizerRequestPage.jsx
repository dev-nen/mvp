import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  LoaderCircle,
  RotateCcw,
  Save,
  SearchX,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { CatalogState } from "@/components/states/CatalogState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  clearPublisherRequestLocalDraft,
  getPublisherRequestLocalDraftStorageKey,
  readPublisherRequestLocalDraft,
  writePublisherRequestLocalDraft,
} from "@/helpers/publisherRequestLocalRecovery";
import { PUBLISHER_STATUS } from "@/helpers/publisherStatus";
import { useAuth } from "@/hooks/useAuth";
import { usePublisherStatus } from "@/hooks/usePublisherStatus";
import {
  getMunicipalityChoiceById,
  getMunicipalityChoiceLabel,
  normalizeMunicipalityQuery,
  searchMunicipalityChoices,
} from "@/services/municipalityService";
import {
  resubmitMyPublisherRequest,
  submitMyPublisherRequest,
} from "@/services/publisherRequestsService";
import "./OrganizerRequestPage.css";

const MUNICIPALITY_SEARCH_DEBOUNCE_MS = 250;
const MUNICIPALITY_SEARCH_MIN_LENGTH = 2;

function getTrimmedText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function buildDefaultFormState({ appUser, latestRequest } = {}) {
  return {
    activityDescription: latestRequest?.activityDescription || "",
    addressLine1: latestRequest?.addressLine1 || "",
    cityId: latestRequest?.cityId ? String(latestRequest.cityId) : "",
    cityLabel: "",
    commercialName: latestRequest?.commercialName || "",
    fullName: latestRequest?.fullName || appUser?.name || "",
    hasPhysicalLocation: latestRequest?.hasPhysicalLocation === true,
    instagram: latestRequest?.instagram || "",
    municipalityQuery: "",
    organizerType: latestRequest?.organizerType || "individual",
    phone: latestRequest?.phone || "",
    website: latestRequest?.website || "",
  };
}

function getFormValidationError(formState) {
  if (!getTrimmedText(formState.fullName)) {
    return "El nombre completo es obligatorio.";
  }

  if (!["individual", "company_or_entity"].includes(formState.organizerType)) {
    return "Selecciona el tipo de organizador.";
  }

  if (
    formState.organizerType === "company_or_entity" &&
    !getTrimmedText(formState.commercialName)
  ) {
    return "Indica el nombre de la empresa, centro, club o actividad.";
  }

  if (!getTrimmedText(formState.cityId)) {
    return "Selecciona un municipio o localidad.";
  }

  if (!getTrimmedText(formState.phone)) {
    return "El teléfono de contacto es obligatorio.";
  }

  if (!getTrimmedText(formState.activityDescription)) {
    return "Cuéntanos brevemente qué actividades ofreces.";
  }

  if (
    formState.organizerType === "company_or_entity" &&
    formState.hasPhysicalLocation &&
    !getTrimmedText(formState.addressLine1)
  ) {
    return "Indica la dirección del centro o entidad.";
  }

  return "";
}

function getStatusGateCopy(status) {
  if (status === PUBLISHER_STATUS.APPROVED) {
    return {
      description:
        "Tu alta como Organizador ya está aprobada. Puedes enviar actividades desde tu panel de publicaciones.",
      title: "Ya eres Organizador en NensGo",
    };
  }

  if (status === PUBLISHER_STATUS.PENDING_REVIEW) {
    return {
      description:
        "Revisaremos la información y te avisaremos cuando puedas enviar nuevas actividades.",
      title: "Tu solicitud está en revisión.",
    };
  }

  return null;
}

export function OrganizerRequestPage() {
  const navigate = useNavigate();
  const { appUser, user } = useAuth();
  const {
    error: publisherStatusError,
    isLoading: isPublisherStatusLoading,
    publisherStatus,
  } = usePublisherStatus();
  const latestRequest = publisherStatus.latestRequest;
  const isResubmission =
    publisherStatus.canResubmit && Boolean(publisherStatus.latestRequestId);
  const localDraftStorageKey = useMemo(
    () =>
      getPublisherRequestLocalDraftStorageKey({
        requestId: isResubmission ? publisherStatus.latestRequestId : null,
      }),
    [isResubmission, publisherStatus.latestRequestId],
  );
  const [formState, setFormState] = useState(() =>
    buildDefaultFormState({ appUser, latestRequest: null }),
  );
  const [selectedMunicipality, setSelectedMunicipality] = useState(null);
  const [municipalityChoices, setMunicipalityChoices] = useState([]);
  const [municipalityChoicesError, setMunicipalityChoicesError] = useState("");
  const [isLoadingMunicipalityChoices, setIsLoadingMunicipalityChoices] =
    useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocalDraftRestored, setIsLocalDraftRestored] = useState(false);
  const [hasLocalRecoveryChanges, setHasLocalRecoveryChanges] = useState(false);
  const [formMessage, setFormMessage] = useState("");
  const [formMessageTone, setFormMessageTone] = useState("error");

  const accountEmail = user?.email || appUser?.email || "";
  const statusGateCopy = getStatusGateCopy(publisherStatus.status);
  const normalizedMunicipalityQuery = useMemo(
    () => normalizeMunicipalityQuery(formState.municipalityQuery),
    [formState.municipalityQuery],
  );
  const selectedMunicipalityLabel = getMunicipalityChoiceLabel(
    selectedMunicipality,
  );
  const shouldSearchMunicipalities =
    normalizedMunicipalityQuery.length >= MUNICIPALITY_SEARCH_MIN_LENGTH &&
    formState.municipalityQuery !== selectedMunicipalityLabel;
  const isMunicipalityOptionsOpen =
    shouldSearchMunicipalities &&
    (isLoadingMunicipalityChoices ||
      municipalityChoices.length > 0 ||
      municipalityChoicesError ||
      normalizedMunicipalityQuery.length >= MUNICIPALITY_SEARCH_MIN_LENGTH);

  useEffect(() => {
    if (isPublisherStatusLoading || isInitialized) {
      return;
    }

    let isMounted = true;
    const nextBaseFormState = buildDefaultFormState({
      appUser,
      latestRequest: isResubmission ? latestRequest : null,
    });
    const localDraftSnapshot = readPublisherRequestLocalDraft(
      localDraftStorageKey,
    );
    const nextFormState =
      localDraftSnapshot?.formState ?? nextBaseFormState;
    const nextCityId = getTrimmedText(nextFormState.cityId);

    const applyFormState = (municipalityChoice = null) => {
      if (!isMounted) {
        return;
      }

      const cityLabel = municipalityChoice
        ? getMunicipalityChoiceLabel(municipalityChoice)
        : nextFormState.cityLabel || "";

      setFormState({
        ...nextFormState,
        cityLabel,
        municipalityQuery: cityLabel || nextFormState.municipalityQuery,
      });
      setSelectedMunicipality(municipalityChoice);
      setIsLocalDraftRestored(Boolean(localDraftSnapshot));
      setHasLocalRecoveryChanges(Boolean(localDraftSnapshot));
      setIsInitialized(true);
    };

    if (!nextCityId) {
      applyFormState(null);
      return () => {
        isMounted = false;
      };
    }

    getMunicipalityChoiceById(nextCityId)
      .then((municipalityChoice) => {
        applyFormState(municipalityChoice);
      })
      .catch(() => {
        applyFormState(null);
      });

    return () => {
      isMounted = false;
    };
  }, [
    appUser,
    isInitialized,
    isPublisherStatusLoading,
    isResubmission,
    latestRequest,
    localDraftStorageKey,
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
      searchMunicipalityChoices(formState.municipalityQuery)
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
          setMunicipalityChoicesError("No pudimos cargar los municipios.");
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
  }, [formState.municipalityQuery, shouldSearchMunicipalities]);

  useEffect(() => {
    if (!isInitialized || !hasLocalRecoveryChanges) {
      return;
    }

    writePublisherRequestLocalDraft(localDraftStorageKey, formState);
  }, [
    formState,
    hasLocalRecoveryChanges,
    isInitialized,
    localDraftStorageKey,
  ]);

  const handleFieldChange = (fieldName, nextValue) => {
    setHasLocalRecoveryChanges(true);
    setFormMessage("");
    setFormState((currentFormState) => ({
      ...currentFormState,
      [fieldName]: nextValue,
    }));
  };

  const handleOrganizerTypeChange = (nextOrganizerType) => {
    setHasLocalRecoveryChanges(true);
    setFormMessage("");
    setFormState((currentFormState) => ({
      ...currentFormState,
      addressLine1:
        nextOrganizerType === "company_or_entity"
          ? currentFormState.addressLine1
          : "",
      hasPhysicalLocation:
        nextOrganizerType === "company_or_entity"
          ? currentFormState.hasPhysicalLocation
          : false,
      organizerType: nextOrganizerType,
    }));
  };

  const handleMunicipalityQueryChange = (event) => {
    const nextQuery = event.target.value;

    setHasLocalRecoveryChanges(true);
    setFormMessage("");
    setMunicipalityChoicesError("");
    setFormState((currentFormState) => ({
      ...currentFormState,
      cityId: nextQuery === selectedMunicipalityLabel ? currentFormState.cityId : "",
      cityLabel:
        nextQuery === selectedMunicipalityLabel ? currentFormState.cityLabel : "",
      municipalityQuery: nextQuery,
    }));

    if (selectedMunicipality && nextQuery !== selectedMunicipalityLabel) {
      setSelectedMunicipality(null);
    }
  };

  const handleSelectMunicipality = (municipalityChoice) => {
    const cityLabel = getMunicipalityChoiceLabel(municipalityChoice);

    setHasLocalRecoveryChanges(true);
    setSelectedMunicipality(municipalityChoice);
    setMunicipalityChoices([]);
    setMunicipalityChoicesError("");
    setFormMessage("");
    setFormState((currentFormState) => ({
      ...currentFormState,
      cityId: municipalityChoice.id ? String(municipalityChoice.id) : "",
      cityLabel,
      municipalityQuery: cityLabel,
    }));
  };

  const handleDiscardLocalDraft = () => {
    clearPublisherRequestLocalDraft(localDraftStorageKey);
    setIsInitialized(false);
    setIsLocalDraftRestored(false);
    setHasLocalRecoveryChanges(false);
    setFormMessage("");
    setSelectedMunicipality(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = getFormValidationError(formState);

    if (validationError) {
      setFormMessageTone("error");
      setFormMessage(validationError);
      return;
    }

    setIsSubmitting(true);
    setFormMessage("");

    try {
      if (isResubmission) {
        await resubmitMyPublisherRequest({
          payload: formState,
          requestId: publisherStatus.latestRequestId,
        });
      } else {
        await submitMyPublisherRequest(formState);
      }

      clearPublisherRequestLocalDraft(localDraftStorageKey);
      navigate("/perfil/publicaciones", {
        state: {
          publisherRequestMessage:
            "Solicitud enviada. Revisaremos tu alta como Organizador.",
        },
      });
    } catch (submitError) {
      setFormMessageTone("error");
      setFormMessage(
        submitError instanceof Error
          ? submitError.message
          : "No pudimos enviar tu solicitud.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="organizer-request-page">
      <main className="organizer-request-page__main">
        <div className="page-container organizer-request-page__container">
          <header className="organizer-request-page__header">
            <Button
              variant="ghost"
              className="organizer-request-page__back-button"
              onClick={() => navigate("/perfil/publicaciones")}
            >
              <ArrowLeft />
              Volver a mis publicaciones
            </Button>

            <div className="organizer-request-page__intro">
              <p className="organizer-request-page__eyebrow">Organizador</p>
              <h1 className="organizer-request-page__title">
                Solicitar alta como Organizador
              </h1>
              <p className="organizer-request-page__description">
                Cuéntanos quién ofrece las actividades. El equipo de NensGo
                revisará la solicitud antes de activar el envío de nuevas
                actividades.
              </p>
            </div>
          </header>

          {isPublisherStatusLoading || !isInitialized ? (
            <CatalogState
              icon={LoaderCircle}
              eyebrow="Organizador"
              title="Cargando solicitud"
              description="Estamos preparando tu estado y el formulario."
            />
          ) : publisherStatusError ? (
            <CatalogState
              icon={AlertTriangle}
              eyebrow="Organizador"
              title="No pudimos cargar tu estado"
              description={publisherStatusError}
              actionLabel="Volver"
              onAction={() => navigate("/perfil/publicaciones")}
            />
          ) : statusGateCopy ? (
            <CatalogState
              icon={
                publisherStatus.status === PUBLISHER_STATUS.APPROVED
                  ? CheckCircle2
                  : LoaderCircle
              }
              eyebrow="Organizador"
              title={statusGateCopy.title}
              description={statusGateCopy.description}
              actionLabel="Volver a mis publicaciones"
              onAction={() => navigate("/perfil/publicaciones")}
            />
          ) : (
            <Card className="organizer-request-page__panel">
              <CardContent className="organizer-request-page__panel-content">
                {isLocalDraftRestored ? (
                  <div className="organizer-request-page__recovery">
                    <p>Restauramos una solicitud local no enviada.</p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleDiscardLocalDraft}
                      disabled={isSubmitting}
                    >
                      <RotateCcw />
                      Descartar borrador
                    </Button>
                  </div>
                ) : null}

                {latestRequest?.userFeedbackSummary &&
                publisherStatus.canResubmit ? (
                  <div className="organizer-request-page__feedback">
                    <p>{latestRequest.userFeedbackSummary}</p>
                    {latestRequest.userFeedbackJson.length > 0 ? (
                      <ul>
                        {latestRequest.userFeedbackJson.map((item, index) => (
                          <li key={`${item.reason_code || item.field}-${index}`}>
                            {item.message}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}

                <form
                  className="organizer-request-page__form"
                  onSubmit={handleSubmit}
                >
                  <div className="organizer-request-page__grid">
                    <label className="organizer-request-page__field">
                      <span>Nombre completo</span>
                      <Input
                        value={formState.fullName}
                        onChange={(event) =>
                          handleFieldChange("fullName", event.target.value)
                        }
                        autoComplete="name"
                      />
                    </label>

                    <label className="organizer-request-page__field">
                      <span>Email</span>
                      <Input value={accountEmail} readOnly />
                    </label>

                    <label className="organizer-request-page__field">
                      <span>Tipo de organizador</span>
                      <select
                        className="organizer-request-page__select"
                        value={formState.organizerType}
                        onChange={(event) =>
                          handleOrganizerTypeChange(event.target.value)
                        }
                      >
                        <option value="individual">Particular</option>
                        <option value="company_or_entity">
                          Empresa, centro, club o entidad
                        </option>
                      </select>
                    </label>

                    <label className="organizer-request-page__field">
                      <span>
                        Nombre de la empresa, centro, club o actividad
                      </span>
                      <Input
                        value={formState.commercialName}
                        onChange={(event) =>
                          handleFieldChange("commercialName", event.target.value)
                        }
                      />
                    </label>

                    <div className="organizer-request-page__field organizer-request-page__field--autocomplete">
                      <label htmlFor="organizer-request-city">
                        Municipio/localidad
                      </label>
                      <Input
                        id="organizer-request-city"
                        type="search"
                        role="combobox"
                        aria-autocomplete="list"
                        aria-expanded={Boolean(isMunicipalityOptionsOpen)}
                        aria-controls="organizer-request-city-options"
                        value={formState.municipalityQuery}
                        onChange={handleMunicipalityQueryChange}
                        autoComplete="off"
                      />

                      {isMunicipalityOptionsOpen ? (
                        <div
                          id="organizer-request-city-options"
                          className="organizer-request-page__autocomplete-panel"
                          role="listbox"
                        >
                          {isLoadingMunicipalityChoices ? (
                            <p className="organizer-request-page__autocomplete-status">
                              Buscando municipios...
                            </p>
                          ) : null}

                          {!isLoadingMunicipalityChoices &&
                          municipalityChoices.length === 0 &&
                          !municipalityChoicesError ? (
                            <p className="organizer-request-page__autocomplete-status">
                              No encontramos resultados.
                            </p>
                          ) : null}

                          {municipalityChoicesError ? (
                            <p className="organizer-request-page__autocomplete-status">
                              {municipalityChoicesError}
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
                                  className="organizer-request-page__autocomplete-option"
                                  onClick={() =>
                                    handleSelectMunicipality(municipalityChoice)
                                  }
                                >
                                  {getMunicipalityChoiceLabel(
                                    municipalityChoice,
                                  )}
                                </button>
                              ))
                            : null}
                        </div>
                      ) : null}
                    </div>

                    <label className="organizer-request-page__field">
                      <span>Teléfono de contacto</span>
                      <Input
                        value={formState.phone}
                        onChange={(event) =>
                          handleFieldChange("phone", event.target.value)
                        }
                        autoComplete="tel"
                      />
                    </label>

                    <label className="organizer-request-page__field">
                      <span>Instagram</span>
                      <Input
                        value={formState.instagram}
                        onChange={(event) =>
                          handleFieldChange("instagram", event.target.value)
                        }
                        placeholder="@nensgo"
                      />
                    </label>

                    <label className="organizer-request-page__field">
                      <span>Web</span>
                      <Input
                        value={formState.website}
                        onChange={(event) =>
                          handleFieldChange("website", event.target.value)
                        }
                        placeholder="https://"
                      />
                    </label>
                  </div>

                  <label className="organizer-request-page__field">
                    <span>Cuéntanos brevemente qué actividades ofreces</span>
                    <textarea
                      className="organizer-request-page__textarea"
                      value={formState.activityDescription}
                      onChange={(event) =>
                        handleFieldChange(
                          "activityDescription",
                          event.target.value,
                        )
                      }
                      rows={5}
                    />
                  </label>

                  {formState.organizerType === "company_or_entity" ? (
                    <div className="organizer-request-page__entity-fields">
                      <label className="organizer-request-page__checkbox">
                        <input
                          type="checkbox"
                          checked={formState.hasPhysicalLocation}
                          onChange={(event) =>
                            handleFieldChange(
                              "hasPhysicalLocation",
                              event.target.checked,
                            )
                          }
                        />
                        <span>La entidad tiene una ubicación física</span>
                      </label>

                      {formState.hasPhysicalLocation ? (
                        <label className="organizer-request-page__field">
                          <span>
                            Dirección del centro o entidad, si aplica
                          </span>
                          <Input
                            value={formState.addressLine1}
                            onChange={(event) =>
                              handleFieldChange(
                                "addressLine1",
                                event.target.value,
                              )
                            }
                          />
                        </label>
                      ) : null}
                    </div>
                  ) : null}

                  {formMessage ? (
                    <p
                      className={`organizer-request-page__message organizer-request-page__message--${formMessageTone}`}
                      role={formMessageTone === "error" ? "alert" : "status"}
                    >
                      {formMessage}
                    </p>
                  ) : null}

                  <div className="organizer-request-page__actions">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/perfil/publicaciones")}
                      disabled={isSubmitting}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        "Enviando..."
                      ) : (
                        <>
                          <Save />
                          {isResubmission
                            ? "Reenviar solicitud"
                            : "Enviar solicitud"}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {!isPublisherStatusLoading &&
          !publisherStatusError &&
          !statusGateCopy &&
          !isInitialized ? (
            <CatalogState
              icon={SearchX}
              eyebrow="Organizador"
              title="No pudimos preparar el formulario"
              description="Vuelve a intentarlo desde tus publicaciones."
              actionLabel="Volver"
              onAction={() => navigate("/perfil/publicaciones")}
            />
          ) : null}
        </div>
      </main>

      <Footer />
    </div>
  );
}
