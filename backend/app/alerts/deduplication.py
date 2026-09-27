from typing import Optional

def should_notify(location_id: int, new_severity: str, current_risk: Optional[str]) -> bool:
    """
    Determine if a notification should be sent to prevent spam.
    Returns True if the severity is new or escalated.
    """
    if current_risk is None:
        return True
        
    severity_levels = {"LOW": 1, "MODERATE": 2, "HIGH": 3, "CRITICAL": 4}
    
    new_level = severity_levels.get(new_severity, 0)
    current_level = severity_levels.get(current_risk, 0)
    
    # Notify if escalated or still critical
    return new_level > current_level or new_level == 4
