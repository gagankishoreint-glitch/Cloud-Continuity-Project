from backend.app.routers.auth import router as auth_router
from backend.app.routers.tasks import router as tasks_router
from backend.app.routers.checkpoints import router as checkpoints_router
from backend.app.routers.recovery import router as recovery_router
from backend.app.routers.experiments import router as experiments_router
from backend.app.routers.aws import router as aws_router
from backend.app.routers.lambda_tasks import router as lambda_router
from backend.app.routers.privacy import router as privacy_router

__all__ = [
    "auth_router",
    "tasks_router",
    "checkpoints_router",
    "recovery_router",
    "experiments_router",
    "aws_router",
    "lambda_router",
    "privacy_router"
]
