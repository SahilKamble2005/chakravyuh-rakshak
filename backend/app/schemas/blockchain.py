from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.blockchain import RecordType

class BlockchainRecordResponse(BaseModel):
    id: int
    record_id: str
    location_id: int
    record_type: RecordType
    data_hash: str
    transaction_hash: Optional[str]
    block_number: Optional[int]
    contract_address: Optional[str]
    network: Optional[str]
    status: Optional[str]
    issuer: Optional[str]
    ipfs_cid: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class BlockchainStatsResponse(BaseModel):
    total_records: int
    verified_records: int
    pending_records: int
    failed_records: int
    latest_block: Optional[int]

class VerificationResponse(BaseModel):
    record_id: str
    is_valid: bool
    on_chain_hash: Optional[str]
    local_hash: str
    message: str
