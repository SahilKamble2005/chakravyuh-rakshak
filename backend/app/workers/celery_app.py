import os
from celery import Celery

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "chakravyuh_rakshak",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["app.workers.tasks"]
)

celery_app.conf.update(
    task_routes={
        "app.workers.tasks.run_monitoring_cycle": {"queue": "monitoring_queue"},
        "app.workers.tasks.process_satellite_raster": {"queue": "raster_queue"},
        "app.workers.tasks.anchor_blockchain_record_task": {"queue": "blockchain_queue"},
        "app.workers.tasks.dispatch_notification_task": {"queue": "notification_queue"},
    }
)
