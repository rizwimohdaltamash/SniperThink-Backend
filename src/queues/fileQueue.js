import { Queue } from "bullmq";
import { createRedisConnection } from "../config/redis.js";

const connection = createRedisConnection();

export const fileQueue = new Queue("file-processing", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: {
      age: 3600,   // keep completed jobs for 1 hour
      count: 100,  // keep last 100 completed jobs
    },
    removeOnFail: {
      age: 86400,  // keep failed jobs for 24 hours
    },
  },
});

console.log("📦 File processing queue initialized");

export default fileQueue;
