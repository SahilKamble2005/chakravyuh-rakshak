from app.workers.celery_app import celery_app
import asyncio

@celery_app.task
def run_monitoring_cycle():
    print("Running monitoring cycle...")
    return True

@celery_app.task
def process_satellite_raster(raster_id: int):
    print(f"Processing satellite raster {raster_id}...")
    return True

@celery_app.task
def anchor_blockchain_record_task(record_id: int):
    print(f"Anchoring blockchain record {record_id}...")
    return True

@celery_app.task
def dispatch_notification_task(alert_id: int):
    print(f"Dispatching notification for alert {alert_id}...")
    return True
