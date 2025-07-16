from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
import os

DB_URL = os.getenv("DB_URL")          # postgresql+asyncpg://...
engine = create_async_engine(DB_URL, pool_size=10, max_overflow=20)
async_session = async_sessionmaker(engine, expire_on_commit=False)
