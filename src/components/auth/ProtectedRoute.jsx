import { useEffect, useMemo } from "react";
import {
  AlertTriangle,
  LoaderCircle,
  MailCheck,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { CatalogState } from "@/components/states/CatalogState";
import { useAuth } from "@/hooks/useAuth";
import "./ProtectedRoute.css";

function getBlockedRouteState(accessState, appUserError) {
  if (accessState === "loading_user") {
    return {
      description:
        "Estamos comprobando el acceso social y los datos minimos de la cuenta para esta ruta.",
      eyebrow: "Acceso",
      icon: LoaderCircle,
      title: "Preparando tu acceso",
    };
  }

  if (accessState === "verification_pending") {
    return {
      actionLabel: "Revisar verificacion",
      description:
        "Esta ruta necesita una cuenta verificada antes de continuar con el onboarding de perfil.",
      eyebrow: "Verificacion",
      icon: MailCheck,
      title: "Falta verificar el email",
    };
  }

  if (accessState === "onboarding_required") {
    return {
      actionLabel: "Completar perfil",
      description:
        "Tu cuenta ya existe, pero todavia falta completar el perfil minimo obligatorio.",
      eyebrow: "Onboarding",
      icon: MapPin,
      title: "Falta completar tu perfil",
    };
  }

  if (accessState === "error") {
    return {
      actionLabel: appUserError ? "Reintentar" : "Continuar acceso",
      description:
        appUserError ||
        "No hemos podido dejar tu acceso listo con la configuracion actual.",
      eyebrow: "Acceso",
      icon: AlertTriangle,
      title: "No pudimos cargar tu perfil",
    };
  }

  return {
    actionLabel: "Acceder",
    description:
      "Esta pantalla necesita una cuenta identificada y un perfil de app listo para quedar disponible.",
    eyebrow: "Acceso",
    icon: ShieldCheck,
    title: "Necesitas acceder para continuar",
  };
}

export function ProtectedRoute({ children, intent }) {
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

  const blockedRouteState = getBlockedRouteState(accessState, appUserError);

  return (
    <div className="protected-route">
      <Navbar />

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
