import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { 
  Cloud, 
  Smartphone, 
  Laptop, 
  Tablet, 
  Monitor, 
  Coffee, 
  GraduationCap, 
  Shuffle, 
  Sparkles, 
  ChevronDown, 
  ShieldCheck, 
  Clock, 
  Plus, 
  LogOut,
  Zap,
  CheckCircle2
} from 'lucide-react';

export default function Navbar() {
  const { user, devices, currentDevice, switchActiveDevice, logout } = useAuth();
  const { activeTask, simulateInterruption, setIsQuickCaptureOpen } = useTasks();
  
  const [deviceDropdownOpen, setDeviceDropdownOpen] = useState(false);
  const [interruptionDropdownOpen, setInterruptionDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const getDeviceIcon = (type) => {
    switch (type) {
      case 'desktop': return <Monitor className="w-4 h-4 text-cyan-400" />;
      case 'tablet': return <Tablet className="w-4 h-4 text-emerald-400" />;
      case 'mobile': return <Smartphone className="w-4 h-4 text-amber-400" />;
      default: return <Laptop className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Brand Logo */}
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/20">
            <Cloud className="w-6 h-6 text-white" />
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-base tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-300">
                Work Continuity Cloud
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                v1.0 • AWS Cloud
              </span>
            </div>
            <p className="text-xs text-slate-400">Context Preservation & Resumption Engine</p>
          </div>
        </div>

        {/* Active Task Context Pill */}
        {activeTask && (
          <div className="hidden lg:flex items-center space-x-2.5 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs text-slate-400 font-medium">Active Workspace:</span>
            <span className="text-xs font-semibold text-slate-200 max-w-xs truncate">
              {activeTask.title}
            </span>
            <span className="px-2 py-0.5 text-[10px] rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {activeTask.category}
            </span>
          </div>
        )}

        {/* Right Actions: Quick Capture, Interruption Simulator, Device Switcher, Profile */}
        <div className="flex items-center space-x-3">
          {/* Quick Capture Simulation Button */}
          <button
            onClick={() => setIsQuickCaptureOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30 transition shadow-sm"
            title="Simulate Browser Extension / CLI Instant Capture"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Quick Capture</span>
          </button>

          {/* Simulate Interruption Dropdown */}
          <div className="relative">
            <button
              onClick={() => setInterruptionDropdownOpen(!interruptionDropdownOpen)}
              className="flex items-center space-x-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-md shadow-orange-900/30 transition"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Simulate Interruption</span>
              <ChevronDown className="w-3 h-3 ml-0.5 opacity-80" />
            </button>

            {interruptionDropdownOpen && (
              <div 
                className="absolute right-0 mt-2 w-72 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-2 z-50 text-xs"
                onMouseLeave={() => setInterruptionDropdownOpen(false)}
              >
                <div className="px-3 py-1.5 border-b border-slate-800 font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                  Select Interruption Scenario
                </div>
                
                <button
                  onClick={() => {
                    setInterruptionDropdownOpen(false);
                    simulateInterruption('short_break', 300);
                  }}
                  className="w-full flex items-start space-x-3 px-3 py-2.5 hover:bg-slate-800/70 transition text-left text-slate-200"
                >
                  <Coffee className="w-4 h-4 text-amber-400 mt-0.5" />
                  <div>
                    <div className="font-semibold text-slate-100">Coffee Break (5 mins)</div>
                    <div className="text-[11px] text-slate-400">Short break, working memory decay test</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setInterruptionDropdownOpen(false);
                    simulateInterruption('long_break', 2700);
                  }}
                  className="w-full flex items-start space-x-3 px-3 py-2.5 hover:bg-slate-800/70 transition text-left text-slate-200"
                >
                  <GraduationCap className="w-4 h-4 text-blue-400 mt-0.5" />
                  <div>
                    <div className="font-semibold text-slate-100">Left for Class (45 mins)</div>
                    <div className="text-[11px] text-slate-400">Long duration, high contextual disruption</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setInterruptionDropdownOpen(false);
                    simulateInterruption('task_switch', 900);
                  }}
                  className="w-full flex items-start space-x-3 px-3 py-2.5 hover:bg-slate-800/70 transition text-left text-slate-200"
                >
                  <Shuffle className="w-4 h-4 text-purple-400 mt-0.5" />
                  <div>
                    <div className="font-semibold text-slate-100">Urgent Task Switch (15 mins)</div>
                    <div className="text-[11px] text-slate-400">Cognitive interference from competing task</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Active Device Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDeviceDropdownOpen(!deviceDropdownOpen)}
              className="flex items-center space-x-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition"
            >
              {currentDevice && getDeviceIcon(currentDevice.device_type)}
              <span className="hidden md:inline max-w-[110px] truncate">
                {currentDevice?.device_name || 'Device'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {deviceDropdownOpen && (
              <div 
                className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-2 z-50 text-xs"
                onMouseLeave={() => setDeviceDropdownOpen(false)}
              >
                <div className="px-3 py-1.5 border-b border-slate-800 font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                  Connected Devices (Cloud Sync)
                </div>
                {devices.map((dev) => (
                  <button
                    key={dev.id}
                    onClick={() => {
                      switchActiveDevice(dev.id);
                      setDeviceDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 hover:bg-slate-800 transition text-left ${dev.is_current ? 'bg-blue-950/40 text-blue-300 font-semibold' : 'text-slate-300'}`}
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      {getDeviceIcon(dev.device_type)}
                      <span className="truncate">{dev.device_name}</span>
                    </div>
                    {dev.is_current && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center space-x-2 p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                {user?.username ? user.username.substring(0, 2).toUpperCase() : 'CE'}
              </div>
            </button>

            {userDropdownOpen && (
              <div 
                className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-2 z-50 text-xs"
                onMouseLeave={() => setUserDropdownOpen(false)}
              >
                <div className="px-3 py-2 border-b border-slate-800">
                  <div className="font-semibold text-slate-100 truncate">{user?.full_name || 'Cloud Researcher'}</div>
                  <div className="text-[11px] text-slate-400 truncate">{user?.email || 'engineer@cloudcontinuity.io'}</div>
                  <div className="mt-1 flex items-center space-x-1.5 text-[10px] text-emerald-400">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Tenant Isolated (JWT / AES-256)</span>
                  </div>
                </div>

                <div className="px-3 py-2 border-b border-slate-800 text-[11px] text-slate-400 space-y-1">
                  <div>Data Retention: <span className="text-slate-200">{user?.settings?.retention_days || 90} days</span></div>
                  <div>Capture Mode: <span className="text-slate-200">{user?.settings?.capture_mode || 'Explicit'}</span></div>
                </div>

                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-rose-400 hover:bg-rose-950/40 transition text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
