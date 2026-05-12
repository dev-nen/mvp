import { useEffect, useMemo } from "react";
import {
  AlertTriangle,
  LoaderCircle,
  MailCheck,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { Footer } from "@/components/Footer";
import { CatalogState } from "@/components/states/CatalogState";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n/useI18n";
import "./ProtectedRoute.css";

function getBlockedRouteState(accessState, hasAppUserError, t) {
  if (accessState === "loading_user") {
    return {
      description: t("protectedRoute.loading.description"),
      eyebrow: t("protectedRoute.loading.eyebrow"),
      icon: LoaderCircle,
      title: t("protectedRoute.loading.title"),
    };
  }

  if (accessState === "verification_pending") {
    return {
      actionLabel: t("protectedRoute.verification.action"),
      description: t("protectedRoute.verification.description"),
      eyebrow: t("protectedRoute.verification.eyebrow"),
      icon: MailCheck,
      title: t("protectedRoute.verification.title"),
    };
  }

  if (accessState === "onboarding_required") {
    return {
      actionLabel: t("protectedRoute.onboarding.action"),
      description: t("protectedRoute.onboarding.description"),
      eyebrow: t("protectedRoute.onboarding.eyebrow"),
      icon: MapPin,
      title: t("protectedRoute.onboarding.title"),
    };
  }

  if (accessState === "error") {
    return {
      actionLabel: hasAppUserError
        ? t("protectedRoute.error.retry")
        : t("protectedRoute.error.continue"),
      description: t("protectedRoute.error.description"),
      eyebrow: t("protectedRoute.error.eyebrow"),
      icon: AlertTriangle,
      title: t("protectedRoute.error.title"),
    };
  }

  return {
    actionLabel: t("protectedRoute.anonymous.action"),
    description: t("protectedRoute.anonymous.description"),
    eyebrow: t("protectedRoute.anonymous.eyebrow"),
    icon: ShieldCheck,
    title: t("protectedRoute.anonymous.title"),
  };
}

export function ProtectedRoute({ children, intent }) {
  const { t } = useI18n();
  const { accessState, appUserError, refreshAppUser, startProtectedAction } =
    useAuth();
  const intentKey = useMemo(() => JSON.stringify(intent ?? null), [intent]);

  useEffect(() => {
    if (accessState === "ready" || accessState === "loading_user") {
      return;
    }

    void startProtectedAction(intent);
  }, [accessState, intent, intentKey, startProtectedAction]);

  if (accessState === "ready") {
    return children;
  }

  const blockedRouteState = getBlockedRouteState(
    accessState,
    Boolean(appUserError),
    t,
  );

  return (
    <div className="protected-route">
      <main className="protected-route__main">
        <div className="page-container protected-route__container">
          <CatalogState
            icon={blockedRouteState.icon}
            eyebrow={blockedRouteState.eyebrow}
            title={blockedRouteState.title}
            description={blockedRouteState.description}
            actionLabel={blockedRouteState.actionLabel}
            onAction={
              appUserError
                ? refreshAppUser
                : () => {
                    void startProtectedAction(intent);
                  }
            }
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
