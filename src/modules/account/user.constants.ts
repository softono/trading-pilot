export const USER_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

export const USER_STATUS_LABEL = {
  active: { label: "Active", variant: "success" },
  inactive: { label: "Inactive", variant: "destructive" },
} as const;

export const USER_ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  USER: "USER",
  ANALYST: "ANALYST",
} as const;

export const ADMIN_ROLES = [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN];
