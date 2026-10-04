import React, { useState } from 'react';
import { 
  Play, 
  Terminal, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  FileCode, 
  Sparkles,
  Database,
  ArrowRight
} from 'lucide-react';

export default function SqlPlayground({ onQueryExecuted }) {
  const [queryText, setQueryText] = useState(`-- Inspect Neon system tables & active database telemetry
SELECT 
  current_database() as database_name,
  current_user as connected_role,
  pg_size_pretty(pg_database_size(current_database())) as size,
  now() as server_timestamp;`);

  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const sampleQueries = [
    {
      title: "Active Projects with Branch Count",
      sql: `SELECT p.name, p.slug, p.environment, count(b.id) as branch_count, p.storage_mb
FROM projects p
LEFT JOIN branches b ON p.id = b.project_id
GROUP BY p.id;`
    },
    {
      title: "Query Latency Benchmarks",
      sql: `SELECT status, count(*) as count, round(avg(duration_ms), 2) as avg_latency_ms
FROM query_logs
GROUP BY status;`
    },
    {
      title: "Recent Neon Log Feeds",
      sql: `SELECT id, query_text, duration_ms, status, created_at 
FROM query_logs 
ORDER BY created_at DESC 
LIMIT 10;`
    },
    {
      title: "PostgreSQL Engine Information",
      sql: `SELECT version();`
    }
  ];

  const handleRun = async () => {
    if (!queryText.trim()) return;
    setExecuting(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/query/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queryText })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Query failed to execute");
      }
      setResult(data);
      if (onQueryExecuted) onQueryExecuted();
    } catch (err) {
      setError(err.message);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header & Preset Queries Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neon-border/60 pb-5">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Terminal className="w-5 h-5 text-neon-primary" />
            <span>Interactive SQL Console</span>
          </h2>
          <p className="text-xs text-neon-muted mt-1">
            Execute SQL queries directly against your live Neon PostgreSQL serverless database.
          </p>
        </div>

        {/* Quick query presets */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neon-muted mr-1">Presets:</span>
          {sampleQueries.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => setQueryText(sample.sql)}
              className="text-xs font-mono font-medium px-2.5 py-1 rounded-lg bg-neon-card hover:bg-neon-cardHover text-neon-muted hover:text-white border border-neon-border/80 transition-all whitespace-nowrap cursor-pointer"
            >
              {sample.title}
            </button>
          ))}
        </div>
      </div>

      {/* Editor & Control Bar */}
      <div className="bg-neon-card rounded-2xl border border-neon-border overflow-hidden shadow-sm">
        
        {/* Editor Toolbar */}
        <div className="px-4 py-2.5 bg-neon-bg/80 border-b border-neon-border/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-neon-muted">
            <Database className="w-3.5 h-3.5 text-neon-cyan" />
            <span>Connected: <b className="text-white">neondb (aws-us-east-2)</b></span>
          </div>

          <button
            onClick={handleRun}
            disabled={executing}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-neon-primary hover:bg-neon-primaryLight text-white text-xs font-bold shadow-neon-glow transition-all cursor-pointer disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{executing ? 'Executing...' : 'Run Query (Ctrl+Enter)'}</span>
          </button>
        </div>

        {/* Textarea Code Field */}
        <textarea
          rows={6}
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              handleRun();
            }
          }}
          placeholder="Enter SQL command (e.g. SELECT * FROM projects;)..."
          className="w-full bg-[#0D1117] text-neon-text font-mono text-xs sm:text-sm p-4 focus:outline-none resize-y selection:bg-neon-primary selection:text-white"
        />

        {/* Execution Metadata Bar */}
        {result && (
          <div className="px-4 py-2 bg-neon-bg/60 border-t border-neon-border/80 flex items-center justify-between text-xs font-mono">
            <span className="text-neon-accent flex items-center gap-1.5 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Query OK &bull; {result.rowCount} row(s) returned</span>
            </span>
            <span className="text-neon-muted">
              Execution Time: <b className="text-white">{result.durationMs} ms</b>
            </span>
          </div>
        )}

        {/* Error Bar */}
        {error && (
          <div className="p-4 bg-rose-500/10 border-t border-rose-500/30 text-rose-300 text-xs font-mono flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <span className="font-bold uppercase tracking-wider text-rose-400 block">Postgres Error:</span>
              <span>{error}</span>
            </div>
          </div>
        )}
      </div>

      {/* Results Table */}
      {result && result.rows && result.rows.length > 0 && (
        <div className="bg-neon-card rounded-2xl border border-neon-border overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-neon-border/80 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neon-muted font-mono">
              Result Dataset Preview
            </h3>
            <span className="text-[11px] font-mono text-neon-muted">
              Max 100 rows preview
            </span>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-neon-bg/80 text-neon-muted border-b border-neon-border sticky top-0">
                <tr>
                  {Object.keys(result.rows[0]).map((key) => (
                    <th key={key} className="px-4 py-2.5 font-bold uppercase tracking-wider">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neon-border/40">
                {result.rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-neon-cardHover/50 transition-colors">
                    {Object.values(row).map((val, cIdx) => (
                      <td key={cIdx} className="px-4 py-2 text-neon-text whitespace-nowrap">
                        {val === null ? <span className="text-neon-muted italic">NULL</span> : String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
