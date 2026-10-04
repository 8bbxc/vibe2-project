import { neon } from '@neondatabase/serverless';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return new Response(JSON.stringify({ error: "DATABASE_URL environment variable is missing" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const sql = neon(dbUrl);

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/api\/?/, '');
    const method = req.method;

    // Ensure database tables exist automatically on first hit
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

    // 1. Health Ping (/api/health)
    if (path === 'health' || path === 'health/') {
      const startTime = performance.now();
      const versionRes = await sql`SELECT version(), current_database(), current_user, pg_database_size(current_database()) as db_bytes;`;
      const latency = (performance.now() - startTime).toFixed(2);

      return new Response(JSON.stringify({
        status: 'online',
        latencyMs: parseFloat(latency),
        database: versionRes[0].current_database,
        user: versionRes[0].current_user,
        postgresVersion: versionRes[0].version.split(' ')[1],
        dbSizeBytes: parseInt(versionRes[0].db_bytes),
        timestamp: new Date().toISOString()
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Analytics Summary (/api/analytics)
    if (path === 'analytics' || path === 'analytics/') {
      const projectsCount = await sql`SELECT count(*) FROM projects;`;
      const branchesCount = await sql`SELECT count(*) FROM branches;`;
      const queriesCount = await sql`SELECT count(*), AVG(duration_ms) as avg_latency FROM query_logs;`;
      const storageSum = await sql`SELECT COALESCE(SUM(storage_mb), 0) as total_storage FROM projects;`;
      const activeConns = await sql`SELECT COALESCE(SUM(active_connections), 0) as total_conns FROM projects;`;

      return new Response(JSON.stringify({
        totalProjects: parseInt(projectsCount[0].count),
        totalBranches: parseInt(branchesCount[0].count),
        totalQueriesExecuted: parseInt(queriesCount[0].count),
        avgQueryLatencyMs: parseFloat(queriesCount[0].avg_latency || 0).toFixed(2),
        totalStorageMb: parseFloat(storageSum[0].total_storage).toFixed(1),
        activeConnections: parseInt(activeConns[0].total_conns)
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. Projects (/api/projects)
    if (path === 'projects' || path === 'projects/') {
      if (method === 'GET') {
        const projects = await sql`
          SELECT 
            p.*,
            COALESCE(json_agg(b.*) FILTER (WHERE b.id IS NOT NULL), '[]') as branches
          FROM projects p
          LEFT JOIN branches b ON p.id = b.project_id
          GROUP BY p.id
          ORDER BY p.created_at DESC;
        `;
        return new Response(JSON.stringify(projects), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (method === 'POST') {
        const body = await req.json();
        const { name, slug, environment, region } = body;
        const inserted = await sql`
          INSERT INTO projects (name, slug, environment, region, status, active_connections, storage_mb)
          VALUES (${name}, ${slug}, ${environment || 'production'}, ${region || 'aws-us-east-2'}, 'healthy', 1, 10.5)
          RETURNING *;
        `;
        await sql`
          INSERT INTO branches (project_id, branch_name, parent_branch, compute_state, is_protected)
          VALUES (${inserted[0].id}, 'main', 'root', 'active', true);
        `;
        await sql`
          INSERT INTO query_logs (project_id, query_text, duration_ms, rows_affected, status, executed_by)
          VALUES (${inserted[0].id}, 'PROVISION CLUSTER ' || ${slug}, 12.4, 1, 'success', 'admin_console');
        `;
        return new Response(JSON.stringify(inserted[0]), {
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Delete project (/api/projects/:id)
    const projectDeleteMatch = path.match(/^projects\/(\d+)\/?$/);
    if (projectDeleteMatch && method === 'DELETE') {
      const projId = parseInt(projectDeleteMatch[1]);
      await sql`DELETE FROM projects WHERE id = ${projId};`;
      return new Response(JSON.stringify({ message: "Project deleted successfully" }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create branch (/api/projects/:id/branches)
    const branchCreateMatch = path.match(/^projects\/(\d+)\/branches\/?$/);
    if (branchCreateMatch && method === 'POST') {
      const projId = parseInt(branchCreateMatch[1]);
      const body = await req.json();
      const newBranch = await sql`
        INSERT INTO branches (project_id, branch_name, parent_branch, compute_state, is_protected)
        VALUES (${projId}, ${body.branch_name}, ${body.parent_branch || 'main'}, 'active', false)
        RETURNING *;
      `;
      await sql`
        INSERT INTO query_logs (project_id, query_text, duration_ms, rows_affected, status, executed_by)
        VALUES (${projId}, 'CREATE NEON BRANCH ' || ${body.branch_name}, 8.6, 1, 'success', 'neon_branch_api');
      `;
      return new Response(JSON.stringify(newBranch[0]), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 4. Query Logs (/api/logs)
    if (path === 'logs' || path === 'logs/') {
      const logs = await sql`
        SELECT q.*, p.name as project_name
        FROM query_logs q
        LEFT JOIN projects p ON q.project_id = p.id
        ORDER BY q.created_at DESC
        LIMIT 25;
      `;
      return new Response(JSON.stringify(logs), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 5. Custom Query Console (/api/query/execute)
    if (path === 'query/execute' || path === 'query/execute/') {
      const body = await req.json();
      const start = performance.now();
      const result = await sql(body.queryText);
      const durationMs = parseFloat((performance.now() - start).toFixed(2));

      try {
        await sql`
          INSERT INTO query_logs (project_id, query_text, duration_ms, rows_affected, status, executed_by)
          VALUES (1, ${body.queryText.substring(0, 400)}, ${durationMs}, ${result.length || 0}, 'success', 'sql_playground');
        `;
      } catch (_) {}

      return new Response(JSON.stringify({
        success: true,
        durationMs,
        rowCount: result.length,
        rows: result.slice(0, 100)
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: "Endpoint not found", path }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
