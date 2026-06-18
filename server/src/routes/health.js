import { pool } from '../db/index.js';

export default async function healthRoutes(fastify) {
  fastify.get('/health', async () => {
    let db = 'down';
    try {
      await pool.query('SELECT 1');
      db = 'up';
    } catch {
      db = 'down';
    }
    return { status: 'ok', db, ts: new Date().toISOString() };
  });
}
