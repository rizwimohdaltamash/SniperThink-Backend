import { Worker } from "bullmq";
import fs from "fs";
import path from "path";
// Dynamic import used for pdf-parse to handle ESM/CommonJS interop
import { updateJobStatus } from "../models/jobModel.js";
import { createResult } from "../models/resultModel.js";
import { createRedisConnection } from "../config/redis.js";

const connection = createRedisConnection();

const processFile = async (job) => {
  const { filePath, originalName, mimeType, fileSize, fileId } = job.data;

  console.log(`🔄 Processing job ${job.id}: ${originalName}`);

  try {
    // ─── Step 1: Validate file exists ───
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    await job.updateProgress(10);

    // ─── Step 2: Read and parse the file ───
    let extractedText = "";
    let pageCount = 0;

    if (mimeType === "application/pdf") {
      const dataBuffer = fs.readFileSync(filePath);
      
      // Strict CommonJS Import mechanism for pdf-parse (v2.4.5+ uses Classes)
      const { createRequire } = await import("module");
      const require = createRequire(import.meta.url);
      const pdfParse = require("pdf-parse");
      
      const parser = new pdfParse.PDFParse({ data: dataBuffer });
      const textResult = await parser.getText();
      const infoResult = await parser.getInfo();
      await parser.destroy(); // Free memory

      extractedText = textResult.text || "";
      pageCount = infoResult.total || 0;

      console.log(
        `📄 Extracted ${extractedText.length} chars from ${pageCount} pages`
      );
    } else {
      // For non-PDF files, read as text
      extractedText = fs.readFileSync(filePath, "utf-8");
      pageCount = 1;
    }

    await job.updateProgress(60);

    // ─── Text Analytics Algorithm ──────────
    // Normalize line endings (\r\n → \n, \r → \n)
    const cleanText = extractedText.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // 1. Word Count (do this first, needed for paragraph heuristic)
    const words = cleanText.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length || 0;

    // 2. Paragraph Count — multi-strategy detection
    let paragraphCount = 0;

    // Strategy A: Split by double newlines (standard paragraph separator)
    const doubleNewlineParagraphs = cleanText.split(/\n\s*\n/).filter(p => p.trim().length > 0);

    if (doubleNewlineParagraphs.length > 1) {
      // Standard text format with blank lines between paragraphs
      paragraphCount = doubleNewlineParagraphs.length;
    } else {
      // Strategy B: For PDFs — split by single newlines, then group consecutive
      // short lines vs long text blocks. A "paragraph" is a block of text
      // that contains at least 20 characters.
      const lines = cleanText.split('\n');
      let currentBlock = '';
      let blockCount = 0;

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.length === 0) {
          // Empty line = end of a block
          if (currentBlock.trim().length >= 20) {
            blockCount++;
          }
          currentBlock = '';
        } else {
          currentBlock += ' ' + trimmed;
        }
      }
      // Don't forget the last block
      if (currentBlock.trim().length >= 20) {
        blockCount++;
      }

      paragraphCount = blockCount > 0 ? blockCount : 1;
    }

    // Sanity check: paragraphs should never exceed word count / 3
    if (paragraphCount > wordCount / 3) {
      paragraphCount = Math.max(1, Math.ceil(wordCount / 30));
    }

    // 3. Top Keywords
    const stopWords = new Set(["the", "and", "a", "to", "of", "in", "i", "is", "that", "it", "on", "you", "this", "for", "but", "with", "are", "have", "be", "at", "or", "as", "was", "so", "if", "out", "not", "we", "my", "your", "all", "do", "they", "will", "from", "can", "has", "by", "what", "about", "which", "when", "one", "their", "there", "would"]);
    
    const wordFreq = {};
    words.forEach(w => {
      const cleanWord = w.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanWord.length > 2 && !stopWords.has(cleanWord)) {
        wordFreq[cleanWord] = (wordFreq[cleanWord] || 0) + 1;
      }
    });

    const topKeywords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => entry[0]);

    await job.updateProgress(80);

    // ─── Step 3: Store results in NeonDB ───
    // The specific assignment structure mandates Jobs and Results separation
    const jobId = job.id; // BullMQ string ID, but schema says INTEGER. Let's use the created job ID passed in payload "jobDbId".
    const jobDbId = job.data.jobDbId; // Need to ensure routes pass jobDbId

    await updateJobStatus(jobDbId, "completed", 100);
    await createResult(jobDbId, wordCount, paragraphCount, topKeywords);

    await job.updateProgress(100);

    console.log(`✅ Job ${job.id} (DB:${jobDbId}) completed successfully. Found ${topKeywords.join(', ')}`);

    return {
      success: true,
      originalName,
      wordCount,
      paragraphCount,
      topKeywords
    };
  } catch (error) {
    console.error(`❌ Job ${job?.id || 'unknown'} failed during processing:`, error);
    console.error(error.stack);

    // Update DB status to failed safely
    try {
      const jobDbId = job?.data?.jobDbId;
      if (jobDbId) {
        await updateJobStatus(jobDbId, "failed", job.progress || 10);
      } else {
        console.error("❌ Cannot update DB: jobDbId is missing from job payload", job?.data);
      }
    } catch (dbErr) {
      console.error("❌ Failed to update DB on error:", dbErr);
    }

    throw error;
  }
};

// ─── Initialize Worker ─────────────────
const fileWorker = new Worker("file-processing", processFile, {
  connection,
  concurrency: 3, // Process up to 3 files simultaneously
  limiter: {
    max: 10,
    duration: 60000, // Max 10 jobs per minute
  },
});

// ─── Worker Event Listeners ────────────
fileWorker.on("completed", (job, result) => {
  console.log(
    `🎉 Job ${job.id} completed: ${result.originalName} (${result.wordCount} words)`
  );
});

fileWorker.on("failed", (job, error) => {
  console.error(`💥 Job ${job?.id} failed: ${error.message}`);
});

fileWorker.on("progress", (job, progress) => {
  console.log(`📊 Job ${job.id} progress: ${progress}%`);
});

fileWorker.on("error", (error) => {
  console.error("❌ Worker error:", error.message);
});

console.log("👷 File processing worker started (concurrency: 3)");

export default fileWorker;
