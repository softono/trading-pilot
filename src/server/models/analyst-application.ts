import {
  pgTable,
  pgEnum,
  serial,
  text,
  integer,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "@/server/models/user";
import { APPLICATION_STATUS } from "@/modules/analyst/analyst.constants";

export const applicationStatusEnum = pgEnum("analyst_application_status", [
  APPLICATION_STATUS.PENDING,
  APPLICATION_STATUS.APPROVED,
  APPLICATION_STATUS.REJECTED,
]);

export const analystApplications = pgTable(
  "analyst_applications",
  {
    id: serial("id").primaryKey(),
    user_id: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    pitch: text("pitch").notNull(),
    experience_years: integer("experience_years"),
    specialties: jsonb("specialties").$type<string[]>().default([]),
    website: text("website"),
    status: applicationStatusEnum("status")
      .notNull()
      .default(APPLICATION_STATUS.PENDING),
    reviewed_by: text("reviewed_by").references(() => users.id, {
      onDelete: "set null",
    }),
    reviewed_at: timestamp("reviewed_at", { withTimezone: true }),
    rejection_reason: text("rejection_reason"),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("analyst_applications_user_idx").on(t.user_id),
    index("analyst_applications_status_idx").on(t.status),
  ],
);

export type IAnalystApplication = typeof analystApplications.$inferSelect;
export type NewAnalystApplication = typeof analystApplications.$inferInsert;

export default analystApplications;
