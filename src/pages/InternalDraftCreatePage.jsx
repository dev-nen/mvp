import { AlertTriangle, ArrowLeft, LoaderCircle, Save, SearchX } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { CatalogState } from "@/components/states/CatalogState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScoutDraftReviewForm } from "@/features/scout-drafts/ScoutDraftReviewForm";
import { normalizeContactOptionsForPayload } from "@/helpers/contactOptions";
import { getDefaultDraftFormState } from "@/helpers/mapDraftPayloadToFormState";
import { mapFormStateToDraftPayload } from "@/helpers/mapFormStateToDraftPayload";
import { useAuth } from "@/hooks/useAuth";
import {
  createInternalDraft,
  listDraftCategories,
  listDraftCenters,
  listDraftTypes,
  saveInternalDraftReview,
} from "@/services/internalDraftsService";
import {
  uploadDraftCoverImage,
  validateDraftCoverImageFile,
} from "@/services/internalDraftCoverImageService";
import "./InternalDraftCreatePage.css";

function getTrimmedText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function validateCreateDraftForm(formState) {
  if (!getTrimmedText(formState.title)) {
    return "El título es obligatorio.";
  }

  if (!getTrimmedText(formState.description)) {
    return "La descripción larga es obligatoria.";
  }

  if (!getTrimmedText(formState.centerId)) {
    return "El centro es obligatorio.";
  }

  if (!getTrimmedText(formState.categoryId)) {
    return "La categoría es obligatoria.";
  }

  if (!getTrimmedText(formState.typeId)) {
    return "El tipo es obligatorio.";
  }

  if (!getTrimmedText(formState.scheduleLabel)) {
    return "El horario es obligatorio.";
  }

  if (
    formState.ageRuleType === "range" &&
    (!getTrimmedText(formState.ageMin) || !getTrimmedText(formState.ageMax))
  ) {
    return "La regla de edad rango necesita edad mínima y máxima.";
  }

  if (formState.ageRuleType === "from" && !getTrimmedText(formState.ageMin)) {
    return "La regla de edad desde necesita edad mínima.";
  }

  if (formState.ageRuleType === "until" && !getTrimmedText(formState.ageMax)) {
    return "La regla de edad hasta necesita edad máxima.";
  }

  const { errors } = normalizeContactOptionsForPayload(formState.contactOptions);

  if (errors.length > 0) {
    return errors[0].message;
  }

  return "";
}

