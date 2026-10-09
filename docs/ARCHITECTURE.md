# Work Continuity Cloud: Architecture Specification

## 1. System Overview

Work Continuity Cloud is a resilient cloud-backed system designed to capture, persist, and restore unfinished digital task context. It minimizes task resumption lag, reduces cognitive workload (measured via NASA-TLX), and facilitates cross-device task resumption.

```
+-----------------------------------------------------------------------------------+
|                                  Client Layer                                     |
|  - Web Single Page App (React 18 + Tailwind CSS + Lucide + Recharts)               |
|  - Multi-Device Workspace (Laptop / Desktop / Tablet)                             |
|  - Browser Extension / Quick Capture Simulator                                    |
+------------------------------------------+----------------------------------------+
                                           | HTTPS / TLS 1.3
                                           v
+-----------------------------------------------------------------------------------+
|                         AWS Edge & Routing Tier                                   |
|  - Amazon CloudFront (Static Asset Edge Caching & TLS Termination)               |
|  - AWS WAF (Web Application Firewall - Rate Limiting & OWASP Top 10)              |
|  - Amazon Route 53 (Latency-based DNS & Health Checks)                            |
+------------------------------------------+----------------------------------------+
                                           | Reverse Proxy / API Routing
                                           v
+-----------------------------------------------------------------------------------+
|                      AWS VPC (10.0.0.0/16 Multi-AZ)                                |
|                                                                                   |
|  [Public Subnets: 10.0.1.0/24 (AZ-a), 10.0.2.0/24 (AZ-b)]                         |
|  - Application Load Balancer (ALB)                                                |
|  - NAT Gateways                                                                   |
|                                                                                   |
|  [Private Application Subnets: 10.0.10.0/24 (AZ-a), 10.0.11.0/24 (AZ-b)]         |
|  - EC2 Auto Scaling Group (FastAPI Python 3.11 on AWS Graviton3 ARM64)            |
|  - AWS Lambda Workers (Async Checkpoint Retention & Bedrock NLP Briefing)         |
|                                                                                   |
|  [Private Isolated Persistence Subnets: 10.0.20.0/24, 10.0.21.0/24]              |
|  - Amazon RDS PostgreSQL (Multi-AZ Standby + Read Replica for Research Analytics) |
|  - Amazon S3 Bucket (Checkpoints + S3 Intelligent-Tiering + S3 Glacier)           |
|  - AWS KMS (Customer Managed Key Envelope Encryption AES-256)                     |
+------------------------------------------+----------------------------------------+
                                           | Observability & Alarms
                                           v
+-----------------------------------------------------------------------------------+
|                       AWS Management & Governance Tier                            |
|  - Amazon CloudWatch (ResumptionLag_MS, CheckpointLatency, ActiveSyncSessions)     |
|  - CloudWatch Alarms & Amazon SNS (HighResumptionLagAlarm, API5xxAlarm)           |
|  - AWS Budgets (Zero-spend budget & 85% forecasted threshold alerts)              |
|  - AWS IAM (Role-based access control with least-privilege tenant policies)       |
+-----------------------------------------------------------------------------------+
```

---

## 2. Core Architectural Components

### A. Context Checkpoint Engine
Every task state is modeled as an immutable, versioned snapshot comprising:
1. **Goal:** The explicit high-level target state.
2. **Confirmed Progress:** Ordered list of accomplished milestones with verified timestamps and source provenance.
3. **Active Blocker / Open Question:** Observed error traces, unresolved hypotheses, or impediments.
4. **Intended Next Action:** The prospective memory anchor defining the immediate next step.
5. **Saved Resources:** Pinned URLs, code snippets, documentation sections, and CLI commands.
6. **Provenance Metadata:** Field-level audit trail (`user_authored`, `system_captured`, `ai_inferred`).

### B. Recovery Briefing Compiler
Upon returning from an interruption, the application extracts the latest checkpoint and compiles a 4-part structured briefing:
- *What you were doing*
- *What was completed*
- *Current blocker*
- *Your explicit next action*

A high-resolution millisecond timer records the **Resumption Lag** ($T_{\text{resumption}} = T_{\text{action}} - T_{\text{presentation}}$) until the first meaningful action is executed.

### C. Multi-Tenant Data Isolation
- Each tenant is partitioned by `user_id` enforced at the database level and JWT token claims.
- S3 storage uses partitioned prefixes: `arn:aws:s3:::continuity-cloud-checkpoints-prod/${aws:userid}/*`.
- All database records and object attachments are encrypted at rest with AWS KMS Customer Managed Keys (CMKs).
