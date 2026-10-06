import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import init_db, AsyncSessionLocal
from app.routers import auth, documents, actions, reminders, events, search, analytics, users
from app.seed_data import seed_database_if_empty

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("kurippu")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure upload folder exists
    os.makedirs(settings.STORAGE_PATH, exist_ok=True)
    # Initialize DB tables
    await init_db()
    # Seed demo data
    async with AsyncSessionLocal() as session:
        try:
            await seed_database_if_empty(session)
        except Exception as e:
            logger.warning(f"Demo seed notice: {e}")
    logger.info("KURIPPU backend started successfully.")
    yield
    logger.info("KURIPPU backend shutting down.")


app = FastAPI(
    title="KURIPPU API",
    description="Intelligent Document-to-Action Platform Backend",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows Vite dev server & any port during development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for uploaded documents preview
os.makedirs(settings.STORAGE_PATH, exist_ok=True)
app.mount("/static/uploads", StaticFiles(directory=settings.STORAGE_PATH), name="uploads")

# Include Routers
app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(actions.router)
app.include_router(reminders.router)
app.include_router(events.router)
app.include_router(search.router)
app.include_router(analytics.router)
app.include_router(users.router)


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "app": "KURIPPU",
        "version": "1.0.0",
        "ai_provider": settings.AI_PROVIDER,
        "storage": settings.STORAGE_PROVIDER,
    }


# Frontend SPA static serving (Production / Docker container)
FRONTEND_DIST_DIR = os.getenv(
    "FRONTEND_DIST_PATH",
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")),
)

if os.path.isdir(FRONTEND_DIST_DIR):
    assets_dir = os.path.join(FRONTEND_DIST_DIR, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="frontend_assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Pass through API, health, static uploads, and docs routes
        if (
            full_path.startswith("api/")
            or full_path.startswith("static/")
            or full_path in ("health", "docs", "redoc", "openapi.json")
        ):
            return JSONResponse(status_code=404, content={"detail": "Not found"})

        # Serve exact file if it exists in dist (e.g. favicon.svg, bg.png, icons.svg)
        candidate = os.path.join(FRONTEND_DIST_DIR, full_path)
        if full_path and os.path.isfile(candidate):
            return FileResponse(candidate)

        # Fallback to index.html for client-side SPA routing
        index_file = os.path.join(FRONTEND_DIST_DIR, "index.html")
        if os.path.isfile(index_file):
            return FileResponse(index_file)

        return JSONResponse(status_code=404, content={"detail": "Not found"})


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please try again."},
    )
