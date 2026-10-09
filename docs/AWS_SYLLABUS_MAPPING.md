# AWS Syllabus Mapping & Project Evidence Matrix

This document maps all 10 core Cloud Practitioner and Solutions Architect syllabus domains directly to technical implementations in the Work Continuity Cloud repository.

| Module | Syllabus Domain | Repository Implementation Evidence | Key AWS Services Utilized |
| :--- | :--- | :--- | :--- |
| **1. Cloud Concepts** | IaaS/PaaS/SaaS models, agility, elasticity, and local-to-cloud migration | Decoupled monolithic local state into stateless multi-tier application behind ALB with elastic auto-scaling. | EC2, Auto Scaling, ALB, CloudFront |
| **2. Economics & Billing** | TCO comparison, CapEx vs OpEx, AWS Pricing Models, and AWS Budgets | Built-in interactive TCO calculator comparing on-prem ($480/mo) vs AWS ($84.65/mo), achieving 82% savings. | AWS Budgets, Cost Explorer, S3 Glacier |
| **3. Global Infrastructure** | Regions, AZs, Edge locations, and RPO/RTO disaster recovery | Multi-AZ deployment across `us-east-1a` and `us-east-1b` with cross-region S3 replication to `us-west-2` (RPO < 5m, RTO < 15m). | Route 53, S3 CRR, Multi-AZ RDS |
| **4. Cloud Security** | Shared responsibility, least-privilege IAM, KMS envelope encryption | Scoped IAM roles with tenant ARN conditions, KMS Customer Managed Keys (AES-256), and JWT claim isolation. | IAM, AWS KMS, AWS WAF, Secrets Manager |
| **5. Networking & VPC** | VPC design, public/private subnets, NAT Gateway, Security Groups | Custom 2-tier VPC (`10.0.0.0/16`) isolating compute and databases in private subnets without public IPs. | Amazon VPC, NAT Gateway, CloudFront |
| **6. Compute Services** | EC2 Graviton3 instances, Elastic Beanstalk, AWS Lambda serverless | Hybrid compute: EC2 `t4g.small` ARM64 for low-latency REST APIs; AWS Lambda for asynchronous retention cleanup. | EC2 (ARM64), AWS Lambda, EventBridge |
| **7. Storage Services** | Block storage (EBS gp3), Object storage (S3), and lifecycle transitions | Tiered S3 lifecycle: Standard (0-30d) ➔ S3-IA (30-90d) ➔ S3 Glacier Flexible Retrieval (>90d) for context backups. | Amazon S3, EBS gp3, S3 Glacier |
| **8. Databases** | Relational databases (RDS PostgreSQL) vs NoSQL document stores (DynamoDB) | Relational RDS schema enforcing ACID transactions, version integrity, and SQL analytics joins for research statistics. | Amazon RDS PostgreSQL, ElastiCache |
| **9. Architecture Review** | AWS Well-Architected Framework 6-Pillar assessment | Interactive 6-pillar assessment achieving 92/100 compliance with zero high-risk security issues. | AWS Well-Architected Tool |
| **10. Scaling & Monitoring** | CloudWatch metrics, alarms, synthetic canaries, and load testing | Custom CloudWatch metrics pipeline tracking `ResumptionLag_MS` with synthetic load generator up to 500 concurrent saves. | Amazon CloudWatch, CloudWatch Alarms, SNS |
