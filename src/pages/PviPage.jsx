import { useMemo } from "react";
import {
  AlertTriangle,
  BarChart3,
  Clock3,
  Eye,
  Heart,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { CatalogState } from "@/components/states/CatalogState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useActivityEventsDashboard } from "@/hooks/useActivityEventsDashboard";
import {
  ACTIVITY_EVENTS_REASON_ACTIVITY_EVENTS_FORBIDDEN,
  ACTIVITY_EVENTS_REASON_ACTIVITY_EVENTS_MISSING,
  ACTIVITY_EVENTS_REASON_SUPABASE_NOT_CONFIGURED,
} from "@/services/activityEventsService";
import "./PviPage.css";

const eventNameLabelMap = {
  activity_view_more: "Mas info",
  activity_contact_click: "Contacto",
  activity_favorite_add: "Favorito agregado",
  activity_favorite_remove: "Favorito quitado",
};

const sourceLabelMap = {
  catalog_card: "Catalogo card",
  catalog_modal: "Catalogo modal",
  favorites_detail: "Detalle favoritos",
};

const dateTimeFormatter = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "short",
  timeStyle: "short",
});

function formatConversionRate(rate) {
  if (rate === null) {
    return "--";
  }

  return `${Math.round(rate * 100)}%`;
}

function formatEventDateTime(createdAt) {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return "Fecha desconocida";
  }

  return dateTimeFormatter.format(date);
}

function getUnavailableStateCopy(reason, message) {
  if (reason === ACTIVITY_EVENTS_REASON_SUPABASE_NOT_CONFIGURED) {
    return {
      eyebrow: "Configuracion requerida",
      title: "PVI no disponible en este entorno",
      description:
        message ||
        "Este panel necesita Supabase configurado para leer activity_events.",
    };
  }

  if (reason === ACTIVITY_EVENTS_REASON_ACTIVITY_EVENTS_MISSING) {
    return {
      eyebrow: "Dependencia ausente",
      title: "PVI sin fuente de datos",
      description:
        message ||
        "activity_events no existe o todavia no esta disponible en este entorno.",
    };
  }

  if (reason === ACTIVITY_EVENTS_REASON_ACTIVITY_EVENTS_FORBIDDEN) {
    return {
      eyebrow: "Lectura no disponible",
      title: "PVI sin acceso a interacciones",
      description:
        message ||
        "Las credenciales actuales no pueden leer activity_events en este entorno.",
    };
  }

  return {
    eyebrow: "No disponible",
    title: "PVI no disponible en este entorno",
    description:
      message ||
      "Este panel necesita una fuente activity_events disponible para mostrar datos.",
  };
}

function PviMetricCard({ icon: Icon, label, value, description }) {
  return (
    <Card>
      <CardContent className="pvi-page__metric-card">
        <div className="pvi-page__metric-icon-wrap" aria-hidden="true">
          <Icon className="pvi-page__metric-icon" />
        </div>
        <p className="pvi-page__metric-label">{label}</p>
        <p className="pvi-page__metric-value">{value}</p>
        <p className="pvi-page__metric-description">{description}</p>
      </CardContent>
    </Card>
  );
}

