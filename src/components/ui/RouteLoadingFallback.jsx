import "./RouteLoadingFallback.css";

export function RouteLoadingFallback() {
  return (
    <div className="route-loading-fallback" role="status" aria-live="polite">
      <span className="route-loading-fallback__sr-only">Cargando NensGo...</span>
      <span className="route-loading-fallback__bar" aria-hidden="true" />
    </div>
  );
}
