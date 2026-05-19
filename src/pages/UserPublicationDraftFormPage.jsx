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
import { ScoutDraftReviewForm } from "@/features/scout-drafts/ScoutDraftReviewForm";
import { mapDraftPayloadToFormState } from "@/helpers/mapDraftPayloadToFormState";
import { mapFormStateToDraftPayload } from "@/helpers/mapFormStateToDraftPayload";
import { useI18n } from "@/i18n/useI18n";
import { resolveActivityImagePreviewUrl } from "@/services/internalDraftCoverImageService";
import {
  createMyActivityEditDraft,
  getMyActivityDraftForCorrection,
  getMyActivityForEdit,
  listMyPublicationFormOptions,
  resubmitMyActivityDraft,
} from "@/services/userPublicationsService";
import "./UserPublicationDraftFormPage.css";

function getTrimmedText(value) {
  return typeof value === "string" ? value.trim() : "";
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

  if (!getTrimmedText(formState.centerId)) {
    return t("userPublicationForm.validation.center");
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

  return "";
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
  const isCorrection = mode === "correction";
  const navigate = useNavigate();
  const { activityId, draftId } = useParams();
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
        const [record, options] = await Promise.all([
          isCorrection
            ? getMyActivityDraftForCorrection(draftId)
            : getMyActivityForEdit(activityId),
          listMyPublicationFormOptions(),
        ]);
        const nextPayload = isCorrection
          ? record.reviewedPayload
          : record.activityPayload;

        if (!isMounted) {
          return;
        }

        setRecordTitle(record.title);
        setFormState({
          ...mapDraftPayloadToFormState(nextPayload),
          sourceReferenceUrl: record.sourceReferenceUrl || "",
        });
        setFeedbackSummary(isCorrection ? record.userFeedbackSummary : "");
        setFeedbackItems(isCorrection ? record.userFeedbackJson : []);
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
  }, [activityId, draftId, isCorrection, t]);

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
      const reviewedPayload = mapFormStateToDraftPayload(formState);

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
    centerChoices.length > 0 && categoryChoices.length > 0 && typeChoices.length > 0;

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
                {isCorrection
                  ? t("userPublicationForm.correction.eyebrow")
                  : t("userPublicationForm.edit.eyebrow")}
              </p>
              <h1 className="user-publication-draft-form-page__title">
                {isCorrection
                  ? t("userPublicationForm.correction.title")
                  : t("userPublicationForm.edit.title")}
              </h1>
              <p className="user-publication-draft-form-page__description">
                {recordTitle ||
                  (isCorrection
                    ? t("userPublicationForm.correction.description")
                    : t("userPublicationForm.edit.description"))}
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
                ) : (
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
                  imagePreviewSrc={resolveActivityImagePreviewUrl(
                    formState.imageUrl,
                  )}
                  onFieldChange={handleFieldChange}
                  showSourceReferenceUrlField
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
                        {isCorrection
                          ? t("userPublicationForm.correction.submit")
                          : t("userPublicationForm.edit.submit")}
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

export function UserPublicationCorrectionPage() {
  return <UserPublicationDraftFormPage mode="correction" />;
}

export function UserActivityEditRequestPage() {
  return <UserPublicationDraftFormPage mode="edit" />;
}
