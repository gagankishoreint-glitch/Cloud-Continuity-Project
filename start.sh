#!/usr/bin/env bash
set -e

echo "🚀 Starting Work Continuity Cloud Backend and Frontend..."

# 1. Run database initialization and startup
python3 -c "from backend.app.database import engine, Base, SessionLocal; from backend.app.services.seed_data import seed_database; Base.metadata.create_all(bind=engine); db=SessionLocal(); seed_database(db); db.close()"

# 2. Build frontend production assets
cd frontend
npm run build
cd ..

# 3. Start Uvicorn Server binding to 0.0.0.0:8000
python3 -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
