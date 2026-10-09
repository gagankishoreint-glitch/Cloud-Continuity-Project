import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { 
  ShieldCheck, 
  Download, 
  Trash2, 
  Lock, 
  EyeOff, 
  Clock, 
  CheckCircle2, 
  FileText, 
  AlertTriangle,
  RefreshCw,
  Database
} from 'lucide-react';

export default function PrivacyCenter() {
  const { user } = useAuth();
  const { showToast } = useTasks();

  const [auditLogs, setAuditLogs] = useState([]);
  const [retentionDays, setRetentionDays] = useState(user?.settings?.retention_days || 90);
  const [autoMask, setAutoMask] = useState(user?.settings?.auto_mask_tokens ?? true);
  const [exportLoading, setExportLoading] = useState(false);
  const [lambdaLoading, setLambdaLoading] = useState(false);
  const [lambdaResult, setLambdaResult] = useState(null);

  const fetchAuditLogs = async () => {
    try {
      const logs = await api.getAuditLogs();
      setAuditLogs(logs);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const handleExportData = async () => {
    setExportLoading(true);
    try {
      const exportData = await api.exportGDPRData();
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `work-continuity-gdpr-export-${user?.username || 'user'}.json`;
      a.click();
      showToast('GDPR Data Archive downloaded with SHA-256 cryptographic proof!', 'success');
      await fetchAuditLogs();
    } catch (err) {
      showToast(`Export failed: ${err.message}`, 'error');
    } finally {
      setExportLoading(false);
    }
  };

  const handleUpdateSettings = async () => {
    try {
      await api.updatePrivacySettings({
        retention_days: retentionDays,
        auto_mask_tokens: autoMask,
        enable_telemetry: true,
        capture_mode: 'explicit',
        allow_cross_device_push: true
      });
      showToast('Privacy and retention preferences updated.', 'success');
      await fetchAuditLogs();
    } catch (err) {
      showToast(`Error updating settings: ${err.message}`, 'error');
    }
  };

  const handleTriggerRetentionLambda = async () => {
    setLambdaLoading(true);
    try {
      const res = await api.triggerRetentionSweep(retentionDays);
      setLambdaResult(res);
      showToast('AWS Lambda retention sweep executed successfully!', 'success');
      await fetchAuditLogs();
    } catch (err) {
      showToast(`Lambda execution error: ${err.message}`, 'error');
    } finally {
      setLambdaLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Privacy, Ethics & Data Governance Center</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Privacy-by-design architecture: Explicit capture, strict multi-tenant authorization, transparent retention, and GDPR Right to Portability.
          </p>
        </div>

        <button
          onClick={handleExportData}
          disabled={exportLoading}
          className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-indigo-600/20 transition shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>{exportLoading ? 'Generating Archive...' : 'Download GDPR Archive'}</span>
        </button>
      </div>

      {/* Ethical Architecture Guarantees */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
            <EyeOff className="w-4 h-4" />
            <span>Explicit Capture Only</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            No continuous background keystroke logging or surveillance. Context is only captured when explicitly saved or verified by the engineer.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center space-x-2 text-blue-400 font-bold text-xs">
            <Lock className="w-4 h-4" />
            <span>Server-Side Isolation</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            JWT claims enforce strict tenant boundaries at the database query level. Checkpoints are encrypted at rest with AWS KMS Customer Managed Keys.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center space-x-2 text-purple-400 font-bold text-xs">
            <Clock className="w-4 h-4" />
            <span>Automated Lifecycle</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Serverless Lambda workers enforce user-defined data retention schedules, transitioning cold snapshots to S3 Glacier before permanent erasure.
          </p>
        </div>
      </div>

      {/* Retention Settings & Lambda Trigger */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Retention Policy Controls */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Data Retention & Masking Policies
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Context Snapshot Retention Duration
              </label>
              <select
                value={retentionDays}
                onChange={(e) => setRetentionDays(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 text-white"
              >
                <option value="30">30 Days (High Privacy)</option>
                <option value="60">60 Days (Standard Lab)</option>
                <option value="90">90 Days (Default Academic Semester)</option>
                <option value="180">180 Days (Long-term Research)</option>
              </select>
            </div>

            <label className="flex items-center space-x-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={autoMask}
                onChange={(e) => setAutoMask(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700"
              />
              <span className="text-slate-300">
                Automatically mask AWS Access Keys, API tokens, and passwords in scratchpad
              </span>
            </label>

            <button
              onClick={handleUpdateSettings}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition"
            >
              Save Retention Policy
            </button>
          </div>
        </div>

        {/* AWS Lambda Scheduled Worker Simulation */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              AWS Lambda Retention Cleanup Execution
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Simulate the scheduled EventBridge trigger that executes the serverless retention sweep function.
          </p>

          <button
            onClick={handleTriggerRetentionLambda}
            disabled={lambdaLoading}
            className="flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/20 transition"
          >
            {lambdaLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            <span>Execute Lambda Retention Worker</span>
          </button>

          {lambdaResult && (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 space-y-1">
              <div className="text-emerald-400 font-bold">✓ Execution Status: {lambdaResult.execution_status}</div>
              <div>Duration: {lambdaResult.duration_ms} ms (Billed: {lambdaResult.billed_duration_ms} ms)</div>
              <div>Memory: {lambdaResult.memory_used_mb} MB</div>
              <div className="text-slate-400">{lambdaResult.message}</div>
            </div>
          )}
        </div>
      </div>

      {/* Audit Trail Log */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Cryptographic Privacy & Access Audit Trail
          </h3>
          <span className="text-[10px] text-slate-500">{auditLogs.length} immutable records</span>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {auditLogs.length === 0 ? (
            <p className="text-xs text-slate-500 py-3 text-center">No audit logs recorded yet.</p>
          ) : (
            auditLogs.map((log) => (
              <div 
                key={log.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs font-mono"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-emerald-400 font-bold">{log.action}</span>
                  <span className="text-slate-400 text-[11px]">{log.resource_type}</span>
                </div>
                <div className="flex items-center space-x-3 text-slate-500 text-[10px]">
                  <span>IP: {log.actor_ip}</span>
                  <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
