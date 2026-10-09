import React from 'react';
import { useTasks } from '../context/TaskContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export default function NotificationToast() {
  const { toastMessage } = useTasks();
  if (!toastMessage) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400" />,
    info: <Info className="w-5 h-5 text-blue-400" />
  };

  const borders = {
    success: 'border-emerald-500/40 bg-emerald-950/80',
    error: 'border-rose-500/40 bg-rose-950/80',
    warning: 'border-amber-500/40 bg-amber-950/80',
    info: 'border-blue-500/40 bg-slate-900/90'
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl transition-all duration-300 animate-slide-up text-sm font-medium text-slate-100 max-w-md ${borders[toastMessage.type] || borders.info}">
      {icons[toastMessage.type] || icons.info}
      <span className="flex-1">{toastMessage.message}</span>
    </div>
  );
}
