import mysql from "mysql2/promise";

let pool;

export const connectMysql = async () => {
  const requiredSettings = ["MYSQL_HOST", "MYSQL_USER", "MYSQL_DATABASE"];
  const missingSettings = requiredSettings.filter((key) => !process.env[key]);

  if (missingSettings.length > 0) {
    throw new Error(`Missing MySQL settings: ${missingSettings.join(", ")}`);
  }

  pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
  });

  await pool.query("SELECT 1");
  console.log("MySQL connected");
};

export const getMysql = () => {
  if (!pool) {
    throw new Error("MySQL pool has not been initialized");
  }

  return pool;
};

export const initializeMysql = async () => {
  const database = getMysql();

  
  await database.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await database.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id INT UNSIGNED NOT NULL,
      name VARCHAR(150) NOT NULL,
      description TEXT NULL,
      status ENUM('active', 'completed', 'archived') NOT NULL DEFAULT 'active',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_projects_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_projects_user_id (user_id)
    )
  `);
};
