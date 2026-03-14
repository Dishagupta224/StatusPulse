const pool = require("../config/database");
const redis = require("../config/redis");
const {
  sendIncidentResolvedAlert,
  sendIncidentStartedAlert,
} = require("./slackAlertService");

const INCIDENT_THRESHOLD = 3;
const FAILURE_COUNTER_TTL_SECONDS = 24 * 60 * 60;

function failureCounterKey(serviceId) {
  return `service_failures:${serviceId}`;
}

async function getOngoingIncident(serviceId) {
  const result = await pool.query(
    `
      SELECT id, service_id, started_at, resolved_at, duration_minutes, status
      FROM incidents
      WHERE service_id = $1 AND status = 'ongoing'
      ORDER BY started_at DESC
      LIMIT 1
    `,
    [serviceId]
  );

  return result.rows[0] || null;
}

async function createIncident(serviceId) {
  const result = await pool.query(
    `
      INSERT INTO incidents (service_id, started_at, status)
      VALUES ($1, NOW(), 'ongoing')
      RETURNING id, service_id, started_at, resolved_at, duration_minutes, status
    `,
    [serviceId]
  );

  return result.rows[0];
}

async function resolveIncident(incidentId) {
  const result = await pool.query(
    `
      UPDATE incidents
      SET
        resolved_at = NOW(),
        duration_minutes = CEIL(EXTRACT(EPOCH FROM (NOW() - started_at)) / 60.0)::integer,
        status = 'resolved'
      WHERE id = $1
      RETURNING id, service_id, started_at, resolved_at, duration_minutes, status
    `,
    [incidentId]
  );

  return result.rows[0] || null;
}

async function listIncidents(status) {
  if (status) {
    const result = await pool.query(
      `
        SELECT id, service_id, started_at, resolved_at, duration_minutes, status
        FROM incidents
        WHERE status = $1
        ORDER BY started_at DESC
      `,
      [status]
    );
    return result.rows;
  }

  const result = await pool.query(
    `
      SELECT id, service_id, started_at, resolved_at, duration_minutes, status
      FROM incidents
      ORDER BY started_at DESC
    `
  );
  return result.rows;
}

async function listServiceIncidents(serviceId) {
  const result = await pool.query(
    `
      SELECT id, service_id, started_at, resolved_at, duration_minutes, status
      FROM incidents
      WHERE service_id = $1
      ORDER BY started_at DESC
    `,
    [serviceId]
  );

  return result.rows;
}

async function evaluateIncidentForCheck(service, checkResult) {
  if (!redis) {
    console.warn(
      `Redis warning: incident detection skipped for ${service.name} (Redis unavailable).`
    );
    return;
  }

  try {
    const counterKey = failureCounterKey(service.id);

    // Consecutive failure logic:
    // - failed check: INCR the failure counter
    // - successful check: SET counter to 0
    // Once failures reach 3, start one ongoing incident if none exists.
    if (checkResult.isHealthy) {
      await redis.set(counterKey, "0", "EX", FAILURE_COUNTER_TTL_SECONDS);

      const ongoingIncident = await getOngoingIncident(service.id);
      if (!ongoingIncident) {
        return;
      }

      const resolvedIncident = await resolveIncident(ongoingIncident.id);
      if (resolvedIncident) {
        console.log(
          `INCIDENT RESOLVED: ${service.name} is UP (downtime: ${resolvedIncident.duration_minutes} minutes)`
        );
        await sendIncidentResolvedAlert(service, resolvedIncident);
      }
      return;
    }

    const failureCount = await redis.incr(counterKey);
    await redis.expire(counterKey, FAILURE_COUNTER_TTL_SECONDS);

    if (failureCount < INCIDENT_THRESHOLD) {
      return;
    }

    const ongoingIncident = await getOngoingIncident(service.id);
    if (ongoingIncident) {
      return;
    }

    const incident = await createIncident(service.id);
    console.log(
      `INCIDENT STARTED: ${service.name} is DOWN (${INCIDENT_THRESHOLD} consecutive failures)`
    );
    await sendIncidentStartedAlert(service, incident);
  } catch (error) {
    // If Redis is down (or any detection step fails), skip this cycle and keep app running.
    console.warn(
      `Incident detection skipped for ${service.name}:`,
      error.message
    );
  }
}

module.exports = {
  evaluateIncidentForCheck,
  listIncidents,
  listServiceIncidents,
};
