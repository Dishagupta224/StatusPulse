"use strict";

module.exports = {
  id: "001-create-services",

  async up(client) {
    await client.query(`
      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        url TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_services_is_active
      ON services (is_active)
    `);
  },
};
