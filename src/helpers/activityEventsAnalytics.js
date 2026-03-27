import {
  ACTIVITY_CONTACT_CLICK_EVENT,
  ACTIVITY_FAVORITE_ADD_EVENT,
  ACTIVITY_FAVORITE_REMOVE_EVENT,
  ACTIVITY_VIEW_MORE_EVENT,
  CATALOG_MODAL_SOURCE,
  FAVORITES_DETAIL_SOURCE,
} from "@/services/activityEventsService";

const SOURCE_ORDER = [CATALOG_MODAL_SOURCE, FAVORITES_DETAIL_SOURCE];

function buildConversionRate(numeratorCount, denominatorCount) {
  if (denominatorCount === 0) {
    return null;
  }

  return numeratorCount / denominatorCount;
}

function isWithinLastSevenDays(createdAt) {
  const eventTime = new Date(createdAt).getTime();

  if (Number.isNaN(eventTime)) {
    return false;
  }

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  return eventTime >= sevenDaysAgo;
}

function sortTopActivities(leftActivity, rightActivity) {
  if (rightActivity.contactCount !== leftActivity.contactCount) {
    return rightActivity.contactCount - leftActivity.contactCount;
  }

  if (rightActivity.viewMoreCount !== leftActivity.viewMoreCount) {
    return rightActivity.viewMoreCount - leftActivity.viewMoreCount;
  }

  if (rightActivity.favoriteAddCount !== leftActivity.favoriteAddCount) {
    return rightActivity.favoriteAddCount - leftActivity.favoriteAddCount;
  }

  return leftActivity.activityTitle.localeCompare(rightActivity.activityTitle);
}

export function buildActivityEventsDashboard(events) {
  const topActivitiesMap = new Map();
  const sourceBreakdownMap = new Map(
    SOURCE_ORDER.map((source) => [
      source,
      {
        source,
        viewMoreCount: 0,
        contactCount: 0,
        favoriteAddCount: 0,
        favoriteRemoveCount: 0,
      },
    ]),
  );

  let viewMoreCount = 0;
  let contactCount = 0;
  let favoriteAddCount = 0;
  let favoriteRemoveCount = 0;
  let lastSevenDaysCount = 0;

  events.forEach((event) => {
    const activityKey = [
      event.activity_id || "unknown-activity",
      event.activity_title_snapshot || "Actividad sin titulo",
      event.city_name_snapshot || "",
    ].join("::");

    if (!topActivitiesMap.has(activityKey)) {
      topActivitiesMap.set(activityKey, {
        activityId: event.activity_id || "",
        activityTitle: event.activity_title_snapshot || "Actividad sin titulo",
        cityName: event.city_name_snapshot || "Sin ciudad",
        viewMoreCount: 0,
        contactCount: 0,
        favoriteAddCount: 0,
        favoriteRemoveCount: 0,
      });
    }

    const activitySummary = topActivitiesMap.get(activityKey);
    const sourceSummary =
      sourceBreakdownMap.get(event.source) ??
      {
        source: event.source || "unknown",
        viewMoreCount: 0,
        contactCount: 0,
        favoriteAddCount: 0,
        favoriteRemoveCount: 0,
      };

    if (event.event_name === ACTIVITY_VIEW_MORE_EVENT) {
      viewMoreCount += 1;
      activitySummary.viewMoreCount += 1;
      sourceSummary.viewMoreCount += 1;
    }

    if (event.event_name === ACTIVITY_CONTACT_CLICK_EVENT) {
      contactCount += 1;
      activitySummary.contactCount += 1;
      sourceSummary.contactCount += 1;
    }

    if (event.event_name === ACTIVITY_FAVORITE_ADD_EVENT) {
      favoriteAddCount += 1;
      activitySummary.favoriteAddCount += 1;
      sourceSummary.favoriteAddCount += 1;
    }

    if (event.event_name === ACTIVITY_FAVORITE_REMOVE_EVENT) {
      favoriteRemoveCount += 1;
      activitySummary.favoriteRemoveCount += 1;
      sourceSummary.favoriteRemoveCount += 1;
    }

    if (!sourceBreakdownMap.has(sourceSummary.source)) {
      sourceBreakdownMap.set(sourceSummary.source, sourceSummary);
    }

    if (isWithinLastSevenDays(event.created_at)) {
      lastSevenDaysCount += 1;
    }
  });

  const topActivities = Array.from(topActivitiesMap.values())
    .map((activitySummary) => ({
      ...activitySummary,
      conversionRate: buildConversionRate(
        activitySummary.contactCount,
        activitySummary.viewMoreCount,
      ),
      favoritePerViewRate: buildConversionRate(
        activitySummary.favoriteAddCount,
        activitySummary.viewMoreCount,
      ),
    }))
    .sort(sortTopActivities);

  const sourceBreakdown = Array.from(sourceBreakdownMap.values()).map(
    (sourceSummary) => ({
      ...sourceSummary,
      conversionRate: buildConversionRate(
        sourceSummary.contactCount,
        sourceSummary.viewMoreCount,
      ),
      favoritePerViewRate: buildConversionRate(
        sourceSummary.favoriteAddCount,
        sourceSummary.viewMoreCount,
      ),
    }),
  );

  const recentEvents = events.slice(0, 20);

  return {
    totals: {
      viewMoreCount,
      contactCount,
      favoriteAddCount,
      favoriteRemoveCount,
      conversionRate: buildConversionRate(contactCount, viewMoreCount),
      favoritePerViewRate: buildConversionRate(favoriteAddCount, viewMoreCount),
      lastSevenDaysCount,
    },
    topActivities,
    sourceBreakdown,
    recentEvents,
  };
}
