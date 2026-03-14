const pool = require("../config/database");

const DEFAULT_HISTORY_LIMIT = 100;
const MAX_HISTORY_LIMIT = 1000;

function toInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) ? parsed : fallback;
}

async function getServiceById(serviceId) {
  // Fetch one service row to validate the service exists before running stats/history queries.
  const result = await pool.query(
    `SELECT id, name, url, is_active FROM services WHERE id = $1 LIMIT 1`,
    [serviceId]
  );

  return result.rows[0] || null;
}

async function getServiceHistory(serviceId, limitInput) {
  const parsedLimit = toInteger(limitInput, DEFAULT_HISTORY_LIMIT);
  const safeLimit = Math.min(Math.max(parsedLimit, 1), MAX_HISTORY_LIMIT);

  // Return latest ping records for one service so the UI can draw recent behavior.
  // Ordered by checked_at DESC to show newest first, and limited to avoid huge payloads.
  const result = await pool.query(
    `
      SELECT
        status_code,
        response_time_ms,
        is_healthy,
        checked_at,
        error_message
      FROM ping_results
      WHERE service_id = $1
      ORDER BY checked_at DESC
      LIMIT $2
    `,
    [serviceId, safeLimit]
  );

  return {
    limit: safeLimit,
    history: result.rows,
  };
}

async function getServiceStats(serviceId) {
  // This query computes all required statistics in SQL:
  // - latest status/last checked timestamp from the most recent ping
  // - uptime percentages for last 24h and 7d using FILTER and COUNT
  // - response-time aggregates for last 24h
  // - all-time total check count
  // The two CTEs isolate "latest record" and "time-window aggregates" for clarity.
  const result = await pool.query(
    `
      WITH latest AS (
        SELECT is_healthy, checked_at
        FROM ping_results
        WHERE service_id = $1
        ORDER BY checked_at DESC
        LIMIT 1
      ),
      agg AS (
        SELECT
          COUNT(*) AS total_checks,
          COUNT(*) FILTER (WHERE checked_at >= NOW() - INTERVAL '24 hours') AS checks_24h,
          COUNT(*) FILTER (
            WHERE checked_at >= NOW() - INTERVAL '24 hours' AND is_healthy = true
          ) AS healthy_24h,
          COUNT(*) FILTER (WHERE checked_at >= NOW() - INTERVAL '7 days') AS checks_7d,
          COUNT(*) FILTER (
            WHERE checked_at >= NOW() - INTERVAL '7 days' AND is_healthy = true
          ) AS healthy_7d,
          AVG(response_time_ms) FILTER (
            WHERE checked_at >= NOW() - INTERVAL '24 hours' AND is_healthy = true
          ) AS avg_response_time_24h,
          MAX(response_time_ms) FILTER (
            WHERE checked_at >= NOW() - INTERVAL '24 hours'
          ) AS max_response_time_24h,
          MIN(response_time_ms) FILTER (
            WHERE checked_at >= NOW() - INTERVAL '24 hours'
          ) AS min_response_time_24h
        FROM ping_results
        WHERE service_id = $1
      )
      SELECT
        CASE
          WHEN latest.is_healthy = true THEN 'up'
          ELSE 'down'
        END AS current_status,
        COALESCE(
          ROUND((agg.healthy_24h::numeric / NULLIF(agg.checks_24h, 0)::numeric) * 100, 2),
          0
        ) AS uptime_24h,
        COALESCE(
          ROUND((agg.healthy_7d::numeric / NULLIF(agg.checks_7d, 0)::numeric) * 100, 2),
          0
        ) AS uptime_7d,
        COALESCE(ROUND(agg.avg_response_time_24h::numeric, 0), 0)::integer AS avg_response_time_24h,
        COALESCE(agg.max_response_time_24h, 0)::integer AS max_response_time_24h,
        COALESCE(agg.min_response_time_24h, 0)::integer AS min_response_time_24h,
        COALESCE(agg.total_checks, 0)::integer AS total_checks,
        latest.checked_at AS last_checked_at
      FROM agg
      LEFT JOIN latest ON true
    `,
    [serviceId]
  );

  return result.rows[0];
}

async function getLatestStatusFromDb(serviceId) {
  // Fetch the most recent ping for one service to rebuild cache on a cache miss.
  // The selected columns match the Redis payload shape used by cacheService.
  const result = await pool.query(
    `
      SELECT
        is_healthy,
        status_code,
        response_time_ms,
        checked_at AS last_checked_at
      FROM ping_results
      WHERE service_id = $1
      ORDER BY checked_at DESC
      LIMIT 1
    `,
    [serviceId]
  );

  return result.rows[0] || null;
}

async function listServicesWithCurrentStatusAndUptime() {
  // List all services and enrich each row with:
  // - current_status from the latest ping row per service (LEFT JOIN LATERAL)
  // - uptime_24h computed as healthy/total checks from last 24 hours
  // The LEFT JOIN keeps services with no checks in the result.
  const result = await pool.query(`
    SELECT
      s.id,
      s.name,
      s.url,
      s.is_active,
      CASE
        WHEN latest.is_healthy = true THEN 'up'
        ELSE 'down'
      END AS current_status,
      COALESCE(
        ROUND(
          (
            (stats.healthy_24h::numeric / NULLIF(stats.checks_24h, 0)::numeric) * 100
          ),
          2
        ),
        0
      ) AS uptime_24h
    FROM services s
    LEFT JOIN LATERAL (
      SELECT pr.is_healthy
      FROM ping_results pr
      WHERE pr.service_id = s.id
      ORDER BY pr.checked_at DESC
      LIMIT 1
    ) latest ON true
    LEFT JOIN LATERAL (
      SELECT
        COUNT(*) FILTER (WHERE pr.checked_at >= NOW() - INTERVAL '24 hours') AS checks_24h,
        COUNT(*) FILTER (
          WHERE pr.checked_at >= NOW() - INTERVAL '24 hours' AND pr.is_healthy = true
        ) AS healthy_24h
      FROM ping_results pr
      WHERE pr.service_id = s.id
    ) stats ON true
    ORDER BY s.id ASC
  `);

  return result.rows;
}

module.exports = {
  DEFAULT_HISTORY_LIMIT,
  getServiceById,
  getServiceHistory,
  getServiceStats,
  getLatestStatusFromDb,
  listServicesWithCurrentStatusAndUptime,
};
