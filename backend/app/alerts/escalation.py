from typing import Optional

def check_escalation(previous_severity: Optional[str], new_severity: str) -> str:
    """Check if risk escalated, reduced or stayed same."""
    severity_levels = {"LOW": 1, "MODERATE": 2, "HIGH": 3, "CRITICAL": 4}
    
    prev = severity_levels.get(previous_severity, 0) if previous_severity else 0
    new_lvl = severity_levels.get(new_severity, 0)
    
    if new_lvl > prev:
        return "ESCALATED"
    elif new_lvl < prev:
        return "REDUCED"
    return "UNCHANGED"
