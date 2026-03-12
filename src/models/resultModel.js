import { query } from "../config/db.js";

export const createResult = async (jobId, wordCount, paragraphCount, keywords) => {
  const result = await query(
    `INSERT INTO Results (job_id, word_count, paragraph_count, keywords) 
     VALUES ($1, $2, $3, $4) RETURNING *;`,
    [jobId, wordCount, paragraphCount, JSON.stringify(keywords)]
  );
  return result.rows[0];
};

export const getResultByJobId = async (jobId) => {
  const result = await query(`SELECT * FROM Results WHERE job_id = $1`, [jobId]);
  return result.rows[0];
};
