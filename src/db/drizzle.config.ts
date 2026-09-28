import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";
import { resolve } from "path";

// Load .env from project root (src/db/ → ../../.env)
config({ path: resolve(__dirname, "../../.env") });

const connectionString = process.env.DATABASE_URL;

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  schemaFilter: ["public"],
  dbCredentials: connectionString
    ? { url: connectionString, ssl: "require" }
    : {
        host: process.env.SQL_HOST || "localhost",
        user: process.env.SQL_USER || "postgres",
        password: process.env.SQL_PASSWORD || "",
        database: process.env.SQL_DB_NAME || "postgres",
        ssl: false,
      },
  verbose: true,
});
