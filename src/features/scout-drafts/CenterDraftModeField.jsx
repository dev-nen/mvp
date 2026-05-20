import { Input } from "@/components/ui/input";
import "./CenterDraftModeField.css";

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

export function CenterDraftModeField({
  centerChoices,
  formState,
  highlightedFields = [],
  idPrefix = "draft-center",
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
  const centerMatches = shouldShowCenterResults
    ? centerChoices
        .filter((centerChoice) =>
          getNormalizedSearchText(
            `${centerChoice.label} ${centerChoice.name} ${centerChoice.cityName}`,
          ).includes(normalizedCenterQuery),
        )
        .slice(0, CENTER_SEARCH_MAX_RESULTS)
    : [];
  const isHighlighted = highlightedFields.includes("centerId");
  const searchInputId = `${idPrefix}-search`;
  const proposalNameId = `${idPrefix}-proposal-name`;
  const proposalNotesId = `${idPrefix}-proposal-notes`;
  const independentNotesId = `${idPrefix}-independent-notes`;

  const fieldClassName = [
    "center-draft-mode-field",
    isHighlighted ? "center-draft-mode-field--highlighted" : "",
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
      <div className="center-draft-mode-field__header">
        <label htmlFor={searchInputId}>Centro</label>
        <p>
          Busca un centro existente o indica que no lo encuentras si la actividad
          necesita revisión manual.
        </p>
      </div>

      <div className="center-draft-mode-field__modes">
        <button
          type="button"
          className={`center-draft-mode-field__mode ${
            centerMode === "existing" ? "center-draft-mode-field__mode--active" : ""
          }`}
          onClick={() => handleModeChange("existing")}
        >
          Centro existente
        </button>
        <button
          type="button"
          className={`center-draft-mode-field__mode ${
            centerMode === "proposed_new"
              ? "center-draft-mode-field__mode--active"
              : ""
          }`}
          onClick={() => handleModeChange("proposed_new")}
        >
          No encuentro el centro
        </button>
        <button
          type="button"
          className={`center-draft-mode-field__mode ${
            centerMode === "not_applicable"
              ? "center-draft-mode-field__mode--active"
              : ""
          }`}
          onClick={() => handleModeChange("not_applicable")}
        >
          No aplica
        </button>
      </div>

      {centerMode === "existing" ? (
        <div className="center-draft-mode-field__search">
          <Input
            id={searchInputId}
            className="center-draft-mode-field__input"
            value={visibleSearchQuery}
            onChange={handleCenterSearchChange}
            placeholder="Escribe al menos 2 letras para buscar"
            autoComplete="off"
          />
          {!formState.centerId &&
          centerSearchQuery.length > 0 &&
          centerSearchQuery.length < CENTER_SEARCH_MIN_LENGTH ? (
            <p className="center-draft-mode-field__help">
              Escribe al menos 2 letras.
            </p>
          ) : null}
          {shouldShowCenterResults ? (
            <div className="center-draft-mode-field__results">
              {centerMatches.length > 0 ? (
                centerMatches.map((centerChoice) => (
                  <button
                    key={centerChoice.id}
                    type="button"
                    className="center-draft-mode-field__result"
                    onClick={() => handleSelectCenter(centerChoice)}
                  >
                    <span>{centerChoice.name}</span>
                    {centerChoice.cityName ? <small>{centerChoice.cityName}</small> : null}
                  </button>
                ))
              ) : (
                <p className="center-draft-mode-field__help">
                  No encontramos centros con ese texto.
                </p>
              )}
            </div>
          ) : null}
        </div>
      ) : null}

      {centerMode === "proposed_new" ? (
        <div className="center-draft-mode-field__proposal">
          <label htmlFor={proposalNameId}>Nombre del centro</label>
          <Input
            id={proposalNameId}
            value={formState.centerProposalName || ""}
            onChange={(event) =>
              onFieldChange("centerProposalName", event.target.value)
            }
            placeholder="Nombre del centro, escuela o espacio"
          />
          <label htmlFor={proposalNotesId}>Información adicional</label>
          <textarea
            id={proposalNotesId}
            className="center-draft-mode-field__notes"
            value={formState.centerProposalNotes || ""}
            onChange={(event) =>
              onFieldChange("centerProposalNotes", event.target.value)
            }
            placeholder="Dirección, web o cualquier pista que ayude a revisarlo."
          />
        </div>
      ) : null}

      {centerMode === "not_applicable" ? (
        <div className="center-draft-mode-field__proposal">
          <label htmlFor={independentNotesId}>Nota opcional</label>
          <textarea
            id={independentNotesId}
            className="center-draft-mode-field__notes"
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
