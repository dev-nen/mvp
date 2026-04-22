import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  DRAFT_INBOX_TOOL_NAME,
  hasInternalToolAccess,
} from "@/services/internalToolAccessService";

export function useInternalToolAccess(toolName = DRAFT_INBOX_TOOL_NAME) {
  const { accessState, user } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (accessState !== "ready" || !user?.id) {
      setHasAccess(false);
      setError("");
      setIsLoading(false);
      return undefined;
    }

    let isMounted = true;

    const loadInternalAccess = async () => {
      setIsLoading(true);
      setError("");

      try {
        const nextHasAccess = await hasInternalToolAccess(user.id, toolName);

        if (!isMounted) {
          return;
        }

        setHasAccess(nextHasAccess);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setHasAccess(false);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No pudimos comprobar el acceso interno.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadInternalAccess();

    return () => {
      isMounted = false;
    };
  }, [accessState, reloadKey, toolName, user?.id]);

  const reload = useCallback(() => {
    setReloadKey((currentReloadKey) => currentReloadKey + 1);
  }, []);

  return {
    error,
    hasAccess,
    isLoading,
    reload,
  };
}
