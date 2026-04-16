import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, MapPin, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { listCatalogCityChoices } from "@/services/catalogCityChoicesService";
import "./ProtectedAccessGate.css";

function getIntentLabel(intent) {
  if (!intent?.type) {
    return "continuar";
  }

  if (intent.type === "view_more") {
    return "ver el detalle";
  }

  if (intent.type === "open_favorites") {
    return "entrar en favoritos";
  }

  if (intent.type === "open_profile") {
    return "entrar en tu perfil";
  }

  if (intent.type === "toggle_favorite") {
    return "guardar esta actividad";
  }

  return "continuar";
}

export function ProtectedAccessGate() {
  const {
    accessState,
    appUserError,
    authError,
    closeAccessGate,
    completeRequiredCity,
    isAccessGateOpen,
    isCompletingCity,
    pendingIntent,
    refreshAppUser,
    signInWithGoogle,
  } = useAuth();
  const [cityChoices, setCityChoices] = useState([]);
  const [cityChoicesError, setCityChoicesError] = useState("");
  const [isLoadingCityChoices, setIsLoadingCityChoices] = useState(false);
  const [selectedCitySlug, setSelectedCitySlug] = useState("");
  const [citySubmitError, setCitySubmitError] = useState("");
  const [isStartingGoogleSignIn, setIsStartingGoogleSignIn] = useState(false);

  useEffect(() => {
    if (!isAccessGateOpen || accessState !== "missing_city") {
      return undefined;
    }

    let isMounted = true;

    const loadCityChoices = async () => {
      setIsLoadingCityChoices(true);
      setCityChoicesError("");

      try {
        const nextCityChoices = await listCatalogCityChoices();

        if (!isMounted) {
          return;
        }

        setCityChoices(nextCityChoices);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setCityChoicesError(
          error instanceof Error
            ? error.message
            : "No pudimos cargar las ciudades disponibles ahora mismo.",
        );
      } finally {
        if (isMounted) {
          setIsLoadingCityChoices(false);
        }
      }
    };

    void loadCityChoices();

    return () => {
      isMounted = false;
    };
  }, [accessState, isAccessGateOpen]);

  useEffect(() => {
    if (!isAccessGateOpen) {
      setSelectedCitySlug("");
      setCitySubmitError("");
      setIsStartingGoogleSignIn(false);
    }
  }, [isAccessGateOpen]);

  const currentIntentLabel = useMemo(
    () => getIntentLabel(pendingIntent),
    [pendingIntent],
  );
  const selectedCity =
    cityChoices.find((cityChoice) => cityChoice.slug === selectedCitySlug) ?? null;
  const feedbackMessage = appUserError || authError || cityChoicesError || citySubmitError;

  if (!isAccessGateOpen) {
    return null;
  }

  const handleGoogleSignIn = async () => {
    setIsStartingGoogleSignIn(true);
    const { error } = await signInWithGoogle();

    if (error) {
      setIsStartingGoogleSignIn(false);
    }
  };

  const handleSubmitCity = async (event) => {
    event.preventDefault();

    if (!selectedCity) {
      setCitySubmitError("Selecciona una ciudad para completar el acceso.");
      return;
    }

    setCitySubmitError("");

    const { error } = await completeRequiredCity(selectedCity);

    if (error) {
      setCitySubmitError(error.message);
    }
  };

  return (
    <div className="protected-access-gate" role="presentation">
      <div
        className="protected-access-gate__overlay"
        onClick={closeAccessGate}
      />

      <Card
        className="protected-access-gate__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="protected-access-gate-title"
      >
        <CardContent className="protected-access-gate__content">
          <button
            type="button"
            className="protected-access-gate__close"
            onClick={closeAccessGate}
            aria-label="Cerrar acceso"
          >
            <X />
          </button>

          {accessState === "anonymous" ? (
            <>
              <div className="protected-access-gate__icon-wrap" aria-hidden="true">
                <ShieldCheck />
              </div>
              <p className="protected-access-gate__eyebrow">Acceso minimo</p>
              <h2
                id="protected-access-gate-title"
                className="protected-access-gate__title"
              >
                Accede con Google para {currentIntentLabel}
              </h2>
              <p className="protected-access-gate__description">
                El catalogo puede explorarse en abierto, pero esta accion necesita
                una cuenta identificada y una ciudad asociada.
              </p>

              {feedbackMessage ? (
                <p
                  className="protected-access-gate__feedback protected-access-gate__feedback--error"
                  role="alert"
                >
                  {feedbackMessage}
                </p>
              ) : null}

              <Button
                type="button"
                className="protected-access-gate__primary-action"
                onClick={handleGoogleSignIn}
                disabled={isStartingGoogleSignIn}
              >
                {isStartingGoogleSignIn
                  ? "Conectando con Google..."
                  : "Continue with Google"}
              </Button>
            </>
          ) : null}

          {accessState === "loading_user" ? (
            <>
              <div className="protected-access-gate__icon-wrap" aria-hidden="true">
                <LoaderCircle className="protected-access-gate__spinner" />
              </div>
              <p className="protected-access-gate__eyebrow">Preparando acceso</p>
              <h2
                id="protected-access-gate-title"
                className="protected-access-gate__title"
              >
                Estamos resolviendo tu cuenta
              </h2>
              <p className="protected-access-gate__description">
                Estamos leyendo los datos minimos asociados a tu cuenta
                autenticada para comprobar si ya podemos continuar.
              </p>
            </>
          ) : null}

          {accessState === "missing_city" ? (
            <>
              <div className="protected-access-gate__icon-wrap" aria-hidden="true">
                <MapPin />
              </div>
              <p className="protected-access-gate__eyebrow">Dato obligatorio</p>
              <h2
                id="protected-access-gate-title"
                className="protected-access-gate__title"
              >
                Necesitamos tu ciudad para continuar
              </h2>
              <p className="protected-access-gate__description">
                Hemos reconocido tu cuenta, pero el alta minima no esta completa
                hasta asociar una ciudad.
              </p>

              {feedbackMessage ? (
                <p
                  className="protected-access-gate__feedback protected-access-gate__feedback--error"
                  role="alert"
                >
                  {feedbackMessage}
                </p>
              ) : null}

              <form
                className="protected-access-gate__form"
                onSubmit={handleSubmitCity}
              >
                <label
                  className="protected-access-gate__label"
                  htmlFor="protected-access-gate-city"
                >
                  Tu ciudad
                </label>
                <select
                  id="protected-access-gate-city"
                  className="protected-access-gate__select"
                  value={selectedCitySlug}
                  onChange={(event) => setSelectedCitySlug(event.target.value)}
                  disabled={isLoadingCityChoices || isCompletingCity}
                  aria-invalid={Boolean(citySubmitError)}
                >
                  <option value="">Selecciona una ciudad</option>
                  {cityChoices.map((cityChoice) => (
                    <option key={cityChoice.slug} value={cityChoice.slug}>
                      {cityChoice.name}
                    </option>
                  ))}
                </select>

                <Button
                  type="submit"
                  className="protected-access-gate__primary-action"
                  disabled={
                    isLoadingCityChoices || isCompletingCity || cityChoices.length === 0
                  }
                >
                  {isLoadingCityChoices
                    ? "Cargando ciudades..."
                    : isCompletingCity
                      ? "Guardando ciudad..."
                      : "Guardar y continuar"}
                </Button>
              </form>
            </>
          ) : null}

          {accessState === "unauthorized" ? (
            <>
              <div className="protected-access-gate__icon-wrap" aria-hidden="true">
                <ShieldCheck />
              </div>
              <p className="protected-access-gate__eyebrow">Acceso no listo</p>
              <h2
                id="protected-access-gate-title"
                className="protected-access-gate__title"
              >
                No pudimos preparar tu acceso
              </h2>
              <p className="protected-access-gate__description">
                La sesion social se ha iniciado, pero no hemos podido refrescar
                los datos minimos de tu cuenta en este momento.
              </p>

              {feedbackMessage ? (
                <p
                  className="protected-access-gate__feedback protected-access-gate__feedback--error"
                  role="alert"
                >
                  {feedbackMessage}
                </p>
              ) : null}

              <Button
                type="button"
                className="protected-access-gate__primary-action"
                onClick={refreshAppUser}
              >
                Reintentar
              </Button>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
