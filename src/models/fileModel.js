import { query } from "../config/db.js";

export const createFile = async (userId, filePath) => {
  const result = await query(
    `INSERT INTO Files (user_id, file_path) VALUES ($1, $2) RETURNING *;`,
    [userId, filePath]
  );
  return result.rows[0];
};

export const getFileById = async (id) => {
  const result = await query(`SELECT * FROM Files WHERE id = $1`, [id]);
  return result.rows[0];
};
