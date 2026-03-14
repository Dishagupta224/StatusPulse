const redis = require("../config/redis");

const SERVICE_STATUS_TTL_SECONDS = 300;

function serviceStatusKey(serviceId) {
  return `service_status:${serviceId}`;
}

async function getServiceStatus(serviceId) {
  try {
    if (!redis) {
      return null;
    }

    const rawValue = await redis.get(serviceStatusKey(serviceId));

    if (!rawValue) {
      return null;
    }

    return JSON.parse(rawValue);
  } catch (error) {
    console.warn(`Redis warning: getServiceStatus(${serviceId}) failed.`, error.message);
    return null;
  }
}

async function setServiceStatus(serviceId, data) {
  try {
    if (!redis) {
      return null;
    }

    // Store small JSON payload for the current service status with a 5-minute TTL.
    await redis.set(
      serviceStatusKey(serviceId),
      JSON.stringify(data),
      "EX",
      SERVICE_STATUS_TTL_SECONDS
    );

    return data;
  } catch (error) {
    console.warn(`Redis warning: setServiceStatus(${serviceId}) failed.`, error.message);
    return null;
  }
}

async function clearServiceStatus(serviceId) {
  try {
    if (!redis) {
      return null;
    }

    await redis.del(serviceStatusKey(serviceId));
    return true;
  } catch (error) {
    console.warn(`Redis warning: clearServiceStatus(${serviceId}) failed.`, error.message);
    return null;
  }
}

module.exports = {
  SERVICE_STATUS_TTL_SECONDS,
  getServiceStatus,
  setServiceStatus,
  clearServiceStatus,
};
