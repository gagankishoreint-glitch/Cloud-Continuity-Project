import uuid
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from backend.app.models.user import User, DeviceSession
from backend.app.models.task import Task
from backend.app.models.checkpoint import Checkpoint
from backend.app.models.recovery import RecoverySession
from backend.app.models.experiment import ExperimentStudy, BenchmarkTask, ExperimentTrial
from backend.app.models.aws_metrics import CloudWatchMetric
from backend.app.services.auth_service import get_password_hash

def seed_database(db: Session):
    # Check if already seeded
    existing_user = db.query(User).filter(User.username == "demo_engineer").first()
    if existing_user:
        return

    print("🌱 Seeding Work Continuity Cloud database with realistic research and cloud data...")

    # 1. Create Demo User
    demo_user = User(
        id=str(uuid.uuid4()),
        email="engineer@cloudcontinuity.io",
        username="demo_engineer",
        hashed_password=get_password_hash("continuity2026"),
        full_name="Alex Rivera (Cloud DevOps & Researcher)",
        is_active=True,
        settings={
            "retention_days": 90,
            "auto_mask_tokens": True,
            "enable_telemetry": True,
            "capture_mode": "explicit",
            "default_device_name": "MacBook Pro M3",
            "briefing_format": "concise"
        }
    )
    db.add(demo_user)
    db.flush()

    # 2. Add Connected Devices for Multi-Device Simulation
    devices = [
        DeviceSession(
            user_id=demo_user.id,
            device_name="MacBook Pro M3 (Primary)",
            device_type="laptop",
            ip_address="192.168.1.104",
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/128.0.0.0",
            last_active_at=datetime.utcnow(),
            is_current=True,
            sync_status="in_sync"
        ),
        DeviceSession(
            user_id=demo_user.id,
            device_name="Ubuntu Linux Workstation (Lab)",
            device_type="desktop",
            ip_address="10.0.4.18",
            user_agent="Mozilla/5.0 (X11; Linux x86_64) Firefox/129.0",
            last_active_at=datetime.utcnow() - timedelta(hours=3),
            is_current=False,
            sync_status="in_sync"
        ),
        DeviceSession(
            user_id=demo_user.id,
            device_name="iPad Pro 12.9 (Field / Mobile)",
            device_type="tablet",
            ip_address="172.20.10.2",
            user_agent="Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) Safari/605.1.15",
            last_active_at=datetime.utcnow() - timedelta(days=1),
            is_current=False,
            sync_status="in_sync"
        )
    ]
    for d in devices:
        db.add(d)

    # 3. Create Sample Active Tasks
    # Task 1: The Blueprint AWS IAM Lab
    task_iam = Task(
        id=str(uuid.uuid4()),
        user_id=demo_user.id,
        title="Complete AWS IAM Lab: Cross-Account S3 Role",
        description="Configure an IAM role that permits required S3 bucket operations without granting excessive wildcard permissions, resolving AccessDenied error.",
        category="AWS Cloud Lab",
        status="active",
        priority="high",
        color="#3b82f6",
        tags=["IAM", "S3", "Security", "AWS-Lab"],
        total_time_spent_seconds=4200,
        resumption_count=4,
        created_at=datetime.utcnow() - timedelta(days=2)
    )
    db.add(task_iam)

    # Task 2: VPC Peering Conflict
    task_vpc = Task(
        id=str(uuid.uuid4()),
        user_id=demo_user.id,
        title="Debug VPC Peering & Route Table CIDR Conflict",
        description="Diagnose packet drop between Production VPC (10.0.0.0/16) and Analytics VPC (10.0.0.0/16) using Transit Gateway and secondary CIDRs.",
        category="Networking",
        status="paused",
        priority="medium",
        color="#10b981",
        tags=["VPC", "Routing", "TransitGateway", "Subnets"],
        total_time_spent_seconds=2700,
        resumption_count=2,
        created_at=datetime.utcnow() - timedelta(days=4)
    )
    db.add(task_vpc)

    # Task 3: Research Evaluation Paper
    task_research = Task(
        id=str(uuid.uuid4()),
        user_id=demo_user.id,
        title="Psychological Evaluation & Statistical Analysis Report",
        description="Write the empirical findings section comparing resumption lag and NASA-TLX cognitive workload across 12 study participants.",
        category="Research & Writing",
        status="active",
        priority="high",
        color="#8b5cf6",
        tags=["Research", "CognitiveLoad", "NASA-TLX", "Paper"],
        total_time_spent_seconds=6400,
        resumption_count=6,
        created_at=datetime.utcnow() - timedelta(days=6)
    )
    db.add(task_research)
    db.flush()

    # 4. Checkpoints for Task 1 (IAM Lab)
    chk1_v1 = Checkpoint(
        id=str(uuid.uuid4()),
        task_id=task_iam.id,
        user_id=demo_user.id,
        version_number=1,
        goal="Configure an IAM role for S3 bucket operations without wildcard permissions.",
        confirmed_progress=[
            {"id": "p1", "text": "Created IAM role 'DataProcessorRole'", "completed": True, "timestamp": "10:15 AM", "provenance": "user"},
            {"id": "p2", "text": "Attached initial managed policy AmazonS3ReadOnlyAccess", "completed": True, "timestamp": "10:28 AM", "provenance": "user"}
        ],
        blocker_or_question="Need write permissions for processed-data/ prefix.",
        next_action="Draft inline policy allowing s3:PutObject for specific bucket ARN.",
        resources=[
            {"id": "r1", "title": "AWS IAM JSON Policy Reference", "type": "url", "value": "https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies.html", "notes": "Section on S3 conditions"},
            {"id": "r2", "title": "Lab Instructions Sheet", "type": "doc", "value": "Lab 4 - Least Privilege Access Control.pdf", "notes": "Page 3: Role requirements"}
        ],
        user_notes="Working in us-east-1. Bucket name: production-data-lake-2026.",
        provenance={"goal": {"source": "user"}, "next_action": {"source": "user"}, "blocker": {"source": "user"}},
        is_draft=False,
        created_at=datetime.utcnow() - timedelta(hours=3)
    )
    db.add(chk1_v1)
    db.flush()

    chk1_v2 = Checkpoint(
        id=str(uuid.uuid4()),
        task_id=task_iam.id,
        user_id=demo_user.id,
        version_number=2,
        parent_checkpoint_id=chk1_v1.id,
        goal="Configure an IAM role that permits required S3 operation without granting unnecessary permissions.",
        confirmed_progress=[
            {"id": "p1", "text": "Created the IAM role 'DataProcessorRole'", "completed": True, "timestamp": "10:15 AM", "provenance": "user"},
            {"id": "p2", "text": "Attached an initial custom policy for s3:PutObject", "completed": True, "timestamp": "11:20 AM", "provenance": "user"},
            {"id": "p3", "text": "Tested access via AWS CLI and received 'AccessDenied' error", "completed": True, "timestamp": "11:38 AM", "provenance": "user"}
        ],
        blocker_or_question="Is the denial caused by the identity policy, bucket policy, KMS key policy, or SCP restriction?",
        next_action="Inspect the S3 bucket policy and KMS key ARN, then rerun the CLI test script 'test_upload.sh'.",
        resources=[
            {"id": "r1", "title": "AWS IAM Lab Instructions", "type": "url", "value": "https://aws.amazon.com/training/course-descriptions/cloud-practitioner/", "notes": "Exercise Step 4"},
            {"id": "r2", "title": "S3 AccessDenied Troubleshooting Guide", "type": "url", "value": "https://repost.aws/knowledge-center/s3-troubleshoot-403", "notes": "4-point checklist for KMS + Bucket Policy"},
            {"id": "r3", "title": "CLI Test Script", "type": "code", "value": "aws s3 cp sample.json s3://production-data-lake-2026/test/ --profile lab-role", "notes": "Returns 403 AccessDenied"}
        ],
        user_notes="Left for computer networks class at 11:40 AM. CLI returned AccessDenied on PutObject. Next step is checking bucket policy.",
        provenance={"goal": {"source": "user"}, "next_action": {"source": "user"}, "blocker": {"source": "user"}},
        is_draft=False,
        created_at=datetime.utcnow() - timedelta(minutes=45)
    )
    db.add(chk1_v2)
    db.flush()

    # Link task active checkpoint
    task_iam.active_checkpoint_id = chk1_v2.id

    # 5. Seed Benchmark Tasks for Research
    benchmarks = [
        BenchmarkTask(
            id="bench-01",
            name="AWS IAM AccessDenied Cross-Account Role Debugging",
            domain="AWS Cloud Security",
            complexity="medium",
            brief_description="Investigate an unexpected 403 AccessDenied error when an EC2 application assumes an IAM role to write to an encrypted S3 bucket.",
            scenario_details={
                "broken_component": "KMS Key Policy missing kms:GenerateDataKey permission for assumed role ARN",
                "evidence_logs": "s3:PutObject failed with ClientError: AccessDenied (KMS.DisabledException or KeyAccessDenied)",
                "correct_remediation": "Add IAM role ARN to KMS Key Policy statement 'Allow use of the key'"
            },
            initial_tabs=[
                {"title": "AWS IAM Console - DataProcessorRole", "url": "https://console.aws.amazon.com/iam/roles/DataProcessorRole"},
                {"title": "AWS KMS Key Policy Editor", "url": "https://console.aws.amazon.com/kms/keys/key-84920"},
                {"title": "AWS Knowledge Center: S3 403 Access Denied", "url": "https://repost.aws/knowledge-center/s3-troubleshoot-403"}
            ],
            pre_interruption_progress=[
                {"id": "b1", "text": "Created role and verified STS AssumeRole succeeds", "completed": True},
                {"id": "b2", "text": "Confirmed S3 bucket policy allows PutObject", "completed": True},
                {"id": "b3", "text": "Encountered 403 AccessDenied upon upload attempt", "completed": True}
            ],
            current_blocker="Uncertain whether AccessDenied stems from S3 bucket ACL, Bucket Policy, or KMS Key Policy.",
            intended_next_action="Open KMS Console and verify role ARN is listed in key policy permissions.",
            verification_check={"target_file_edited": "kms_policy.json", "expected_action": "Check KMS Key policy"}
        ),
        BenchmarkTask(
            id="bench-02",
            name="Amazon VPC Peering & Route Table Conflict",
            domain="AWS Networking",
            complexity="medium",
            brief_description="Resolve connectivity timeout between two peered VPCs where both VPCs inadvertently used overlapping CIDR ranges.",
            scenario_details={
                "broken_component": "Overlapping CIDR block 10.0.0.0/16 prevents bidirectional routing table association",
                "evidence_logs": "traceroute: Destination Host Unreachable / Route table conflict error in VPC console",
                "correct_remediation": "Assign secondary IPv4 CIDR 10.100.0.0/16 to VPC-B and update route tables"
            },
            initial_tabs=[
                {"title": "VPC Route Tables Console", "url": "https://console.aws.amazon.com/vpc/routes"},
                {"title": "VPC Peering Connection Status", "url": "https://console.aws.amazon.com/vpc/peering/pcx-9921"},
                {"title": "AWS VPC Peering Limitations Guide", "url": "https://docs.aws.amazon.com/vpc/latest/peering/vpc-peering-basics.html"}
            ],
            pre_interruption_progress=[
                {"id": "vp1", "text": "Accepted VPC Peering connection pcx-9921", "completed": True},
                {"id": "vp2", "text": "Attempted ping between 10.0.1.15 and 10.0.2.80 with 100% packet loss", "completed": True}
            ],
            current_blocker="Route table rejects route entry due to overlapping CIDR conflict.",
            intended_next_action="Check VPC-B IPv4 CIDR settings and add secondary non-overlapping CIDR block.",
            verification_check={"target_file_edited": "route_tables.tf", "expected_action": "Modify CIDR allocation"}
        ),
        BenchmarkTask(
            id="bench-03",
            name="FastAPI Async Database Connection Pool Starvation",
            domain="Backend Performance Engineering",
            complexity="high",
            brief_description="Diagnose 504 Gateway Timeouts under synthetic load where unclosed async database sessions exhaust the SQLAlchemy pool.",
            scenario_details={
                "broken_component": "FastAPI route missing 'async with session.begin()' context manager, causing connection leaks",
                "evidence_logs": "sqlalchemy.exc.TimeoutError: QueuePool limit of size 5 overflow 10 reached",
                "correct_remediation": "Wrap DB access in async session dependency with automatic context exit"
            },
            initial_tabs=[
                {"title": "FastAPI Async SQLAlchemy Guide", "url": "https://fastapi.tiangolo.com/tutorial/sql-databases/"},
                {"title": "CloudWatch Logs - Backend 504 Errors", "url": "https://console.aws.amazon.com/cloudwatch/logs/app-errors"}
            ],
            pre_interruption_progress=[
                {"id": "db1", "text": "Simulated 200 concurrent requests with Locust load tester", "completed": True},
                {"id": "db2", "text": "Reproduced QueuePool limit exhaustion error in application logs", "completed": True}
            ],
            current_blocker="Connections remain in SLEEP state in PostgreSQL pg_stat_activity.",
            intended_next_action="Inspect get_db generator in database.py to ensure session.close() in finally block.",
            verification_check={"target_file_edited": "database.py", "expected_action": "Fix session lifecycle generator"}
        )
    ]
    for b in benchmarks:
        db.add(b)

    # 6. Seed Realistic Research Trials Data (12 Participants: Condition A vs B)
    # Reflects the empirical hypothesis: Condition B reduces resumption lag from ~42s down to ~14s and cuts NASA-TLX by ~40 points.
    pilot_trials_data = [
        # Participant 1
        ("P-01", "bench-01", "AWS IAM AccessDenied Debugging", "A_MANUAL", 1, 180, 48.2, 72.0, 1, 74.5, 6),
        ("P-01", "bench-02", "Amazon VPC Peering Conflict", "B_STRUCTURED", 2, 180, 13.4, 100.0, 0, 26.2, 9),
        # Participant 2
        ("P-02", "bench-02", "Amazon VPC Peering Conflict", "A_MANUAL", 1, 180, 39.5, 80.0, 2, 65.0, 7),
        ("P-02", "bench-01", "AWS IAM AccessDenied Debugging", "B_STRUCTURED", 2, 180, 15.1, 100.0, 0, 29.8, 9),
        # Participant 3
        ("P-03", "bench-01", "AWS IAM AccessDenied Debugging", "A_MANUAL", 2, 180, 52.0, 68.0, 3, 78.0, 5),
        ("P-03", "bench-02", "Amazon VPC Peering Conflict", "B_STRUCTURED", 1, 180, 16.8, 95.0, 0, 32.0, 8),
        # Participant 4
        ("P-04", "bench-03", "FastAPI Connection Pool Starvation", "A_MANUAL", 1, 300, 61.4, 75.0, 2, 82.5, 5),
        ("P-04", "bench-01", "AWS IAM AccessDenied Debugging", "B_STRUCTURED", 2, 300, 18.2, 100.0, 0, 31.4, 9),
        # Participant 5
        ("P-05", "bench-02", "Amazon VPC Peering Conflict", "A_MANUAL", 2, 180, 44.1, 85.0, 1, 62.0, 7),
        ("P-05", "bench-03", "FastAPI Connection Pool Starvation", "B_STRUCTURED", 1, 180, 14.0, 100.0, 0, 24.5, 10),
        # Participant 6
        ("P-06", "bench-01", "AWS IAM AccessDenied Debugging", "A_MANUAL", 1, 180, 36.8, 82.0, 1, 58.5, 7),
        ("P-06", "bench-02", "Amazon VPC Peering Conflict", "B_STRUCTURED", 2, 180, 12.2, 100.0, 0, 22.0, 10),
        # Participant 7
        ("P-07", "bench-03", "FastAPI Connection Pool Starvation", "A_MANUAL", 2, 180, 55.2, 70.0, 2, 76.0, 6),
        ("P-07", "bench-01", "AWS IAM AccessDenied Debugging", "B_STRUCTURED", 1, 180, 15.6, 95.0, 0, 30.5, 8),
        # Participant 8
        ("P-08", "bench-02", "Amazon VPC Peering Conflict", "A_MANUAL", 1, 180, 41.0, 80.0, 1, 66.0, 7),
        ("P-08", "bench-03", "FastAPI Connection Pool Starvation", "B_STRUCTURED", 2, 180, 13.9, 100.0, 0, 25.0, 9),
        # Participant 9
        ("P-09", "bench-01", "AWS IAM AccessDenied Debugging", "A_MANUAL", 2, 300, 58.9, 65.0, 3, 80.0, 5),
        ("P-09", "bench-02", "Amazon VPC Peering Conflict", "B_STRUCTURED", 1, 300, 17.5, 95.0, 0, 33.0, 8),
        # Participant 10
        ("P-10", "bench-02", "Amazon VPC Peering Conflict", "A_MANUAL", 1, 180, 38.4, 88.0, 1, 61.0, 8),
        ("P-10", "bench-01", "AWS IAM AccessDenied Debugging", "B_STRUCTURED", 2, 180, 11.8, 100.0, 0, 21.5, 10),
        # Participant 11
        ("P-11", "bench-03", "FastAPI Connection Pool Starvation", "A_MANUAL", 2, 180, 49.3, 75.0, 2, 73.0, 6),
        ("P-11", "bench-02", "Amazon VPC Peering Conflict", "B_STRUCTURED", 1, 180, 14.5, 100.0, 0, 27.0, 9),
        # Participant 12
        ("P-12", "bench-01", "AWS IAM AccessDenied Debugging", "A_MANUAL", 1, 180, 43.5, 80.0, 1, 69.0, 6),
        ("P-12", "bench-03", "FastAPI Connection Pool Starvation", "B_STRUCTURED", 2, 180, 13.1, 100.0, 0, 23.5, 10)
    ]

    for p_id, t_id, t_name, cond, order, intr_sec, res_sec, acc, rep, tlx, conf in pilot_trials_data:
        # Calculate subscales based on condition
        if cond == "A_MANUAL":
            m_dem = int(tlx * 1.1)
            p_dem = 15
            t_dem = int(tlx * 0.95)
            perf = int(100 - acc)
            eff = int(tlx * 1.05)
            frust = int(tlx * 1.1)
        else:
            m_dem = int(tlx * 0.85)
            p_dem = 8
            t_dem = int(tlx * 0.75)
            perf = int(100 - acc)
            eff = int(tlx * 0.8)
            frust = int(tlx * 0.6)

        trial = ExperimentTrial(
            id=str(uuid.uuid4()),
            study_id="default-study",
            participant_id=p_id,
            task_id=t_id,
            task_name=t_name,
            condition=cond,
            task_order=order,
            interruption_duration_sec=intr_sec,
            interruption_type="distractor_math_puzzle",
            resumption_time_sec=res_sec,
            briefing_reading_time_sec=4.2 if cond == "B_STRUCTURED" else 0.0,
            recovery_accuracy_percent=acc,
            repeated_work_count=rep,
            first_action_correct=(rep == 0),
            nasa_mental_demand=min(100, max(0, m_dem)),
            nasa_physical_demand=min(100, max(0, p_dem)),
            nasa_temporal_demand=min(100, max(0, t_dem)),
            nasa_performance=min(100, max(0, perf)),
            nasa_effort=min(100, max(0, eff)),
            nasa_frustration=min(100, max(0, frust)),
            nasa_overall_score=tlx,
            confidence_rating=conf,
            qualitative_notes="Participant noted clear prospective memory anchor in Condition B." if cond == "B_STRUCTURED" else "Had to re-read terminal output and browser history.",
            created_at=datetime.utcnow() - timedelta(days=1, hours=int(p_id.split("-")[1]))
        )
        db.add(trial)

    # 7. Seed CloudWatch Telemetry Metrics
    for i in range(24):
        t = datetime.utcnow() - timedelta(hours=24 - i)
        # Resumption Lag metric
        db.add(CloudWatchMetric(
            namespace="WorkContinuityCloud/App",
            metric_name="ResumptionLag_MS",
            value=13500.0 + (i % 5) * 450.0,
            unit="Milliseconds",
            timestamp=t,
            dimensions={"Environment": "Production", "Region": "us-east-1"}
        ))
        # Checkpoint Save Latency
        db.add(CloudWatchMetric(
            namespace="WorkContinuityCloud/App",
            metric_name="CheckpointSaveLatency_MS",
            value=42.0 + (i % 3) * 8.0,
            unit="Milliseconds",
            timestamp=t,
            dimensions={"Environment": "Production", "Region": "us-east-1"}
        ))
        # Active Sync Sessions
        db.add(CloudWatchMetric(
            namespace="WorkContinuityCloud/App",
            metric_name="ActiveSyncSessions",
            value=18.0 + (i % 8) * 3.0,
            unit="Count",
            timestamp=t,
            dimensions={"Environment": "Production", "Region": "us-east-1"}
        ))

    db.commit()
    print("✅ Successfully seeded Work Continuity Cloud database!")
