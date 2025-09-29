import dotenv from 'dotenv'
dotenv.config();
import pkg from "pg";

const { Pool } = pkg;
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

pool.on('connect', ()=> {
    console.log("Connected to PostgreSQL Database");
})

pool.on('error', (err)=> {
    console.error("Database Connection Error:", err);
});

async function initializeDatabase() {
  try {
    const client = await pool.connect();
    
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('Database tables initialized successfully');
    client.release();
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Initialize the database when this module is imported
initializeDatabase();

export default pool;
