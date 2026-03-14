require("dotenv").config();

const { createApp } = require("./app");
const { startHealthChecker } = require("./workers/healthChecker");

const app = createApp();
const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startHealthChecker();
});