export function PviPage() {
  const {
    dashboard,
    isLoading,
    error,
    availability,
    availabilityReason,
    availabilityMessage,
    reload,
  } = useActivityEventsDashboard();
  const unavailableState = useMemo(
    () =>
      getUnavailableStateCopy(availabilityReason, availabilityMessage),
    [availabilityMessage, availabilityReason],
  );

  const metricCards = useMemo(
    () => [
      {
        label: "Mas info",
        value: dashboard.totals.viewMoreCount,
        description: "Personas que quisieron ampliar una actividad.",
        icon: Eye,
      },
      {
        label: "Contactos",
        value: dashboard.totals.contactCount,
        description: "Intentos de contacto por WhatsApp.",
        icon: MessageCircle,
      },
      {
        label: "Favoritos agregados",
        value: dashboard.totals.favoriteAddCount,
        description: "Actividades guardadas desde una interaccion real.",
        icon: Heart,
      },
      {
        label: "Favoritos quitados",
        value: dashboard.totals.favoriteRemoveCount,
        description: "Actividades retiradas de favoritos.",
        icon: Heart,
      },
      {
        label: "Conversion a contacto",
        value: formatConversionRate(dashboard.totals.conversionRate),
        description: "Relacion entre contactos y mas info.",
        icon: Sparkles,
      },
      {
        label: "Favoritos / Mas info",
        value: formatConversionRate(dashboard.totals.favoritePerViewRate),
        description: "Relacion entre favoritos agregados y mas info.",
        icon: Sparkles,
      },
      {
        label: "Ultimos 7 dias",
        value: dashboard.totals.lastSevenDaysCount,
        description: "Interacciones registradas durante la ultima semana.",
        icon: Clock3,
      },
    ],
    [dashboard],
  );

  return (
    <div className="pvi-page">
      <Navbar />

      <main className="pvi-page__main">
        <div className="page-container pvi-page__container">
          <header className="pvi-page__header">
            <p className="pvi-page__eyebrow">Uso interno | MVP 1</p>
            <h1 className="pvi-page__title">
              PVI - Panel de Visionado de Interacciones
            </h1>
            <p className="pvi-page__description">
              Vista interna rapida del interes y contacto generado por NensGo.
            </p>
          </header>

          {isLoading ? (
            <CatalogState
              icon={BarChart3}
              eyebrow="PVI"
              title="Cargando interacciones..."
              description="Estamos leyendo activity_events para preparar el panel interno."
            />
          ) : availability === "unavailable" ? (
            <CatalogState
              icon={BarChart3}
              eyebrow={unavailableState.eyebrow}
              title={unavailableState.title}
              description={unavailableState.description}
              actionLabel="Reintentar"
              onAction={reload}
            />
          ) : error ? (
            <CatalogState
              icon={AlertTriangle}
              eyebrow="Error"
              title="No pudimos cargar las interacciones."
              description={error}
              actionLabel="Reintentar"
              onAction={reload}
            />
          ) : dashboard.recentEvents.length === 0 ? (
            <CatalogState
              icon={BarChart3}
              eyebrow="Sin datos"
              title="Todavia no hay interacciones registradas"
              description="Cuando el MVP empiece a moverse, este panel mostrara interes y contactos."
            />
          ) : (
            <>
              <section className="pvi-page__metrics">
                {metricCards.map((metricCard) => (
                  <PviMetricCard key={metricCard.label} {...metricCard} />
                ))}
              </section>

              <div className="pvi-page__grid">
                <Card className="pvi-page__panel pvi-page__panel--wide">
                  <CardContent className="pvi-page__panel-content">
                    <div className="pvi-page__panel-header">
                      <div>
                        <p className="pvi-page__panel-eyebrow">Top</p>
                        <h2 className="pvi-page__panel-title">
                          Actividades con mas interaccion
                        </h2>
                      </div>
                    </div>

                    <div className="pvi-page__table-wrap">
                      <table className="pvi-page__table">
                        <thead>
                          <tr>
                            <th>Actividad</th>
                            <th>Ciudad</th>
                            <th>Mas info</th>
                            <th>Contactos</th>
                            <th>Favoritos +</th>
                            <th>Favoritos -</th>
                            <th>Favoritos / Mas info</th>
                            <th>Conversion</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dashboard.topActivities.map((activity) => (
                            <tr
                              key={`${activity.activityId}:${activity.cityName}`}
                            >
                              <td>{activity.activityTitle}</td>
                              <td>{activity.cityName}</td>
                              <td>{activity.viewMoreCount}</td>
                              <td>{activity.contactCount}</td>
                              <td>{activity.favoriteAddCount}</td>
                              <td>{activity.favoriteRemoveCount}</td>
                              <td>
                                {formatConversionRate(activity.favoritePerViewRate)}
                              </td>
                              <td>
                                {formatConversionRate(activity.conversionRate)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                <Card className="pvi-page__panel">
                  <CardContent className="pvi-page__panel-content">
                    <p className="pvi-page__panel-eyebrow">Fuentes</p>
                    <h2 className="pvi-page__panel-title">
                      Origen de las interacciones
                    </h2>

                    <div className="pvi-page__source-list">
                      {dashboard.sourceBreakdown.map((sourceSummary) => (
                        <div
                          key={sourceSummary.source}
                          className="pvi-page__source-item"
                        >
                          <div>
                            <p className="pvi-page__source-name">
                              {sourceLabelMap[sourceSummary.source] ||
                                sourceSummary.source}
                            </p>
                            <p className="pvi-page__source-subcopy">
                              {sourceSummary.viewMoreCount} mas info |{" "}
                              {sourceSummary.contactCount} contactos |{" "}
                              {sourceSummary.favoriteAddCount} fav + |{" "}
                              {sourceSummary.favoriteRemoveCount} fav -
                            </p>
                          </div>
                          <p className="pvi-page__source-rate">
                            {formatConversionRate(sourceSummary.conversionRate)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="pvi-page__panel pvi-page__panel--wide">
                  <CardContent className="pvi-page__panel-content">
                    <div className="pvi-page__panel-header">
                      <div>
                        <p className="pvi-page__panel-eyebrow">Recientes</p>
                        <h2 className="pvi-page__panel-title">
                          Eventos recientes
                        </h2>
                      </div>
                      <Button variant="outline" onClick={reload}>
                        Actualizar
                      </Button>
                    </div>

                    <div className="pvi-page__table-wrap">
                      <table className="pvi-page__table">
                        <thead>
                          <tr>
                            <th>Fecha/hora</th>
                            <th>Evento</th>
                            <th>Actividad</th>
                            <th>Ciudad</th>
                            <th>Fuente</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dashboard.recentEvents.map((event) => (
                            <tr key={event.id}>
                              <td>{formatEventDateTime(event.created_at)}</td>
                              <td>
                                {eventNameLabelMap[event.event_name] ||
                                  event.event_name}
                              </td>
                              <td>
                                {event.activity_title_snapshot || "Sin titulo"}
                              </td>
                              <td>{event.city_name_snapshot || "Sin ciudad"}</td>
                              <td>
                                {sourceLabelMap[event.source] || event.source}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
