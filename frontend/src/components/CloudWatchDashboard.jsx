import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { 
  Activity, 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  Server, 
  Clock, 
  ShieldCheck, 
  Cpu,
  RefreshCw
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

export default function CloudWatchDashboard() {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);

  // Synthetic Load Tester State
  const [concurrency, setConcurrency] = useState(100);
  const [iterations, setIterations] = useState(5);
  const [loadTesting, setLoadTesting] = useState(false);
  const [loadResult, setLoadResult] = useState(null);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const data = await api.getCloudWatchMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Error fetching CloudWatch metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleRunLoadTest = async () => {
    setLoadTesting(true);
    try {
      const res = await api.runSyntheticLoad(concurrency, iterations);
      setLoadResult(res);
      await fetchMetrics();
    } catch (err) {
      console.error('Error running load test:', err);
    } finally {
      setLoadTesting(false);
    }
  };

  // Group metrics by name
  const resumptionMetrics = metrics.filter(m => m.metric_name === 'ResumptionLag_MS');
  const latencyMetrics = metrics.filter(m => m.metric_name === 'CheckpointSaveLatency_MS' || m.metric_name === 'SyntheticSaveLatency_MS');

  const chartData = resumptionMetrics.map((rm, idx) => ({
    time: rm.time_label,
    'Resumption Lag (s)': parseFloat((rm.value / 1000).toFixed(1)),
    'API Latency (ms)': latencyMetrics[idx] ? parseFloat(latencyMetrics[idx].value.toFixed(1)) : 45.0
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">Amazon CloudWatch Telemetry & Load Tester</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Observability pipeline monitoring task resumption lag SLAs, checkpoint mutation throughput, and synthetic stress response.
          </p>
        </div>

        <button
          onClick={fetchMetrics}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* CloudWatch Alarms Status Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Alarm: High Resumption Lag</span>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              OK
            </span>
          </div>
          <div className="text-xs text-slate-300">
            Threshold: &gt; 60s for 3 data points (Current: 14.2s)
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Alarm: API 5XX Error Rate</span>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              OK
            </span>
          </div>
          <div className="text-xs text-slate-300">
            Threshold: &gt; 1% errors in 5 min (Current: 0.0%)
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">EC2 Auto Scaling Group</span>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Healthy (2/2)
            </span>
          </div>
          <div className="text-xs text-slate-300">
            Target Tracking: Average CPU &lt; 70%
          </div>
        </div>
      </div>

      {/* Real-time Telemetry Line Chart */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
          CloudWatch Custom Metrics: Resumption Lag (s) & API Save Latency (ms)
        </h3>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Line type="monotone" dataKey="Resumption Lag (s)" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="API Latency (ms)" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Synthetic Load Generator */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center space-x-2">
          <Cpu className="w-5 h-5 text-indigo-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            Synthetic Load & Stress Testing Simulator
          </h3>
        </div>
        <p className="text-xs text-slate-400">
          Generate concurrent context checkpoint requests to benchmark API elasticity and measure latency percentiles.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Concurrent Clients</label>
            <select
              value={concurrency}
              onChange={(e) => setConcurrency(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 text-white"
            >
              <option value="50">50 Concurrent Clients</option>
              <option value="100">100 Concurrent Clients</option>
              <option value="250">250 Concurrent Clients</option>
              <option value="500">500 Concurrent Clients</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Iterations / Client</label>
            <select
              value={iterations}
              onChange={(e) => setIterations(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 text-white"
            >
              <option value="3">3 Iterations (Quick Test)</option>
              <option value="5">5 Iterations (Standard Test)</option>
              <option value="10">10 Iterations (Stress Test)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleRunLoadTest}
              disabled={loadTesting}
              className="w-full py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 transition flex items-center justify-center space-x-2"
            >
              {loadTesting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Executing Load Test...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Run Synthetic Load Test</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Load Test Results Banner */}
        {loadResult && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 mt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400">
                ✓ Test Completed: {loadResult.total_requests} Requests Executed
              </span>
              <span className="text-xs font-mono text-purple-400 font-bold">
                Throughput: {loadResult.throughput_tps} TPS
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500">Average Latency</span>
                <div className="font-bold text-white font-mono">{loadResult.average_latency_ms} ms</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500">p50 Latency</span>
                <div className="font-bold text-white font-mono">{loadResult.p50_latency_ms} ms</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500">p95 Latency</span>
                <div className="font-bold text-white font-mono">{loadResult.p95_latency_ms} ms</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500">Error Rate</span>
                <div className="font-bold text-emerald-400 font-mono">{loadResult.error_rate_pct}%</div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              <span className="font-bold text-blue-400">Auto Scaling Evaluator: </span>
              {loadResult.aws_auto_scaling_trigger}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
