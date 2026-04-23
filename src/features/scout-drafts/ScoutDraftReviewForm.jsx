import { Input } from "@/components/ui/input";
import "./ScoutDraftReviewForm.css";

export function ScoutDraftReviewForm({
  categoryChoices,
  centerChoices,
  formState,
  isReadOnly = false,
  onFieldChange,
  typeChoices,
}) {
  return (
    <div className="scout-draft-review-form">
      <div className="scout-draft-review-form__grid">
        <div className="scout-draft-review-form__field scout-draft-review-form__field--full">
          <label htmlFor="draft-title">Título</label>
          <Input
            id="draft-title"
            className="scout-draft-review-form__input"
            value={formState.title}
            onChange={(event) => onFieldChange("title", event.target.value)}
            disabled={isReadOnly}
          />
        </div>

        <div className="scout-draft-review-form__field scout-draft-review-form__field--full">
          <label htmlFor="draft-description">Descripción</label>
          <textarea
            id="draft-description"
            className="scout-draft-review-form__textarea"
            value={formState.description}
            onChange={(event) => onFieldChange("description", event.target.value)}
            disabled={isReadOnly}
          />
        </div>

        <div className="scout-draft-review-form__field">
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

        <div className="scout-draft-review-form__field">
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

        <div className="scout-draft-review-form__field">
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

        <div className="scout-draft-review-form__field">
          <label htmlFor="draft-image-url">URL de imagen</label>
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

        <div className="scout-draft-review-form__field">
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

        <div className="scout-draft-review-form__field">
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

        <div className="scout-draft-review-form__field">
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

        <div className="scout-draft-review-form__field">
          <label htmlFor="draft-price-label">Texto de precio</label>
          <Input
            id="draft-price-label"
            className="scout-draft-review-form__input"
            value={formState.priceLabel}
            onChange={(event) => onFieldChange("priceLabel", event.target.value)}
            disabled={isReadOnly}
          />
        </div>

        <div className="scout-draft-review-form__field">
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

        <div className="scout-draft-review-form__field scout-draft-review-form__field--full">
          <label htmlFor="draft-schedule-label">Horario</label>
          <Input
            id="draft-schedule-label"
            className="scout-draft-review-form__input"
            value={formState.scheduleLabel}
            onChange={(event) => onFieldChange("scheduleLabel", event.target.value)}
            disabled={isReadOnly}
          />
        </div>

        <div className="scout-draft-review-form__field">
          <label htmlFor="draft-venue-name">Nombre del lugar</label>
          <Input
            id="draft-venue-name"
            className="scout-draft-review-form__input"
            value={formState.venueName}
            onChange={(event) => onFieldChange("venueName", event.target.value)}
            disabled={isReadOnly}
          />
        </div>

        <div className="scout-draft-review-form__field">
          <label htmlFor="draft-venue-postal-code">Código postal</label>
          <Input
            id="draft-venue-postal-code"
            className="scout-draft-review-form__input"
            value={formState.venuePostalCode}
            onChange={(event) => onFieldChange("venuePostalCode", event.target.value)}
            disabled={isReadOnly}
          />
        </div>

        <div className="scout-draft-review-form__field scout-draft-review-form__field--full">
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
