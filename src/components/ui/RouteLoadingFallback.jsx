import "./RouteLoadingFallback.css";

export function RouteLoadingFallback() {
  return (
    <div className="route-loading-fallback" role="status" aria-live="polite">
      <span className="route-loading-fallback__mark" aria-hidden="true" />
      <span>Cargando NensGo...</span>
    </div>
  );
}
