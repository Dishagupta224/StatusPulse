const cors = require("cors");
const express = require("express");
const pool = require("./config/database");
const serviceRoutes = require("./routes/serviceRoutes");
const statsRoutes = require("./routes/statsRoutes");
const incidentRoutes = require("./routes/incidentRoutes");

function createApp() {
  const app = express();
  const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

  app.use(
    cors({
      origin: frontendOrigin,
    })
  );
  app.use(express.json());
  app.use("/api/services", serviceRoutes);
  app.use("/api/services", statsRoutes);
  app.use("/api", incidentRoutes);

  app.get("/health", async (_req, res) => {
    try {
      await pool.query("SELECT 1");
      return res.status(200).json({ status: "ok" });
    } catch (error) {
      return res
        .status(500)
        .json({ status: "db_unreachable", error: error.message });
    }
  });

  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}

module.exports = {
  createApp,
};
