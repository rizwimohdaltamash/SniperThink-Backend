import { Router } from "express";
import { getJobDetails, getAllJobs } from "../controllers/jobsController.js";

const router = Router();

// ─── GET /api/jobs/:id ─────────────────
router.get("/:id", getJobDetails);

// ─── GET /api/jobs ──────────────────────
router.get("/", getAllJobs);

export default router;
