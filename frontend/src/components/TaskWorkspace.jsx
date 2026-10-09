import React, { useState, useEffect } from 'react';
import { useTasks } from '../context/TaskContext';
import { 
  Plus, 
  Save, 
  Clock, 
  CheckCircle2, 
  Circle, 
  AlertOctagon, 
  ArrowRightCircle, 
  Link2, 
  FileText, 
  Terminal, 
  Code2, 
  Trash2, 
  Zap, 
  RotateCcw,
  Tag,
  History,
  Layers,
  Sparkles,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';

export default function TaskWorkspace({ onOpenBriefing, onOpenHistory }) {
  const { 
    tasks, 
    activeTask, 
    checkpoints, 
    activeCheckpoint, 
    switchTask, 
    createTask, 
    saveCheckpointSnapshot,
    simulateInterruption,
    showToast
  } = useTasks();

  // Local editable form state
  const [goal, setGoal] = useState('');
  const [confirmedProgress, setConfirmedProgress] = useState([]);
  const [newProgressText, setNewProgressText] = useState('');
  const [blocker, setBlocker] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [resources, setResources] = useState([]);
  const [newResTitle, setNewResTitle] = useState('');
  const [newResType, setNewResType] = useState('url');
  const [newResValue, setNewResValue] = useState('');
  const [newResNotes, setNewResNotes] = useState('');
  const [userNotes, setUserNotes] = useState('');
  
  // New Task Modal
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('AWS Cloud Lab');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const [newTaskGoal, setNewTaskGoal] = useState('');
  const [newTaskNextAction, setNewTaskNextAction] = useState('');

  const [copiedId, setCopiedId] = useState(null);

  // Sync active checkpoint into local state
  useEffect(() => {
    if (activeCheckpoint) {
      setGoal(activeCheckpoint.goal || '');
      setConfirmedProgress(activeCheckpoint.confirmed_progress || []);
      setBlocker(activeCheckpoint.blocker_or_question || '');
      setNextAction(activeCheckpoint.next_action || '');
      setResources(activeCheckpoint.resources || []);
      setUserNotes(activeCheckpoint.user_notes || '');
    } else if (activeTask) {
      setGoal(`Complete ${activeTask.title}`);
      setConfirmedProgress([{ id: 'p1', text: 'Task initialized', completed: true, provenance: 'user' }]);
      setBlocker('');
      setNextAction('Perform initial task configuration.');
      setResources([]);
      setUserNotes('');
    }
  }, [activeCheckpoint, activeTask]);

  // Handle milestone operations
  const toggleMilestone = (id) => {
    setConfirmedProgress(prev => prev.map(m => m.id === id ? { ...m, completed: !m.completed } : m));
  };

  const addMilestone = (e) => {
    e.preventDefault();
    if (!newProgressText.trim()) return;
    const newM = {
      id: `m-${Date.now()}`,
      text: newProgressText.trim(),
      completed: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      provenance: 'user'
    };
    setConfirmedProgress(prev => [...prev, newM]);
    setNewProgressText('');
  };

  const removeMilestone = (id) => {
    setConfirmedProgress(prev => prev.filter(m => m.id !== id));
  };

  // Handle resource operations
  const addResource = (e) => {
    e.preventDefault();
    if (!newResTitle.trim() || !newResValue.trim()) return;
    const newRes = {
      id: `r-${Date.now()}`,
      title: newResTitle.trim(),
      type: newResType,
      value: newResValue.trim(),
      notes: newResNotes.trim()
    };
    setResources(prev => [...prev, newRes]);
    setNewResTitle('');
    setNewResValue('');
    setNewResNotes('');
  };

  const removeResource = (id) => {
    setResources(prev => prev.filter(r => r.id !== id));
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Copied to clipboard!', 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Commit snapshot
  const handleCommitSnapshot = async () => {
    if (!goal.trim() || !nextAction.trim()) {
      showToast('Please specify both Goal and Explicit Next Action.', 'warning');
      return;
    }

    await saveCheckpointSnapshot({
      goal: goal.trim(),
      confirmed_progress: confirmedProgress,
      blocker_or_question: blocker.trim(),
      next_action: nextAction.trim(),
      resources: resources,
      user_notes: userNotes.trim()
    });
  };

  // Create new task
  const handleCreateTaskSubmit = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    await createTask({
      title: newTaskTitle.trim(),
      category: newTaskCategory,
      priority: newTaskPriority,
      initial_goal: newTaskGoal.trim() || undefined,
      initial_next_action: newTaskNextAction.trim() || undefined
    });
    setIsNewTaskModalOpen(false);
    setNewTaskTitle('');
    setNewTaskGoal('');
    setNewTaskNextAction('');
  };

  const getResourceIcon = (type) => {
    switch (type) {
      case 'url': return <Link2 className="w-4 h-4 text-blue-400" />;
      case 'doc': return <FileText className="w-4 h-4 text-emerald-400" />;
      case 'terminal': return <Terminal className="w-4 h-4 text-amber-400" />;
      case 'code': return <Code2 className="w-4 h-4 text-purple-400" />;
      default: return <FileText className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Task Switcher Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Tasks:
          </span>
          {tasks.map((t) => {
            const isSelected = activeTask?.id === t.id;
            return (
              <button
                key={t.id}
                onClick={() => switchTask(t.id)}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition whitespace-nowrap ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
                }`}
              >
                <span>{t.title}</span>
                {t.checkpoints_count > 0 && (
                  <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                    isSelected ? 'bg-blue-800 text-blue-100' : 'bg-slate-700 text-slate-300'
                  }`}>
                    v{t.checkpoints_count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setIsNewTaskModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Main Context Checkpoint Workspace */}
      {activeTask && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Goal, Progress, Blocker, Next Action */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header with Version & Commit Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 border border-slate-800">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-bold text-white tracking-tight">{activeTask.title}</h2>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                    v{activeCheckpoint?.version_number || 1}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Category: <span className="text-slate-200">{activeTask.category}</span> • Total Active Time: {Math.round(activeTask.total_time_spent_seconds / 60)} mins
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCommitSnapshot}
                  className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-indigo-600/25 transition"
                >
                  <Save className="w-4 h-4" />
                  <span>Commit Checkpoint v{(activeCheckpoint?.version_number || 1) + 1}</span>
                </button>

                <button
                  onClick={() => simulateInterruption('short_break', 300)}
                  className="flex items-center space-x-1 px-3 py-2 text-xs font-semibold rounded-xl bg-amber-600/20 text-amber-300 hover:bg-amber-600/30 border border-amber-500/30 transition"
                  title="Simulate interruption and trigger Recovery Briefing"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Resume Test</span>
                </button>
              </div>
            </div>

            {/* 1. Goal Card (Working Memory Anchor) */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm font-bold text-slate-200">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span>1. Task Objective & Goal</span>
                </div>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Prospective Memory Anchor
                </span>
              </div>
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                rows={2}
                placeholder="What is the precise goal of this task?"
                className="w-full px-3.5 py-2.5 text-xs text-slate-100 bg-slate-950/70 rounded-xl border border-slate-800 focus:outline-none focus:border-blue-500 transition resize-none font-medium leading-relaxed"
              />
            </div>

            {/* 2. Confirmed Progress Milestones */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm font-bold text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>2. Confirmed Progress Milestones</span>
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  {confirmedProgress.filter(m => m.completed).length}/{confirmedProgress.length} Completed
                </span>
              </div>

              {/* Progress List */}
              <div className="space-y-2">
                {confirmedProgress.map((m) => (
                  <div 
                    key={m.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition group"
                  >
                    <div 
                      onClick={() => toggleMilestone(m.id)}
                      className="flex items-center space-x-3 cursor-pointer flex-1"
                    >
                      {m.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-500 shrink-0" />
                      )}
                      <span className={`text-xs ${m.completed ? 'text-slate-200 line-through opacity-85' : 'text-slate-100 font-medium'}`}>
                        {m.text}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {m.timestamp && (
                        <span className="text-[10px] text-slate-500 flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{m.timestamp}</span>
                        </span>
                      )}
                      <button
                        onClick={() => removeMilestone(m.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Progress Input */}
              <form onSubmit={addMilestone} className="flex items-center space-x-2 pt-1">
                <input
                  type="text"
                  value={newProgressText}
                  onChange={(e) => setNewProgressText(e.target.value)}
                  placeholder="Add completed milestone (e.g. 'Created IAM role and verified STS token')..."
                  className="flex-1 px-3.5 py-2 text-xs text-slate-100 bg-slate-950/70 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 transition"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/30 transition shrink-0"
                >
                  Add Milestone
                </button>
              </form>
            </div>

            {/* 3. Blocker or Open Question */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm font-bold text-slate-200">
                  <AlertOctagon className="w-4 h-4 text-rose-400" />
                  <span>3. Active Blocker / Unresolved Question</span>
                </div>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  Cognitive Offloading
                </span>
              </div>
              <textarea
                value={blocker}
                onChange={(e) => setBlocker(e.target.value)}
                rows={2}
                placeholder="What error, question, or hypothesis are you currently troubleshooting? (e.g. 'AccessDenied on PutObject. Is it bucket policy or KMS key?')"
                className="w-full px-3.5 py-2.5 text-xs text-rose-200 bg-slate-950/70 rounded-xl border border-slate-800 focus:outline-none focus:border-rose-500 transition resize-none font-mono"
              />
            </div>

            {/* 4. Intended Next Action (Prospective Memory Anchor) */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-blue-950/30 border border-indigo-500/40 shadow-lg shadow-indigo-950/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm font-bold text-indigo-300">
                  <ArrowRightCircle className="w-4 h-4 text-indigo-400" />
                  <span>4. Explicit Next Action</span>
                </div>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Key Resumption Trigger
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Write the concrete, explicit step you plan to execute the second you return (e.g. "Open KMS key policy in AWS Console and check kms:GenerateDataKey").
              </p>
              <textarea
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                rows={2}
                placeholder="Specify the next command or code modification..."
                className="w-full px-3.5 py-2.5 text-xs text-white bg-slate-950/80 rounded-xl border border-indigo-500/50 focus:outline-none focus:border-indigo-400 transition resize-none font-medium leading-relaxed"
              />
            </div>
          </div>

          {/* Right Col: Saved Resources, Scratchpad, Provenance */}
          <div className="space-y-6">
            {/* Saved Resources & Bookmarks */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm font-bold text-slate-200">
                  <Link2 className="w-4 h-4 text-cyan-400" />
                  <span>Saved Task Resources</span>
                </div>
                <span className="text-xs text-slate-400 font-medium">{resources.length} pinned</span>
              </div>

              {/* Resource List */}
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {resources.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2 text-center">
                    No resources pinned yet. Add documentation, command snippets, or error references below.
                  </p>
                ) : (
                  resources.map((r) => (
                    <div 
                      key={r.id} 
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 truncate">
                          {getResourceIcon(r.type)}
                          <span className="text-xs font-semibold text-slate-200 truncate">{r.title}</span>
                        </div>
                        <div className="flex items-center space-x-1 shrink-0">
                          <button
                            onClick={() => handleCopy(r.value, r.id)}
                            className="p-1 text-slate-400 hover:text-white transition"
                            title="Copy value"
                          >
                            {copiedId === r.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          {r.type === 'url' && (
                            <a 
                              href={r.value.startsWith('http') ? r.value : `https://${r.value}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 text-slate-400 hover:text-blue-400 transition"
                              title="Open link"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => removeResource(r.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="text-[11px] font-mono text-slate-400 bg-slate-900/80 px-2 py-1 rounded truncate">
                        {r.value}
                      </div>

                      {r.notes && (
                        <p className="text-[10px] text-slate-500 italic">{r.notes}</p>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Add Resource Form */}
              <form onSubmit={addResource} className="pt-2 border-t border-slate-800/80 space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={newResTitle}
                    onChange={(e) => setNewResTitle(e.target.value)}
                    placeholder="Title (e.g. IAM Guide)"
                    className="col-span-2 px-2.5 py-1.5 text-xs text-slate-100 bg-slate-950/70 rounded-lg border border-slate-800 focus:outline-none focus:border-blue-500"
                  />
                  <select
                    value={newResType}
                    onChange={(e) => setNewResType(e.target.value)}
                    className="px-2 py-1.5 text-xs text-slate-300 bg-slate-950 rounded-lg border border-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="url">URL</option>
                    <option value="doc">Doc</option>
                    <option value="code">Code</option>
                    <option value="terminal">CLI</option>
                    <option value="note">Note</option>
                  </select>
                </div>

                <input
                  type="text"
                  value={newResValue}
                  onChange={(e) => setNewResValue(e.target.value)}
                  placeholder="URL link, command, or file path..."
                  className="w-full px-2.5 py-1.5 text-xs text-slate-100 bg-slate-950/70 rounded-lg border border-slate-800 focus:outline-none focus:border-blue-500 font-mono"
                />

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newResNotes}
                    onChange={(e) => setNewResNotes(e.target.value)}
                    placeholder="Optional note / section reference..."
                    className="flex-1 px-2.5 py-1.5 text-xs text-slate-100 bg-slate-950/70 rounded-lg border border-slate-800 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 border border-blue-500/30 transition shrink-0"
                  >
                    Pin
                  </button>
                </div>
              </form>
            </div>

            {/* User Notes & Scratchpad */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm font-bold text-slate-200">
                  <FileText className="w-4 h-4 text-purple-400" />
                  <span>Freeform Scratchpad</span>
                </div>
                <span className="text-[10px] text-slate-500">Auto-persisted</span>
              </div>
              <textarea
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                rows={4}
                placeholder="Quick notes, temporary IP addresses, draft IAM snippets..."
                className="w-full px-3 py-2 text-xs text-slate-300 bg-slate-950/70 rounded-xl border border-slate-800 focus:outline-none focus:border-purple-500 transition resize-none font-mono"
              />
            </div>

            {/* Quick Navigation Cards */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onOpenBriefing && onOpenBriefing()}
                className="flex flex-col items-start p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition text-left"
              >
                <RotateCcw className="w-4 h-4 text-blue-400 mb-1" />
                <span className="text-xs font-bold text-slate-200">Briefing Preview</span>
                <span className="text-[10px] text-slate-500">Inspect recovery view</span>
              </button>

              <button
                onClick={() => onOpenHistory && onOpenHistory()}
                className="flex flex-col items-start p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition text-left"
              >
                <History className="w-4 h-4 text-purple-400 mb-1" />
                <span className="text-xs font-bold text-slate-200">Version Diff</span>
                <span className="text-[10px] text-slate-500">{checkpoints.length} versions saved</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Task Modal */}
      {isNewTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Create New Task Workspace</h3>
            
            <form onSubmit={handleCreateTaskSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. AWS Lambda API Gateway Integration Lab"
                  className="w-full px-3.5 py-2 text-xs text-slate-100 bg-slate-950 rounded-xl border border-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={newTaskCategory}
                    onChange={(e) => setNewTaskCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs text-slate-300 bg-slate-950 rounded-xl border border-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="AWS Cloud Lab">AWS Cloud Lab</option>
                    <option value="Networking">Networking</option>
                    <option value="DevOps & CI/CD">DevOps & CI/CD</option>
                    <option value="Databases">Databases</option>
                    <option value="Research & Writing">Research & Writing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value)}
                    className="w-full px-3 py-2 text-xs text-slate-300 bg-slate-950 rounded-xl border border-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Initial Goal (Optional)</label>
                <input
                  type="text"
                  value={newTaskGoal}
                  onChange={(e) => setNewTaskGoal(e.target.value)}
                  placeholder="What is the objective of this task?"
                  className="w-full px-3.5 py-2 text-xs text-slate-100 bg-slate-950 rounded-xl border border-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Initial Next Action (Optional)</label>
                <input
                  type="text"
                  value={newTaskNextAction}
                  onChange={(e) => setNewTaskNextAction(e.target.value)}
                  placeholder="First concrete step..."
                  className="w-full px-3.5 py-2 text-xs text-slate-100 bg-slate-950 rounded-xl border border-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewTaskModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 transition"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
