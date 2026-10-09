import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from backend.app.config import settings
from backend.app.database import engine, Base, SessionLocal
from backend.app.routers import (
    auth_router,
    tasks_router,
    checkpoints_router,
    recovery_router,
    experiments_router,
    aws_router,
    lambda_router,
    privacy_router
)
from backend.app.services.seed_data import seed_database

# Initialize DB schema immediately
Base.metadata.create_all(bind=engine)
db_init = SessionLocal()
try:
    seed_database(db_init)
finally:
    db_init.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="A cloud-based system for preserving task context, reducing mental resumption effort, and empirical cognitive workload research.",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(tasks_router, prefix=settings.API_V1_STR)
app.include_router(checkpoints_router, prefix=settings.API_V1_STR)
app.include_router(recovery_router, prefix=settings.API_V1_STR)
app.include_router(experiments_router, prefix=settings.API_V1_STR)
app.include_router(aws_router, prefix=settings.API_V1_STR)
app.include_router(lambda_router, prefix=settings.API_V1_STR)
app.include_router(privacy_router, prefix=settings.API_V1_STR)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Work Continuity Cloud API",
        "version": settings.VERSION,
        "database": "connected",
        "aws_region": settings.AWS_REGION
    }

# Mount static frontend if built
frontend_dist_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "frontend", "dist")

if os.path.exists(frontend_dist_path):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist_path, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Don't intercept API calls
        if full_path.startswith("api/"):
            return JSONResponse(status_code=404, content={"detail": "API endpoint not found"})
            
        file_path = os.path.join(frontend_dist_path, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
            
        index_file = os.path.join(frontend_dist_path, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
            
        return JSONResponse(content={"message": "Frontend build ready. Access via Vite or static assets."})
