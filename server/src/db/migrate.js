import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pool, closePool } from './index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function migrate() {
  const sql = await readFile(join(__dirname, 'schema.sql'), 'utf8');
  console.log('[migrate] applying schema.sql ...');
  await pool.query(sql);
  console.log('[migrate] done');
}

migrate()
  .catch((err) => {
    console.error('[migrate] failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => closePool());
