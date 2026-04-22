import "./ScoutDraftStatusBadge.css";

function normalizeReviewStatus(reviewStatus) {
  return typeof reviewStatus === "string"
    ? reviewStatus.trim().toLowerCase().replace(/_/g, "-")
    : "pending-review";
}

function getReviewStatusLabel(reviewStatus) {
  if (reviewStatus === "approved") {
    return "Aprobado";
  }

  if (reviewStatus === "rejected") {
    return "Rechazado";
  }

  return "Pendiente";
}

export function ScoutDraftStatusBadge({ reviewStatus }) {
  const normalizedReviewStatus = normalizeReviewStatus(reviewStatus);

  return (
    <span
      className={`scout-draft-status-badge scout-draft-status-badge--${normalizedReviewStatus}`}
    >
      {getReviewStatusLabel(normalizedReviewStatus.replace(/-/g, "_"))}
    </span>
  );
}
