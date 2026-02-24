import os
import sys
import logging
from datetime import datetime, timedelta, date

from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings  # type: ignore
from app.models.habit import FeedEvent  # type: ignore


logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

DATABASE_URL = settings.DATABASE_URL

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def cleanup_old_notifications() -> None:
    db = SessionLocal()
    try:
        today = date.today()
        cutoff_date = today - timedelta(days=14)

        logging.info("Starting cleanup for feed events on or before %s", cutoff_date.isoformat())

        deleted = (
            db.query(FeedEvent)
            .filter(func.date(FeedEvent.created_at) <= cutoff_date)
            .delete(synchronize_session=False)
        )
        db.commit()

        logging.info("Deleted %d old feed events", deleted)
    except Exception as e:
        logging.error("Cleanup failed: %s", e)
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    cleanup_old_notifications()

