import { useEffect, useMemo } from "react";
import { AlertTriangle, LoaderCircle, MapPin, ShieldCheck } from "lucide-react";
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

  if (accessState === "missing_city") {
    return {
      actionLabel: "Completar ciudad",
      description:
        "Tu cuenta ya existe, pero necesitamos asociar una ciudad antes de continuar.",
      eyebrow: "Alta minima",
      icon: MapPin,
      title: "Falta un dato obligatorio",
    };
  }

  if (accessState === "unauthorized") {
    return {
      actionLabel: appUserError ? "Reintentar" : "Continuar acceso",
      description:
        appUserError ||
        "No hemos podido dejar tu acceso listo con la configuracion actual.",
      eyebrow: "Acceso",
      icon: AlertTriangle,
      title: "No pudimos validar tu cuenta",
    };
  }

  return {
    actionLabel: "Acceder con Google",
    description:
      "Esta pantalla necesita una cuenta identificada y una ciudad asociada para quedar disponible.",
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
