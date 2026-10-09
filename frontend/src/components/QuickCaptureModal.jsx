import React, { useState } from 'react';
import { useTasks } from '../context/TaskContext';
import { api } from '../api/client';
import { 
  Sparkles, 
  Terminal, 
  Globe, 
  ArrowRight, 
  Save, 
  X, 
  CheckCircle2, 
  Check, 
  Plus,
  RefreshCw
} from 'lucide-react';

export default function QuickCaptureModal({ isOpen, onClose }) {
  const { activeTask, saveCheckpointSnapshot, showToast } = useTasks();

  const [rawNotes, setRawNotes] = useState('Goal: Fix S3 AccessDenied\nError: 403 Forbidden on PutObject\nNext: Check KMS key policy in IAM console');
  const [terminalSnippet, setTerminalSnippet] = useState('aws s3 cp file.txt s3://prod-bucket/ -> AccessDenied');
  const [extractedData, setExtractedData] = useState(null);
  const [extracting, setExtracting] = useState(false);

  if (!isOpen) return null;

  const handleExtractContext = async () => {
    setExtracting(true);
    try {
      const res = await api.triggerAutoBriefingNLP({
        raw_notes: rawNotes,
        terminal_output: terminalSnippet
      });
      setExtractedData(res);
      showToast('Context intelligently parsed by AWS Lambda NLP extraction!', 'info');
    } catch (err) {
      showToast(`Extraction failed: ${err.message}`, 'error');
    } finally {
      setExtracting(false);
    }
  };

  const handleSaveToActiveTask = async () => {
    if (!extractedData) return;
    try {
      await saveCheckpointSnapshot({
        goal: extractedData.inferred_goal,
        confirmed_progress: extractedData.inferred_progress,
        blocker_or_question: extractedData.inferred_blocker,
        next_action: extractedData.inferred_next_action,
        resources: [
          { id: `r-${Date.now()}`, title: 'Quick Captured CLI Error', type: 'terminal', value: terminalSnippet }
        ],
        provenance: {
          goal: { source: 'ai_inferred', confidence: extractedData.confidence_score },
          next_action: { source: 'ai_inferred', confidence: extractedData.confidence_score }
        }
      });
      onClose();
    } catch (err) {
      showToast(`Failed to commit: ${err.message}`, 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Browser Extension & CLI Quick Capture
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulate instant one-shortcut capture of active tabs and terminal output into structured context.
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Active Browser Scratchpad / Unfinished Notes
            </label>
            <textarea
              rows={3}
              value={rawNotes}
              onChange={(e) => setRawNotes(e.target.value)}
              className="w-full px-3.5 py-2 text-xs text-slate-100 bg-slate-950 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Active Terminal Error Snippet (Simulated CLI Output)
            </label>
            <textarea
              rows={2}
              value={terminalSnippet}
              onChange={(e) => setTerminalSnippet(e.target.value)}
              className="w-full px-3.5 py-2 text-xs text-rose-300 bg-slate-950 rounded-xl border border-slate-800 focus:outline-none focus:border-rose-500 font-mono"
            />
          </div>

          <button
            onClick={handleExtractContext}
            disabled={extracting}
            className="w-full py-2.5 font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition flex items-center justify-center space-x-2"
          >
            {extracting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>Extract Structured Checkpoint (AWS Lambda NLP)</span>
          </button>

          {/* Extracted Preview */}
          {extractedData && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-emerald-400">
                  ✓ Structured Context Extracted
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold">
                  Provenance: AI Inferred (Confidence: {extractedData.confidence_score * 100}%)
                </span>
              </div>

              <div className="space-y-1.5 font-medium text-slate-200">
                <div><span className="text-blue-400 font-bold">Goal: </span>{extractedData.inferred_goal}</div>
                <div><span className="text-rose-400 font-bold">Blocker: </span>{extractedData.inferred_blocker}</div>
                <div><span className="text-indigo-400 font-bold">Next Action: </span>{extractedData.inferred_next_action}</div>
              </div>

              <button
                onClick={handleSaveToActiveTask}
                className="w-full py-2 font-bold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md transition"
              >
                Commit to Active Workspace ({activeTask?.title})
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
