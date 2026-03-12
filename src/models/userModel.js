import { query } from "../config/db.js";

export const createUser = async (name, email) => {
  // Use ON CONFLICT to avoid duplicate errors if the same email tests again
  const sql = `
    INSERT INTO Users (name, email)
    VALUES ($1, $2)
    ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
    RETURNING *;
  `;
  const result = await query(sql, [name, email]);
  return result.rows[0];
};

export const getUserByEmail = async (email) => {
  const result = await query(`SELECT * FROM Users WHERE email = $1`, [email]);
  return result.rows[0];
};
