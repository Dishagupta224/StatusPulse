const cron = require("node-cron");
const { checkActiveServices } = require("../services/healthCheckService");

function startHealthChecker() {
  cron.schedule("*/2 * * * *", async () => {
    try {
      await checkActiveServices();
    } catch (error) {
      console.error("Health checker cron run failed:", error.message);
    }
  });

  console.log("Health checker started (interval: 2 minutes)");
}

module.exports = {
  startHealthChecker,
};
