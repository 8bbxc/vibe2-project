import React from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  ArrowLeftRight, 
  Users, 
  PieChart, 
  Database, 
  Activity, 
  Coins
} from 'lucide-react';

export default function Header({ 
  activeTab, 
  setActiveTab, 
  dbHealth, 
  currency, 
  setCurrency 
}) {
  const navItems = [
    { id: 'dashboard', label: 'لوحة المؤشرات', icon: LayoutDashboard },
    { id: 'transactions', label: 'القيود والمعاملات', icon: ArrowLeftRight },
    { id: 'invoices', label: 'إدارة الفواتير', icon: Receipt },
    { id: 'clients', label: 'العملاء والشركاء', icon: Users },
    { id: 'reports', label: 'التقارير المالية', icon: PieChart },
  ];

  return (
    <header className="border-b border-gray-800 bg-[#0d131f]/90 backdrop-blur-md sticky top-0 z-50 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-3">
          
          {/* Logo & Platform Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-bold text-xl">
              م
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-wide font-sans">ميزان الذكي</h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium">
                  Smart Ledger v2
                </span>
              </div>
              <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                <Database className="w-3.5 h-3.5 text-teal-400" />
                متصل سحابياً مع <span className="text-teal-300 font-medium">Neon PostgreSQL</span>
              </p>
            </div>
          </div>

          {/* Database Health Badge & Currency Toggle */}
          <div className="flex items-center gap-3">
            {/* Currency Selector */}
            <div className="flex items-center bg-gray-900/80 border border-gray-700/80 rounded-lg p-1 text-xs">
              <Coins className="w-3.5 h-3.5 text-amber-400 mx-1.5" />
              {[
                { code: 'USD', symbol: '$' },
                { code: 'SAR', symbol: 'ر.س' },
                { code: 'ILS', symbol: '₪' }
              ].map(c => (
                <button
                  key={c.code}
                  onClick={() => setCurrency(c.code)}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    currency === c.code 
                      ? 'bg-emerald-600 text-white shadow-sm' 
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {c.symbol}
                </button>
              ))}
            </div>

            {/* Neon Connection Status */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-900/90 border border-gray-800 text-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-gray-300 font-mono font-medium">
                {dbHealth?.latencyMs ? `${dbHealth.latencyMs}ms` : 'Neon Live'}
              </span>
              <span className="text-gray-500">|</span>
              <span className="text-gray-400 font-mono text-[11px]">
                {dbHealth?.database || 'neondb'}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-1 space-x-reverse overflow-x-auto pb-2 scrollbar-none pt-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-gray-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
