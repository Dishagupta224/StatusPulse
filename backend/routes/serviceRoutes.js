const express = require("express");
const pool = require("../config/database");
const {
  checkService,
  getServiceById,
} = require("../services/healthCheckService");
const {
  getLatestStatusFromDb,
  listServicesWithCurrentStatusAndUptime,
} = require("../services/statsService");
const {
  getServiceStatus,
  setServiceStatus,
  clearServiceStatus,
} = require("../services/cacheService");
const {
  validateServiceInput,
} = require("../services/serviceValidationService");

const router = express.Router();

router.get("/", async (_req, res) => {
  try {
    const services = await listServicesWithCurrentStatusAndUptime();
    const servicesWithStatus = [];

    for (const service of services) {
      // First read from Redis cache for the latest status snapshot.
      const cachedStatus = await getServiceStatus(service.id);
      let currentStatus = service.current_status;

      if (cachedStatus) {
        console.log(`Cache HIT: ${service.name}`);
        currentStatus = cachedStatus.is_healthy ? "up" : "down";
      } else {
        console.log(`Cache MISS: ${service.name}`);

        // On cache miss, read latest status from PostgreSQL (source of truth),
        // then repopulate cache for future requests.
        const latestStatus = await getLatestStatusFromDb(service.id);

        if (latestStatus) {
          currentStatus = latestStatus.is_healthy ? "up" : "down";
          await setServiceStatus(service.id, latestStatus);
        }
      }

      servicesWithStatus.push({
        ...service,
        current_status: currentStatus || "down",
      });
    }

    return res.status(200).json({ data: servicesWithStatus });
  } catch (error) {
    console.error("Failed to fetch services:", error.message);
    return res.status(500).json({ error: "Failed to fetch services" });
  }
});

router.get("/:id", async (req, res) => {
  const serviceId = Number(req.params.id);

  if (!Number.isInteger(serviceId) || serviceId <= 0) {
    return res.status(400).json({ error: "Invalid service id" });
  }

  try {
    const service = await getServiceById(serviceId);
    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }
    return res.status(200).json({ data: service });
  } catch (error) {
    console.error("Failed to fetch service:", error.message);
    return res.status(500).json({ error: "Failed to fetch service" });
  }
});

router.post("/", async (req, res) => {
  const validation = validateServiceInput(req.body);

  if (!validation.isValid) {
    return res.status(400).json({
      error: validation.errors[0],
      errors: validation.errors,
    });
  }

  try {
    const result = await pool.query(
      `
        INSERT INTO services (name, url, is_active)
        VALUES ($1, $2, true)
        RETURNING id, name, url, is_active
      `,
      [validation.value.name, validation.value.url]
    );

    return res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    console.error("Failed to add service:", error.message);
    return res.status(500).json({ error: "Failed to add service" });
  }
});

router.put("/:id", async (req, res) => {
  const serviceId = Number(req.params.id);

  if (!Number.isInteger(serviceId) || serviceId <= 0) {
    return res.status(400).json({ error: "Invalid service id" });
  }

  const validation = validateServiceInput(req.body);

  if (!validation.isValid) {
    return res.status(400).json({
      error: validation.errors[0],
      errors: validation.errors,
    });
  }

  try {
    const result = await pool.query(
      `
        UPDATE services
        SET name = $1, url = $2
        WHERE id = $3
        RETURNING id, name, url, is_active
      `,
      [validation.value.name, validation.value.url, serviceId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Service not found" });
    }

    await clearServiceStatus(serviceId);

    return res.status(200).json({ data: result.rows[0] });
  } catch (error) {
    console.error("Failed to update service:", error.message);
    return res.status(500).json({ error: "Failed to update service" });
  }
});

router.delete("/:id", async (req, res) => {
  const serviceId = Number(req.params.id);

  if (!Number.isInteger(serviceId) || serviceId <= 0) {
    return res.status(400).json({ error: "Invalid service id" });
  }

  try {
    const result = await pool.query(
      `
        DELETE FROM services
        WHERE id = $1
        RETURNING id
      `,
      [serviceId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Service not found" });
    }

    await clearServiceStatus(serviceId);

    return res.status(200).json({ message: "Service deleted" });
  } catch (error) {
    console.error("Failed to delete service:", error.message);
    return res.status(500).json({ error: "Failed to delete service" });
  }
});

router.post("/:id/check", async (req, res) => {
  const serviceId = Number(req.params.id);

  if (!Number.isInteger(serviceId) || serviceId <= 0) {
    return res.status(400).json({ error: "Invalid service id" });
  }

  try {
    const service = await getServiceById(serviceId);

    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    const result = await checkService(service);

    return res.status(200).json({
      message: "Service check completed",
      data: result,
    });
  } catch (error) {
    console.error("Manual service check failed:", error.message);
    return res.status(500).json({ error: "Failed to check service" });
  }
});

module.exports = router;