export function InternalDraftCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formState, setFormState] = useState(() => ({
    ...getDefaultDraftFormState(),
    descriptionFormat: "markdown",
  }));
  const [centerChoices, setCenterChoices] = useState([]);
  const [categoryChoices, setCategoryChoices] = useState([]);
  const [typeChoices, setTypeChoices] = useState([]);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState("");
  const [createdDraftId, setCreatedDraftId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackTone, setFeedbackTone] = useState("success");

  useEffect(() => {
    let isMounted = true;

    const loadReferenceData = async () => {
      setIsLoading(true);
      setLoadError("");

      try {
        const [nextCenters, nextCategories, nextTypes] = await Promise.all([
          listDraftCenters(),
          listDraftCategories(),
          listDraftTypes(),
        ]);

        if (!isMounted) {
          return;
        }

        setCenterChoices(nextCenters);
        setCategoryChoices(nextCategories);
        setTypeChoices(nextTypes);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setLoadError(
          error instanceof Error
            ? error.message
            : "No pudimos cargar las referencias del formulario.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadReferenceData();

    return () => {
      isMounted = false;
    };
  }, []);

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

  const handleFieldChange = (fieldName, nextValue) => {
    setFormState((currentFormState) => ({
      ...currentFormState,
      [fieldName]: nextValue,
    }));
  };

  const handleImageFileChange = (nextFile) => {
    setFeedbackMessage("");

    if (!nextFile) {
      setCoverFile(null);
      return;
    }

    const validationError = validateDraftCoverImageFile(nextFile);

    if (validationError) {
      setCoverFile(null);
      setFeedbackTone("error");
      setFeedbackMessage(validationError);
      return;
    }

    setCoverFile(nextFile);
  };

  const handleSaveDraft = async () => {
    const validationError = validateCreateDraftForm(formState);

    if (validationError) {
      setFeedbackTone("error");
      setFeedbackMessage(validationError);
      return;
    }

    setIsSaving(true);
    setFeedbackMessage("");

    try {
      const draft =
        createdDraftId === null
          ? await createInternalDraft({
              createdByUserId: user?.id,
              reviewedPayload: mapFormStateToDraftPayload(formState),
              sourceLabel: getTrimmedText(formState.title),
            })
          : { id: createdDraftId };
      let nextFormState = formState;

      setCreatedDraftId(draft.id);

      if (coverFile) {
        const imagePath = await uploadDraftCoverImage({
          draftId: draft.id,
          file: coverFile,
        });
        nextFormState = {
          ...formState,
          imageUrl: imagePath,
        };
      }

      await saveInternalDraftReview({
        draftId: draft.id,
        reviewedPayload: mapFormStateToDraftPayload(nextFormState),
        reviewNotes: "",
      });

      navigate(`/internal/drafts/${draft.id}`);
    } catch (error) {
      setFeedbackTone("error");
      setFeedbackMessage(
        error instanceof Error
          ? error.message
          : "No pudimos guardar la nueva actividad como draft.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="internal-draft-create-page">
      <main className="internal-draft-create-page__main">
        <div className="page-container internal-draft-create-page__container">
          <header className="internal-draft-create-page__header">
            <Button
              variant="ghost"
              className="internal-draft-create-page__back-button"
              onClick={() => navigate("/internal/drafts")}
            >
              <ArrowLeft />
              Volver al Draft Inbox
            </Button>

            <div className="internal-draft-create-page__intro">
              <p className="internal-draft-create-page__eyebrow">
                Uso interno | Nueva actividad
              </p>
              <h2 className="internal-draft-create-page__title">
                Nueva actividad
              </h2>
              <p className="internal-draft-create-page__description">
                Crea un draft interno con la información publicable. La actividad
                no entra en catálogo hasta pasar por la revisión y aprobación del
                Draft Inbox.
              </p>
            </div>
          </header>

          {isLoading ? (
            <CatalogState
              icon={LoaderCircle}
              eyebrow="Nueva actividad"
              title="Cargando formulario interno"
              description="Estamos preparando centros, categorías y tipos disponibles."
            />
          ) : loadError ? (
            <CatalogState
              icon={AlertTriangle}
              eyebrow="Error"
              title="No pudimos cargar el formulario"
              description={loadError}
              actionLabel="Volver al inbox"
              onAction={() => navigate("/internal/drafts")}
            />
          ) : centerChoices.length === 0 ? (
            <CatalogState
              icon={SearchX}
              eyebrow="Sin centros"
              title="No hay centros disponibles"
              description="El alta interna necesita elegir un centro activo antes de crear un draft publicable."
              actionLabel="Volver al inbox"
              onAction={() => navigate("/internal/drafts")}
            />
          ) : (
            <Card className="internal-draft-create-page__panel">
              <CardContent className="internal-draft-create-page__panel-content">
                <ScoutDraftReviewForm
                  centerChoices={centerChoices}
                  categoryChoices={categoryChoices}
                  typeChoices={typeChoices}
                  formState={formState}
                  imagePreviewSrc={coverPreviewUrl}
                  isImageUploadEnabled
                  onFieldChange={handleFieldChange}
                  onImageFileChange={handleImageFileChange}
                  showImageUrlField={false}
                />

                {feedbackMessage ? (
                  <p
                    className={`internal-draft-create-page__feedback internal-draft-create-page__feedback--${feedbackTone}`}
                    role={feedbackTone === "error" ? "alert" : "status"}
                  >
                    {feedbackMessage}
                  </p>
                ) : null}

                <div className="internal-draft-create-page__actions">
                  <Button
                    variant="outline"
                    onClick={() => navigate("/internal/drafts")}
                    disabled={isSaving}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveDraft} disabled={isSaving}>
                    {isSaving ? (
                      "Guardando..."
                    ) : (
                      <>
                        <Save />
                        Guardar draft
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
