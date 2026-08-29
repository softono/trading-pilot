export const BROKER = {
  GROWW: "groww",
  DHAN: "dhan",
  DELTA: "delta",
  ANGELONE: "angelone",
  PAPER: "paper",
} as const;

export const BROKER_LABEL = {
  groww: "Groww",
  dhan: "Dhan",
  delta: "Delta Exchange",
  angelone: "Angel One",
  paper: "Paper Trading",
} as const;

export const BROKER_MODE = {
  LIVE: "live",
  SANDBOX: "sandbox",
  PAPER: "paper",
} as const;

// Which modes each broker actually supports (Groww has no sandbox; Paper is always "paper").
export const BROKER_SUPPORTED_MODES: Record<string, readonly string[]> = {
  groww: [BROKER_MODE.LIVE],
  dhan: [BROKER_MODE.LIVE, BROKER_MODE.SANDBOX],
  delta: [BROKER_MODE.LIVE, BROKER_MODE.SANDBOX],
  angelone: [BROKER_MODE.LIVE],
  paper: [BROKER_MODE.PAPER],
};

// equity brokers can only execute equity-class signals; crypto brokers only crypto-class.
// Paper accepts either, since it never touches a real venue.
export const BROKER_INSTRUMENT_CLASSES: Record<string, readonly string[]> = {
  groww: ["equity"],
  dhan: ["equity"],
  delta: ["crypto"],
  angelone: ["equity"],
  paper: ["equity", "crypto"],
};

export const CONNECTION_STATUS = {
  UNVERIFIED: "unverified",
  VERIFIED: "verified",
  ERROR: "error",
} as const;

export const CONNECTION_STATUS_LABEL = {
  unverified: { label: "Unverified", variant: "secondary" },
  verified: { label: "Verified", variant: "success" },
  error: { label: "Error", variant: "destructive" },
} as const;

export const EXECUTION_STATUS = {
  PENDING: "pending",
  PLACED: "placed",
  FILLED: "filled",
  REJECTED: "rejected",
  FAILED: "failed",
  SKIPPED: "skipped",
} as const;

export const EXECUTION_STATUS_LABEL = {
  pending: { label: "Pending", variant: "secondary" },
  placed: { label: "Placed", variant: "default" },
  filled: { label: "Filled", variant: "success" },
  rejected: { label: "Rejected", variant: "destructive" },
  failed: { label: "Failed", variant: "destructive" },
  skipped: { label: "Skipped", variant: "outline" },
} as const;
