import { useEffect } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Heart,
  LoaderCircle,
  SearchX,
} from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { CatalogState } from "@/components/states/CatalogState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { buildWhatsappActivityUrl } from "@/helpers/buildWhatsappActivityMessage";
import {
  ACTIVITY_DETAIL_PLACEHOLDER_SRC,
  buildActivityDetailViewModel,
  handleActivityDetailImageError,
} from "@/helpers/activityDetailViewModel";
import { useCatalog } from "@/hooks/useCatalog";
import { useFavorites } from "@/hooks/useFavorites";
import {
  FAVORITES_DETAIL_SOURCE,
  trackActivityContactClick,
  trackActivityFavoriteRemove,
  trackActivityViewMore,
} from "@/services/activityEventsService";
import "./FavoriteActivityDetailPage.css";

const trackedFavoriteDetailViews = new Set();

export function FavoriteActivityDetailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { activityId = "" } = useParams();
  const { activities, isLoading, error, reload } = useCatalog();
  const { favoriteIds, removeFavorite } = useFavorites();

  const activity =
    activities.find((item) => String(item.id) === activityId) ?? null;
  const isSavedFavorite = favoriteIds.includes(activityId);

  const handleGoBack = () => {
    navigate("/favoritos");
  };

  const handleRemoveFavorite = () => {
    if (activity) {
      void trackActivityFavoriteRemove(activity, FAVORITES_DETAIL_SOURCE);
    }

    removeFavorite(activityId);
    navigate("/favoritos");
  };

  const handleOpenWhatsapp = () => {
    if (!activity) {
      return;
    }

    void trackActivityContactClick(activity, FAVORITES_DETAIL_SOURCE);
    window.open(buildWhatsappActivityUrl(activity), "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activityId]);

  useEffect(() => {
    if (!activity || !isSavedFavorite) {
      return;
    }

    const trackingKey = `${location.key || location.pathname}:${String(activity.id)}`;

    if (trackedFavoriteDetailViews.has(trackingKey)) {
      return;
    }

    trackedFavoriteDetailViews.add(trackingKey);
    void trackActivityViewMore(activity, FAVORITES_DETAIL_SOURCE);
  }, [activity, isSavedFavorite, location.key, location.pathname]);

  let content = null;

  if (isLoading) {
    content = (
      <CatalogState
        icon={LoaderCircle}
        eyebrow="Favoritos"
        title="Cargando la ficha"
        description="Estamos preparando la informacion completa de esta actividad."
      />
    );
  } else if (error) {
    content = (
      <CatalogState
        icon={AlertTriangle}
        eyebrow="Error"
        title="No pudimos cargar esta actividad"
        description={error}
        actionLabel="Reintentar"
        onAction={reload}
      />
    );
  } else if (!activity && isSavedFavorite) {
    content = (
      <CatalogState
        icon={SearchX}
        eyebrow="No disponible"
        title="Esta actividad ya no esta disponible"
        description="La actividad sigue guardada, pero no hemos podido recuperarla desde el catalogo actual."
        actionLabel="Volver a favoritos"
        onAction={handleGoBack}
      />
    );
  } else if (!activity) {
    content = (
      <CatalogState
        icon={SearchX}
        eyebrow="No encontrada"
        title="No encontramos esta actividad"
        description="La ficha que intentas abrir no existe en el catalogo actual. Vuelve a favoritos para seguir revisando tus actividades guardadas."
        actionLabel="Volver a favoritos"
        onAction={handleGoBack}
      />
    );
  } else if (!isSavedFavorite) {
    content = (
      <CatalogState
        icon={Heart}
        eyebrow="Fuera de favoritos"
        title="Esta actividad ya no esta en tus favoritos"
        description="Vuelve a tu lista para seguir revisando las actividades que todavia tienes guardadas."
        actionLabel="Volver a favoritos"
        onAction={handleGoBack}
      />
    );
  } else {
    const viewModel = buildActivityDetailViewModel(activity);

    content = (
      <Card className="favorite-activity-detail__detail-card">
        <div className="favorite-activity-detail__media">
          <img
            src={viewModel.imageSrc}
            alt={activity.title}
            className="favorite-activity-detail__image"
            data-placeholder-applied={
              viewModel.imageSrc === ACTIVITY_DETAIL_PLACEHOLDER_SRC
                ? "true"
                : "false"
            }
            onError={handleActivityDetailImageError}
          />
        </div>

        <CardContent className="favorite-activity-detail__body">
          <section className="favorite-activity-detail__identity">
            <div className="favorite-activity-detail__identity-head">
              <div className="favorite-activity-detail__identity-copy">
                <h1 className="favorite-activity-detail__title">
                  {viewModel.title}
                </h1>
                {viewModel.categoryLabel || viewModel.showFreeBadge ? (
                  <div className="favorite-activity-detail__identity-meta">
                    {viewModel.categoryLabel ? (
                      <p className="favorite-activity-detail__category">
                        {viewModel.categoryLabel}
                      </p>
                    ) : null}
                    {viewModel.showFreeBadge ? (
                      <span className="favorite-activity-detail__free-badge">
                        Gratis
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="favorite-activity-detail__identity-action">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="favorite-activity-detail__favorite favorite-activity-detail__favorite--active"
                  onClick={handleRemoveFavorite}
                  aria-label="Quitar de favoritos"
                >
                  <Heart className="favorite-activity-detail__favorite-icon favorite-activity-detail__favorite-icon--filled" />
                </Button>
              </div>
            </div>
          </section>

          {viewModel.description ? (
            <section className="favorite-activity-detail__section">
              <p className="favorite-activity-detail__section-eyebrow">
                Descripcion
              </p>
              <p className="favorite-activity-detail__description">
                {viewModel.description}
              </p>
            </section>
          ) : null}

          {viewModel.evaluationItems.length > 0 ? (
            <section className="favorite-activity-detail__section">
              <div className="favorite-activity-detail__section-head">
                <p className="favorite-activity-detail__section-eyebrow">
                  Informacion clave
                </p>
                <h2 className="favorite-activity-detail__section-title">
                  Evalua si encaja
                </h2>
              </div>

              <dl className="favorite-activity-detail__facts-grid">
                {viewModel.evaluationItems.map(
                  ({ key, label, value, icon: Icon, tone }) => (
                    <div
                      key={key}
                      className={`favorite-activity-detail__fact ${
                        tone ? `favorite-activity-detail__fact--${tone}` : ""
                      }`}
                    >
                      <dt className="favorite-activity-detail__fact-label">{label}</dt>
                      <dd className="favorite-activity-detail__fact-value">
                        <Icon
                          className="favorite-activity-detail__fact-icon"
                          aria-hidden="true"
                        />
                        <span>{value}</span>
                      </dd>
                    </div>
                  ),
                )}
              </dl>
            </section>
          ) : null}

          {viewModel.locationItems.length > 0 ? (
            <section className="favorite-activity-detail__section">
              <div className="favorite-activity-detail__section-head">
                <p className="favorite-activity-detail__section-eyebrow">
                  Ubicacion
                </p>
                <h2 className="favorite-activity-detail__section-title">
                  Referencia practica
                </h2>
              </div>

              <dl className="favorite-activity-detail__facts-grid favorite-activity-detail__facts-grid--location">
                {viewModel.locationItems.map(({ key, label, value, icon: Icon }) => (
                  <div key={key} className="favorite-activity-detail__fact">
                    <dt className="favorite-activity-detail__fact-label">{label}</dt>
                    <dd className="favorite-activity-detail__fact-value">
                      <Icon
                        className="favorite-activity-detail__fact-icon"
                        aria-hidden="true"
                      />
                      <span>{value}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          <section className="favorite-activity-detail__contact">
            <div className="favorite-activity-detail__section-head">
              <p className="favorite-activity-detail__section-eyebrow">
                Accion principal
              </p>
              <h2 className="favorite-activity-detail__section-title">
                Contactar
              </h2>
            </div>
            <p className="favorite-activity-detail__contact-copy">
              Puedes escribir directamente al centro si quieres confirmar si
              esta actividad encaja con tu familia.
            </p>
            <Button onClick={handleOpenWhatsapp} className="button--whatsapp">
              Contactar
            </Button>
          </section>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="favorite-activity-detail">
      <Navbar />

      <main className="favorite-activity-detail__main">
        <div className="page-container favorite-activity-detail__container">
          <header className="favorite-activity-detail__header">
            <Button
              variant="ghost"
              className="favorite-activity-detail__back-button"
              onClick={handleGoBack}
            >
              <ArrowLeft />
              Volver a favoritos
            </Button>
          </header>

          {content}
        </div>
      </main>

      <Footer />
    </div>
  );
}
