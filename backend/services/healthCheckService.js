const axios = require("axios");
const pool = require("../config/database");
const { setServiceStatus } = require("./cacheService");
const { evaluateIncidentForCheck } = require("./alertService");

const REQUEST_TIMEOUT_MS = 10000;

function formatTimestamp(date = new Date()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

function normalizeErrorMessage(error, statusCode) {
  if (statusCode && statusCode >= 400) {
    return `HTTP_${statusCode}`;
  }

  if (error && error.code === "ECONNABORTED") {
    return "TIMEOUT";
  }

  if (error && error.code) {
    return error.code;
  }

  return "REQUEST_FAILED";
}

async function savePingResult({
  serviceId,
  statusCode,
  responseTimeMs,
  isHealthy,
  errorMessage,
}) {
  const query = `
    INSERT INTO ping_results (
      service_id,
      status_code,
      response_time_ms,
      is_healthy,
      error_message,
      checked_at
    )
    VALUES ($1, $2, $3, $4, $5, NOW())
    RETURNING id, service_id, status_code, response_time_ms, is_healthy, error_message, checked_at
  `;

  const values = [
    serviceId,
    statusCode,
    responseTimeMs,
    isHealthy,
    errorMessage,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

async function checkService(service) {
  const startedAt = Date.now();
  let isHealthy = false;
  let statusCode = null;
  let errorMessage = null;

  try {
    const response = await axios.get(service.url, {
      timeout: REQUEST_TIMEOUT_MS,
      validateStatus: () => true,
    });

    statusCode = response.status;
    isHealthy = statusCode >= 200 && statusCode <= 299;

    if (!isHealthy) {
      errorMessage = normalizeErrorMessage(null, statusCode);
    }
  } catch (error) {
    errorMessage = normalizeErrorMessage(error, null);
  }

  const responseTimeMs = Date.now() - startedAt;

  const savedResult = await savePingResult({
    serviceId: service.id,
    statusCode,
    responseTimeMs,
    isHealthy,
    errorMessage,
  });

  // Keep latest status in Redis cache; cache failures are non-fatal by design.
  await setServiceStatus(service.id, {
    is_healthy: isHealthy,
    status_code: statusCode,
    response_time_ms: responseTimeMs,
    last_checked_at: savedResult.checked_at,
  });

  // Incident detection runs after DB save and cache update.
  await evaluateIncidentForCheck(service, { isHealthy });

  if (isHealthy) {
    console.log(
      `[${formatTimestamp()}] ${service.name} - UP (${responseTimeMs}ms)`
    );
  } else if (errorMessage === "TIMEOUT") {
    console.log(
      `[${formatTimestamp()}] ${service.name} - DOWN (timeout after ${REQUEST_TIMEOUT_MS}ms)`
    );
  } else {
    console.log(
      `[${formatTimestamp()}] ${service.name} - DOWN (${errorMessage})`
    );
  }

  return {
    serviceId: service.id,
    serviceName: service.name,
    url: service.url,
    statusCode,
    responseTimeMs,
    isHealthy,
    errorMessage,
    checkedAt: savedResult.checked_at,
  };
}

async function getActiveServices() {
  const result = await pool.query(
    `SELECT id, name, url, is_active FROM services WHERE is_active = true ORDER BY id ASC`
  );
  return result.rows;
}

async function getServiceById(serviceId) {
  const result = await pool.query(
    `SELECT id, name, url, is_active FROM services WHERE id = $1 LIMIT 1`,
    [serviceId]
  );

  return result.rows[0] || null;
}

async function checkActiveServices() {
  const services = await getActiveServices();

  for (const service of services) {
    try {
      await checkService(service);
    } catch (error) {
      console.error(
        `Failed to process service ${service.id} (${service.name}):`,
        error.message
      );
    }
  }
}

module.exports = {
  REQUEST_TIMEOUT_MS,
  checkService,
  checkActiveServices,
  getServiceById,
};
