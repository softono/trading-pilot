export const ANALYST_TYPE = {
  AI: "ai",
  HUMAN: "human",
} as const;

export const ANALYST_TYPE_LABEL = {
  ai: { label: "AI Analyst", variant: "secondary" },
  human: { label: "Analyst", variant: "success" },
} as const;

export const APPLICATION_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

export const APPLICATION_STATUS_LABEL = {
  pending: { label: "Pending", variant: "secondary" },
  approved: { label: "Approved", variant: "success" },
  rejected: { label: "Rejected", variant: "destructive" },
} as const;
