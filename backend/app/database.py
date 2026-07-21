"""
Database connection setup.

Uses SQLite for local development (zero setup — just a file).
To move to production later, change DATABASE_URL to a Postgres URL,
e.g. postgresql://user:password@host/dbname
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = "sqlite:///./social_app.db"

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Dependency used by route handlers to get a DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()