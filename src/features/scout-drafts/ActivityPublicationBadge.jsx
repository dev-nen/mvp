import "./ActivityPublicationBadge.css";

export function ActivityPublicationBadge({
  isPublished,
  unpublishedLabel = "Oculta",
}) {
  return (
    <span
      className={`activity-publication-badge activity-publication-badge--${isPublished ? "published" : "unpublished"}`}
    >
      {isPublished ? "Publicada" : unpublishedLabel}
    </span>
  );
}
