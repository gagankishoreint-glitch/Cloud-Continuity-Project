import React, { useState, useEffect } from 'react';
import { useTasks } from '../context/TaskContext';
import { api } from '../api/client';
import { 
  History, 
  GitCommit, 
  GitCompare, 
  RotateCcw, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Layers, 
  Plus, 
  Minus,
  Sparkles,
  Laptop
} from 'lucide-react';

export default function VersionHistory() {
  const { activeTask, checkpoints, fetchCheckpoints, showToast } = useTasks();

  const [selectedVersionA, setSelectedVersionA] = useState(null);
  const [selectedVersionB, setSelectedVersionB] = useState(null);
  const [diffResult, setDiffResult] = useState(null);
  const [loadingDiff, setLoadingDiff] = useState(false);

  useEffect(() => {
    if (checkpoints.length >= 2) {
      setSelectedVersionA(checkpoints[1].id);
      setSelectedVersionB(checkpoints[0].id);
    } else if (checkpoints.length === 1) {
      setSelectedVersionA(checkpoints[0].id);
      setSelectedVersionB(checkpoints[0].id);
    }
  }, [checkpoints]);

  useEffect(() => {
    const fetchDiff = async () => {
      if (!selectedVersionA || !selectedVersionB) return;
      if (selectedVersionA === selectedVersionB) {
        setDiffResult(null);
        return;
      }
      setLoadingDiff(true);
      try {
        const res = await api.diffCheckpoints(selectedVersionA, selectedVersionB);
        setDiffResult(res);
      } catch (err) {
        console.error('Error fetching diff:', err);
      } finally {
        setLoadingDiff(false);
      }
    };

    fetchDiff();
  }, [selectedVersionA, selectedVersionB]);

  const handleRollback = async (checkpointId) => {
    try {
      const rolledBack = await api.rollbackCheckpoint(checkpointId);
      await fetchCheckpoints(activeTask.id);
      showToast(`Rolled back to Version ${rolledBack.provenance?.rollback_from_version || 'previous'}. New snapshot created!`, 'success');
    } catch (err) {
      showToast(`Rollback failed: ${err.message}`, 'error');
    }
  };

  if (!activeTask) {
    return (
      <div className="p-8 text-center text-slate-400">
        Select a task to inspect checkpoint version history.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-purple-400" />
            <h2 className="text-base font-bold text-white">Checkpoint Version History & Diff</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Track context evolutions, inspect state differences, and safely restore historical task states.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
          <span className="px-3 py-1 rounded-xl bg-purple-950/60 text-purple-300 border border-purple-800/40">
            {checkpoints.length} Saved Checkpoints
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Version Timeline */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            Version Timeline
          </h3>

          <div className="space-y-2.5">
            {checkpoints.map((chk, index) => {
              const isLatest = index === 0;
              return (
                <div 
                  key={chk.id}
                  className={`p-4 rounded-2xl border transition ${
                    isLatest 
                      ? 'bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/30 border-blue-500/40' 
                      : 'bg-slate-900/80 border-slate-800/90 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        v{chk.version_number}
                      </span>
                      {isLatest && (
                        <span className="px-1.5 py-0.2 text-[10px] font-bold uppercase rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Active
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] text-slate-500 flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(chk.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 font-medium line-clamp-2 mb-2">
                    {chk.goal}
                  </p>

                  <div className="text-[11px] text-slate-400 space-y-1 mb-3">
                    <div className="flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>{chk.confirmed_progress?.length || 0} Milestones</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Laptop className="w-3 h-3 text-slate-500" />
                      <span>{chk.device_origin || 'Workstation'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                    <button
                      onClick={() => setSelectedVersionB(chk.id)}
                      className="text-blue-400 hover:text-blue-300 font-semibold"
                    >
                      Compare in Diff
                    </button>
                    {!isLatest && (
                      <button
                        onClick={() => handleRollback(chk.id)}
                        className="flex items-center space-x-1 text-slate-400 hover:text-white transition"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Rollback</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 2 Columns: Visual Diff Engine */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <GitCompare className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Interactive Version Diff Explorer
                </h3>
              </div>

              {/* Version Selectors */}
              <div className="flex items-center space-x-2 text-xs">
                <select
                  value={selectedVersionA || ''}
                  onChange={(e) => setSelectedVersionA(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  {checkpoints.map((c) => (
                    <option key={c.id} value={c.id}>
                      Base: v{c.version_number} ({new Date(c.created_at).toLocaleTimeString()})
                    </option>
                  ))}
                </select>

                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />

                <select
                  value={selectedVersionB || ''}
                  onChange={(e) => setSelectedVersionB(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  {checkpoints.map((c) => (
                    <option key={c.id} value={c.id}>
                      Target: v{c.version_number} ({new Date(c.created_at).toLocaleTimeString()})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Diff Summary */}
            {diffResult ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-xs">
                  <span className="font-bold text-indigo-300">Diff Summary: </span>
                  <span className="text-slate-200">{diffResult.summary_text}</span>
                </div>

                <div className="space-y-3">
                  {diffResult.diffs.map((d, idx) => (
                    <div 
                      key={idx}
                      className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold uppercase tracking-wider text-slate-300 font-mono">
                          {d.field.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                          d.change_type === 'added' ? 'bg-emerald-500/20 text-emerald-300' :
                          d.change_type === 'modified' ? 'bg-amber-500/20 text-amber-300' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {d.change_type}
                        </span>
                      </div>

                      {d.change_type === 'modified' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-900/30 font-mono text-[11px] text-rose-300">
                            <span className="block text-[10px] text-rose-400 font-bold mb-1">- Base (v{diffResult.version_a})</span>
                            {String(d.old_value)}
                          </div>
                          <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-900/30 font-mono text-[11px] text-emerald-300">
                            <span className="block text-[10px] text-emerald-400 font-bold mb-1">+ Target (v{diffResult.version_b})</span>
                            {String(d.new_value)}
                          </div>
                        </div>
                      )}

                      {d.change_type === 'added' && (
                        <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-900/30 font-mono text-[11px] text-emerald-300">
                          <span className="block text-[10px] text-emerald-400 font-bold mb-1">+ Newly Added</span>
                          {JSON.stringify(d.new_value, null, 2)}
                        </div>
                      )}

                      {d.change_type === 'unchanged' && (
                        <div className="text-slate-500 text-[11px] italic">
                          No changes in this field.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs italic">
                {checkpoints.length < 2 
                  ? "Save at least two checkpoint snapshots to view side-by-side version diffs." 
                  : "Select two distinct versions above to compute contextual diff."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
