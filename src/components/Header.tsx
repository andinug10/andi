import React from 'react';
import {
  Activity,
  AlertTriangle,
  CheckSquare,
  FileSpreadsheet,
  Gauge,
  Layers,
  Settings,
  ShieldCheck,
} from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  openAlertsCount: number;
  pendingTasksCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  openAlertsCount,
  pendingTasksCount,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'predict', label: 'Single Patient Predictor', icon: Gauge },
    { id: 'batch', label: 'Batch CSV Analysis', icon: FileSpreadsheet },
    {
      id: 'alerts',
      label: 'Alerts (Triggers)',
      icon: AlertTriangle,
      badge: openAlertsCount,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'tasks',
      label: 'Task Board (Operations)',
      icon: CheckSquare,
      badge: pendingTasksCount,
      badgeColor: 'bg-amber-500 text-white',
    },
    { id: 'model', label: 'Model Insights (CRISP-DM)', icon: Layers },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Top utility bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-600 flex items-center justify-center text-white shadow-sm ring-2 ring-teal-100">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-slate-900">
                  AI Health Copilot <span className="text-teal-600">Pro</span>
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-teal-50 text-teal-700 border border-teal-200">
                  v3.1.0 • Chapter 10
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Clinical ML Decision Support &amp; ITDO Agentic Framework • Dr. Harry Patria
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="font-semibold text-slate-800">Model Pipeline:</span>
              <span className="font-mono text-teal-700 font-medium">RandomForest (AUC 0.835)</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50/80 border border-teal-200 text-xs text-teal-800 font-medium">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Deterministic Flags + LLM Reasoner</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main navigation row */}
      <div className="bg-slate-50/80 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 overflow-x-auto py-1.5 scrollbar-none" aria-label="Main Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs md:text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`ml-1.5 px-1.5 py-0.2 text-[10px] font-bold rounded-full ${
                        isActive ? 'bg-white text-teal-700' : item.badgeColor
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
