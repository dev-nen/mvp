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
          <label htmlFor="draft-title">Title</label>
          <Input
            id="draft-title"
            className="scout-draft-review-form__input"
            value={formState.title}
            onChange={(event) => onFieldChange("title", event.target.value)}
            disabled={isReadOnly}
          />
        </div>

        <div className="scout-draft-review-form__field scout-draft-review-form__field--full">
          <label htmlFor="draft-description">Description</label>
          <textarea
            id="draft-description"
            className="scout-draft-review-form__textarea"
            value={formState.description}
            onChange={(event) => onFieldChange("description", event.target.value)}
            disabled={isReadOnly}
          />
        </div>

        <div className="scout-draft-review-form__field">
          <label htmlFor="draft-center-id">Center</label>
          <select
            id="draft-center-id"
            className="scout-draft-review-form__select"
            value={formState.centerId}
            onChange={(event) => onFieldChange("centerId", event.target.value)}
            disabled={isReadOnly}
          >
            <option value="">Select a center</option>
            {centerChoices.map((centerChoice) => (
              <option key={centerChoice.id} value={centerChoice.id}>
                {centerChoice.label}
              </option>
            ))}
          </select>
        </div>

        <div className="scout-draft-review-form__field">
          <label htmlFor="draft-category-id">Category</label>
          <select
            id="draft-category-id"
            className="scout-draft-review-form__select"
            value={formState.categoryId}
            onChange={(event) => onFieldChange("categoryId", event.target.value)}
            disabled={isReadOnly}
          >
            <option value="">Select a category</option>
            {categoryChoices.map((categoryChoice) => (
              <option key={categoryChoice.id} value={categoryChoice.id}>
                {categoryChoice.name}
              </option>
            ))}
          </select>
        </div>

        <div className="scout-draft-review-form__field">
          <label htmlFor="draft-type-id">Type</label>
          <select
            id="draft-type-id"
            className="scout-draft-review-form__select"
            value={formState.typeId}
            onChange={(event) => onFieldChange("typeId", event.target.value)}
            disabled={isReadOnly}
          >
            <option value="">Select a type</option>
            {typeChoices.map((typeChoice) => (
              <option key={typeChoice.id} value={typeChoice.id}>
                {typeChoice.name}
              </option>
            ))}
          </select>
        </div>

        <div className="scout-draft-review-form__field">
          <label htmlFor="draft-image-url">Image URL</label>
          <Input
            id="draft-image-url"
            className="scout-draft-review-form__input"
            value={formState.imageUrl}
            onChange={(event) => onFieldChange("imageUrl", event.target.value)}
            disabled={isReadOnly}
          />
          <p className="scout-draft-review-form__hint">
            Empty values are normalized to the standard placeholder on approve.
          </p>
        </div>

        <div className="scout-draft-review-form__field">
          <label htmlFor="draft-age-rule-type">Age rule type</label>
          <select
            id="draft-age-rule-type"
            className="scout-draft-review-form__select"
            value={formState.ageRuleType}
            onChange={(event) => onFieldChange("ageRuleType", event.target.value)}
            disabled={isReadOnly}
          >
            <option value="all">All</option>
            <option value="range">Range</option>
            <option value="from">From</option>
            <option value="until">Until</option>
          </select>
        </div>

        <div className="scout-draft-review-form__field">
          <label htmlFor="draft-age-min">Age min</label>
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
          <label htmlFor="draft-age-max">Age max</label>
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
          <label htmlFor="draft-price-label">Price label</label>
          <Input
            id="draft-price-label"
            className="scout-draft-review-form__input"
            value={formState.priceLabel}
            onChange={(event) => onFieldChange("priceLabel", event.target.value)}
            disabled={isReadOnly}
          />
        </div>

        <div className="scout-draft-review-form__field">
          <label htmlFor="draft-is-free">Is free</label>
          <select
            id="draft-is-free"
            className="scout-draft-review-form__select"
            value={formState.isFree}
            onChange={(event) => onFieldChange("isFree", event.target.value)}
            disabled={isReadOnly}
          >
            <option value="false">Paid or unknown</option>
            <option value="true">Free</option>
          </select>
        </div>

        <div className="scout-draft-review-form__field scout-draft-review-form__field--full">
          <label htmlFor="draft-schedule-label">Schedule</label>
          <Input
            id="draft-schedule-label"
            className="scout-draft-review-form__input"
            value={formState.scheduleLabel}
            onChange={(event) => onFieldChange("scheduleLabel", event.target.value)}
            disabled={isReadOnly}
          />
        </div>

        <div className="scout-draft-review-form__field">
          <label htmlFor="draft-venue-name">Venue name</label>
          <Input
            id="draft-venue-name"
            className="scout-draft-review-form__input"
            value={formState.venueName}
            onChange={(event) => onFieldChange("venueName", event.target.value)}
            disabled={isReadOnly}
          />
        </div>

        <div className="scout-draft-review-form__field">
          <label htmlFor="draft-venue-postal-code">Venue postal code</label>
          <Input
            id="draft-venue-postal-code"
            className="scout-draft-review-form__input"
            value={formState.venuePostalCode}
            onChange={(event) => onFieldChange("venuePostalCode", event.target.value)}
            disabled={isReadOnly}
          />
        </div>

        <div className="scout-draft-review-form__field scout-draft-review-form__field--full">
          <label htmlFor="draft-venue-address-1">Venue address 1</label>
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
