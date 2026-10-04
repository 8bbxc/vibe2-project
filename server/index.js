import express from 'express';
import cors from 'cors';
import { sql, initDatabase } from './db.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize DB schema on boot
initDatabase().catch(err => {
  console.error("Failed to bootstrap database on server start:", err);
});

// 1. Health & Database Diagnostic Ping
app.get('/api/health', async (req, res) => {
  try {
    const startTime = performance.now();
    const versionRes = await sql`SELECT version(), current_database(), current_user, pg_database_size(current_database()) as db_bytes;`;
    const latency = (performance.now() - startTime).toFixed(2);

    res.json({
      status: 'online',
      latencyMs: parseFloat(latency),
      database: versionRes[0].current_database,
      user: versionRes[0].current_user,
      postgresVersion: versionRes[0].version.split(' ')[1],
      dbSizeBytes: parseInt(versionRes[0].db_bytes),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 2. Overview Metrics & Statistics
app.get('/api/analytics', async (req, res) => {
  try {
    const projectsCount = await sql`SELECT count(*) FROM projects;`;
    const branchesCount = await sql`SELECT count(*) FROM branches;`;
    const queriesCount = await sql`SELECT count(*), AVG(duration_ms) as avg_latency FROM query_logs;`;
    const storageSum = await sql`SELECT COALESCE(SUM(storage_mb), 0) as total_storage FROM projects;`;
    const activeConns = await sql`SELECT COALESCE(SUM(active_connections), 0) as total_conns FROM projects;`;

    res.json({
      totalProjects: parseInt(projectsCount[0].count),
      totalBranches: parseInt(branchesCount[0].count),
      totalQueriesExecuted: parseInt(queriesCount[0].count),
      avgQueryLatencyMs: parseFloat(queriesCount[0].avg_latency || 0).toFixed(2),
      totalStorageMb: parseFloat(storageSum[0].total_storage).toFixed(1),
      activeConnections: parseInt(activeConns[0].total_conns)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Get All Projects with their Branches
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await sql`
      SELECT 
        p.*,
        COALESCE(json_agg(b.*) FILTER (WHERE b.id IS NOT NULL), '[]') as branches
      FROM projects p
      LEFT JOIN branches b ON p.id = b.project_id
      GROUP BY p.id
      ORDER BY p.created_at DESC;
    `;
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Create New Project
app.post('/api/projects', async (req, res) => {
  try {
    const { name, slug, environment, region } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ error: "Project name and slug are required" });
    }

    const inserted = await sql`
      INSERT INTO projects (name, slug, environment, region, status, active_connections, storage_mb)
      VALUES (${name}, ${slug}, ${environment || 'production'}, ${region || 'aws-us-east-2'}, 'healthy', 1, 10.5)
      RETURNING *;
    `;

    // Create root 'main' branch automatically
    await sql`
      INSERT INTO branches (project_id, branch_name, parent_branch, compute_state, is_protected)
      VALUES (${inserted[0].id}, 'main', 'root', 'active', true);
    `;

    // Log this operation
    await sql`
      INSERT INTO query_logs (project_id, query_text, duration_ms, rows_affected, status, executed_by)
      VALUES (${inserted[0].id}, 'PROVISION CLUSTER ' || ${slug}, 12.4, 1, 'success', 'admin_console');
    `;

    res.status(201).json(inserted[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Create Instant Branch (Neon Branching primitive)
app.post('/api/projects/:id/branches', async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const { branch_name, parent_branch } = req.body;

    if (!branch_name) {
      return res.status(400).json({ error: "Branch name is required" });
    }

    const newBranch = await sql`
      INSERT INTO branches (project_id, branch_name, parent_branch, compute_state, is_protected)
      VALUES (${projectId}, ${branch_name}, ${parent_branch || 'main'}, 'active', false)
      RETURNING *;
    `;

    // Add query log
    await sql`
      INSERT INTO query_logs (project_id, query_text, duration_ms, rows_affected, status, executed_by)
      VALUES (${projectId}, 'CREATE NEON BRANCH ' || ${branch_name}, 8.6, 1, 'success', 'neon_branch_api');
    `;

    res.status(201).json(newBranch[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Delete Project
app.delete('/api/projects/:id', async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    await sql`DELETE FROM projects WHERE id = ${projectId};`;
    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Recent Query Logs Feed
app.get('/api/logs', async (req, res) => {
  try {
    const logs = await sql`
      SELECT q.*, p.name as project_name
      FROM query_logs q
      LEFT JOIN projects p ON q.project_id = p.id
      ORDER BY q.created_at DESC
      LIMIT 25;
    `;
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Execute Live Custom SQL Query directly on Neon
app.post('/api/query/execute', async (req, res) => {
  try {
    const { queryText } = req.body;
    if (!queryText || typeof queryText !== 'string') {
      return res.status(400).json({ error: "Missing queryText parameter" });
    }

    // Measure exact serverless execution latency
    const start = performance.now();
    // Execute query using template-free direct string
    const result = await sql(queryText);
    const durationMs = parseFloat((performance.now() - start).toFixed(2));

    // Save into log
    try {
      await sql`
        INSERT INTO query_logs (project_id, query_text, duration_ms, rows_affected, status, executed_by)
        VALUES (1, ${queryText.substring(0, 400)}, ${durationMs}, ${result.length || 0}, 'success', 'sql_playground');
      `;
    } catch (_) {}

    res.json({
      success: true,
      durationMs,
      rowCount: result.length,
      rows: result.slice(0, 100) // cap to 100 preview rows
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`NeonPulse OS Backend API listening on port ${PORT}`);
});
