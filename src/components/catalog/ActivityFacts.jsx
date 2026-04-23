import {
  Building2,
  Clock3,
  MapPin,
  Users,
  Wallet,
} from "lucide-react";
import {
  formatActivityAgeLabel,
  formatActivityLocationLabel,
} from "@/helpers/activityPresentation";
import "./ActivityFacts.css";

export function ActivityFacts({ activity, className = "" }) {
  const classNames = ["activity-facts", className].filter(Boolean).join(" ");

  const facts = [
    {
      key: "location",
      label: "Ubicación",
      value: formatActivityLocationLabel(activity),
      icon: MapPin,
    },
    {
      key: "age",
      label: "Edad",
      value: formatActivityAgeLabel(activity),
      icon: Users,
    },
    {
      key: "schedule",
      label: "Horario",
      value: activity.schedule_label || "Consulta el horario",
      icon: Clock3,
    },
    {
      key: "price",
      label: "Precio",
      value: activity.price_label || "Consulta el precio",
      icon: Wallet,
      tone: "price",
    },
    {
      key: "center",
      label: "Centro",
      value: activity.center_name || "Consulta el centro",
      icon: Building2,
    },
  ];

  return (
    <dl className={classNames}>
      {facts.map(({ key, label, value, icon: Icon, tone }) => (
        <div
          key={key}
          className={`activity-facts__item ${
            tone ? `activity-facts__item--${tone}` : ""
          }`}
        >
          <dt className="activity-facts__label">{label}</dt>
          <dd className="activity-facts__value">
            <Icon className="activity-facts__icon" aria-hidden="true" />
            <span>{value}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
