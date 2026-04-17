import { Building2, Clock3, MapPin, Users, Wallet } from "lucide-react";
import { formatActivityAgeLabel } from "@/helpers/activityPresentation";

export const ACTIVITY_DETAIL_PLACEHOLDER_SRC =
  "/placeholders/activity-card-placeholder.svg";

function getTrimmedText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function hasDistinctVenueName(venueName, centerName) {
  if (!venueName) {
    return false;
  }

  if (!centerName) {
    return true;
  }

  return venueName.toLocaleLowerCase() !== centerName.toLocaleLowerCase();
}

function buildDetailEvaluationItems(activity) {
  const evaluationItems = [];
  const ageLabel = getTrimmedText(formatActivityAgeLabel(activity));
  const scheduleLabel = getTrimmedText(activity.schedule_label);
  const priceLabel = getTrimmedText(activity.price_label);

  if (ageLabel && ageLabel !== "Consulta la edad") {
    evaluationItems.push({
      key: "age",
      label: "Edad",
      value: ageLabel,
      icon: Users,
    });
  }

  if (scheduleLabel) {
    evaluationItems.push({
      key: "schedule",
      label: "Horario",
      value: scheduleLabel,
      icon: Clock3,
    });
  }

  if (activity.is_free !== true && priceLabel) {
    evaluationItems.push({
      key: "price",
      label: "Precio",
      value: priceLabel,
      icon: Wallet,
      tone: "price",
    });
  }

  return evaluationItems;
}

function buildDetailLocationItems(activity) {
  const venueName = getTrimmedText(activity.venue_name);
  const address = getTrimmedText(activity.venue_address_1);
  const centerName = getTrimmedText(activity.center_name);
  const cityName = getTrimmedText(activity.city_name);
  const locationItems = [];

  if (hasDistinctVenueName(venueName, centerName)) {
    locationItems.push({
      key: "venue",
      label: "Lugar",
      value: venueName,
      icon: MapPin,
    });
  }

  if (address) {
    locationItems.push({
      key: "address",
      label: "Direccion",
      value: address,
      icon: MapPin,
    });
  }

  if (centerName) {
    locationItems.push({
      key: "center",
      label: "Centro",
      value: centerName,
      icon: Building2,
    });
  }

  if (cityName) {
    locationItems.push({
      key: "city",
      label: "Ciudad",
      value: cityName,
      icon: MapPin,
    });
  }

  return locationItems;
}

export function buildActivityDetailViewModel(activity = {}) {
  const imageUrl = getTrimmedText(activity.image_url);
  const categoryLabel = getTrimmedText(activity.category_label);
  const description = getTrimmedText(activity.short_description);
  const title = getTrimmedText(activity.title);

  return {
    categoryLabel,
    description,
    evaluationItems: buildDetailEvaluationItems(activity),
    imageSrc: imageUrl || ACTIVITY_DETAIL_PLACEHOLDER_SRC,
    locationItems: buildDetailLocationItems(activity),
    showFreeBadge: activity.is_free === true,
    title,
  };
}

export function handleActivityDetailImageError(event) {
  const imageElement = event.currentTarget;

  if (imageElement.dataset.placeholderApplied === "true") {
    return;
  }

  imageElement.dataset.placeholderApplied = "true";
  imageElement.src = ACTIVITY_DETAIL_PLACEHOLDER_SRC;
}
