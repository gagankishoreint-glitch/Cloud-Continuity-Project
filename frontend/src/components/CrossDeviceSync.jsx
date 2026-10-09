import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { 
  Smartphone, 
  Laptop, 
  Tablet, 
  Monitor, 
  Cloud, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Plus, 
  RefreshCw,
  Zap,
  Radio
} from 'lucide-react';

export default function CrossDeviceSync() {
  const { devices, currentDevice, switchActiveDevice, registerDevice } = useAuth();
  const { activeTask, activeCheckpoint, showToast } = useTasks();

  const [targetDevice, setTargetDevice] = useState(null);
  const [handoverLoading, setHandoverLoading] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceType, setNewDeviceType] = useState('laptop');
  const [showAddModal, setShowAddModal] = useState(false);

  const getDeviceIcon = (type) => {
    switch (type) {
      case 'desktop': return <Monitor className="w-5 h-5 text-cyan-400" />;
      case 'tablet': return <Tablet className="w-5 h-5 text-emerald-400" />;
      case 'mobile': return <Smartphone className="w-5 h-5 text-amber-400" />;
      default: return <Laptop className="w-5 h-5 text-blue-400" />;
    }
  };

  const handleHandover = async (targetId) => {
    setHandoverLoading(true);
    try {
      await switchActiveDevice(targetId);
      const target = devices.find(d => d.id === targetId);
      showToast(`Context seamlessly handed over to "${target?.device_name}". Checkpoint v${activeCheckpoint?.version_number || 1} synced!`, 'success');
    } catch (err) {
      showToast(`Handover failed: ${err.message}`, 'error');
    } finally {
      setHandoverLoading(false);
    }
  };

  const handleAddDevice = async (e) => {
    e.preventDefault();
    if (!newDeviceName.trim()) return;
    try {
      await registerDevice({
        device_name: newDeviceName.trim(),
        device_type: newDeviceType
      });
      setShowAddModal(false);
      setNewDeviceName('');
      showToast('New device paired and encrypted in cloud cluster.', 'success');
    } catch (err) {
      showToast(`Failed to add device: ${err.message}`, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Cloud className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">Cross-Device Synchronization & Handover Hub</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Synchronize digital task state across machines with end-to-end user isolation and seamless context handoff.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 border border-blue-500/30 transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Pair New Device</span>
        </button>
      </div>

      {/* Live Handover Simulation Panel */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 border border-indigo-500/30 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Live Task Context Handover Simulator
            </span>
          </div>
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Real-Time Sync Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          {/* Current Device Box */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-blue-500/40 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
              Source Device (Active)
            </div>
            <div className="flex items-center space-x-3">
              {currentDevice && getDeviceIcon(currentDevice.device_type)}
              <div>
                <div className="text-xs font-bold text-white truncate">{currentDevice?.device_name}</div>
                <div className="text-[10px] text-slate-400">{currentDevice?.ip_address}</div>
              </div>
            </div>
            <div className="text-[11px] text-slate-300 pt-2 border-t border-slate-800">
              Active Task: <span className="font-semibold text-white">{activeTask?.title || 'None'}</span>
            </div>
          </div>

          {/* Sync Transfer Arrow */}
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="flex items-center space-x-2 text-indigo-400">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
              <ArrowRight className="w-6 h-6 animate-pulse" />
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Payload: Checkpoint v{activeCheckpoint?.version_number || 1} (KMS Encrypted)
            </span>
          </div>

          {/* Target Device Selection */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
              Target Device (Resume Here)
            </div>
            <div className="space-y-2">
              {devices.filter(d => !d.is_current).map((d) => (
                <button
                  key={d.id}
                  onClick={() => handleHandover(d.id)}
                  disabled={handoverLoading}
                  className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 transition text-left"
                >
                  <div className="flex items-center space-x-2 truncate">
                    {getDeviceIcon(d.device_type)}
                    <span className="text-xs font-semibold text-slate-200 truncate">{d.device_name}</span>
                  </div>
                  <span className="text-[10px] text-indigo-400 font-bold shrink-0">Handoff ➔</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Paired Devices Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
          Registered Device Fleet
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {devices.map((dev) => (
            <div 
              key={dev.id}
              className={`p-5 rounded-2xl border transition space-y-3 ${
                dev.is_current 
                  ? 'bg-slate-900 border-blue-500/50 shadow-lg shadow-blue-500/10' 
                  : 'bg-slate-900/70 border-slate-800/90'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  {getDeviceIcon(dev.device_type)}
                  <span className="text-xs font-bold text-white truncate">{dev.device_name}</span>
                </div>
                {dev.is_current ? (
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Current
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-slate-800 text-slate-400">
                    Standby
                  </span>
                )}
              </div>

              <div className="text-[11px] text-slate-400 space-y-1 font-mono">
                <div>IP: {dev.ip_address}</div>
                <div>Last Active: {new Date(dev.last_active_at).toLocaleTimeString()}</div>
                <div>Sync Status: <span className="text-emerald-400 font-semibold">{dev.sync_status}</span></div>
              </div>

              {!dev.is_current && (
                <button
                  onClick={() => switchActiveDevice(dev.id)}
                  className="w-full mt-2 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                >
                  Set as Active Device
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Pair Device Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Pair New Device to Workspace</h3>

            <form onSubmit={handleAddDevice} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Device Name</label>
                <input
                  type="text"
                  required
                  value={newDeviceName}
                  onChange={(e) => setNewDeviceName(e.target.value)}
                  placeholder="e.g. Dell XPS Ubuntu Lab"
                  className="w-full px-3.5 py-2 text-xs text-slate-100 bg-slate-950 rounded-xl border border-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Device Type</label>
                <select
                  value={newDeviceType}
                  onChange={(e) => setNewDeviceType(e.target.value)}
                  className="w-full px-3 py-2 text-xs text-slate-300 bg-slate-950 rounded-xl border border-slate-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="laptop">Laptop</option>
                  <option value="desktop">Desktop Workstation</option>
                  <option value="tablet">Tablet</option>
                  <option value="mobile">Mobile Phone</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30"
                >
                  Pair Device
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
