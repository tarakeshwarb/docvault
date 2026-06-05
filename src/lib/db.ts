import type { QueryResultRow } from "pg";
import { Pool } from "pg";
import { requireEnv } from "./env";

let cachedPool: Pool | null = null;

export function getPool(): Pool {
  if (!cachedPool) {
    cachedPool = new Pool({
      connectionString: requireEnv("DATABASE_URL"),
    });
  }
  return cachedPool;
}

export async function queryDb<T extends QueryResultRow>(
  text: string,
  params: Array<string | number | boolean | null> = []
): Promise<T[]> {
  const pool = getPool();
  const result = await pool.query<T>(text, params);
  return result.rows;
}

export async function executeDb(
  text: string,
  params: Array<string | number | boolean | null> = []
): Promise<void> {
  const pool = getPool();
  await pool.query(text, params);
}
