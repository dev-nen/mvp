import { AlertTriangle, LoaderCircle, MailCheck, MapPin, ShieldCheck } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { CatalogState } from "@/components/states/CatalogState";
import { useAuth } from "@/hooks/useAuth";
import { useInternalToolAccess } from "@/hooks/useInternalToolAccess";
import { DRAFT_INBOX_TOOL_NAME } from "@/services/internalToolAccessService";
import "./InternalToolRoute.css";

function getBlockedRouteState(accessState, appUserError) {
  if (accessState === "loading_user") {
    return {
      description:
        "Estamos comprobando la sesion y el perfil minimo antes de revisar el acceso interno.",
      eyebrow: "Acceso interno",
      icon: LoaderCircle,
      title: "Preparando el acceso interno",
    };
  }

  if (accessState === "verification_pending") {
    return {
      actionLabel: "Revisar verificacion",
      description:
        "Esta ruta interna necesita una cuenta verificada y un perfil de app listo antes de comprobar permisos internos.",
      eyebrow: "Verificacion",
      icon: MailCheck,
      title: "Falta verificar el email",
    };
  }

  if (accessState === "onboarding_required") {
    return {
      actionLabel: "Completar perfil",
      description:
        "Primero necesitamos completar el perfil minimo de la cuenta antes de evaluar el acceso interno.",
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
        "No pudimos dejar tu cuenta lista para comprobar permisos internos.",
      eyebrow: "Acceso interno",
      icon: AlertTriangle,
      title: "No pudimos cargar tu perfil",
    };
  }

  return {
    actionLabel: "Acceder",
    description:
      "Esta herramienta interna necesita una cuenta autenticada y un perfil de app listo antes de comprobar permisos del equipo.",
    eyebrow: "Acceso interno",
    icon: ShieldCheck,
    title: "Necesitas acceder para continuar",
  };
}

export function InternalToolRoute({
  children,
  toolName = DRAFT_INBOX_TOOL_NAME,
}) {
  const { accessState, appUserError, openAccessGate, refreshAppUser } = useAuth();
  const {
    error: internalAccessError,
    hasAccess,
    isLoading: isLoadingInternalAccess,
    reload: reloadInternalAccess,
  } = useInternalToolAccess(toolName);

  if (accessState === "ready" && hasAccess) {
    return children;
  }

  if (accessState === "ready" && isLoadingInternalAccess) {
    return (
      <div className="internal-tool-route">
        <Navbar />
        <main className="internal-tool-route__main">
          <div className="page-container internal-tool-route__container">
            <CatalogState
              icon={LoaderCircle}
              eyebrow="Acceso interno"
              title="Comprobando permisos del equipo"
              description="Estamos comprobando si esta cuenta tiene acceso interno a Draft Inbox."
            />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (accessState === "ready" && internalAccessError) {
    return (
      <div className="internal-tool-route">
        <Navbar />
        <main className="internal-tool-route__main">
          <div className="page-container internal-tool-route__container">
            <CatalogState
              icon={AlertTriangle}
              eyebrow="Acceso interno"
              title="No pudimos comprobar tu permiso interno"
              description={internalAccessError}
              actionLabel="Reintentar"
              onAction={reloadInternalAccess}
            />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (accessState === "ready" && !hasAccess) {
    return (
      <div className="internal-tool-route">
        <Navbar />
        <main className="internal-tool-route__main">
          <div className="page-container internal-tool-route__container">
            <CatalogState
              icon={ShieldCheck}
              eyebrow="Acceso interno"
              title="Esta cuenta no tiene acceso al Draft Inbox"
              description="La sesion ya esta lista, pero no existe un permiso interno activo para esta herramienta. Pide que te autoricen en la base de datos antes de continuar."
            />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const blockedRouteState = getBlockedRouteState(accessState, appUserError);

  return (
    <div className="internal-tool-route">
      <Navbar />

      <main className="internal-tool-route__main">
        <div className="page-container internal-tool-route__container">
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
                    openAccessGate();
                  }
            }
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
