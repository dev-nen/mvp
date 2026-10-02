export const PUBLISHER_STATUS = {
  APPROVED: "approved",
  NEEDS_CHANGES: "needs_changes",
  NOT_REQUESTED: "not_requested",
  PENDING_REVIEW: "pending_review",
  REJECTED: "rejected",
};

export const PUBLISHER_STATUS_VALUES = Object.values(PUBLISHER_STATUS);

export function normalizePublisherStatus(value) {
  const normalizedValue =
    typeof value === "string" ? value.trim().toLowerCase() : "";

  return PUBLISHER_STATUS_VALUES.includes(normalizedValue)
    ? normalizedValue
    : PUBLISHER_STATUS.NOT_REQUESTED;
}

export function canSubmitActivitiesWithPublisherStatus(status) {
  return normalizePublisherStatus(status) === PUBLISHER_STATUS.APPROVED;
}

export function canRequestPublisherAccess(status) {
  return [PUBLISHER_STATUS.NOT_REQUESTED, PUBLISHER_STATUS.REJECTED].includes(
    normalizePublisherStatus(status),
  );
}

export function canResubmitPublisherRequest(status) {
  return [PUBLISHER_STATUS.NEEDS_CHANGES, PUBLISHER_STATUS.REJECTED].includes(
    normalizePublisherStatus(status),
  );
}

export function getDefaultPublisherStatus() {
  return {
    activeProfile: null,
    canRequest: true,
    canResubmit: false,
    canSubmitActivities: false,
    latestRequest: null,
    latestRequestId: null,
    status: PUBLISHER_STATUS.NOT_REQUESTED,
    userFeedbackJson: [],
    userFeedbackSummary: "",
  };
}
