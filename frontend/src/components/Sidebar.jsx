import React from 'react';
import { 
  LayoutDashboard, 
  RotateCcw, 
  History, 
  Smartphone, 
  FlaskConical, 
  Cloud, 
  Activity, 
  ShieldCheck, 
  BookOpen,
  ArrowRight
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'workspace', label: 'Context Workspace', icon: LayoutDashboard, badge: 'Core' },
    { id: 'recovery', label: 'Recovery Briefing Hub', icon: RotateCcw, highlight: true },
    { id: 'history', label: 'Version History & Diff', icon: History },
    { id: 'devices', label: 'Cross-Device Sync', icon: Smartphone },
    { id: 'research', label: 'Research Experiment Suite', icon: FlaskConical, badge: 'A/B Study' },
    { id: 'aws', label: 'AWS Syllabus & Architecture', icon: Cloud, badge: '10 Modules' },
    { id: 'telemetry', label: 'CloudWatch & Load Tester', icon: Activity },
    { id: 'privacy', label: 'Privacy & Governance', icon: ShieldCheck },
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-slate-800 bg-slate-950/60 p-4 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-65px)]">
      <div className="space-y-6">
        <div>
          <div className="px-3 text-[11px] font-semibold tracking-wider text-slate-500 uppercase mb-2">
            System Navigation
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition group ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 transition ${isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`px-1.5 py-0.5 text-[10px] rounded-md font-semibold ${
                      isActive 
                        ? 'bg-blue-500/20 text-blue-300' 
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Psychological Model Callout */}
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-purple-950/30 border border-indigo-500/20 text-xs">
          <div className="flex items-center space-x-2 text-indigo-400 font-semibold mb-1">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Cognitive Model</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Preserves task context (Goal · Milestones · Blockers · Next Action) to minimize resumption lag and working memory depletion.
          </p>
        </div>
      </div>

      {/* Cloud Security Indicator */}
      <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>AWS us-east-1</span>
        </div>
        <span className="text-slate-400 font-mono text-[10px]">KMS AES-256</span>
      </div>
    </aside>
  );
}
