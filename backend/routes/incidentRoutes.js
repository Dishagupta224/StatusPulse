const express = require("express");
const { getServiceById } = require("../services/healthCheckService");
const {
  listIncidents,
  listServiceIncidents,
} = require("../services/alertService");

const router = express.Router();

router.get("/incidents", async (req, res) => {
  const status = req.query.status;

  if (status && status !== "ongoing" && status !== "resolved") {
    return res
      .status(400)
      .json({ error: "Invalid status. Use 'ongoing' or 'resolved'." });
  }

  try {
    const incidents = await listIncidents(status);
    return res.status(200).json({ data: incidents });
  } catch (error) {
    console.error("Failed to fetch incidents:", error.message);
    return res.status(500).json({ error: "Failed to fetch incidents" });
  }
});

router.get("/services/:id/incidents", async (req, res) => {
  const serviceId = Number(req.params.id);

  if (!Number.isInteger(serviceId) || serviceId <= 0) {
    return res.status(400).json({ error: "Invalid service id" });
  }

  try {
    const service = await getServiceById(serviceId);
    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    const incidents = await listServiceIncidents(serviceId);
    return res.status(200).json({
      service_id: serviceId,
      data: incidents,
    });
  } catch (error) {
    console.error("Failed to fetch service incidents:", error.message);
    return res.status(500).json({ error: "Failed to fetch service incidents" });
  }
});

module.exports = router;
