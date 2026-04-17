import { useEffect, useMemo, useState } from "react";
import { buildActivityEventsDashboard } from "@/helpers/activityEventsAnalytics";
import { listActivityEvents } from "@/services/activityEventsService";

export function useActivityEventsDashboard() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [availability, setAvailability] = useState("ready");
  const [availabilityReason, setAvailabilityReason] = useState("");
  const [availabilityMessage, setAvailabilityMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadActivityEvents = async () => {
      setIsLoading(true);
      setError("");
      setAvailability("ready");
      setAvailabilityReason("");
      setAvailabilityMessage("");

      try {
        const result = await listActivityEvents();

        if (!isMounted) {
          return;
        }

        if (result.availability === "unavailable") {
          setEvents([]);
          setAvailability("unavailable");
          setAvailabilityReason(result.reason || "");
          setAvailabilityMessage(result.message || "");
          return;
        }

        setEvents(result.events ?? []);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setEvents([]);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No pudimos cargar las interacciones.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadActivityEvents();

    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

  const dashboard = useMemo(
    () => buildActivityEventsDashboard(events),
    [events],
  );

  const reload = () => {
    setReloadKey((currentReloadKey) => currentReloadKey + 1);
  };

  return {
    events,
    dashboard,
    isLoading,
    error,
    availability,
    availabilityReason,
    availabilityMessage,
    reload,
  };
}
