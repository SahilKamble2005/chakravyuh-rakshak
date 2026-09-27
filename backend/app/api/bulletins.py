from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.models import Bulletin, CyclonicSystem
from app.schemas import BulletinResponse

router = APIRouter(prefix="/api/bulletins", tags=["bulletins"])

@router.get("", response_model=List[BulletinResponse])
async def get_bulletins(
    system_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(Bulletin).order_by(Bulletin.issued_at.desc())
    if system_id:
        query = query.where(Bulletin.system_id == system_id)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{bulletin_id}", response_model=BulletinResponse)
async def get_bulletin_by_id(
    bulletin_id: int,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Bulletin).where(Bulletin.id == bulletin_id))
    bulletin = result.scalars().first()
    if not bulletin:
        raise HTTPException(status_code=404, detail="Bulletin not found")
    return bulletin

@router.get("/{bulletin_id}/download")
async def download_bulletin_text(
    bulletin_id: int,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Bulletin).where(Bulletin.id == bulletin_id))
    bulletin = result.scalars().first()
    if not bulletin:
        raise HTTPException(status_code=404, detail="Bulletin not found")

    content = f"""================================================================================
CHAKRAVYUH RAKSHAK — OFFICIAL CYCLONE EARLY WARNING BULLETIN
RSMC / IMD AUTHORIZED ADVISORY
================================================================================
BULLETIN NO: {bulletin.bulletin_number}
ISSUED AT:   {bulletin.issued_at.strftime('%Y-%m-%d %H:%M:%S UTC')}
CATEGORY:    {bulletin.category}
MAX WINDS:   {bulletin.wind_kmh} KM/H ({round(bulletin.wind_kmh/1.852, 1)} KT)
PRESSURE:    {bulletin.pressure_hpa} HPA

LANDFALL OUTLOOK:
{bulletin.landfall_summary}

PORT SIGNALS & MARITIME WARNINGS:
{bulletin.warning_signals}

FISHERMEN ADVISORY:
{bulletin.fishermen_warning}

FULL METEOROLOGICAL DISPATCH:
{bulletin.full_text}

--------------------------------------------------------------------------------
CRYPTOGRAPHIC INTEGRITY & BLOCKCHAIN PROVENANCE
SHA-256 HASH: {bulletin.sha256_hash}
LEDGER TX:    {bulletin.blockchain_tx_ref}
BLOCK NUMBER: #{bulletin.block_number}
VERIFICATION: Validated by Chakravyuh Rakshak Decentralized Oracle Network
================================================================================
"""
    return Response(
        content=content,
        media_type="text/plain",
        headers={"Content-Disposition": f"attachment; filename={bulletin.bulletin_number}.txt"}
    )
