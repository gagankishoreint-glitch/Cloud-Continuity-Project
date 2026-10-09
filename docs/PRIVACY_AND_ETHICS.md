# Privacy, Ethics & Data Governance Specification

Work Continuity Cloud is engineered strictly in adherence to **Privacy-by-Design** principles to avoid becoming an invasive surveillance or productivity scoring tool.

---

## 1. Ethical Principles & Anti-Patterns Rejected

| Principle | Work Continuity Cloud Policy |
| :--- | :--- |
| **No Background Surveillance** | Never captures keystrokes, webcam, micro-movements, or full ambient browsing history. Only captures explicitly declared tasks and confirmed checkpoints. |
| **No Employee Activity Scoring** | Avoids toxic productivity quotas, time tracking rankings, or punitive metrics. Recovery metrics are private to the individual engineer. |
| **Data Minimization** | Checkpoints store only what is strictly required to reconstruct cognitive state: Goal, Milestones, Blocker, and Next Action. |
| **Clear Provenance Attribution** | Every piece of data is labeled with its origin (`user_authored`, `system_captured`, or `ai_inferred`) to prevent fabricated facts. |

---

## 2. Regulatory Compliance (GDPR & CCPA)

1. **Right to Access & Portability (Art. 20 GDPR):**
   - Users can generate and download a complete JSON archive of all tasks, checkpoints, and recovery sessions via `GET /api/privacy/export`.
   - The export payload is cryptographically hashed with SHA-256 for integrity verification.

2. **Right to Erasure / Right to be Forgotten (Art. 17 GDPR):**
   - Single-click hard purge with explicit confirmation string `PERMANENTLY_DELETE_ALL_MY_DATA` cascades permanent deletion across all database tables and S3 prefixes.

3. **Data Retention & Lifecycle (Art. 5(1)(e) GDPR):**
   - User-configurable retention schedules (30, 60, 90, 180 days).
   - Serverless AWS Lambda workers purge expired snapshots automatically.
