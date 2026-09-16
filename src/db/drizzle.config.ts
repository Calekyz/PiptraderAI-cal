import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  schemaFilter: ["public"],
  dbCredentials: {
    host: process.env.SQL_HOST || "localhost",
    user: process.env.SQL_ADMIN_USER || "postgres",
    password: process.env.SQL_ADMIN_PASSWORD || "",
    database: process.env.SQL_DB_NAME || "postgres",
    ssl: false,
  },
  verbose: true,
});
