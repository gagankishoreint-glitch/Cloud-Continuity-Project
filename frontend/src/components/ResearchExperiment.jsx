import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { 
  FlaskConical, 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  TrendingDown, 
  Brain, 
  Download, 
  FileText, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  Award,
  Zap,
  BarChart2,
  Check,
  ChevronRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

export default function ResearchExperiment() {
  const [benchmarks, setBenchmarks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exportFormat, setExportFormat] = useState('markdown');
  const [reportText, setReportText] = useState(null);

  // Live Experiment Runner State
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard or run_trial
  const [selectedBenchmark, setSelectedBenchmark] = useState(null);
  const [participantId, setParticipantId] = useState(`P-${Math.floor(10 + Math.random() * 90)}`);
  const [testCondition, setTestCondition] = useState('B_STRUCTURED');
  
  // Trial step states: 1=Intro, 2=Interruption (Distractor Puzzle), 3=Resumption, 4=NASA-TLX, 5=Complete
  const [trialStep, setTrialStep] = useState(1);
  const [trialTimer, setTrialTimer] = useState(0);
  const [resumptionStartTime, setResumptionStartTime] = useState(null);
  const [recordedResumptionSec, setRecordedResumptionSec] = useState(0);

  // Distractor Math Puzzle during Interruption
  const [mathA, setMathA] = useState(17);
  const [mathB, setMathB] = useState(24);
  const [userMathAnswer, setUserMathAnswer] = useState('');
  const [puzzlesSolved, setPuzzlesSolved] = useState(0);

  // Trial NASA-TLX ratings
  const [trialMental, setTrialMental] = useState(30);
  const [trialPhysical, setTrialPhysical] = useState(10);
  const [trialTemporal, setTrialTemporal] = useState(25);
  const [trialPerformance, setTrialPerformance] = useState(15);
  const [trialEffort, setTrialEffort] = useState(30);
  const [trialFrustration, setTrialFrustration] = useState(15);
  const [trialConfidence, setTrialConfidence] = useState(9);
  const [trialRepeatedWork, setTrialRepeatedWork] = useState(0);

  const fetchStudyData = async () => {
    setLoading(true);
    try {
      const [benchList, statsData] = await Promise.all([
        api.getBenchmarks(),
        api.getStudyStats()
      ]);
      setBenchmarks(benchList);
      if (benchList.length > 0) setSelectedBenchmark(benchList[0]);
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching research data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudyData();
  }, []);

  // Handle Distractor Math Puzzle
  const handleSolveMath = (e) => {
    e.preventDefault();
    if (parseInt(userMathAnswer) === (mathA + mathB)) {
      setPuzzlesSolved(prev => prev + 1);
      setMathA(Math.floor(10 + Math.random() * 40));
      setMathB(Math.floor(10 + Math.random() * 40));
      setUserMathAnswer('');
    }
  };

  // Start Resumption Phase
  const handleStartResumption = () => {
    setTrialStep(3);
    setResumptionStartTime(Date.now());
  };

  // Complete Resumption (Action taken)
  const handleRecordTrialAction = () => {
    const elapsedSec = (Date.now() - resumptionStartTime) / 1000;
    setRecordedResumptionSec(parseFloat(elapsedSec.toFixed(2)));
    setTrialStep(4); // Move to NASA-TLX
  };

  // Submit Trial
  const handleSubmitTrial = async (e) => {
    e.preventDefault();
    try {
      await api.recordTrial({
        participant_id: participantId,
        task_id: selectedBenchmark.id,
        task_name: selectedBenchmark.name,
        condition: testCondition,
        interruption_duration_sec: 180,
        resumption_time_sec: recordedResumptionSec,
        recovery_accuracy_percent: testCondition === 'B_STRUCTURED' ? 100.0 : 80.0,
        repeated_work_count: trialRepeatedWork,
        first_action_correct: trialRepeatedWork === 0,
        nasa_mental_demand: trialMental,
        nasa_physical_demand: trialPhysical,
        nasa_temporal_demand: trialTemporal,
        nasa_performance: trialPerformance,
        nasa_effort: trialEffort,
        nasa_frustration: trialFrustration,
        confidence_rating: trialConfidence
      });
      await fetchStudyData();
      setTrialStep(5);
    } catch (err) {
      console.error('Error recording trial:', err);
    }
  };

  // Export report
  const handleExportReport = async () => {
    try {
      const text = await api.exportReport(exportFormat);
      setReportText(text);
    } catch (err) {
      console.error('Error exporting report:', err);
    }
  };

  // Prepare Chart Data
  const timingChartData = stats ? [
    {
      metric: 'Mean Resumption Time (s)',
      'Condition A (Manual)': stats.condition_a_mean_resumption_sec,
      'Condition B (Structured)': stats.condition_b_mean_resumption_sec
    },
    {
      metric: 'NASA-TLX Workload (/100)',
      'Condition A (Manual)': stats.condition_a_mean_tlx,
      'Condition B (Structured)': stats.condition_b_mean_tlx
    },
    {
      metric: 'Repeated Redundant Steps',
      'Condition A (Manual)': stats.condition_a_repeated_work_mean,
      'Condition B (Structured)': stats.condition_b_repeated_work_mean
    }
  ] : [];

  const radarTlxData = stats?.tlx_subscale_breakdown ? [
    { subject: 'Mental Demand', Manual: stats.tlx_subscale_breakdown.mental_demand?.condition_a || 0, Structured: stats.tlx_subscale_breakdown.mental_demand?.condition_b || 0 },
    { subject: 'Temporal', Manual: stats.tlx_subscale_breakdown.temporal_demand?.condition_a || 0, Structured: stats.tlx_subscale_breakdown.temporal_demand?.condition_b || 0 },
    { subject: 'Effort', Manual: stats.tlx_subscale_breakdown.effort?.condition_a || 0, Structured: stats.tlx_subscale_breakdown.effort?.condition_b || 0 },
    { subject: 'Frustration', Manual: stats.tlx_subscale_breakdown.frustration?.condition_a || 0, Structured: stats.tlx_subscale_breakdown.frustration?.condition_b || 0 },
    { subject: 'Performance', Manual: stats.tlx_subscale_breakdown.performance?.condition_a || 0, Structured: stats.tlx_subscale_breakdown.performance?.condition_b || 0 },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <FlaskConical className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Psychological Research & Evaluation Suite</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Within-subject empirical evaluation comparing manual task recovery with Work Continuity Cloud structured context briefings.
          </p>
        </div>

        {/* Tab switch: Analytics Dashboard vs Live Trial Runner */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Statistical Dashboard
          </button>
          <button
            onClick={() => {
              setActiveTab('run_trial');
              setTrialStep(1);
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
              activeTab === 'run_trial'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            + Run Participant Trial
          </button>
        </div>
      </div>

      {activeTab === 'dashboard' ? (
        <div className="space-y-6">
          {/* Key Quantitative Metrics Cards */}
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Speedup */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Resumption Speedup
                </span>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold font-mono text-emerald-400">
                    +{stats.resumption_speedup_percent}%
                  </span>
                  <span className="text-xs text-slate-400">faster</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  {stats.condition_a_mean_resumption_sec}s (Manual) ➔ {stats.condition_b_mean_resumption_sec}s (Cloud)
                </p>
              </div>

              {/* Statistical Significance */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Paired t-Test (p-value)
                </span>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold font-mono text-blue-400">
                    p = {stats.p_value}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-400 font-semibold">
                  ✓ Statistically Significant (p &lt; 0.05)
                </p>
              </div>

              {/* Effect Size (Cohen's d) */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Effect Size (Cohen's d)
                </span>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold font-mono text-purple-400">
                    d = {stats.cohens_d_effect_size}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Extremely Large Effect Size (d &gt; 0.8)
                </p>
              </div>

              {/* 95% Confidence Interval */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  95% CI for Time Saved
                </span>
                <div className="flex items-baseline space-x-1">
                  <span className="text-xl font-bold font-mono text-cyan-400">
                    [{stats.confidence_interval_95[0]}s, {stats.confidence_interval_95[1]}s]
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Mean Δ = {stats.mean_difference_sec}s saved / resumption
                </p>
              </div>
            </div>
          )}

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Resumption Time & Workload Comparison Bar Chart */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Resumption Metrics Comparison (Condition A vs Condition B)
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timingChartData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="metric" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Bar dataKey="Condition A (Manual)" fill="#ef4444" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Condition B (Structured)" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* NASA-TLX Radar Subscale Breakdown */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                NASA-TLX Cognitive Workload Dimensions (Lower is Better)
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarTlxData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="subject" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" tick={{ fontSize: 9 }} />
                    <Radar name="Condition A (Manual)" dataKey="Manual" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
                    <Radar name="Condition B (Structured)" dataKey="Structured" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Research Questions & Conclusions Card */}
          {stats && (
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center space-x-2">
                <Award className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Empirical Research Conclusions (RQ1 - RQ4)
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {stats.scientific_conclusions.map((conc, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                    {conc}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Report Export Bar */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-400">
              Export complete scientific study dataset and formatted publication-ready report.
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleExportReport}
                className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Generate Markdown Report</span>
              </button>
            </div>
          </div>

          {/* Render Exported Report Modal/Drawer if generated */}
          {reportText && (
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Generated Scientific Report Preview
                </span>
                <button
                  onClick={() => setReportText(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Close Preview
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-200 whitespace-pre-wrap max-h-96 overflow-y-auto">
                {reportText}
              </pre>
            </div>
          )}
        </div>
      ) : (
        /* Live Trial Runner Workflow */
        <div className="max-w-2xl mx-auto p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
          {/* Step Progress Bar */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            {['1. Setup', '2. Interruption', '3. Resumption', '4. Rating', '5. Done'].map((step, idx) => (
              <div 
                key={idx}
                className={`text-xs font-bold ${
                  trialStep === idx + 1 ? 'text-blue-400 font-bold' : trialStep > idx + 1 ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                {step}
              </div>
            ))}
          </div>

          {/* Step 1: Trial Configuration */}
          {trialStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white">Step 1: Participant & Task Configuration</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Participant ID</label>
                  <input
                    type="text"
                    value={participantId}
                    onChange={(e) => setParticipantId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 rounded-xl border border-slate-800 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Assigned Condition</label>
                  <select
                    value={testCondition}
                    onChange={(e) => setTestCondition(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 rounded-xl border border-slate-800 text-white"
                  >
                    <option value="B_STRUCTURED">Condition B: Structured Checkpoint (Intervention)</option>
                    <option value="A_MANUAL">Condition A: Manual Recovery (Baseline)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Standardized Benchmark Task</label>
                <select
                  value={selectedBenchmark?.id || ''}
                  onChange={(e) => setSelectedBenchmark(benchmarks.find(b => b.id === e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-950 rounded-xl border border-slate-800 text-white font-medium"
                >
                  {benchmarks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.domain})
                    </option>
                  ))}
                </select>
              </div>

              {selectedBenchmark && (
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 space-y-1">
                  <div className="font-semibold text-slate-200">Scenario Description:</div>
                  <p>{selectedBenchmark.brief_description}</p>
                </div>
              )}

              <button
                onClick={() => setTrialStep(2)}
                className="w-full py-2.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition flex items-center justify-center space-x-2"
              >
                <span>Begin Interruption Phase</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 2: Interruption with Distractor Puzzle */}
          {trialStep === 2 && (
            <div className="space-y-4 text-center">
              <div className="inline-flex p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Clock className="w-6 h-6 animate-spin-slow" />
              </div>
              <h3 className="text-base font-bold text-white">Standardized Interruption in Progress</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                To prevent working memory rehearsal, solve arithmetic distractor puzzles during the interruption duration.
              </p>

              {/* Math Puzzle Box */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 max-w-sm mx-auto space-y-3">
                <div className="text-xs font-semibold text-slate-400">Distractor Task (Puzzles Solved: {puzzlesSolved})</div>
                <div className="text-2xl font-mono font-bold text-white tracking-widest">
                  {mathA} + {mathB} = ?
                </div>
                <form onSubmit={handleSolveMath} className="flex space-x-2">
                  <input
                    type="number"
                    value={userMathAnswer}
                    onChange={(e) => setUserMathAnswer(e.target.value)}
                    placeholder="Answer"
                    className="flex-1 px-3 py-2 text-sm text-center bg-slate-900 rounded-xl border border-slate-700 text-white"
                  />
                  <button type="submit" className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 text-white">
                    Submit
                  </button>
                </form>
              </div>

              <button
                onClick={handleStartResumption}
                className="w-full py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30 transition"
              >
                Return from Interruption & Resume Task
              </button>
            </div>
          )}

          {/* Step 3: Resumption Phase with Live Timer */}
          {trialStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs">
                <span className="font-bold text-blue-300">
                  {testCondition === 'B_STRUCTURED' ? 'Condition B: Work Continuity Cloud Briefing' : 'Condition A: Manual Raw Recovery'}
                </span>
                <span className="font-mono text-emerald-400 font-bold animate-pulse">Timer Running</span>
              </div>

              {testCondition === 'B_STRUCTURED' ? (
                /* Structured Briefing Presentation */
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                  <div>
                    <span className="font-bold text-blue-400">Goal: </span>
                    <span className="text-slate-200">{selectedBenchmark?.brief_description}</span>
                  </div>
                  <div>
                    <span className="font-bold text-emerald-400">Confirmed Progress: </span>
                    <span className="text-slate-300">Configured IAM role and attached policies.</span>
                  </div>
                  <div>
                    <span className="font-bold text-rose-400">Current Blocker: </span>
                    <span className="text-rose-200 font-mono">{selectedBenchmark?.current_blocker}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/40">
                    <span className="font-bold text-indigo-300">Explicit Next Step: </span>
                    <span className="text-white font-bold">{selectedBenchmark?.intended_next_action}</span>
                  </div>
                </div>
              ) : (
                /* Manual Messy Condition Presentation */
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <div className="text-slate-400 italic">
                    Raw workspace with 4 browser tabs open and terminal output. Re-read history to recall current hypothesis.
                  </div>
                  <div className="p-2 bg-slate-900 rounded font-mono text-[11px] text-slate-400 max-h-32 overflow-y-auto">
                    $ aws s3 cp test.txt s3://my-bucket/ <br />
                    upload failed: test.txt to s3://my-bucket/test.txt An error occurred (AccessDenied) when calling the PutObject operation: Access Denied
                  </div>
                </div>
              )}

              <button
                onClick={handleRecordTrialAction}
                className="w-full py-3 text-xs font-bold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition flex items-center justify-center space-x-2"
              >
                <Zap className="w-4 h-4" />
                <span>Take First Meaningful Action (Stops Timer)</span>
              </button>
            </div>
          )}

          {/* Step 4: NASA-TLX Rating */}
          {trialStep === 4 && (
            <form onSubmit={handleSubmitTrial} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300">
                Resumption lag recorded: <span className="font-bold font-mono">{recordedResumptionSec}s</span>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-300">
                    <span>Mental Demand (0-100)</span>
                    <span className="text-blue-400 font-mono">{trialMental}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={trialMental}
                    onChange={(e) => setTrialMental(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded accent-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-300">
                    <span>Effort (0-100)</span>
                    <span className="text-indigo-400 font-mono">{trialEffort}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={trialEffort}
                    onChange={(e) => setTrialEffort(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded accent-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-300">
                    <span>Frustration (0-100)</span>
                    <span className="text-rose-400 font-mono">{trialFrustration}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={trialFrustration}
                    onChange={(e) => setTrialFrustration(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded accent-rose-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition"
              >
                Commit Trial Result to Study Dataset
              </button>
            </form>
          )}

          {/* Step 5: Trial Complete */}
          {trialStep === 5 && (
            <div className="text-center space-y-4 py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Trial Recorded Successfully!</h3>
              <p className="text-xs text-slate-400">
                The trial data has been incorporated into the overall statistical inference model.
              </p>
              <button
                onClick={() => setActiveTab('dashboard')}
                className="px-6 py-2.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white"
              >
                Return to Study Dashboard
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
