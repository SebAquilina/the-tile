import type { Config } from "drizzle-kit";

/**
 * Drizzle config — generates migrations against the D1 schema in db/schema.ts.
 *
 * Run:
 *   pnpm drizzle-kit generate   # emit a new SQL migration in drizzle/
 *   pnpm wrangler d1 migrations apply the-tile-staging --remote
 */
export default {
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  driver: "d1-http",
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID ?? "",
    databaseId:
      process.env.CLOUDFLARE_D1_DATABASE_ID ?? "REPLACE-WITH-D1-UUID",
    token: process.env.CLOUDFLARE_API_TOKEN ?? "",
  },
} satisfies Config;
