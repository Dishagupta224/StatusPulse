const express = require("express");
const {
  DEFAULT_HISTORY_LIMIT,
  getServiceById,
  getServiceHistory,
  getServiceStats,
} = require("../services/statsService");

const router = express.Router();

router.get("/:id/history", async (req, res) => {
  const serviceId = Number(req.params.id);
  const limit = req.query.limit;

  if (!Number.isInteger(serviceId) || serviceId <= 0) {
    return res.status(400).json({ error: "Invalid service id" });
  }

  try {
    const service = await getServiceById(serviceId);

    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    const result = await getServiceHistory(serviceId, limit);

    return res.status(200).json({
      service_id: serviceId,
      limit: result.limit || DEFAULT_HISTORY_LIMIT,
      data: result.history,
    });
  } catch (error) {
    console.error("Failed to fetch service history:", error.message);
    return res.status(500).json({ error: "Failed to fetch service history" });
  }
});

router.get("/:id/stats", async (req, res) => {
  const serviceId = Number(req.params.id);

  if (!Number.isInteger(serviceId) || serviceId <= 0) {
    return res.status(400).json({ error: "Invalid service id" });
  }

  try {
    const service = await getServiceById(serviceId);

    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    const stats = await getServiceStats(serviceId);

    return res.status(200).json({
      service_id: serviceId,
      data: stats,
    });
  } catch (error) {
    console.error("Failed to fetch service stats:", error.message);
    return res.status(500).json({ error: "Failed to fetch service stats" });
  }
});

module.exports = router;
