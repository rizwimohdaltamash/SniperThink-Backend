import IORedis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

// Shared connection for BullMQ
export const createRedisConnection = () => {
  const connection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
    retryStrategy: (times) => {
      if (times > 3) {
        console.error("\n❌ CRITICAL: Could not connect to Redis at", redisUrl);
        console.error("👉 Please ensure Redis server is running locally on port 6379.");
        console.error("👉 Or provide a valid REDIS_URL in your .env file.");
        console.error("👉 On Windows, you can use Docker: 'docker run -p 6379:6379 -d redis'\n");
        process.exit(1);
      }
      return 1000; // retry every 1 second, 3 times
    },
  });

  connection.on("error", (err) => {
    if (err.code === "ECONNREFUSED") {
      // Suppress the giant aggregate error dump
      return; 
    }
    console.error("Redis Error:", err.message);
  });

  return connection;
};

export default createRedisConnection;
