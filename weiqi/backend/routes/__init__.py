from .joseki_routes import router as joseki_router
from .analysis_routes import router as analysis_router
from .game_routes import router as game_router
from .training_routes import router as training_router

__all__ = [
    "joseki_router",
    "analysis_router",
    "game_router",
    "training_router",
]
