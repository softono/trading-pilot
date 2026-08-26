export const WEBHOOK_EVENT = {
  PUBLISHED: "signal.published",
  UPDATED: "signal.updated",
} as const;

export const SIGNAL_SIDE = {
  LONG: "long",
  SHORT: "short",
} as const;

// Mirrors the subset of the upstream trading engine's state machine that
// ever reaches this platform — only PUBLISHED and later. Free text in the
// DB (see Signal model) so upstream can extend it without a migration here;
// this list is only the wire-validation contract for the webhook payload.
export const SIGNAL_STATUS = {
  PUBLISHED: "PUBLISHED",
  ACTIVE: "ACTIVE",
  TARGET_REACHED: "TARGET_REACHED",
  STOPPED: "STOPPED",
  FAILED: "FAILED",
  EXPIRED: "EXPIRED",
} as const;

export const SIGNAL_STATUS_LABEL = {
  PUBLISHED: { label: "Published", variant: "secondary" },
  ACTIVE: { label: "Active", variant: "default" },
  TARGET_REACHED: { label: "Target Reached", variant: "success" },
  STOPPED: { label: "Stopped", variant: "destructive" },
  FAILED: { label: "Failed", variant: "destructive" },
  EXPIRED: { label: "Expired", variant: "outline" },
} as const;
