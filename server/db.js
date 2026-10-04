import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load .env from project root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("FATAL: DATABASE_URL is not set in .env file.");
  process.exit(1);
}

// Instantiate serverless SQL driver
export const sql = neon(dbUrl);

/**
 * Initializes the database schema automatically
 */
export async function initDatabase() {
  try {
    console.log("Connecting to Neon PostgreSQL and validating schema...");

    // 1. Projects Table
    await sql`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        slug VARCHAR(120) UNIQUE NOT NULL,
        environment VARCHAR(50) DEFAULT 'production',
        region VARCHAR(50) DEFAULT 'aws-us-east-2',
        status VARCHAR(30) DEFAULT 'healthy',
        active_connections INT DEFAULT 4,
        storage_mb NUMERIC(10, 2) DEFAULT 128.5,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 2. Query Logs & Telemetry Table
    await sql`
      CREATE TABLE IF NOT EXISTS query_logs (
        id SERIAL PRIMARY KEY,
        project_id INT REFERENCES projects(id) ON DELETE CASCADE,
        query_text TEXT NOT NULL,
        duration_ms NUMERIC(10, 2) NOT NULL,
        rows_affected INT DEFAULT 1,
        status VARCHAR(20) DEFAULT 'success',
        executed_by VARCHAR(80) DEFAULT 'neon_agent',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 3. Branches Table
    await sql`
      CREATE TABLE IF NOT EXISTS branches (
        id SERIAL PRIMARY KEY,
        project_id INT REFERENCES projects(id) ON DELETE CASCADE,
        branch_name VARCHAR(100) NOT NULL,
        parent_branch VARCHAR(100) DEFAULT 'main',
        compute_state VARCHAR(30) DEFAULT 'idle',
        is_protected BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Seed initial operational data if empty
    const existingProjects = await sql`SELECT count(*) FROM projects`;
    if (parseInt(existingProjects[0].count) === 0) {
      console.log("Seeding initial NeonPulse operational records...");

      const insertedProjects = await sql`
        INSERT INTO projects (name, slug, environment, region, status, active_connections, storage_mb)
        VALUES 
          ('E-Commerce Core Cluster', 'ecommerce-core', 'production', 'aws-us-east-2', 'healthy', 18, 412.8),
          ('Autonomous Agents Vector DB', 'agents-vector-db', 'production', 'aws-us-east-2', 'healthy', 7, 856.2),
          ('Real-Time Analytics Pipeline', 'analytics-pipeline', 'staging', 'aws-us-east-2', 'syncing', 3, 224.0)
        RETURNING id, name;
      `;

      const p1 = insertedProjects[0].id;
      const p2 = insertedProjects[1].id;
      const p3 = insertedProjects[2].id;

      // Seed branches
      await sql`
        INSERT INTO branches (project_id, branch_name, parent_branch, compute_state, is_protected)
        VALUES
          (${p1}, 'main', 'root', 'active', true),
          (${p1}, 'feature/checkout-v2', 'main', 'idle', false),
          (${p2}, 'main', 'root', 'active', true),
          (${p2}, 'experiment/gemini-embeddings', 'main', 'active', false),
          (${p3}, 'main', 'root', 'active', true);
      `;

      // Seed realistic query logs
      await sql`
        INSERT INTO query_logs (project_id, query_text, duration_ms, rows_affected, status, executed_by)
        VALUES
          (${p1}, 'SELECT * FROM users WHERE active = true ORDER BY last_login DESC LIMIT 50', 3.24, 50, 'success', 'user_api'),
          (${p1}, 'UPDATE inventory SET stock_count = stock_count - 1 WHERE sku = $1', 1.85, 1, 'success', 'order_worker'),
          (${p2}, 'SELECT id, cosine_similarity(vector, $1) FROM embeddings ORDER BY 2 DESC LIMIT 10', 8.42, 10, 'success', 'gemini_agent'),
          (${p2}, 'INSERT INTO vector_cache (key, tensor) VALUES ($1, $2)', 4.15, 1, 'success', 'agent_pipeline'),
          (${p3}, 'REFRESH MATERIALIZED VIEW CONCURRENTLY hourly_turnover_mv', 42.10, 1200, 'success', 'cron_daemon');
      `;
    }

    console.log("Neon database schema initialized successfully.");
  } catch (err) {
    console.error("Database initialization failed:", err);
    throw err;
  }
}
