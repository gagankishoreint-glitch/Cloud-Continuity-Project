import React, { useState, useEffect, useRef } from 'react';
import { useTasks } from '../context/TaskContext';
import { 
  RotateCcw, 
  Play, 
  CheckCircle2, 
  AlertOctagon, 
  ArrowRightCircle, 
  Clock, 
  ExternalLink, 
  Copy, 
  Check, 
  Terminal, 
  Layers, 
  ShieldCheck, 
  X,
  Sparkles,
  Zap
} from 'lucide-react';

export default function RecoveryBriefingModal({ isOpen, onClose }) {
  const { 
    activeTask, 
    recoveryBriefing, 
    currentRecoverySession, 
    interruptionScenario, 
    completeResumption,
    showToast
  } = useTasks();

  const [elapsedMs, setElapsedMs] = useState(0);
  const [copiedId, setCopiedId] = useState(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  // Live Resumption Timer
  useEffect(() => {
    if (isOpen) {
      startTimeRef.current = Date.now();
      setElapsedMs(0);
      timerRef.current = setInterval(() => {
        setElapsedMs(Date.now() - startTimeRef.current);
      }, 50);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen]);

  if (!isOpen || !recoveryBriefing) return null;

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Copied to clipboard!', 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAction = async (actionType, actionDesc) => {
    if (timerRef.current) clearInterval(timerRef.current);
    await completeResumption(actionType, actionDesc);
  };

  const formatTimer = (ms) => {
    const totalSec = ms / 1000;
    const minutes = Math.floor(totalSec / 60);
    const seconds = Math.floor(totalSec % 60);
    const tenths = Math.floor((ms % 1000) / 100);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${tenths}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header with Resumption Timer Banner */}
        <div className="p-6 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <RotateCcw className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white tracking-tight">Recovery Briefing</h3>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase">
                  v{recoveryBriefing.version_number}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {recoveryBriefing.task_title} • Last active {recoveryBriefing.elapsed_time_human}
              </p>
            </div>
          </div>

          {/* Resumption Lag Running Clock */}
          <div className="flex items-center space-x-2 px-3.5 py-2 rounded-2xl bg-slate-950/80 border border-indigo-500/40 shrink-0">
            <Clock className="w-4 h-4 text-indigo-400 animate-pulse" />
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Resumption Lag</div>
              <div className="text-sm font-mono font-bold text-white">{formatTimer(elapsedMs)}</div>
            </div>
          </div>
        </div>

        {/* 4 Core Briefing Sections */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* 1. What you were doing */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>1. What You Were Doing (Task Goal)</span>
              </span>
              <span className="text-[10px] text-slate-500">{recoveryBriefing.provenance_summary.goal || 'User Verified'}</span>
            </div>
            <p className="text-xs font-semibold text-slate-100 leading-relaxed">
              {recoveryBriefing.what_you_were_doing}
            </p>
          </div>

          {/* 2. What was completed */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>2. Confirmed Completed Progress</span>
              </span>
              <span className="text-[10px] text-slate-500">
                {recoveryBriefing.what_was_completed.length} milestones confirmed
              </span>
            </div>
            <ul className="space-y-1.5">
              {recoveryBriefing.what_was_completed.map((m, idx) => (
                <li key={idx} className="flex items-start space-x-2 text-xs text-slate-200">
                  <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 3. Current Blocker */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 flex items-center space-x-1.5">
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>3. Current Blocker / Open Question</span>
              </span>
              <span className="text-[10px] text-slate-500">{recoveryBriefing.provenance_summary.blocker || 'Observed State'}</span>
            </div>
            <p className="text-xs font-mono text-rose-200 bg-rose-950/20 p-2.5 rounded-xl border border-rose-900/40">
              {recoveryBriefing.current_blocker}
            </p>
          </div>

          {/* 4. Explicit Next Action (Prospective Anchor) */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/50 via-slate-950 to-blue-950/40 border border-indigo-500/50 space-y-2 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 flex items-center space-x-1.5">
                <ArrowRightCircle className="w-4 h-4 text-indigo-400" />
                <span>4. Explicit Next Action (Resume Here)</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold uppercase">
                Primary Action
              </span>
            </div>
            <p className="text-xs font-bold text-white bg-slate-900/90 p-3 rounded-xl border border-indigo-500/30 leading-relaxed">
              {recoveryBriefing.explicit_next_action}
            </p>
          </div>

          {/* Pinned Resources Quick Access */}
          {recoveryBriefing.resources && recoveryBriefing.resources.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                Pinned Resources to Reopen
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {recoveryBriefing.resources.map((r, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                    <span className="font-semibold text-slate-200 truncate mr-2">{r.title}</span>
                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        onClick={() => handleCopy(r.value, idx)}
                        className="p-1 text-slate-400 hover:text-white"
                        title="Copy command"
                      >
                        {copiedId === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      {r.type === 'url' && (
                        <a
                          href={r.value.startsWith('http') ? r.value : `https://${r.value}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => handleAction('opened_resource', `Opened resource: ${r.title}`)}
                          className="p-1 text-blue-400 hover:text-blue-300"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer: Take First Action to Stop Timer & Resume */}
        <div className="p-5 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex items-center space-x-1.5">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>Clicking an action stops the resumption timer and records telemetry.</span>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={() => handleAction('executed_next_action', `Executed explicit action: ${recoveryBriefing.explicit_next_action}`)}
              className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition"
            >
              <Zap className="w-4 h-4" />
              <span>Start Next Action</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
