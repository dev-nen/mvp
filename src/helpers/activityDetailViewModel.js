import { Building2, Clock3, MapPin, Users, Wallet } from "lucide-react";
import {
  formatActivityAgeLabel,
  getActivityDescription,
} from "@/helpers/activityPresentation";

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

function buildDetailEvaluationItems(activity, copy) {
  const evaluationItems = [];
  const ageLabel = getTrimmedText(formatActivityAgeLabel(activity, copy.age));
  const scheduleLabel = getTrimmedText(activity.schedule_label);
  const priceLabel = getTrimmedText(activity.price_label);

  if (ageLabel && ageLabel !== copy.age.consultAge) {
    evaluationItems.push({
      key: "age",
      label: copy.ageLabel,
      value: ageLabel,
      icon: Users,
    });
  }

  if (scheduleLabel) {
    evaluationItems.push({
      key: "schedule",
      label: copy.scheduleLabel,
      value: scheduleLabel,
      icon: Clock3,
    });
  }

  if (activity.is_free !== true && priceLabel) {
    evaluationItems.push({
      key: "price",
      label: copy.priceLabel,
      value: priceLabel,
      icon: Wallet,
      tone: "price",
    });
  }

  return evaluationItems;
}

function buildDetailLocationItems(activity, copy) {
  const venueName = getTrimmedText(activity.venue_name);
  const address = getTrimmedText(activity.venue_address_1);
  const centerName = getTrimmedText(activity.center_name);
  const cityName = getTrimmedText(activity.city_name);
  const locationItems = [];

  if (hasDistinctVenueName(venueName, centerName)) {
    locationItems.push({
      key: "venue",
      label: copy.venueLabel,
      value: venueName,
      icon: MapPin,
    });
  }

  if (address) {
    locationItems.push({
      key: "address",
      label: copy.addressLabel,
      value: address,
      icon: MapPin,
    });
  }

  if (centerName) {
    locationItems.push({
      key: "center",
      label: copy.centerLabel,
      value: centerName,
      icon: Building2,
    });
  }

  if (cityName) {
    locationItems.push({
      key: "city",
      label: copy.cityLabel,
      value: cityName,
      icon: MapPin,
    });
  }

  return locationItems;
}

function buildDetailSummaryItems(activity, copy) {
  const ageLabel = getTrimmedText(formatActivityAgeLabel(activity, copy.age));
  const scheduleLabel = getTrimmedText(activity.schedule_label);
  const priceLabel = getTrimmedText(activity.price_label);
  const venueName = getTrimmedText(activity.venue_name);
  const address = getTrimmedText(activity.venue_address_1);
  const centerName = getTrimmedText(activity.center_name);
  const cityName = getTrimmedText(activity.city_name);
  const summaryItems = [];

  const whenForWho = [ageLabel, scheduleLabel]
    .filter(Boolean)
    .filter((value) => value !== copy.age.consultAge)
    .join(" · ");

  if (whenForWho) {
    summaryItems.push({
      key: "when-for-who",
      value: whenForWho,
      tone: "default",
    });
  }

  if (activity.is_free !== true && priceLabel) {
    summaryItems.push({
      key: "price",
      value: priceLabel,
      tone: "price",
    });
  }

  const placeLabel = centerName || venueName;
  const location = [placeLabel, address, cityName].filter(Boolean).join(" · ");

  if (location) {
    summaryItems.push({
      key: "location",
      value: location,
      tone: "location",
    });
  }

  return summaryItems;
}

export function buildActivityDetailViewModel(activity = {}, copy = {}) {
  const resolvedCopy = {
    fallbackDescription: "Consulta más información por WhatsApp.",
    ageLabel: "Edad",
    scheduleLabel: "Horario",
    priceLabel: "Precio",
    venueLabel: "Lugar",
    addressLabel: "Dirección",
    centerLabel: "Centro",
    cityLabel: "Ciudad",
    ...copy,
    age: {
      allAges: "Todas las edades",
      ageRange: "{min}-{max} años",
      ageFrom: "Desde {min} años",
      ageUntil: "Hasta {max} años",
      consultAge: "Consulta la edad",
      ...copy.age,
    },
  };
  const imageUrl = getTrimmedText(activity.image_url);
  const categoryLabel = getTrimmedText(activity.category_label);
  const description = getTrimmedText(
    getActivityDescription(activity, resolvedCopy),
  );
  const title = getTrimmedText(activity.title);

  return {
    categoryLabel,
    description,
    evaluationItems: buildDetailEvaluationItems(activity, resolvedCopy),
    imageSrc: imageUrl || ACTIVITY_DETAIL_PLACEHOLDER_SRC,
    locationItems: buildDetailLocationItems(activity, resolvedCopy),
    showFreeBadge: activity.is_free === true,
    summaryItems: buildDetailSummaryItems(activity, resolvedCopy),
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
