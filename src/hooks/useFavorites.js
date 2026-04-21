import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  getSupabaseClient,
  getSupabaseClientError,
} from "@/services/supabaseClient";

function normalizeFavoriteId(activityId) {
  if (activityId === null || activityId === undefined) {
    return null;
  }

  return String(activityId);
}

export function useFavorites() {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.id) {
      setFavoriteIds([]);
      setError("");
      setIsLoading(false);
      return undefined;
    }

    let isMounted = true;

    const loadFavorites = async () => {
      const supabase = getSupabaseClient();

      if (!supabase) {
        if (!isMounted) {
          return;
        }

        setFavoriteIds([]);
        setError(
          getSupabaseClientError() ||
            "No pudimos conectar con Supabase para cargar favoritos.",
        );
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");

      const { data, error: loadError } = await supabase
        .from("user_favorite_activities")
        .select("activity_id")
        .eq("user_profile_id", user.id)
        .order("created_at", { ascending: false });

      if (!isMounted) {
        return;
      }

      if (loadError) {
        setFavoriteIds([]);
        setError(
          loadError.message || "No pudimos cargar tus favoritos remotos.",
        );
        setIsLoading(false);
        return;
      }

      setFavoriteIds(
        (data ?? [])
          .map((favoriteRow) => normalizeFavoriteId(favoriteRow.activity_id))
          .filter(Boolean),
      );
      setIsLoading(false);
    };

    void loadFavorites();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const addFavorite = useCallback(
    async (activityId) => {
      const normalizedActivityId = normalizeFavoriteId(activityId);

      if (!user?.id || !normalizedActivityId) {
        return { error: new Error("Necesitamos una cuenta activa para guardar favoritos.") };
      }

      const supabase = getSupabaseClient();

      if (!supabase) {
        const resolvedError = new Error(
          getSupabaseClientError() ||
            "No pudimos conectar con Supabase para guardar favoritos.",
        );

        setError(resolvedError.message);
        return { error: resolvedError };
      }

      setError("");
      setFavoriteIds((currentFavoriteIds) =>
        currentFavoriteIds.includes(normalizedActivityId)
          ? currentFavoriteIds
          : [normalizedActivityId, ...currentFavoriteIds],
      );

      const { error: insertError } = await supabase
        .from("user_favorite_activities")
        .insert({
          user_profile_id: user.id,
          activity_id: Number(normalizedActivityId),
        });

      if (insertError) {
        setFavoriteIds((currentFavoriteIds) =>
          currentFavoriteIds.filter(
            (favoriteId) => favoriteId !== normalizedActivityId,
          ),
        );
        setError(insertError.message || "No pudimos guardar este favorito.");
        return { error: insertError };
      }

      return { error: null };
    },
    [user?.id],
  );

  const removeFavorite = useCallback(
    async (activityId) => {
      const normalizedActivityId = normalizeFavoriteId(activityId);

      if (!user?.id || !normalizedActivityId) {
        return { error: new Error("Necesitamos una cuenta activa para quitar favoritos.") };
      }

      const supabase = getSupabaseClient();

      if (!supabase) {
        const resolvedError = new Error(
          getSupabaseClientError() ||
            "No pudimos conectar con Supabase para quitar favoritos.",
        );

        setError(resolvedError.message);
        return { error: resolvedError };
      }

      setError("");
      const previousFavoriteIds = favoriteIds;

      setFavoriteIds((currentFavoriteIds) =>
        currentFavoriteIds.filter(
          (favoriteId) => favoriteId !== normalizedActivityId,
        ),
      );

      const { error: deleteError } = await supabase
        .from("user_favorite_activities")
        .delete()
        .eq("user_profile_id", user.id)
        .eq("activity_id", Number(normalizedActivityId));

      if (deleteError) {
        setFavoriteIds(previousFavoriteIds);
        setError(deleteError.message || "No pudimos quitar este favorito.");
        return { error: deleteError };
      }

      return { error: null };
    },
    [favoriteIds, user?.id],
  );

  const toggleFavorite = useCallback(
    async (activityId) => {
      if (favoriteIds.includes(normalizeFavoriteId(activityId))) {
        return removeFavorite(activityId);
      }

      return addFavorite(activityId);
    },
    [addFavorite, favoriteIds, removeFavorite],
  );

  const isFavorite = (activityId) => {
    const normalizedActivityId = normalizeFavoriteId(activityId);

    return normalizedActivityId
      ? favoriteIds.includes(normalizedActivityId)
      : false;
  };

  return {
    error,
    favoriteIds,
    isLoading,
    isFavorite,
    toggleFavorite,
    removeFavorite,
    addFavorite,
  };
}
