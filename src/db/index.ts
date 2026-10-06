import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Reuse one connection pool across dev hot reloads instead of opening a new one per edit.
const globalForDb = globalThis as unknown as { pgClient?: postgres.Sql };

// postgres() connects lazily, so a missing DATABASE_URL only fails on the first query.
// The home page checks the env first and shows a setup notice instead.
const client = globalForDb.pgClient ?? postgres(process.env.DATABASE_URL ?? "");
if (process.env.NODE_ENV !== "production") globalForDb.pgClient = client;

export const db = drizzle(client, { schema });
