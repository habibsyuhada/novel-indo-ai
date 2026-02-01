// src/lib/db.ts
import { Pool } from "pg";

declare global {
    // eslint-disable-next-line no-var
    var pgPool: Pool | undefined;
}

export const pool =
    global.pgPool ??
    new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 5,
    });

if (process.env.NODE_ENV !== "production") global.pgPool = pool;
