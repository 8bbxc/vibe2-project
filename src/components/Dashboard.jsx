import React, { useState } from 'react';
import { 
  Database, 
  GitBranch, 
  HardDrive, 
  Cpu, 
  Activity, 
  Plus, 
  Trash2, 
  ExternalLink,
  CheckCircle2,
  Clock,
  Zap,
  Server
} from 'lucide-react';

export default function Dashboard({ projects, analytics, onRefresh, onCreateProject, onDeleteProject }) {
  const [showModal, setShowModal] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    slug: '',
    environment: 'production',
    region: 'aws-us-east-2'
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newProject.name || !newProject.slug) return;
    setSubmitting(true);
    await onCreateProject(newProject);
    setSubmitting(false);
    setShowModal(false);
    setNewProject({ name: '', slug: '', environment: 'production', region: 'aws-us-east-2' });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* 1. Global Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-neon-card border border-neon-border/80 rounded-2xl p-5 shadow-sm hover:border-neon-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neon-muted">Total Clusters</span>
            <Database className="w-4 h-4 text-neon-primary" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white font-mono">
            {analytics?.totalProjects ?? 0}
          </div>
          <span className="text-[11px] text-neon-muted mt-1 block">Live Neon Postgres Instances</span>
        </div>

        <div className="bg-neon-card border border-neon-border/80 rounded-2xl p-5 shadow-sm hover:border-neon-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neon-muted">Active Branches</span>
            <GitBranch className="w-4 h-4 text-neon-cyan" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white font-mono">
            {analytics?.totalBranches ?? 0}
          </div>
          <span className="text-[11px] text-neon-muted mt-1 block">Instant CoW Database Forks</span>
        </div>

        <div className="bg-neon-card border border-neon-border/80 rounded-2xl p-5 shadow-sm hover:border-neon-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neon-muted">Avg Query Latency</span>
            <Zap className="w-4 h-4 text-neon-accent" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-neon-accent font-mono">
            {analytics?.avgQueryLatencyMs ?? 0} <span className="text-sm font-normal text-neon-muted">ms</span>
          </div>
          <span className="text-[11px] text-neon-muted mt-1 block">Serverless Pooler Response</span>
        </div>

        <div className="bg-neon-card border border-neon-border/80 rounded-2xl p-5 shadow-sm hover:border-neon-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neon-muted">Storage Footprint</span>
            <HardDrive className="w-4 h-4 text-neon-primaryLight" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white font-mono">
            {analytics?.totalStorageMb ?? 0} <span className="text-sm font-normal text-neon-muted">MB</span>
          </div>
          <span className="text-[11px] text-neon-muted mt-1 block">Dynamic Autoscaling Volume</span>
        </div>

      </div>

      {/* 2. Projects & Clusters Header & Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neon-border/60 pb-5">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Database Clusters</span>
            <span className="text-xs font-mono text-neon-muted bg-neon-card px-2 py-0.5 rounded border border-neon-border">
              {projects.length} Registered
            </span>
          </h2>
          <p className="text-xs text-neon-muted mt-1">
            Managed serverless database instances connected through Neon's distributed storage architecture.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neon-primary hover:bg-neon-primaryLight text-white text-xs font-bold shadow-neon-glow transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Provision New Cluster</span>
        </button>
      </div>

      {/* 3. Project Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((proj) => (
          <div 
            key={proj.id}
            className="bg-neon-card rounded-2xl border border-neon-border/80 hover:border-neon-primary/60 transition-all duration-300 p-6 flex flex-col justify-between shadow-sm group"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    proj.environment === 'production' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}>
                    {proj.environment}
                  </span>
                  <h3 className="mt-2 text-base font-bold text-white group-hover:text-neon-primaryLight transition-colors">
                    {proj.name}
                  </h3>
                  <span className="text-xs font-mono text-neon-muted block">
                    /{proj.slug}
                  </span>
                </div>

                <button
                  onClick={() => onDeleteProject(proj.id)}
                  title="Drop Cluster"
                  className="p-1.5 rounded-lg text-neon-muted hover:text-neon-accentRose hover:bg-neon-accentRose/10 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Status and Metrics bar */}
              <div className="mt-5 grid grid-cols-2 gap-3 p-3 rounded-xl bg-neon-bg/60 border border-neon-border/50 text-xs">
                <div>
                  <span className="text-[10px] text-neon-muted block uppercase">Connections</span>
                  <span className="font-mono font-bold text-white flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-neon-accent" />
                    {proj.active_connections} pooling
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-neon-muted block uppercase">Storage</span>
                  <span className="font-mono font-bold text-white mt-0.5 block">
                    {proj.storage_mb} MB
                  </span>
                </div>
              </div>

              {/* Branches list preview */}
              <div className="mt-4 space-y-1.5">
                <span className="text-[11px] font-bold text-neon-muted uppercase tracking-wider block">
                  Isolated Branches ({proj.branches?.length || 0}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(proj.branches || []).map((br, i) => (
                    <span 
                      key={i} 
                      className={`text-[11px] font-mono px-2 py-0.5 rounded-md flex items-center gap-1 ${
                        br.branch_name === 'main'
                          ? 'bg-neon-primary/10 text-neon-primaryLight border border-neon-primary/20 font-bold'
                          : 'bg-neon-border/40 text-neon-muted border border-neon-border/60'
                      }`}
                    >
                      <GitBranch className="w-3 h-3 text-neon-cyan" />
                      <span>{br.branch_name}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-neon-border/60 flex items-center justify-between text-xs text-neon-muted">
              <span className="font-mono">{proj.region}</span>
              <span className="text-neon-accent flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Operational</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for Provisioning New Project */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-neon-card border border-neon-border rounded-2xl max-w-md w-full p-6 shadow-neon-glow space-y-5">
            <div className="flex items-center justify-between border-b border-neon-border pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-neon-primary" />
                <span>Provision Neon Database Cluster</span>
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-neon-muted hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-neon-muted uppercase block mb-1">Cluster Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Production Billing Database"
                  value={newProject.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    setNewProject({ ...newProject, name, slug });
                  }}
                  className="w-full bg-neon-bg border border-neon-border rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-neon-muted/60 focus:border-neon-primary outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neon-muted uppercase block mb-1">Database Slug / Identifier</label>
                <input
                  type="text"
                  required
                  value={newProject.slug}
                  onChange={(e) => setNewProject({ ...newProject, slug: e.target.value })}
                  className="w-full bg-neon-bg border border-neon-border rounded-xl px-3.5 py-2 text-xs font-mono text-neon-cyan focus:border-neon-primary outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neon-muted uppercase block mb-1">Environment</label>
                  <select
                    value={newProject.environment}
                    onChange={(e) => setNewProject({ ...newProject, environment: e.target.value })}
                    className="w-full bg-neon-bg border border-neon-border rounded-xl px-3 py-2 text-xs text-white outline-none"
                  >
                    <option value="production">Production</option>
                    <option value="staging">Staging</option>
                    <option value="development">Development</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-neon-muted uppercase block mb-1">Region</label>
                  <input
                    type="text"
                    disabled
                    value="aws-us-east-2"
                    className="w-full bg-neon-bg/40 border border-neon-border/40 rounded-xl px-3 py-2 text-xs text-neon-muted font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-neon-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neon-muted hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-neon-primary hover:bg-neon-primaryLight text-white text-xs font-bold shadow-neon-glow"
                >
                  {submitting ? 'Provisioning...' : 'Deploy to Neon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
