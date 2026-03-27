import { useEffect, useState } from "react";

const FAVORITES_STORAGE_KEY = "nendo.favorite_activity_ids";

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
      ? parsedValue.filter((value) => typeof value === "string")
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
    setFavoriteIds((currentFavoriteIds) =>
      currentFavoriteIds.includes(activityId)
        ? currentFavoriteIds.filter((favoriteId) => favoriteId !== activityId)
        : [...currentFavoriteIds, activityId],
    );
  };

  const removeFavorite = (activityId) => {
    setFavoriteIds((currentFavoriteIds) =>
      currentFavoriteIds.filter((favoriteId) => favoriteId !== activityId),
    );
  };

  const isFavorite = (activityId) => favoriteIds.includes(activityId);

  return {
    favoriteIds,
    isFavorite,
    toggleFavorite,
    removeFavorite,
  };
}
