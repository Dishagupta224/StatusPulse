"use strict";

module.exports = {
  id: "003-create-incidents",

  async up(client) {
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS "pgcrypto"
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS incidents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
        started_at TIMESTAMPTZ NOT NULL,
        resolved_at TIMESTAMPTZ,
        duration_minutes INTEGER,
        status VARCHAR(20) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_incidents_service_started_at
      ON incidents (service_id, started_at DESC)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_incidents_status
      ON incidents (status)
    `);
  },
};
