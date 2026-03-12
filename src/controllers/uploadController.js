import fs from "fs";
import { createUser, getUserByEmail } from "../models/userModel.js";
import { createFile } from "../models/fileModel.js";
import { createJob } from "../models/jobModel.js";
import fileQueue from "../queues/fileQueue.js";

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_DIR || "./uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded. Send a file with field name 'file'.",
      });
    }

    const { originalname, mimetype, size, path: filePath } = req.file;

    // For the assignment, we need a User. If not provided via auth, we create an "Anonymous" or use a provided email.
    // We'll use a dummy user for now if none is provided.
    const email = req.body.email || `guest_${Date.now()}@example.com`;
    const name = req.body.name || "Guest User";
    
    let user = await getUserByEmail(email);
    if (!user) {
      user = await createUser(name, email);
    }

    // Insert file record into NeonDB Files table
    const fileRecord = await createFile(user.id, filePath);

    // Insert job record into NeonDB Jobs table
    const jobRecord = await createJob(fileRecord.id);

    // Enqueue the processing job
    const job = await fileQueue.add(
      "process-file",
      {
        jobDbId: jobRecord.id, // Pass DB ID so worker can update status
        fileId: fileRecord.id,
        filePath,
        originalName: originalname,
        mimeType: mimetype,
        fileSize: size,
      },
      {
        priority: mimetype === "application/pdf" ? 1 : 2, // PDFs get higher priority
      }
    );

    res.status(202).json({
      success: true,
      message: "File accepted for processing",
      data: {
        fileId: fileRecord.id,
        jobId: jobRecord.id, // For tracking
        bullJobId: job.id, // Redis Queue ID
        originalName: originalname,
        mimeType: mimetype,
        fileSize: size,
        status: "pending",
      },
      jobId: jobRecord.id // Return at root level for easy API access
    });
  } catch (error) {
    console.error("❌ Upload error:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
