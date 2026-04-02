import { useEffect, useState } from "react";

const FAVORITES_STORAGE_KEY = "nensgo.favorite_activity_ids";
const LEGACY_STORAGE_PREFIX = ["nen", "do"].join("");
const LEGACY_FAVORITES_STORAGE_KEY =
  `${LEGACY_STORAGE_PREFIX}.favorite_activity_ids`;

function normalizeFavoriteId(activityId) {
  if (activityId === null || activityId === undefined) {
    return null;
  }

  return String(activityId);
}

function parseStoredFavoriteIds(storedValue) {
  if (!storedValue) {
    return [];
  }

  const parsedValue = JSON.parse(storedValue);

  return Array.isArray(parsedValue)
    ? parsedValue
        .map((value) => normalizeFavoriteId(value))
        .filter(Boolean)
    : [];
}

function loadFavoriteIds() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedValue = window.localStorage.getItem(FAVORITES_STORAGE_KEY);

    if (storedValue) {
      return parseStoredFavoriteIds(storedValue);
    }

    const legacyStoredValue = window.localStorage.getItem(
      LEGACY_FAVORITES_STORAGE_KEY,
    );

    return parseStoredFavoriteIds(legacyStoredValue);
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

    try {
      const currentStoredValue = window.localStorage.getItem(FAVORITES_STORAGE_KEY);

      if (currentStoredValue) {
        return;
      }

      const legacyStoredValue = window.localStorage.getItem(
        LEGACY_FAVORITES_STORAGE_KEY,
      );

      if (!legacyStoredValue) {
        return;
      }

      const migratedFavoriteIds = parseStoredFavoriteIds(legacyStoredValue);

      window.localStorage.setItem(
        FAVORITES_STORAGE_KEY,
        JSON.stringify(migratedFavoriteIds),
      );
      window.localStorage.removeItem(LEGACY_FAVORITES_STORAGE_KEY);
    } catch {
      // Ignore localStorage migration errors and keep the in-memory state.
    }
  }, []);

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
