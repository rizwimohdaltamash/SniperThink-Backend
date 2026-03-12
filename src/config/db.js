import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Initialize the database tables
export const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS Users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE
      );

      CREATE TABLE IF NOT EXISTS Files (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES Users(id) ON DELETE SET NULL,
        file_path TEXT NOT NULL,
        uploaded_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS Jobs (
        id SERIAL PRIMARY KEY,
        file_id INTEGER REFERENCES Files(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pending',
        progress INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS Results (
        id SERIAL PRIMARY KEY,
        job_id INTEGER REFERENCES Jobs(id) ON DELETE CASCADE,
        word_count INTEGER DEFAULT 0,
        paragraph_count INTEGER DEFAULT 0,
        keywords JSONB DEFAULT '[]'::jsonb
      );
    `);
    console.log("✅ Database tables initialized");
  } catch (error) {
    console.error("❌ Database initialization failed:", error.message);
  }
};

export const query = (text, params) => pool.query(text, params);

export default pool;
