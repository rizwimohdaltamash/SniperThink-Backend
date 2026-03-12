import { Router } from "express";
import { submitInterest } from "../controllers/interestController.js";

const router = Router();

// ─── POST /api/interest ─────────────────
router.post("/", submitInterest);

export default router;
