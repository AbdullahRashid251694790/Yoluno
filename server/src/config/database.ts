import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

export type { PoolClient };

let _pool: Pool | null = null;
let _keepaliveInterval: ReturnType<typeof setInterval> | null = null;

export function getPool(): Pool {
  if (!_pool) {
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      min: 2, // Keep at least 2 connections alive
      idleTimeoutMillis: 0, // Never kill idle connections — we handle keepalive ourselves
      connectionTimeoutMillis: 20000, // 20s to connect
      allowExitOnIdle: false, // Don't let pool exit when idle
    });

    // Prevent unhandled pool errors from crashing the server
    _pool.on('error', (err) => {
      console.error('Database pool error:', err.message);
      // If pool is broken, recreate it on next query
      if (err.message.includes('terminated') || err.message.includes('Connection terminated')) {
        console.log('Pool connection terminated, will reconnect on next query');
        _pool = null;
        if (_keepaliveInterval) {
          clearInterval(_keepaliveInterval);
          _keepaliveInterval = null;
        }
      }
    });

    // Keepalive: ping DB every 60 seconds to prevent Railway from killing idle connections
    _keepaliveInterval = setInterval(async () => {
      try {
        const pool = getPool();
        await pool.query('SELECT 1');
      } catch (err) {
        console.error('Keepalive ping failed:', (err as Error).message);
        // Pool will auto-recreate on next getPool() call
        _pool = null;
        if (_keepaliveInterval) {
          clearInterval(_keepaliveInterval);
          _keepaliveInterval = null;
        }
      }
    }, 60000); // Every 60 seconds

    // Don't let keepalive prevent Node from exiting
    if (_keepaliveInterval.unref) {
      _keepaliveInterval.unref();
    }
  }
  return _pool;
}

// Backwards-compatible export
export const pool = new Proxy({} as Pool, {
  get(_target, prop) {
    return (getPool() as any)[prop];
  },
});

// Test database connection
export async function testConnection(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('SELECT NOW()');
  } finally {
    client.release();
  }
}

// Helper for running queries with automatic retry on connection failure
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const start = Date.now();

  try {
    const result = await getPool().query<T>(text, params);
    const duration = Date.now() - start;

    if (process.env.NODE_ENV === 'development') {
      console.log('Executed query', { text: text.substring(0, 100), duration, rows: result.rowCount });
    }

    return result;
  } catch (error) {
    const err = error as Error & { code?: string };

    // Connection-level errors — retry once after resetting pool
    if (
      err.code === 'ECONNRESET' ||
      err.code === 'EPIPE' ||
      err.code === '57P01' || // admin_shutdown
      err.code === '57P03' || // cannot_connect_now
      err.message?.includes('terminated') ||
      err.message?.includes('Connection terminated') ||
      err.message?.includes('Client has encountered a connection error')
    ) {
      console.warn('DB connection lost, retrying query...');
      _pool = null; // Force pool recreation
      if (_keepaliveInterval) {
        clearInterval(_keepaliveInterval);
        _keepaliveInterval = null;
      }

      // Retry once with fresh pool
      const result = await getPool().query<T>(text, params);
      const duration = Date.now() - start;
      console.log('Query retry succeeded', { duration });
      return result;
    }

    throw error;
  }
}

// Helper for transactions
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Helper for single row queries
export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const result = await query<T>(text, params);
  return result.rows[0] || null;
}
