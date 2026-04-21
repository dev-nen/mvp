import { useEffect, useState } from "react";
import { listActivityContactOptions } from "@/services/activityContactOptionsService";

export function useActivityContactOptions(activityId, enabled = true) {
  const [contactOptions, setContactOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!enabled || !activityId) {
      setContactOptions([]);
      setIsLoading(false);
      setError("");
      return;
    }

    let isMounted = true;

    const loadContactOptions = async () => {
      setIsLoading(true);
      setError("");

      try {
        const nextContactOptions = await listActivityContactOptions(activityId);

        if (!isMounted) {
          return;
        }

        setContactOptions(nextContactOptions);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setContactOptions([]);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No pudimos cargar las opciones de contacto.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadContactOptions();

    return () => {
      isMounted = false;
    };
  }, [activityId, enabled, reloadKey]);

  return {
    contactOptions,
    isLoading,
    error,
    reload: () => setReloadKey((currentKey) => currentKey + 1),
  };
}
