const Redis = require("ioredis");

let redis = null;

if (!process.env.REDIS_URL) {
  console.warn("Redis warning: REDIS_URL is not set. Running without cache.");
} else {
  try {
    // lazyConnect avoids throwing on startup when Redis is temporarily unavailable.
    redis = new Redis(process.env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });

    redis.on("error", (error) => {
      console.warn("Redis warning:", error.message);
    });

    redis
      .connect()
      .then(() => {
        console.log("Redis connected");
      })
      .catch((error) => {
        console.warn("Redis warning: unable to connect.", error.message);
      });
  } catch (error) {
    console.warn("Redis warning: client initialization failed.", error.message);
    redis = null;
  }
}

module.exports = redis;
