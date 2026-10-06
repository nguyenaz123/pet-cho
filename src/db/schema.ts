import { bigint, doublePrecision, index, integer, jsonb, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";
import type { BreedId, EquippedItems, PetAction, PetStats, PetStatus } from "@/types/pet";

// --- Auth.js tables (shape required by @auth/drizzle-adapter) ---------------

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [primaryKey({ columns: [account.provider, account.providerAccountId] })],
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })],
);

// --- Game tables -------------------------------------------------------------

/** One pet per user. Epoch-ms fields are stored as bigint, read back as numbers. */
export const pets = pgTable(
  "pet",
  {
    ownerId: text("ownerId")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    petName: text("petName").notNull(),
    breed: text("breed").$type<BreedId>().notNull().default("shiba"),
    level: integer("level").notNull(),
    exp: doublePrecision("exp").notNull(),
    stats: jsonb("stats").$type<PetStats>().notNull(),
    status: text("status").$type<PetStatus>().notNull(),
    equippedItems: jsonb("equippedItems").$type<EquippedItems>().notNull(),
    lastUpdated: bigint("lastUpdated", { mode: "number" }).notNull(),
    createdAt: bigint("createdAt", { mode: "number" }).notNull(),
    pubertyAt: bigint("pubertyAt", { mode: "number" }),
    estrusSoothedUntil: bigint("estrusSoothedUntil", { mode: "number" }).notNull(),
    lastActionAt: jsonb("lastActionAt").$type<Partial<Record<PetAction, number>>>().notNull(),
    lastSickPenaltyAt: bigint("lastSickPenaltyAt", { mode: "number" }),
  },
  // The friends list sorts everyone by last played.
  (pet) => [index("pet_lastUpdated_idx").on(pet.lastUpdated)],
);
