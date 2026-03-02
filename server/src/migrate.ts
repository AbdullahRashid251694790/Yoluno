import dotenv from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';

const envLocalPath = resolve(process.cwd(), '.env.local');
if (existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath, override: true });
} else {
  dotenv.config();
}

import fs from 'fs/promises';
import path from 'path';
import { getPool } from './config/database.js';

const MIGRATIONS_DIR = path.join(process.cwd(), 'migrations');

async function runMigrations() {
  console.log('Starting database migrations...');

  const pool = getPool();
  const client = await pool.connect();

  try {
    // Create migrations tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id serial PRIMARY KEY,
        name text NOT NULL UNIQUE, 
        executed_at timestamptz NOT  NULL DEFAULT now()
      ) 
    `);

    // Get executed migrations
    const { rows: executed } = await client.query(
      'SELECT name FROM _migrations ORDER BY id'
    );
    const executedNames = new Set(executed.map(r => r.name));

    // Get all migration files
    const files = await fs.readdir(MIGRATIONS_DIR);
    const sqlFiles = files
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`Found ${sqlFiles.length} migration files`);

    // Run pending migrations
    for (const file of sqlFiles) {
      if (executedNames.has(file)) {
        console.log(`Skipping ${file} (already executed)`);
        continue;
      }

      console.log(`Running ${file}...`);

      const sql = await fs.readFile(path.join(MIGRATIONS_DIR, file), 'utf-8');

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO _migrations (name) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
        console.log(`Completed ${file}`);
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Failed ${file}:`, error);
        throw error;
      }
    }

    console.log('All migrations completed successfully');
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
