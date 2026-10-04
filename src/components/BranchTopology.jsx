import React, { useState } from 'react';
import { 
  GitBranch, 
  Plus, 
  GitFork, 
  CheckCircle2, 
  ShieldCheck, 
  Layers,
  ArrowRight,
  Database
} from 'lucide-react';

export default function BranchTopology({ projects, onBranchCreated }) {
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || 1);
  const [newBranchName, setNewBranchName] = useState('');
  const [creating, setCreating] = useState(false);

  const activeProject = projects.find(p => p.id === parseInt(selectedProjectId)) || projects[0];

  const handleCreateBranch = async (e) => {
    e.preventDefault();
    if (!newBranchName.trim() || !activeProject) return;
    setCreating(true);

    try {
      const res = await fetch(`/api/projects/${activeProject.id}/branches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch_name: newBranchName.trim(),
          parent_branch: 'main'
        })
      });
      if (res.ok && onBranchCreated) {
        onBranchCreated();
        setNewBranchName('');
      }
    } catch (err) {
      console.error("Failed to create branch:", err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neon-border/60 pb-5">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-neon-cyan" />
            <span>Neon Branching & Isolated Environments</span>
          </h2>
          <p className="text-xs text-neon-muted mt-1">
            Zero-overhead, copy-on-write database branches for preview deployments, staging, and isolated agent workflows.
          </p>
        </div>

        {/* Project Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-neon-muted uppercase">Select Cluster:</span>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(parseInt(e.target.value))}
            className="bg-neon-card text-white text-xs font-bold border border-neon-border rounded-xl px-3 py-2 outline-none"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.slug})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Create Branch Panel */}
        <div className="bg-neon-card border border-neon-border rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-neon-primary" />
            <span>Create Instant Branch</span>
          </h3>
          <p className="text-xs text-neon-muted leading-relaxed">
            Forks the entire schema and data of <b>{activeProject?.name}</b> in less than 500ms using Neon's Copy-on-Write storage engine.
          </p>

          <form onSubmit={handleCreateBranch} className="space-y-3 pt-2">
            <div>
              <label className="text-[11px] font-bold uppercase text-neon-muted block mb-1">
                New Branch Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. preview-pr-42"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                className="w-full bg-neon-bg border border-neon-border rounded-xl px-3 py-2 text-xs font-mono text-white placeholder:text-neon-muted/60 focus:border-neon-primary outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-neon-muted block mb-1">
                Parent Branch Source
              </label>
              <input
                type="text"
                disabled
                value="main (root snapshot)"
                className="w-full bg-neon-bg/40 border border-neon-border/40 rounded-xl px-3 py-2 text-xs font-mono text-neon-muted"
              />
            </div>

            <button
              type="submit"
              disabled={creating || !newBranchName}
              className="w-full py-2.5 rounded-xl bg-neon-primary hover:bg-neon-primaryLight text-white text-xs font-bold shadow-neon-glow transition-all cursor-pointer disabled:opacity-50"
            >
              {creating ? 'Forking Snapshot...' : 'Create Instant Fork'}
            </button>
          </form>
        </div>

        {/* Visual Branch Tree List */}
        <div className="lg:col-span-2 bg-neon-card border border-neon-border rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-neon-border pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-neon-cyan" />
              <span>Active Branch Tree for {activeProject?.name}</span>
            </h3>
            <span className="text-[11px] font-mono text-neon-muted">
              {activeProject?.branches?.length || 0} active branches
            </span>
          </div>

          <div className="space-y-3">
            {(activeProject?.branches || []).map((branch) => {
              const isMain = branch.branch_name === 'main';

              return (
                <div
                  key={branch.id}
                  className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                    isMain
                      ? 'bg-neon-primary/10 border-neon-primary/40 text-white'
                      : 'bg-neon-bg/60 border-neon-border/60 text-neon-text'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isMain ? 'bg-neon-primary text-white' : 'bg-neon-border text-neon-muted'
                    }`}>
                      <GitBranch className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold">{branch.branch_name}</span>
                        {isMain && (
                          <span className="text-[9px] font-bold uppercase tracking-wider bg-neon-primary text-white px-2 py-0.5 rounded-full">
                            Default / Production
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-neon-muted">
                        Forked from: <span className="font-mono text-white">{branch.parent_branch}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-neon-accent flex items-center gap-1 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-neon-accent" />
                      <span>{branch.compute_state}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-4 rounded-xl bg-neon-bg border border-neon-border/50 text-xs text-neon-muted flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-neon-primary mt-0.5 flex-shrink-0" />
            <p>
              In accordance with Neon best practices, every branch runs independently with its own compute scale-to-zero quota without duplicating physical storage costs.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
