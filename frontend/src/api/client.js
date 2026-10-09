const API_BASE = '/api';

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('continuity_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    let errorDetail = 'API request failed';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || errorDetail;
    } catch (e) {
      errorDetail = `HTTP ${response.status}: ${response.statusText}`;
    }
    const error = new Error(errorDetail);
    error.status = response.status;
    throw error;
  }

  // Handle text/markdown response
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('text/markdown')) {
    return response.text();
  }

  return response.json();
}

export const api = {
  // Auth & Devices
  login: (data) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => apiRequest('/auth/me'),
  updateSettings: (data) => apiRequest('/auth/settings', { method: 'PUT', body: JSON.stringify(data) }),
  getDevices: () => apiRequest('/auth/devices'),
  registerDevice: (data) => apiRequest('/auth/devices', { method: 'POST', body: JSON.stringify(data) }),
  switchDevice: (id) => apiRequest(`/auth/devices/${id}/switch-current`, { method: 'POST' }),

  // Tasks
  getTasks: (params = '') => apiRequest(`/tasks${params}`),
  createTask: (data) => apiRequest('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  getTask: (id) => apiRequest(`/tasks/${id}`),
  updateTask: (id, data) => apiRequest(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTask: (id) => apiRequest(`/tasks/${id}`, { method: 'DELETE' }),
  switchTask: (data) => apiRequest('/tasks/switch', { method: 'POST', body: JSON.stringify(data) }),

  // Checkpoints
  getCheckpoints: (taskId) => apiRequest(`/checkpoints?task_id=${taskId}`),
  createCheckpoint: (data) => apiRequest('/checkpoints', { method: 'POST', body: JSON.stringify(data) }),
  getCheckpoint: (id) => apiRequest(`/checkpoints/${id}`),
  updateCheckpoint: (id, data) => apiRequest(`/checkpoints/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCheckpoint: (id) => apiRequest(`/checkpoints/${id}`, { method: 'DELETE' }),
  diffCheckpoints: (idA, idB) => apiRequest(`/checkpoints/${idA}/diff/${idB}`),
  rollbackCheckpoint: (id) => apiRequest(`/checkpoints/${id}/rollback`, { method: 'POST' }),

  // Recovery
  getBriefing: (taskId) => apiRequest(`/recovery/briefing/${taskId}`),
  startRecoverySession: (data) => apiRequest('/recovery/session/start', { method: 'POST', body: JSON.stringify(data) }),
  recordFirstAction: (sessionId, data) => apiRequest(`/recovery/session/${sessionId}/first-action`, { method: 'POST', body: JSON.stringify(data) }),
  submitRating: (sessionId, data) => apiRequest(`/recovery/session/${sessionId}/rating`, { method: 'POST', body: JSON.stringify(data) }),
  getRecoverySessions: () => apiRequest('/recovery/sessions'),
  getRecoveryStats: () => apiRequest('/recovery/stats'),

  // Experiments
  getBenchmarks: () => apiRequest('/experiments/benchmarks'),
  getStudyStats: (studyId = 'default-study') => apiRequest(`/experiments/stats?study_id=${studyId}`),
  recordTrial: (data) => apiRequest('/experiments/trials', { method: 'POST', body: JSON.stringify(data) }),
  getTrials: (studyId = 'default-study') => apiRequest(`/experiments/trials?study_id=${studyId}`),
  exportReport: (format = 'markdown') => apiRequest(`/experiments/export-report?format=${format}`),

  // AWS & Operations
  getSyllabus: () => apiRequest('/aws/syllabus'),
  calculateTCO: (data) => apiRequest('/aws/tco-calculator', { method: 'POST', body: JSON.stringify(data) }),
  reviewWellArchitected: (data) => apiRequest('/aws/well-architected', { method: 'POST', body: JSON.stringify(data) }),
  getCloudWatchMetrics: (params = '') => apiRequest(`/aws/cloudwatch/metrics${params}`),
  runSyntheticLoad: (concurrency = 100, iterations = 5) => apiRequest(`/aws/cloudwatch/synthetic-load?concurrency=${concurrency}&iterations=${iterations}`, { method: 'POST' }),

  // Lambda
  triggerRetentionSweep: (days = 90) => apiRequest(`/lambda/trigger/retention-sweep?retention_days=${days}`, { method: 'POST' }),
  triggerAutoBriefingNLP: (data) => apiRequest('/lambda/trigger/auto-briefing-nlp', { method: 'POST', body: JSON.stringify(data) }),

  // Privacy
  exportGDPRData: () => apiRequest('/privacy/export'),
  getAuditLogs: () => apiRequest('/privacy/audit-logs'),
  updatePrivacySettings: (data) => apiRequest('/privacy/settings', { method: 'PUT', body: JSON.stringify(data) }),
  purgeAccount: (confirmation) => apiRequest('/privacy/purge-account', { method: 'POST', body: JSON.stringify({ confirmation }) }),
};
