import { useEffect, useState } from "react";

const FAVORITES_STORAGE_KEY = "nendo.favorite_activity_ids";

function normalizeFavoriteId(activityId) {
  if (activityId === null || activityId === undefined) {
    return null;
  }

  return String(activityId);
}

function loadFavoriteIds() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedValue = window.localStorage.getItem(FAVORITES_STORAGE_KEY);

    if (!storedValue) {
      return [];
    }

    const parsedValue = JSON.parse(storedValue);

    return Array.isArray(parsedValue)
      ? parsedValue
          .map((value) => normalizeFavoriteId(value))
          .filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState(loadFavoriteIds);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify(favoriteIds),
    );
  }, [favoriteIds]);

  const toggleFavorite = (activityId) => {
    const normalizedActivityId = normalizeFavoriteId(activityId);

    if (!normalizedActivityId) {
      return;
    }

    setFavoriteIds((currentFavoriteIds) =>
      currentFavoriteIds.includes(normalizedActivityId)
        ? currentFavoriteIds.filter(
            (favoriteId) => favoriteId !== normalizedActivityId,
          )
        : [...currentFavoriteIds, normalizedActivityId],
    );
  };

  const removeFavorite = (activityId) => {
    const normalizedActivityId = normalizeFavoriteId(activityId);

    if (!normalizedActivityId) {
      return;
    }

    setFavoriteIds((currentFavoriteIds) =>
      currentFavoriteIds.filter(
        (favoriteId) => favoriteId !== normalizedActivityId,
      ),
    );
  };

  const isFavorite = (activityId) => {
    const normalizedActivityId = normalizeFavoriteId(activityId);

    return normalizedActivityId
      ? favoriteIds.includes(normalizedActivityId)
      : false;
  };

  return {
    favoriteIds,
    isFavorite,
    toggleFavorite,
    removeFavorite,
  };
}
