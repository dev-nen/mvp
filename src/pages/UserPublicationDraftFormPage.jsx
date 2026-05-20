import {
  AlertTriangle,
  ArrowLeft,
  LoaderCircle,
  Save,
  SearchX,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { CatalogState } from "@/components/states/CatalogState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScoutDraftReviewForm } from "@/features/scout-drafts/ScoutDraftReviewForm";
import { normalizeContactOptionsForPayload } from "@/helpers/contactOptions";
import { mapDraftPayloadToFormState } from "@/helpers/mapDraftPayloadToFormState";
import { mapFormStateToDraftPayload } from "@/helpers/mapFormStateToDraftPayload";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n/useI18n";
import {
  resolveActivityImagePreviewUrl,
  uploadUserSubmissionCoverImage,
  validateDraftCoverImageFile,
} from "@/services/internalDraftCoverImageService";
import {
  createMyActivitySubmission,
  createMyActivityEditDraft,
  getMyActivityDraftForCorrection,
  getMyActivityForEdit,
  listMyPublicationFormOptions,
  resubmitMyActivityDraft,
} from "@/services/userPublicationsService";
import "./UserPublicationDraftFormPage.css";

const CENTER_SEARCH_MIN_LENGTH = 2;
const CENTER_SEARCH_MAX_RESULTS = 5;

function getTrimmedText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getNormalizedSearchText(value) {
  return getTrimmedText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getFeedbackFieldKeys(feedbackItems) {
  if (!Array.isArray(feedbackItems)) {
    return [];
  }

  return [
    ...new Set(
      feedbackItems
        .map((item) => getTrimmedText(item?.field))
        .filter(Boolean),
    ),
  ];
}

function validatePublicationForm(formState, t) {
  if (!getTrimmedText(formState.title)) {
    return t("userPublicationForm.validation.title");
  }

  if (!getTrimmedText(formState.description)) {
    return t("userPublicationForm.validation.description");
  }

  const centerMode = getTrimmedText(formState.centerMode) || "existing";

  if (centerMode === "existing" && !getTrimmedText(formState.centerId)) {
    return t("userPublicationForm.validation.center");
  }

  if (
    centerMode === "proposed_new" &&
    !getTrimmedText(formState.centerProposalName)
  ) {
    return t("userPublicationForm.validation.proposedCenterName");
  }

  if (!getTrimmedText(formState.categoryId)) {
    return t("userPublicationForm.validation.category");
  }

  if (!getTrimmedText(formState.typeId)) {
    return t("userPublicationForm.validation.type");
  }

  if (!getTrimmedText(formState.scheduleLabel)) {
    return t("userPublicationForm.validation.schedule");
  }

  if (
    formState.ageRuleType === "range" &&
    (!getTrimmedText(formState.ageMin) || !getTrimmedText(formState.ageMax))
  ) {
    return t("userPublicationForm.validation.ageRange");
  }

  if (formState.ageRuleType === "from" && !getTrimmedText(formState.ageMin)) {
    return t("userPublicationForm.validation.ageFrom");
  }

  if (formState.ageRuleType === "until" && !getTrimmedText(formState.ageMax)) {
    return t("userPublicationForm.validation.ageUntil");
  }

  const { errors } = normalizeContactOptionsForPayload(formState.contactOptions);

  if (errors.length > 0) {
    return errors[0].message;
  }

  return "";
}

function UserCenterDraftModeField({
  centerChoices,
  formState,
  highlightedFields = [],
  onFieldChange,
}) {
  const centerMode = getTrimmedText(formState.centerMode) || "existing";
  const centerSearchQuery = formState.centerSearchQuery || "";
  const selectedCenter = centerChoices.find(
    (centerChoice) => String(centerChoice.id) === String(formState.centerId),
  );
  const visibleSearchQuery = centerSearchQuery || selectedCenter?.label || "";
  const normalizedCenterQuery = getNormalizedSearchText(centerSearchQuery);
  const shouldShowCenterResults =
    !formState.centerId &&
    normalizedCenterQuery.length >= CENTER_SEARCH_MIN_LENGTH;
  const centerMatches =
    shouldShowCenterResults
      ? centerChoices
          .filter((centerChoice) =>
            getNormalizedSearchText(
              `${centerChoice.label} ${centerChoice.name} ${centerChoice.cityName}`,
            ).includes(normalizedCenterQuery),
          )
          .slice(0, CENTER_SEARCH_MAX_RESULTS)
      : [];
  const isHighlighted = highlightedFields.includes("centerId");

  const fieldClassName = [
    "user-publication-draft-form-page__center-field",
    isHighlighted ? "user-publication-draft-form-page__center-field--highlighted" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const handleModeChange = (nextMode) => {
    onFieldChange("centerMode", nextMode);

    if (nextMode === "existing") {
      onFieldChange("centerProposalName", "");
      onFieldChange("centerProposalNotes", "");
      return;
    }

    onFieldChange("centerId", "");
    onFieldChange("centerSearchQuery", "");
  };

  const handleCenterSearchChange = (event) => {
    onFieldChange("centerSearchQuery", event.target.value);
    onFieldChange("centerId", "");
  };

  const handleSelectCenter = (centerChoice) => {
    onFieldChange("centerMode", "existing");
    onFieldChange("centerId", String(centerChoice.id));
    onFieldChange("centerSearchQuery", centerChoice.label);
    onFieldChange("centerProposalName", "");
    onFieldChange("centerProposalNotes", "");
  };

  return (
    <section className={fieldClassName}>
      <div className="user-publication-draft-form-page__center-header">
        <label htmlFor="user-publication-center-search">Centro</label>
        <p>
          Busca un centro existente o indica que no lo encuentras si la actividad
          necesita revision manual.
        </p>
      </div>

      <div className="user-publication-draft-form-page__center-modes">
        <button
          type="button"
          className={`user-publication-draft-form-page__center-mode ${
            centerMode === "existing"
              ? "user-publication-draft-form-page__center-mode--active"
              : ""
          }`}
          onClick={() => handleModeChange("existing")}
        >
          Centro existente
        </button>
        <button
          type="button"
          className={`user-publication-draft-form-page__center-mode ${
            centerMode === "proposed_new"
              ? "user-publication-draft-form-page__center-mode--active"
              : ""
          }`}
          onClick={() => handleModeChange("proposed_new")}
        >
          No encuentro el centro
        </button>
        <button
          type="button"
          className={`user-publication-draft-form-page__center-mode ${
            centerMode === "not_applicable"
              ? "user-publication-draft-form-page__center-mode--active"
              : ""
          }`}
          onClick={() => handleModeChange("not_applicable")}
        >
          No aplica
        </button>
      </div>

      {centerMode === "existing" ? (
        <div className="user-publication-draft-form-page__center-search">
          <Input
            id="user-publication-center-search"
            className="user-publication-draft-form-page__center-input"
            value={visibleSearchQuery}
            onChange={handleCenterSearchChange}
            placeholder="Escribe al menos 2 letras para buscar"
            autoComplete="off"
          />
          {!formState.centerId &&
          centerSearchQuery.length > 0 &&
          centerSearchQuery.length < CENTER_SEARCH_MIN_LENGTH ? (
            <p className="user-publication-draft-form-page__center-help">
              Escribe al menos 2 letras.
            </p>
          ) : null}
          {shouldShowCenterResults ? (
            <div className="user-publication-draft-form-page__center-results">
              {centerMatches.length > 0 ? (
                centerMatches.map((centerChoice) => (
                  <button
                    key={centerChoice.id}
                    type="button"
                    className="user-publication-draft-form-page__center-result"
                    onClick={() => handleSelectCenter(centerChoice)}
                  >
                    <span>{centerChoice.name}</span>
                    {centerChoice.cityName ? <small>{centerChoice.cityName}</small> : null}
                  </button>
                ))
              ) : (
                <p className="user-publication-draft-form-page__center-help">
                  No encontramos centros con ese texto.
                </p>
              )}
            </div>
          ) : null}
        </div>
      ) : null}

      {centerMode === "proposed_new" ? (
        <div className="user-publication-draft-form-page__center-proposal">
          <label htmlFor="user-publication-center-name">
            Nombre del centro
          </label>
          <Input
            id="user-publication-center-name"
            value={formState.centerProposalName || ""}
            onChange={(event) =>
              onFieldChange("centerProposalName", event.target.value)
            }
            placeholder="Nombre del centro, escuela o espacio"
          />
          <label htmlFor="user-publication-center-notes">
            Informacion adicional
          </label>
          <textarea
            id="user-publication-center-notes"
            className="user-publication-draft-form-page__center-notes"
            value={formState.centerProposalNotes || ""}
            onChange={(event) =>
              onFieldChange("centerProposalNotes", event.target.value)
            }
            placeholder="Direccion, web o cualquier pista que ayude a revisarlo."
          />
        </div>
      ) : null}

      {centerMode === "not_applicable" ? (
        <div className="user-publication-draft-form-page__center-proposal">
          <label htmlFor="user-publication-center-independent-notes">
            Nota opcional
          </label>
          <textarea
            id="user-publication-center-independent-notes"
            className="user-publication-draft-form-page__center-notes"
            value={formState.centerProposalNotes || ""}
            onChange={(event) =>
              onFieldChange("centerProposalNotes", event.target.value)
            }
            placeholder="Ej. actividad independiente en la playa."
          />
        </div>
      ) : null}
    </section>
  );
}

function FieldFeedbackList({ feedbackItems, summary }) {
  if (!summary && feedbackItems.length === 0) {
    return null;
  }

  return (
    <div className="user-publication-draft-form-page__feedback-box">
      {summary ? <p>{summary}</p> : null}
      {feedbackItems.length > 0 ? (
        <ul>
          {feedbackItems.map((item, index) => (
            <li key={`${item.reason_code || item.field}-${index}`}>
              {item.message}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function UserPublicationDraftFormPage({ mode }) {
  const isNewSubmission = mode === "new";
  const isCorrection = mode === "correction";
  let modeCopyKey = "edit";

  if (isNewSubmission) {
    modeCopyKey = "new";
  } else if (isCorrection) {
    modeCopyKey = "correction";
  }

  const navigate = useNavigate();
  const { activityId, draftId } = useParams();
  const { user } = useAuth();
  const { t } = useI18n();
  const [recordTitle, setRecordTitle] = useState("");
  const [formState, setFormState] = useState(() => mapDraftPayloadToFormState({}));
  const [feedbackItems, setFeedbackItems] = useState([]);
  const [feedbackSummary, setFeedbackSummary] = useState("");
  const [centerChoices, setCenterChoices] = useState([]);
  const [categoryChoices, setCategoryChoices] = useState([]);
  const [typeChoices, setTypeChoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState("");
  const [error, setError] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [formMessageTone, setFormMessageTone] = useState("success");

  useEffect(() => {
    let isMounted = true;

    const loadForm = async () => {
      setIsLoading(true);
      setError("");
      setFormMessage("");

      try {
        let recordPromise = Promise.resolve(null);

        if (!isNewSubmission) {
          recordPromise = isCorrection
            ? getMyActivityDraftForCorrection(draftId)
            : getMyActivityForEdit(activityId);
        }

        const [record, options] = await Promise.all([
          recordPromise,
          listMyPublicationFormOptions(),
        ]);

        if (!isMounted) {
          return;
        }

        if (isNewSubmission) {
          setRecordTitle("");
          setFormState({
            ...mapDraftPayloadToFormState({}),
            hasContactOptionsPayload: true,
          });
          setFeedbackSummary("");
          setFeedbackItems([]);
        } else {
          const nextPayload = isCorrection
            ? record.reviewedPayload
            : record.activityPayload;

          setRecordTitle(record.title);
          setFormState({
            ...mapDraftPayloadToFormState(nextPayload),
            sourceReferenceUrl: record.sourceReferenceUrl || "",
          });
          setFeedbackSummary(isCorrection ? record.userFeedbackSummary : "");
          setFeedbackItems(isCorrection ? record.userFeedbackJson : []);
        }

        setCenterChoices(options.centerChoices);
        setCategoryChoices(options.categoryChoices);
        setTypeChoices(options.typeChoices);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : t("userPublicationForm.loadErrorDescription"),
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadForm();

    return () => {
      isMounted = false;
    };
  }, [activityId, draftId, isCorrection, isNewSubmission, t]);

  useEffect(() => {
    if (!coverFile) {
      setCoverPreviewUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(coverFile);
    setCoverPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [coverFile]);

  const highlightedFields = useMemo(
    () => getFeedbackFieldKeys(feedbackItems),
    [feedbackItems],
  );

  const handleFieldChange = (fieldName, nextValue) => {
    setFormState((currentFormState) => ({
      ...currentFormState,
      [fieldName]: nextValue,
    }));
  };

  const handleImageFileChange = (nextFile) => {
    setFormMessage("");

    if (!nextFile) {
      setCoverFile(null);
      return;
    }

    const validationError = validateDraftCoverImageFile(nextFile);

    if (validationError) {
      setCoverFile(null);
      setFormMessageTone("error");
      setFormMessage(validationError);
      return;
    }

    setCoverFile(nextFile);
  };

  const handleSubmit = async () => {
    const validationError = validatePublicationForm(formState, t);

    if (validationError) {
      setFormMessageTone("error");
      setFormMessage(validationError);
      return;
    }

    setIsSubmitting(true);
    setFormMessage("");
    setError("");

    try {
      let nextFormState = formState;

      if (coverFile) {
        const imagePath = await uploadUserSubmissionCoverImage({
          userId: user?.id,
          file: coverFile,
        });
        nextFormState = {
          ...formState,
          imageUrl: imagePath,
        };
      }

      const reviewedPayload = mapFormStateToDraftPayload(nextFormState);

      if (isNewSubmission) {
        await createMyActivitySubmission({
          reviewedPayload,
          sourceReferenceUrl: formState.sourceReferenceUrl,
        });
        navigate("/perfil/publicaciones", {
          state: {
            userPublicationsMessage: t("userPublicationForm.new.success"),
          },
        });
        return;
      }

      if (isCorrection) {
        await resubmitMyActivityDraft({
          draftId,
          reviewedPayload,
          sourceReferenceUrl: formState.sourceReferenceUrl,
        });
        navigate("/perfil/publicaciones", {
          state: {
            userPublicationsMessage: t("userPublicationForm.correction.success"),
          },
        });
        return;
      }

      await createMyActivityEditDraft({
        activityId,
        reviewedPayload,
        sourceReferenceUrl: formState.sourceReferenceUrl,
      });
      navigate("/perfil/publicaciones", {
        state: {
          userPublicationsMessage: t("userPublicationForm.edit.success"),
        },
      });
    } catch (submitError) {
      setFormMessageTone("error");
      setFormMessage(
        submitError instanceof Error
          ? submitError.message
          : t("userPublicationForm.submitErrorDescription"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasFormOptions =
    categoryChoices.length > 0 && typeChoices.length > 0;

  return (
    <div className="user-publication-draft-form-page">
      <main className="user-publication-draft-form-page__main">
        <div className="page-container user-publication-draft-form-page__container">
          <header className="user-publication-draft-form-page__header">
            <Button
              variant="ghost"
              className="user-publication-draft-form-page__back-button"
              onClick={() => navigate("/perfil/publicaciones")}
            >
              <ArrowLeft />
              {t("userPublicationForm.back")}
            </Button>

            <div className="user-publication-draft-form-page__intro">
              <p className="user-publication-draft-form-page__eyebrow">
                {t(`userPublicationForm.${modeCopyKey}.eyebrow`)}
              </p>
              <h1 className="user-publication-draft-form-page__title">
                {t(`userPublicationForm.${modeCopyKey}.title`)}
              </h1>
              <p className="user-publication-draft-form-page__description">
                {recordTitle ||
                  t(`userPublicationForm.${modeCopyKey}.description`)}
              </p>
            </div>
          </header>

          {isLoading ? (
            <CatalogState
              icon={LoaderCircle}
              eyebrow={t("userPublicationForm.loadingEyebrow")}
              title={t("userPublicationForm.loadingTitle")}
              description={t("userPublicationForm.loadingDescription")}
            />
          ) : error ? (
            <CatalogState
              icon={AlertTriangle}
              eyebrow={t("userPublicationForm.errorEyebrow")}
              title={t("userPublicationForm.loadErrorTitle")}
              description={error}
              actionLabel={t("userPublicationForm.back")}
              onAction={() => navigate("/perfil/publicaciones")}
            />
          ) : !hasFormOptions ? (
            <CatalogState
              icon={SearchX}
              eyebrow={t("userPublicationForm.errorEyebrow")}
              title={t("userPublicationForm.noOptionsTitle")}
              description={t("userPublicationForm.noOptionsDescription")}
              actionLabel={t("userPublicationForm.back")}
              onAction={() => navigate("/perfil/publicaciones")}
            />
          ) : (
            <Card className="user-publication-draft-form-page__panel">
              <CardContent className="user-publication-draft-form-page__panel-content">
                {isCorrection ? (
                  <FieldFeedbackList
                    feedbackItems={feedbackItems}
                    summary={feedbackSummary}
                  />
                ) : isNewSubmission ? null : (
                  <p className="user-publication-draft-form-page__warning">
                    {t("userPublicationForm.edit.warning")}
                  </p>
                )}

                <ScoutDraftReviewForm
                  centerChoices={centerChoices}
                  categoryChoices={categoryChoices}
                  typeChoices={typeChoices}
                  formState={formState}
                  highlightedFields={highlightedFields}
                  imagePreviewSrc={
                    coverPreviewUrl ||
                    resolveActivityImagePreviewUrl(formState.imageUrl)
                  }
                  isImageUploadEnabled
                  onFieldChange={handleFieldChange}
                  onImageFileChange={handleImageFileChange}
                  priceMode="user"
                  centerFieldSlot={
                    <UserCenterDraftModeField
                      centerChoices={centerChoices}
                      formState={formState}
                      highlightedFields={highlightedFields}
                      onFieldChange={handleFieldChange}
                    />
                  }
                  showCenterField={false}
                  showImageUrlField={false}
                />

                {formMessage ? (
                  <p
                    className={`user-publication-draft-form-page__message user-publication-draft-form-page__message--${formMessageTone}`}
                    role={formMessageTone === "error" ? "alert" : "status"}
                  >
                    {formMessage}
                  </p>
                ) : null}

                <div className="user-publication-draft-form-page__actions">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/perfil/publicaciones")}
                    disabled={isSubmitting}
                  >
                    {t("userPublicationForm.cancel")}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      t("userPublicationForm.submitting")
                    ) : (
                      <>
                        <Save />
                        {t(`userPublicationForm.${modeCopyKey}.submit`)}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export function UserActivitySubmissionPage() {
  return <UserPublicationDraftFormPage mode="new" />;
}

export function UserPublicationCorrectionPage() {
  return <UserPublicationDraftFormPage mode="correction" />;
}

export function UserActivityEditRequestPage() {
  return <UserPublicationDraftFormPage mode="edit" />;
}
