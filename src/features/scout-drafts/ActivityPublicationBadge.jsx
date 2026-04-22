import "./ActivityPublicationBadge.css";

export function ActivityPublicationBadge({ isPublished }) {
  return (
    <span
      className={`activity-publication-badge activity-publication-badge--${isPublished ? "published" : "unpublished"}`}
    >
      {isPublished ? "Publicada" : "Oculta"}
    </span>
  );
}
