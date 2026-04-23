import { useEffect, useState } from "react";
import { listActivities } from "@/services/catalogService";

export function useCatalog() {
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadCatalog = async () => {
      setIsLoading(true);
      setError("");

      try {
        const nextActivities = await listActivities();

        if (!isMounted) {
          return;
        }

        setActivities(nextActivities);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
          : "No pudimos cargar el catálogo. Intenta de nuevo.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadCatalog();

    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

  const reload = () => {
    setReloadKey((currentKey) => currentKey + 1);
  };

  return {
    activities,
    isLoading,
    error,
    reload,
  };
}
