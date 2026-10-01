import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Locally the URLs live in .env.local; on Vercel they come from the Neon integration.
config({ path: ".env.local", quiet: true });

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "",
  },
  strict: true,
});
