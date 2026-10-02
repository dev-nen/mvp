import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { CatalogState } from "@/components/states/CatalogState";
import { Button } from "@/components/ui/button";
import { LoaderCircle, ShieldCheck } from "lucide-react";

export function MaintenanceRoute({ children }) {
  const location = useLocation();
  const { accessState, isMaintenanceOperator, authError, refreshAccess, signOut } = useAuth();
  if (accessState === "anonymous") return <Navigate to="/usuario" state={{ returnTo: location.pathname }} replace />;
  if (accessState === "ready" && isMaintenanceOperator) return children;
  return <main className="page-container" style={{ paddingBlock: "3rem" }}>
    <CatalogState icon={accessState === "loading_user" ? LoaderCircle : ShieldCheck}
      title={accessState === "loading_user" ? "Comprobando acceso" : "Acceso de administración"}
      description={accessState === "error" ? authError : accessState === "loading_user" ? "Estamos comprobando tu sesión." : "Esta cuenta no tiene permiso para administrar NensGo."}
      actionLabel={accessState === "error" ? "Reintentar" : undefined} onAction={refreshAccess} />
    {accessState === "forbidden" ? <Button variant="outline" onClick={signOut}>Cerrar sesión</Button> : null}
  </main>;
}
