require("dotenv").config();

const fs = require("fs");
const path = require("path");
const pool = require("../config/database");

const migrationsDir = path.join(__dirname, "..", "migrations");

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      run_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getAppliedMigrationIds(client) {
  const result = await client.query(
    `SELECT id FROM schema_migrations ORDER BY id ASC`
  );
  return new Set(result.rows.map((row) => row.id));
}

async function runMigrations() {
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((file) => /^\d+.*\.js$/.test(file))
    .sort();

  const client = await pool.connect();

  try {
    await ensureMigrationsTable(client);
    const appliedMigrationIds = await getAppliedMigrationIds(client);

    for (const file of migrationFiles) {
      const migration = require(path.join(migrationsDir, file));
      const migrationId = migration.id || file;

      if (appliedMigrationIds.has(migrationId)) {
        continue;
      }

      await client.query("BEGIN");
      await migration.up(client);
      await client.query(
        `INSERT INTO schema_migrations (id) VALUES ($1)`,
        [migrationId]
      );
      await client.query("COMMIT");
      console.log(`Applied migration: ${migrationId}`);
    }
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Migration run failed:", error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
