import pg from 'pg';
import { config } from '../config.js';

const { Pool } = pg;

export const pool = new Pool({ connectionString: config.databaseUrl });

pool.on('error', (err) => {
  // Surface unexpected idle-client errors instead of crashing silently.
  console.error('[db] unexpected pool error', err);
});

export function query(text, params) {
  return pool.query(text, params);
}

export async function closePool() {
  await pool.end();
}
