import { useRef } from "react";
import {
  Bold,
  Heading3,
  ImagePlus,
  Italic,
  Link,
  List,
  ListOrdered,
  Plus,
  Trash2,
} from "lucide-react";
import { SafeMarkdown } from "@/components/ui/SafeMarkdown";
import { Input } from "@/components/ui/input";
import {
  CONTACT_OPTION_TYPE_CHOICES,
  createEmptyContactOption,
  normalizeContactOptionForPayload,
} from "@/helpers/contactOptions";
import "./ScoutDraftReviewForm.css";

function getTextSelection(textareaElement) {
  if (!textareaElement) {
    return {
      end: 0,
      selectedText: "",
      start: 0,
    };
  }

  const start = textareaElement.selectionStart ?? 0;
  const end = textareaElement.selectionEnd ?? start;

  return {
    end,
    selectedText: textareaElement.value.slice(start, end),
    start,
  };
}

function replaceSelection(value, start, end, nextText) {
  return `${value.slice(0, start)}${nextText}${value.slice(end)}`;
}

export function ScoutDraftReviewForm({
  categoryChoices,
  centerChoices,
  formState,
  highlightedFields = [],
  imagePreviewSrc = "",
  isImageUploadEnabled = false,
  isReadOnly = false,
  onFieldChange,
  onImageFileChange,
  showContactOptionsField = true,
  showImageUrlField = true,
  showSourceReferenceUrlField = false,
  typeChoices,
}) {
  const descriptionRef = useRef(null);
  const isMarkdownDescription = formState.descriptionFormat === "markdown";
  const highlightedFieldSet = new Set(highlightedFields);
  const contactOptions = Array.isArray(formState.contactOptions)
    ? formState.contactOptions
    : [];

  const getFieldClassName = (fieldName, extraClassName = "") =>
    [
      "scout-draft-review-form__field",
      extraClassName,
      highlightedFieldSet.has(fieldName)
        ? "scout-draft-review-form__field--highlighted"
        : "",
    ]
      .filter(Boolean)
      .join(" ");

  const applyMarkdownSnippet = (kind) => {
    if (isReadOnly || !isMarkdownDescription) {
      return;
    }

    const textareaElement = descriptionRef.current;
    const { end, selectedText, start } = getTextSelection(textareaElement);
    const currentValue = formState.description || "";
    const fallbackText = selectedText || "texto";
    let nextText = fallbackText;

    if (kind === "bold") {
      nextText = `**${fallbackText}**`;
    } else if (kind === "italic") {
      nextText = `*${fallbackText}*`;
    } else if (kind === "heading") {
      nextText = `### ${selectedText || "Título"}`;
    } else if (kind === "bullets") {
      nextText = (selectedText || "Elemento")
        .split("\n")
        .map((line) => `- ${line || "Elemento"}`)
        .join("\n");
    } else if (kind === "numbers") {
      nextText = (selectedText || "Elemento")
        .split("\n")
        .map((line, index) => `${index + 1}. ${line || "Elemento"}`)
        .join("\n");
    } else if (kind === "link") {
      nextText = `[${fallbackText}](https://)`;
    }

    onFieldChange("description", replaceSelection(currentValue, start, end, nextText));
  };

  const handleAddContactOption = () => {
    if (isReadOnly) {
      return;
    }

    onFieldChange("contactOptionsTouched", true);
    onFieldChange("contactOptions", [
      ...contactOptions,
      createEmptyContactOption(),
    ]);
  };

  const handleRemoveContactOption = (index) => {
    if (isReadOnly) {
      return;
    }

    onFieldChange("contactOptionsTouched", true);
    onFieldChange(
      "contactOptions",
      contactOptions.filter((_, optionIndex) => optionIndex !== index),
    );
  };

  const handleContactOptionChange = (index, fieldName, nextValue) => {
    if (isReadOnly) {
      return;
    }

    onFieldChange("contactOptionsTouched", true);
    onFieldChange(
      "contactOptions",
      contactOptions.map((contactOption, optionIndex) =>
        optionIndex === index
          ? {
              ...contactOption,
              [fieldName]: nextValue,
            }
          : contactOption,
      ),
    );
  };

  return (
    <div className="scout-draft-review-form">
      <div className="scout-draft-review-form__grid">
        <div className={getFieldClassName("title", "scout-draft-review-form__field--full")}>
          <label htmlFor="draft-title">Título</label>
          <Input
            id="draft-title"
            className="scout-draft-review-form__input"
            value={formState.title}
            onChange={(event) => onFieldChange("title", event.target.value)}
            disabled={isReadOnly}
          />
        </div>

        <div className={getFieldClassName("descriptionFormat")}>
          <label htmlFor="draft-description-format">Formato de descripción</label>
          <select
            id="draft-description-format"
            className="scout-draft-review-form__select"
            value={formState.descriptionFormat}
            onChange={(event) => onFieldChange("descriptionFormat", event.target.value)}
            disabled={isReadOnly}
          >
            <option value="markdown">Markdown</option>
            <option value="plain">Texto plano</option>
          </select>
        </div>

        <div className={getFieldClassName("description", "scout-draft-review-form__field--full")}>
          <div className="scout-draft-review-form__label-row">
            <label htmlFor="draft-description">Descripción larga</label>
            {isMarkdownDescription ? (
              <div
                className="scout-draft-review-form__toolbar"
                aria-label="Formato Markdown"
              >
                <button
                  type="button"
                  onClick={() => applyMarkdownSnippet("bold")}
                  disabled={isReadOnly}
                  aria-label="Negrita"
                >
                  <Bold />
                </button>
                <button
                  type="button"
                  onClick={() => applyMarkdownSnippet("italic")}
                  disabled={isReadOnly}
                  aria-label="Cursiva"
                >
                  <Italic />
                </button>
                <button
                  type="button"
                  onClick={() => applyMarkdownSnippet("heading")}
                  disabled={isReadOnly}
                  aria-label="Encabezado"
                >
                  <Heading3 />
                </button>
                <button
                  type="button"
                  onClick={() => applyMarkdownSnippet("bullets")}
                  disabled={isReadOnly}
                  aria-label="Lista"
                >
                  <List />
                </button>
                <button
                  type="button"
                  onClick={() => applyMarkdownSnippet("numbers")}
                  disabled={isReadOnly}
                  aria-label="Lista numerada"
                >
                  <ListOrdered />
                </button>
                <button
                  type="button"
                  onClick={() => applyMarkdownSnippet("link")}
                  disabled={isReadOnly}
                  aria-label="Enlace"
                >
                  <Link />
                </button>
              </div>
            ) : null}
          </div>
          <textarea
            ref={descriptionRef}
            id="draft-description"
            className="scout-draft-review-form__textarea"
            value={formState.description}
            onChange={(event) => onFieldChange("description", event.target.value)}
            disabled={isReadOnly}
          />
          <p className="scout-draft-review-form__hint">
            Puedes usar formato simple en la descripción: negrita, listas y enlaces.
          </p>
        </div>

        <div className="scout-draft-review-form__field scout-draft-review-form__field--full">
          <span className="scout-draft-review-form__preview-label">
            Preview de descripción
          </span>
          <div className="scout-draft-review-form__description-preview">
            {isMarkdownDescription ? (
              <SafeMarkdown content={formState.description} />
            ) : (
              <p>{formState.description || "Sin descripción todavía."}</p>
            )}
          </div>
        </div>

        {isImageUploadEnabled ? (
          <div className={getFieldClassName("imageUrl", "scout-draft-review-form__field--full")}>
            <label htmlFor="draft-cover-image">Imagen principal</label>
            <label className="scout-draft-review-form__file-drop" htmlFor="draft-cover-image">
              <ImagePlus />
              <span>Seleccionar imagen JPG, PNG o WebP</span>
              <input
                id="draft-cover-image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => onImageFileChange?.(event.target.files?.[0] ?? null)}
                disabled={isReadOnly}
              />
            </label>
          </div>
        ) : null}

        {showImageUrlField ? (
          <div className={getFieldClassName("imageUrl")}>
            <label htmlFor="draft-image-url">Referencia de imagen</label>
            <Input
              id="draft-image-url"
              className="scout-draft-review-form__input"
              value={formState.imageUrl}
              onChange={(event) => onFieldChange("imageUrl", event.target.value)}
              disabled={isReadOnly}
            />
            <p className="scout-draft-review-form__hint">
              Los valores vacíos se normalizan al placeholder estándar al publicar o guardar.
            </p>
          </div>
        ) : null}

        {showSourceReferenceUrlField ? (
          <div className={getFieldClassName("sourceReferenceUrl")}>
            <label htmlFor="draft-source-reference-url">Enlace de referencia</label>
            <Input
              id="draft-source-reference-url"
              className="scout-draft-review-form__input"
              value={formState.sourceReferenceUrl || ""}
              onChange={(event) =>
                onFieldChange("sourceReferenceUrl", event.target.value)
              }
              disabled={isReadOnly}
            />
          </div>
        ) : null}

        {imagePreviewSrc ? (
          <div className="scout-draft-review-form__field scout-draft-review-form__field--full">
            <span className="scout-draft-review-form__preview-label">
              Preview de imagen
            </span>
            <div className="scout-draft-review-form__image-preview">
              <img src={imagePreviewSrc} alt="Preview de imagen principal" />
            </div>
          </div>
        ) : null}

        {showContactOptionsField ? (
          <div className={getFieldClassName("contactOptions", "scout-draft-review-form__field--full")}>
            <div className="scout-draft-review-form__contact-header">
              <div>
                <span className="scout-draft-review-form__preview-label">
                  Opciones de contacto
                </span>
                <p className="scout-draft-review-form__hint">
                  Estos contactos se revisan antes de publicarse.
                </p>
              </div>
              <button
                type="button"
                className="scout-draft-review-form__contact-add"
                onClick={handleAddContactOption}
                disabled={isReadOnly}
              >
                <Plus />
                Anadir contacto
              </button>
            </div>

            {contactOptions.length === 0 ? (
              <p className="scout-draft-review-form__contact-empty">
                Sin contactos en este draft.
              </p>
            ) : (
              <div className="scout-draft-review-form__contact-list">
                {contactOptions.map((contactOption, index) => {
                  const normalizedContact =
                    normalizeContactOptionForPayload(contactOption);
                  const contactError =
                    contactOption.value || contactOption.label
                      ? normalizedContact.error
                      : "";

                  return (
                    <div
                      key={`contact-option-${index}`}
                      className="scout-draft-review-form__contact-row"
                    >
                      <div className="scout-draft-review-form__contact-grid">
                        <label>
                          Tipo
                          <select
                            className="scout-draft-review-form__select"
                            value={contactOption.type || "whatsapp"}
                            onChange={(event) =>
                              handleContactOptionChange(
                                index,
                                "type",
                                event.target.value,
                              )
                            }
                            disabled={isReadOnly}
                          >
                            {CONTACT_OPTION_TYPE_CHOICES.map((choice) => (
                              <option key={choice.value} value={choice.value}>
                                {choice.label}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label>
                          Valor
                          <Input
                            className="scout-draft-review-form__input"
                            value={contactOption.value || ""}
                            onChange={(event) =>
                              handleContactOptionChange(
                                index,
                                "value",
                                event.target.value,
                              )
                            }
                            disabled={isReadOnly}
                            placeholder={
                              contactOption.type === "instagram"
                                ? "@usuario o URL de Instagram"
                                : "Telefono, email o enlace"
                            }
                          />
                        </label>

                        <label>
                          Etiqueta
                          <Input
                            className="scout-draft-review-form__input"
                            value={contactOption.label || ""}
                            onChange={(event) =>
                              handleContactOptionChange(
                                index,
                                "label",
                                event.target.value,
                              )
                            }
                            disabled={isReadOnly}
                            placeholder="Opcional"
                          />
                        </label>
                      </div>

                      <div className="scout-draft-review-form__contact-footer">
                        <label className="scout-draft-review-form__contact-primary">
                          <input
                            type="checkbox"
                            checked={contactOption.isPrimary === true}
                            onChange={(event) =>
                              handleContactOptionChange(
                                index,
                                "isPrimary",
                                event.target.checked,
                              )
                            }
                            disabled={isReadOnly}
                          />
                          Principal
                        </label>

                        {contactError ? (
                          <p className="scout-draft-review-form__contact-error">
                            {contactError}
                          </p>
                        ) : normalizedContact.contactOption ? (
                          <p className="scout-draft-review-form__contact-preview">
                            {normalizedContact.contactOption.url}
                          </p>
                        ) : null}

                        <button
                          type="button"
                          className="scout-draft-review-form__contact-remove"
                          onClick={() => handleRemoveContactOption(index)}
                          disabled={isReadOnly}
                          aria-label="Quitar contacto"
                        >
                          <Trash2 />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}

        <div className={getFieldClassName("centerId")}>
          <label htmlFor="draft-center-id">Centro</label>
          <select
            id="draft-center-id"
            className="scout-draft-review-form__select"
            value={formState.centerId}
            onChange={(event) => onFieldChange("centerId", event.target.value)}
            disabled={isReadOnly}
          >
            <option value="">Selecciona un centro</option>
            {centerChoices.map((centerChoice) => (
              <option key={centerChoice.id} value={centerChoice.id}>
                {centerChoice.label}
              </option>
            ))}
          </select>
        </div>

        <div className={getFieldClassName("categoryId")}>
          <label htmlFor="draft-category-id">Categoría</label>
          <select
            id="draft-category-id"
            className="scout-draft-review-form__select"
            value={formState.categoryId}
            onChange={(event) => onFieldChange("categoryId", event.target.value)}
            disabled={isReadOnly}
          >
            <option value="">Selecciona una categoría</option>
            {categoryChoices.map((categoryChoice) => (
              <option key={categoryChoice.id} value={categoryChoice.id}>
                {categoryChoice.name}
              </option>
            ))}
          </select>
        </div>

        <div className={getFieldClassName("typeId")}>
          <label htmlFor="draft-type-id">Tipo</label>
          <select
            id="draft-type-id"
            className="scout-draft-review-form__select"
            value={formState.typeId}
            onChange={(event) => onFieldChange("typeId", event.target.value)}
            disabled={isReadOnly}
          >
            <option value="">Selecciona un tipo</option>
            {typeChoices.map((typeChoice) => (
              <option key={typeChoice.id} value={typeChoice.id}>
                {typeChoice.name}
              </option>
            ))}
          </select>
        </div>

        <div className={getFieldClassName("ageRuleType")}>
          <label htmlFor="draft-age-rule-type">Regla de edad</label>
          <select
            id="draft-age-rule-type"
            className="scout-draft-review-form__select"
            value={formState.ageRuleType}
            onChange={(event) => onFieldChange("ageRuleType", event.target.value)}
            disabled={isReadOnly}
          >
            <option value="all">Todas</option>
            <option value="range">Rango</option>
            <option value="from">Desde</option>
            <option value="until">Hasta</option>
          </select>
        </div>

        <div className={getFieldClassName("ageMin")}>
          <label htmlFor="draft-age-min">Edad mínima</label>
          <Input
            id="draft-age-min"
            type="number"
            className="scout-draft-review-form__input"
            value={formState.ageMin}
            onChange={(event) => onFieldChange("ageMin", event.target.value)}
            disabled={isReadOnly}
          />
        </div>

        <div className={getFieldClassName("ageMax")}>
          <label htmlFor="draft-age-max">Edad máxima</label>
          <Input
            id="draft-age-max"
            type="number"
            className="scout-draft-review-form__input"
            value={formState.ageMax}
            onChange={(event) => onFieldChange("ageMax", event.target.value)}
            disabled={isReadOnly}
          />
        </div>

        <div className={getFieldClassName("priceLabel")}>
          <label htmlFor="draft-price-label">Texto de precio</label>
          <Input
            id="draft-price-label"
            className="scout-draft-review-form__input"
            value={formState.priceLabel}
            onChange={(event) => onFieldChange("priceLabel", event.target.value)}
            disabled={isReadOnly}
          />
        </div>

        <div className={getFieldClassName("isFree")}>
          <label htmlFor="draft-is-free">Gratuidad</label>
          <select
            id="draft-is-free"
            className="scout-draft-review-form__select"
            value={formState.isFree}
            onChange={(event) => onFieldChange("isFree", event.target.value)}
            disabled={isReadOnly}
          >
            <option value="false">De pago o sin confirmar</option>
            <option value="true">Gratuita</option>
          </select>
        </div>

        <div className={getFieldClassName("scheduleLabel", "scout-draft-review-form__field--full")}>
          <label htmlFor="draft-schedule-label">Horario</label>
          <Input
            id="draft-schedule-label"
            className="scout-draft-review-form__input"
            value={formState.scheduleLabel}
            onChange={(event) => onFieldChange("scheduleLabel", event.target.value)}
            disabled={isReadOnly}
          />
        </div>

        <div className={getFieldClassName("venueName")}>
          <label htmlFor="draft-venue-name">Nombre del lugar</label>
          <Input
            id="draft-venue-name"
            className="scout-draft-review-form__input"
            value={formState.venueName}
            onChange={(event) => onFieldChange("venueName", event.target.value)}
            disabled={isReadOnly}
          />
        </div>

        <div className={getFieldClassName("venuePostalCode")}>
          <label htmlFor="draft-venue-postal-code">Código postal</label>
          <Input
            id="draft-venue-postal-code"
            className="scout-draft-review-form__input"
            value={formState.venuePostalCode}
            onChange={(event) => onFieldChange("venuePostalCode", event.target.value)}
            disabled={isReadOnly}
          />
        </div>

        <div className={getFieldClassName("venueAddress1", "scout-draft-review-form__field--full")}>
          <label htmlFor="draft-venue-address-1">Dirección</label>
          <Input
            id="draft-venue-address-1"
            className="scout-draft-review-form__input"
            value={formState.venueAddress1}
            onChange={(event) => onFieldChange("venueAddress1", event.target.value)}
            disabled={isReadOnly}
          />
        </div>
      </div>
    </div>
  );
}
