import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import SqlPlayground from './components/SqlPlayground';
import BranchTopology from './components/BranchTopology';
import QueryLogs from './components/QueryLogs';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [projects, setProjects] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all live data from backend
  const fetchData = async () => {
    try {
      const [projRes, analyticsRes, healthRes, logsRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/analytics'),
        fetch('/api/health'),
        fetch('/api/logs')
      ]);

      if (projRes.ok) setProjects(await projRes.json());
      if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
      if (healthRes.ok) setHealthData(await healthRes.json());
      if (logsRes.ok) setLogs(await logsRes.json());
    } catch (err) {
      console.error("Telemetry fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000); // 8s live refresh
    return () => clearInterval(interval);
  }, []);

  const handleCreateProject = async (projectData) => {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error("Failed to provision project:", err);
    }
  };

  const handleDeleteProject = async (id) => {
    if (!confirm("Are you sure you want to drop this cluster?")) return;
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error("Failed to delete project:", err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-neon-bg text-neon-text font-sans">
      
      {/* 1. Header with Live Telemetry Ping */}
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        healthData={healthData} 
      />

      {/* 2. Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <Dashboard 
            projects={projects}
            analytics={analytics}
            onRefresh={fetchData}
            onCreateProject={handleCreateProject}
            onDeleteProject={handleDeleteProject}
          />
        )}

        {activeTab === 'playground' && (
          <SqlPlayground onQueryExecuted={fetchData} />
        )}

        {activeTab === 'branches' && (
          <BranchTopology 
            projects={projects} 
            onBranchCreated={fetchData} 
          />
        )}

        {activeTab === 'logs' && (
          <QueryLogs 
            logs={logs} 
            onRefresh={fetchData} 
          />
        )}
      </main>

      {/* 3. Footer */}
      <footer className="border-t border-neon-border/60 bg-neon-card/40 py-6 text-xs text-neon-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-neon-accent" />
            <span>Connected to Neon Serverless PostgreSQL</span>
          </div>
          <div>
            Built with UI/UX Pro Max &bull; Safe Environment Protected &bull; Zero Leaks
          </div>
        </div>
      </footer>

    </div>
  );
}
