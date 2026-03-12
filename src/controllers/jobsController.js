import { query } from "../config/db.js";
import { getJobById } from "../models/jobModel.js";
import { getResultByJobId } from "../models/resultModel.js";
import fileQueue from "../queues/fileQueue.js";

// ─── Controller for GET /api/jobs/:id ───
export const getJobDetails = async (req, res) => {
  try {
    const { id } = req.params;

    // We passed jobRecord.id as the param jobId from the frontend
    const jobRecord = await getJobById(id);

    if (!jobRecord) {
      return res.status(404).json({
        success: false,
        error: `Job ${id} not found in database`,
      });
    }

    // Try to get BullMQ stats
    let progress = jobRecord.progress;
    // We didn't link BullMQ ID back to DB in the refactored controller yet (we passed Bull Job ID but didn't store it)
    // Progress is managed well enough in DB via worker currently, but let's stick to DB state

    const response = {
      success: true,
      data: {
        jobId: jobRecord.id.toString(),
        state: jobRecord.status,
        progress: jobRecord.progress,
      }
    };

    // If completed, fetch the analytics from the Results table
    if (jobRecord.status === "completed") {
      const resultData = await getResultByJobId(id);
      if (resultData) {
        response.data.wordCount = resultData.word_count;
        response.data.paragraphCount = resultData.paragraph_count;
        response.data.topKeywords = resultData.keywords;
      }
    }

    res.json(response);
  } catch (error) {
    console.error("❌ Job status error:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ─── Controller for GET /api/jobs ───────
export const getAllJobs = async (req, res) => {
  try {
    const { status = "all", page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let queryText = `
      SELECT Jobs.*, Files.original_name as file_name 
      FROM Jobs
      LEFT JOIN Files ON Jobs.file_id = Files.id
    `;
    const params = [];

    if (status !== "all") {
      queryText += ` WHERE Jobs.status = $1`;
      params.push(status);
    }

    queryText += ` ORDER BY Jobs.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), offset);

    const result = await query(queryText, params);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.rowCount,
      },
    });
  } catch (error) {
    console.error("❌ List jobs error:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
