import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { initDB } from "./config/db.js";
import uploadRouter from "./routes/upload.js";
import jobsRouter from "./routes/jobs.js";
import interestRouter from "./routes/interest.js";

// ─── Load env vars ─────────────────────
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ─────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Ensure uploads directory exists ───
const uploadDir = process.env.UPLOAD_DIR || "./uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`📁 Created upload directory: ${uploadDir}`);
}

// ─── Routes ─────────────────────────────
app.use("/api/upload", uploadRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/interest", interestRouter);

// ─── Health Check ───────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

// ─── 404 Catch-All ──────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ─── Error Handler ──────────────────────
app.use((err, req, res, next) => {
  console.error("❌ Unhandled error:", err.message);
  res.status(500).json({
    success: false,
    error: err.message || "Internal server error",
  });
});

// ─── Start Server ───────────────────────
const startServer = async () => {
  try {
    // Initialize database (will log warning if no DATABASE_URL)
    await initDB();

    // Import worker to start processing (side-effect import)
    await import("./workers/fileWorker.js");

    app.listen(PORT, () => {
      console.log(`\n🚀 SniperThink API Server running on http://localhost:${PORT}`);
      console.log(`   Health: http://localhost:${PORT}/api/health`);
      console.log(`   Upload: POST http://localhost:${PORT}/api/upload`);
      console.log(`   Jobs:   GET  http://localhost:${PORT}/api/jobs\n`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
