import { useCallback, useEffect, useState } from "react";
import { getDefaultPublisherStatus } from "@/helpers/publisherStatus";
import { getMyPublisherStatus } from "@/services/publisherRequestsService";

export function usePublisherStatus({ enabled = true } = {}) {
  const [publisherStatus, setPublisherStatus] = useState(() =>
    getDefaultPublisherStatus(),
  );
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState("");

  const reloadPublisherStatus = useCallback(async () => {
    if (!enabled) {
      setPublisherStatus(getDefaultPublisherStatus());
      setIsLoading(false);
      setError("");
      return getDefaultPublisherStatus();
    }

    setIsLoading(true);
    setError("");

    try {
      const nextPublisherStatus = await getMyPublisherStatus();
      setPublisherStatus(nextPublisherStatus);
      return nextPublisherStatus;
    } catch (loadError) {
      const resolvedError =
        loadError instanceof Error
          ? loadError
          : new Error("No pudimos cargar tu estado de Organizador.");

      setPublisherStatus(getDefaultPublisherStatus());
      setError(resolvedError.message);
      return getDefaultPublisherStatus();
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    let isMounted = true;

    const loadStatus = async () => {
      const nextPublisherStatus = await reloadPublisherStatus();

      if (!isMounted) {
        return;
      }

      setPublisherStatus(nextPublisherStatus);
    };

    void loadStatus();

    return () => {
      isMounted = false;
    };
  }, [reloadPublisherStatus]);

  return {
    error,
    isLoading,
    publisherStatus,
    reloadPublisherStatus,
  };
}
