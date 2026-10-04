import React from 'react';
import { 
  Server, 
  Clock, 
  Activity, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

export default function QueryLogs({ logs, onRefresh }) {
  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neon-border/60 pb-5">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Server className="w-5 h-5 text-neon-accent" />
            <span>Serverless Query Telemetry Feed</span>
          </h2>
          <p className="text-xs text-neon-muted mt-1">
            Real-time audit log of executed queries, latency benchmarks, and connection pooler events.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neon-card hover:bg-neon-cardHover text-neon-muted hover:text-white border border-neon-border text-xs font-bold transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Logs Table */}
      <div className="bg-neon-card rounded-2xl border border-neon-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-neon-bg/80 text-neon-muted border-b border-neon-border">
              <tr>
                <th className="px-4 py-3 font-bold uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 font-bold uppercase tracking-wider">Executed Query</th>
                <th className="px-4 py-3 font-bold uppercase tracking-wider">Target Cluster</th>
                <th className="px-4 py-3 font-bold uppercase tracking-wider">Latency</th>
                <th className="px-4 py-3 font-bold uppercase tracking-wider">Rows</th>
                <th className="px-4 py-3 font-bold uppercase tracking-wider">Caller</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neon-border/40">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-neon-cardHover/50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-neon-accent bg-neon-accent/10 px-2 py-0.5 rounded-full border border-neon-accent/20">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{log.status}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white max-w-md truncate" title={log.query_text}>
                    {log.query_text}
                  </td>
                  <td className="px-4 py-3 text-neon-cyan whitespace-nowrap">
                    {log.project_name || 'neondb'}
                  </td>
                  <td className="px-4 py-3 text-neon-accent font-bold whitespace-nowrap">
                    {log.duration_ms} ms
                  </td>
                  <td className="px-4 py-3 text-neon-muted whitespace-nowrap">
                    {log.rows_affected}
                  </td>
                  <td className="px-4 py-3 text-neon-muted whitespace-nowrap">
                    {log.executed_by}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
