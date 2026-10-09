# REST API Reference Specification

Base URL: `http://localhost:8000/api` (or proxied via `/api`)

All authenticated endpoints require `Authorization: Bearer <JWT_TOKEN>`.

---

## 1. Authentication & Devices (`/api/auth`)
* `POST /auth/register` — Register new user account.
* `POST /auth/login` — Login with username/email and password.
* `POST /auth/token` — OAuth2 password form login.
* `GET /auth/me` — Retrieve current authenticated user profile.
* `PUT /auth/settings` — Update user settings & privacy preferences.
* `GET /auth/devices` — List registered devices for user.
* `POST /auth/devices` — Register new device session.
* `POST /auth/devices/{id}/switch-current` — Switch active device session.

---

## 2. Task Management (`/api/tasks`)
* `GET /tasks` — List all user tasks with checkpoint counts and statuses.
* `POST /tasks` — Create a new task (optionally with initial goal and next action).
* `GET /tasks/{id}` — Get task details.
* `PUT /tasks/{id}` — Update task properties (status, priority, category, tags).
* `DELETE /tasks/{id}` — Delete task and all associated checkpoints.
* `POST /tasks/switch` — Switch active task context and log transition.

---

## 3. Context Checkpoint Engine (`/api/checkpoints`)
* `GET /checkpoints?task_id={id}` — List versioned checkpoints for a task.
* `POST /checkpoints` — Create new checkpoint snapshot ($v_1 \to v_2 \dots$).
* `GET /checkpoints/{id}` — Get single checkpoint.
* `PUT /checkpoints/{id}` — Update checkpoint notes or draft content.
* `DELETE /checkpoints/{id}` — Delete checkpoint.
* `GET /checkpoints/{id}/diff/{other_id}` — Compute field-level diff between two checkpoints.
* `POST /checkpoints/{id}/rollback` — Rollback task context to historical checkpoint version.

---

## 4. Recovery Briefing & Resumption (`/api/recovery`)
* `GET /recovery/briefing/{task_id}` — Generate the concise 4-part recovery briefing.
* `POST /recovery/session/start` — Start recovery timer and log session initiation.
* `POST /recovery/session/{id}/first-action` — Record first meaningful action and compute resumption lag.
* `POST /recovery/session/{id}/rating` — Submit post-resumption NASA-TLX 6-dimension workload scores.
* `GET /recovery/sessions` — List user's historical recovery sessions.
* `GET /recovery/stats` — Aggregate quantitative telemetry stats.

---

## 5. Psychological Research Experiment Suite (`/api/experiments`)
* `GET /experiments/benchmarks` — List predefined standardized benchmark tasks.
* `GET /experiments/stats` — Calculate paired t-test, Wilcoxon, Cohen's d, and 95% CI.
* `POST /experiments/trials` — Record a new empirical trial.
* `GET /experiments/trials` — List trial dataset.
* `GET /experiments/export-report` — Export scientific research report (Markdown / JSON).

---

## 6. AWS Syllabus, Operations & CloudWatch (`/api/aws`)
* `GET /aws/syllabus` — Retrieve the 10 Syllabus Modules mapping.
* `POST /aws/tco-calculator` — Calculate monthly and annual AWS vs on-prem TCO.
* `POST /aws/well-architected` — Run 6-pillar Well-Architected assessment.
* `GET /aws/cloudwatch/metrics` — Query CloudWatch custom metrics.
* `POST /aws/cloudwatch/synthetic-load` — Execute synthetic load stress test.

---

## 7. AWS Lambda & Background Automation (`/api/lambda`)
* `POST /lambda/trigger/retention-sweep` — Trigger Lambda context retention worker.
* `POST /lambda/trigger/auto-briefing-nlp` — Run Amazon Bedrock / NLP context extraction on raw notes.

---

## 8. Privacy, Ethics & Governance (`/api/privacy`)
* `GET /privacy/export` — Generate and download GDPR/CCPA data portability archive.
* `GET /privacy/audit-logs` — Retrieve immutable audit trail logs.
* `PUT /privacy/settings` — Update retention and token masking settings.
* `POST /privacy/purge-account` — Hard delete account with confirmation string.
