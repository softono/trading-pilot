import {
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { users } from "@/server/models/user";

export const analystApiKeys = pgTable(
  "analyst_api_keys",
  {
    id: serial("id").primaryKey(),
    user_id: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    key_id: text("key_id").notNull(),
    // Encrypted (reversible, AES-256-GCM via lib/encryption), not hashed —
    // HMAC verification on every webhook call needs the plaintext secret
    // back to recompute the signature, unlike a login password.
    secret_encrypted: text("secret_encrypted").notNull(),
    label: text("label"),
    last_used_at: timestamp("last_used_at", { withTimezone: true }),
    revoked_at: timestamp("revoked_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("analyst_api_keys_key_id_unique").on(t.key_id),
    index("analyst_api_keys_user_idx").on(t.user_id),
  ],
);

export type IAnalystApiKey = typeof analystApiKeys.$inferSelect;
export type NewAnalystApiKey = typeof analystApiKeys.$inferInsert;

export default analystApiKeys;
