import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, Integer, Text, ForeignKey, JSON, Boolean
from backend.app.database import Base

class ExperimentStudy(Base):
    __tablename__ = "experiment_studies"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), default="Cognitive Workload & Resumption Lag in Cloud Engineering Workflows")
    description = Column(Text, default="A within-subject controlled empirical trial comparing manual task recovery with Work Continuity Cloud structured checkpoints.")
    research_questions = Column(JSON, default=lambda: [
        "RQ1: Does a structured, cloud-backed task checkpoint reduce the time and effort required to resume an interrupted digital task, compared with ordinary manual recovery?",
        "RQ2: Which information matters most for recovery: saved resources, a progress summary, or an explicit next action?",
        "RQ3: Does the benefit change with interruption duration or task complexity?",
        "RQ4: Can the system provide useful recovery without collecting excessive personal data or creating distracting notifications?"
    ])
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(50), default="active")


class BenchmarkTask(Base):
    __tablename__ = "benchmark_tasks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    domain = Column(String(100), default="AWS Cloud Infrastructure")
    complexity = Column(String(50), default="medium")  # low, medium, high
    brief_description = Column(Text, nullable=False)
    scenario_details = Column(JSON, default=dict)  # full instructions, broken state, expected fix
    initial_tabs = Column(JSON, default=list)      # tabs open before interruption
    pre_interruption_progress = Column(JSON, default=list) # milestones done before interruption
    current_blocker = Column(Text, default="")
    intended_next_action = Column(Text, default="")
    verification_check = Column(JSON, default=dict) # criteria for successful resumption
    created_at = Column(DateTime, default=datetime.utcnow)


class ExperimentTrial(Base):
    __tablename__ = "experiment_trials"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    study_id = Column(String(36), nullable=False, index=True)
    participant_id = Column(String(100), nullable=False, index=True) # e.g. "P-01", "P-02"
    task_id = Column(String(36), nullable=False)
    task_name = Column(String(255), nullable=False)
    
    # Within-subject condition: "A_MANUAL" (baseline) or "B_STRUCTURED" (intervention)
    condition = Column(String(50), nullable=False, index=True)
    task_order = Column(Integer, default=1)  # 1 or 2 for counterbalancing order
    
    # Interruption parameters
    interruption_duration_sec = Column(Integer, default=180) # e.g., 3 mins (180s) or 15 mins
    interruption_type = Column(String(50), default="distractor_math_puzzle")
    
    # Outcome Metrics
    resumption_time_sec = Column(Float, nullable=False)       # Primary metric: Time from return prompt to 1st meaningful action
    briefing_reading_time_sec = Column(Float, default=0.0)
    recovery_accuracy_percent = Column(Float, default=100.0)  # Facts accurately recalled (0 - 100)
    repeated_work_count = Column(Integer, default=0)          # Actions repeated because forgotten
    first_action_correct = Column(Boolean, default=True)      # Did they resume with the intended next step?
    
    # NASA-TLX Subscales (0 - 100)
    nasa_mental_demand = Column(Integer, default=50)
    nasa_physical_demand = Column(Integer, default=10)
    nasa_temporal_demand = Column(Integer, default=40)
    nasa_performance = Column(Integer, default=30)
    nasa_effort = Column(Integer, default=45)
    nasa_frustration = Column(Integer, default=25)
    nasa_overall_score = Column(Float, default=33.3)
    
    # Confidence (1 - 10)
    confidence_rating = Column(Integer, default=8)
    
    qualitative_notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
