import { query } from "../config/db.js";

export const createJob = async (fileId) => {
  const result = await query(
    `INSERT INTO Jobs (file_id) VALUES ($1) RETURNING *;`,
    [fileId]
  );
  return result.rows[0];
};

export const getJobById = async (id) => {
  const result = await query(`SELECT * FROM Jobs WHERE id = $1`, [id]);
  return result.rows[0];
};

export const updateJobStatus = async (id, status, progress) => {
  const result = await query(
    `UPDATE Jobs SET status = $1, progress = $2 WHERE id = $3 RETURNING *;`,
    [status, progress, id]
  );
  return result.rows[0];
};
