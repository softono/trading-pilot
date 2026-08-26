import {
  pgTable,
  pgEnum,
  serial,
  text,
  jsonb,
  boolean,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { users } from "@/server/models/user";
import { ANALYST_TYPE } from "@/modules/analyst/analyst.constants";

export const analystTypeEnum = pgEnum("analyst_type", [
  ANALYST_TYPE.AI,
  ANALYST_TYPE.HUMAN,
]);

export const analystProfiles = pgTable(
  "analyst_profiles",
  {
    id: serial("id").primaryKey(),
    user_id: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    display_name: text("display_name").notNull(),
    headline: text("headline"),
    bio: text("bio"),
    avatar: text("avatar"),
    analyst_type: analystTypeEnum("analyst_type")
      .notNull()
      .default(ANALYST_TYPE.HUMAN),
    specialties: jsonb("specialties").$type<string[]>().default([]),
    socials: jsonb("socials").$type<Record<string, string>>().default({}),
    is_public: boolean("is_public").notNull().default(true),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("analyst_profiles_user_unique").on(t.user_id),
    uniqueIndex("analyst_profiles_slug_unique").on(t.slug),
    index("analyst_profiles_type_idx").on(t.analyst_type),
  ],
);

export type IAnalystProfile = typeof analystProfiles.$inferSelect;
export type NewAnalystProfile = typeof analystProfiles.$inferInsert;

export default analystProfiles;
