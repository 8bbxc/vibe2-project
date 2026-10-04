import React from 'react';
import { 
  Database, 
  Activity, 
  GitBranch, 
  Terminal, 
  ShieldCheck, 
  ExternalLink,
  Zap,
  Server
} from 'lucide-react';

export default function Header({ activeTab, setActiveTab, healthData }) {
  const tabs = [
    { id: 'dashboard', label: 'Clusters & Analytics', icon: Activity },
    { id: 'playground', label: 'SQL Console', icon: Terminal },
    { id: 'branches', label: 'Branch Topology', icon: GitBranch },
    { id: 'logs', label: 'Live Telemetry', icon: Server },
  ];

  return (
    <header className="sticky top-0 z-50 cyber-glass border-b border-neon-border/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          
          {/* Logo & Platform Badge */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-primary to-indigo-700 flex items-center justify-center text-white shadow-neon-glow">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-white font-mono">
                  NEON<span className="text-neon-primary">.PULSE</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-neon-primary/20 text-neon-primaryLight px-2 py-0.5 rounded-full border border-neon-primary/30">
                  Mission Control
                </span>
              </div>
              <p className="text-[11px] text-neon-muted flex items-center gap-1.5">
                <span>AWS us-east-2 (Ohio)</span>
                <span>&bull;</span>
                <span className="text-neon-cyan font-mono">Serverless Postgres 16</span>
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-neon-card p-1 rounded-xl border border-neon-border/80">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-neon-primary text-white shadow-neon-glow'
                      : 'text-neon-muted hover:text-white hover:bg-neon-cardHover'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-neon-muted'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Live Ping Indicator & Security Badge */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neon-card border border-neon-border text-xs font-mono">
              <span className={`w-2 h-2 rounded-full ${healthData?.status === 'online' ? 'bg-neon-accent animate-ping' : 'bg-neon-accentWarn'}`} />
              <span className="text-neon-muted">RTT:</span>
              <span className="text-neon-accent font-bold">
                {healthData?.latencyMs ? `${healthData.latencyMs} ms` : 'Testing...'}
              </span>
            </div>

            <div className="flex items-center gap-1 text-[11px] font-bold text-neon-accent bg-neon-accent/10 border border-neon-accent/30 px-2.5 py-1 rounded-lg">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>TLS Secured</span>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
