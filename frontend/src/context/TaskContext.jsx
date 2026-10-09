import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { useAuth } from './AuthContext';

const TaskContext = createContext(null);

export function TaskProvider({ children }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [activeTask, setActiveTask] = useState(null);
  const [checkpoints, setCheckpoints] = useState([]);
  const [activeCheckpoint, setActiveCheckpoint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Recovery & Resumption state
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
  const [isNasaTlxModalOpen, setIsNasaTlxModalOpen] = useState(false);
  const [recoveryBriefing, setRecoveryBriefing] = useState(null);
  const [currentRecoverySession, setCurrentRecoverySession] = useState(null);
  const [interruptionScenario, setInterruptionScenario] = useState(null);
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);

  const showToast = (message, type = 'info') => {
    setToastMessage({ message, type, id: Date.now() });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Fetch all tasks
  const fetchTasks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await api.getTasks();
      setTasks(data);
      if (data.length > 0) {
        // Set first active or first task as activeTask
        const active = data.find(t => t.status === 'active') || data[0];
        setActiveTask(active);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch checkpoints for active task
  const fetchCheckpoints = useCallback(async (taskId) => {
    if (!taskId) return;
    try {
      const chkList = await api.getCheckpoints(taskId);
      setCheckpoints(chkList);
      if (chkList.length > 0) {
        setActiveCheckpoint(chkList[0]);
      } else {
        setActiveCheckpoint(null);
      }
    } catch (err) {
      console.error('Error fetching checkpoints:', err);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user, fetchTasks]);

  useEffect(() => {
    if (activeTask) {
      fetchCheckpoints(activeTask.id);
    }
  }, [activeTask, fetchCheckpoints]);

  // Switch Active Task
  const switchTask = async (taskId, reason = 'manual_switch') => {
    try {
      const switched = await api.switchTask({ target_task_id: taskId, reason });
      setActiveTask(switched);
      await fetchTasks();
      await fetchCheckpoints(switched.id);
      showToast(`Switched active workspace to "${switched.title}"`, 'success');
      return switched;
    } catch (err) {
      showToast(`Failed to switch task: ${err.message}`, 'error');
    }
  };

  // Create Task
  const createTask = async (taskData) => {
    try {
      const newTask = await api.createTask(taskData);
      await fetchTasks();
      setActiveTask(newTask);
      await fetchCheckpoints(newTask.id);
      showToast(`Task "${newTask.title}" created successfully!`, 'success');
      return newTask;
    } catch (err) {
      showToast(`Error creating task: ${err.message}`, 'error');
      throw err;
    }
  };

  // Save new Checkpoint Snapshot (Version N + 1)
  const saveCheckpointSnapshot = async (checkpointData) => {
    if (!activeTask) return;
    try {
      const newChk = await api.createCheckpoint({
        ...checkpointData,
        task_id: activeTask.id,
        is_draft: false,
        client_mutation_id: `mut-${Date.now()}`
      });
      await fetchCheckpoints(activeTask.id);
      await fetchTasks();
      setActiveCheckpoint(newChk);
      showToast(`Checkpoint v${newChk.version_number} committed to cloud!`, 'success');
      return newChk;
    } catch (err) {
      showToast(`Error saving checkpoint: ${err.message}`, 'error');
      throw err;
    }
  };

  // Trigger Interruption Simulation (Standard Break, Class, Meeting, Task Switch)
  const simulateInterruption = async (interruptionType = 'short_break', durationSeconds = 300) => {
    if (!activeTask) {
      showToast('No active task to interrupt', 'warning');
      return;
    }

    try {
      // 1. Fetch Recovery Briefing
      const briefing = await api.getBriefing(activeTask.id);
      setRecoveryBriefing(briefing);

      // 2. Start Recovery Session on server
      const session = await api.startRecoverySession({
        task_id: activeTask.id,
        checkpoint_id: briefing.checkpoint_id,
        interruption_type: interruptionType,
        interruption_duration_seconds: durationSeconds,
        recovery_condition: 'structured_briefing'
      });

      setCurrentRecoverySession(session);
      setInterruptionScenario({
        type: interruptionType,
        duration: durationSeconds,
        timestamp: new Date()
      });

      // 3. Open Briefing Modal
      setIsRecoveryModalOpen(true);
    } catch (err) {
      showToast(`Cannot start recovery: ${err.message}`, 'error');
    }
  };

  // Complete Resumption (Record first action and prompt NASA-TLX rating)
  const completeResumption = async (actionType, actionDesc) => {
    if (!currentRecoverySession) return;
    try {
      const updatedSession = await api.recordFirstAction(currentRecoverySession.id, {
        first_action_type: actionType,
        first_action_description: actionDesc
      });
      setCurrentRecoverySession(updatedSession);
      setIsRecoveryModalOpen(false);
      // Prompt NASA-TLX modal for subjective cognitive load rating
      setIsNasaTlxModalOpen(true);
      showToast(`First action recorded! Resumption lag: ${updatedSession.resumption_lag_seconds}s`, 'success');
    } catch (err) {
      showToast(`Failed to record resumption action: ${err.message}`, 'error');
    }
  };

  // Submit NASA-TLX Rating
  const submitNasaRating = async (ratingData) => {
    if (!currentRecoverySession) return;
    try {
      await api.submitRating(currentRecoverySession.id, ratingData);
      setIsNasaTlxModalOpen(false);
      setCurrentRecoverySession(null);
      showToast('NASA-TLX Workload rating submitted. Telemetry recorded!', 'success');
    } catch (err) {
      showToast(`Error submitting rating: ${err.message}`, 'error');
    }
  };

  return (
    <TaskContext.Provider value={{
      tasks,
      activeTask,
      checkpoints,
      activeCheckpoint,
      loading,
      toastMessage,
      showToast,
      fetchTasks,
      fetchCheckpoints,
      switchTask,
      createTask,
      saveCheckpointSnapshot,
      setActiveCheckpoint,
      // Recovery state
      isRecoveryModalOpen,
      setIsRecoveryModalOpen,
      isNasaTlxModalOpen,
      setIsNasaTlxModalOpen,
      recoveryBriefing,
      currentRecoverySession,
      interruptionScenario,
      simulateInterruption,
      completeResumption,
      submitNasaRating,
      // Quick capture
      isQuickCaptureOpen,
      setIsQuickCaptureOpen
    }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
}
