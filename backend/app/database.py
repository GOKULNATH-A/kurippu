import logging
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import StaticPool, NullPool
from app.config import settings
from app.models import Base

logger = logging.getLogger(__name__)

# Normalize DATABASE_URL for async SQLAlchemy
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+asyncpg://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

# Configure pooling depending on dialect
engine_kwargs = {}
if "sqlite" in db_url:
    engine_kwargs = {
        "connect_args": {"check_same_thread": False},
        "poolclass": StaticPool,
    }
else:
    # For Supabase / Postgres asyncpg
    engine_kwargs = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
    }

try:
    engine = create_async_engine(
        db_url,
        echo=False,
        **engine_kwargs,
    )
except Exception as e:
    logger.warning(f"Failed to initialize database engine with {db_url}: {e}. Falling back to SQLite.")
    db_url = "sqlite+aiosqlite:///./kurippu.db"
    engine = create_async_engine(
        db_url,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def init_db():
    """Create all tables on startup if they don't exist."""
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database schema initialized successfully.")
    except Exception as e:
        logger.error(f"Error initializing database schema: {e}")
        raise


async def get_db():
    """FastAPI dependency — yields an async DB session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
