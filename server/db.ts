import { drizzle } from "drizzle-orm/neon-http";
import { neon, neonConfig } from "@neondatabase/serverless";

// Configure neon to work in Node.js environment
neonConfig.fetchConnectionCache = true;

// Initialize Neon connection
const sql = neon(process.env.DATABASE_URL || "");

// Initialize Drizzle with the Neon connection
export const db = drizzle(sql);
