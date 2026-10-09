import React, { useState } from 'react';
import { useTasks } from '../context/TaskContext';
import { 
  Activity, 
  Brain, 
  Smile, 
  Frown, 
  Flame, 
  Hourglass, 
  CheckCircle2, 
  Star,
  Send,
  X
} from 'lucide-react';

export default function NasaTlxModal({ isOpen, onClose }) {
  const { currentRecoverySession, submitNasaRating } = useTasks();

  const [mental, setMental] = useState(30);
  const [physical, setPhysical] = useState(10);
  const [temporal, setTemporal] = useState(25);
  const [performance, setPerformance] = useState(20);
  const [effort, setEffort] = useState(35);
  const [frustration, setFrustration] = useState(15);
  const [confidence, setConfidence] = useState(9);
  const [repeatedWork, setRepeatedWork] = useState(0);
  const [feedback, setFeedback] = useState('');

  if (!isOpen) return null;

  const calculateOverallTlx = () => {
    return Math.round((mental + physical + temporal + performance + effort + frustration) / 6);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await submitNasaRating({
      nasa_tlx_mental: mental,
      nasa_tlx_physical: physical,
      nasa_tlx_temporal: temporal,
      nasa_tlx_performance: performance,
      nasa_tlx_effort: effort,
      nasa_tlx_frustration: frustration,
      perceived_confidence: confidence,
      repeated_work_count: repeatedWork,
      qualitative_feedback: feedback.trim()
    });
  };

  const getTlxColor = (score) => {
    if (score < 35) return 'text-emerald-400';
    if (score < 65) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Subjective Cognitive Workload (NASA-TLX)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Resumption lag recorded: <span className="text-blue-400 font-bold">{currentRecoverySession?.resumption_lag_seconds || 0}s</span>
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">TLX Score</div>
            <div className={`text-xl font-bold font-mono ${getTlxColor(calculateOverallTlx())}`}>
              {calculateOverallTlx()} / 100
            </div>
          </div>
        </div>

        {/* Sliders Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <p className="text-xs text-slate-300 leading-relaxed">
            Rate your subjective mental effort regaining context after the interruption.
          </p>

          <div className="space-y-4">
            {/* Mental Demand */}
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-200">1. Mental Demand (Thinking, recalling, deciding)</span>
                <span className="text-blue-400 font-mono font-bold">{mental}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={mental}
                onChange={(e) => setMental(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Very Low</span>
                <span>Very High</span>
              </div>
            </div>

            {/* Temporal Demand */}
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-200">2. Temporal Demand (Time pressure, rushing)</span>
                <span className="text-indigo-400 font-mono font-bold">{temporal}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={temporal}
                onChange={(e) => setTemporal(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Relaxed Pace</span>
                <span>Rushed</span>
              </div>
            </div>

            {/* Effort */}
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-200">3. Effort (Hard work required to regain state)</span>
                <span className="text-purple-400 font-mono font-bold">{effort}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={effort}
                onChange={(e) => setEffort(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Effortless</span>
                <span>Exhausting</span>
              </div>
            </div>

            {/* Frustration */}
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-200">4. Frustration (Stress, confusion, annoyance)</span>
                <span className="text-rose-400 font-mono font-bold">{frustration}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={frustration}
                onChange={(e) => setFrustration(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>

            {/* Confidence (1-10) */}
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-200">5. Perceived Confidence in Next Step (1-10)</span>
                <span className="text-emerald-400 font-mono font-bold">{confidence}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={confidence}
                onChange={(e) => setConfidence(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            {/* Qualitative Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Reflection (Optional)
              </label>
              <input
                type="text"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="e.g. 'The briefing helped me remember the exact CLI flag I was testing.'"
                className="w-full px-3.5 py-2 text-xs text-slate-100 bg-slate-950 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="submit"
              className="w-full flex items-center justify-center space-x-2 px-6 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition"
            >
              <Send className="w-4 h-4" />
              <span>Submit Evaluation Telemetry</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
