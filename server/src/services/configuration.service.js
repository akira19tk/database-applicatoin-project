import { pool } from "../db/pool.js";

export async function getConfig(key) {
  const r = await pool.query("SELECT value FROM configuration WHERE key = $1", [key]);
  if (r.rowCount === 0) throw new Error(`Config not found: ${key}`);
  return r.rows[0];
}
