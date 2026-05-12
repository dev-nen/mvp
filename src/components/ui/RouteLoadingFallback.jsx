import "./RouteLoadingFallback.css";
import { useI18n } from "@/i18n/useI18n";

export function RouteLoadingFallback() {
  const { t } = useI18n();

  return (
    <div className="route-loading-fallback" role="status" aria-live="polite">
      <span className="route-loading-fallback__sr-only">
        {t("common.routeLoading")}
      </span>
      <span className="route-loading-fallback__bar" aria-hidden="true" />
    </div>
  );
}
