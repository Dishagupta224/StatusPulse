"use strict";

module.exports = {
  id: "002-create-ping-results",

  async up(client) {
    await client.query(`
      CREATE TABLE IF NOT EXISTS ping_results (
        id BIGSERIAL PRIMARY KEY,
        service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
        status_code INTEGER,
        response_time_ms INTEGER NOT NULL,
        is_healthy BOOLEAN NOT NULL,
        error_message TEXT,
        checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_ping_results_service_checked_at
      ON ping_results (service_id, checked_at DESC)
    `);
  },
};
