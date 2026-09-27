from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any

async def process_prediction_and_alert(db: AsyncSession, prediction_data: Dict[str, Any]):
    """
    Process prediction, evaluate thresholds (MODERATE: 25%, HIGH: 50%, CRITICAL: 75%), 
    trigger alert creation and dispatch.
    """
    probability = prediction_data.get("probability", 0)
    severity = "LOW"
    if probability >= 75:
        severity = "CRITICAL"
    elif probability >= 50:
        severity = "HIGH"
    elif probability >= 25:
        severity = "MODERATE"
        
    if severity != "LOW":
        # Create alert in DB and trigger notification task
        from app.workers.tasks import dispatch_notification_task
        print(f"Triggering alert for {prediction_data.get('location_id')} with severity {severity}")
        # In a real app we'd save to DB and get alert_id
        alert_id = 1 
        dispatch_notification_task.delay(alert_id)
