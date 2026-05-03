import json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
import models
import schemas

router = APIRouter(prefix="/games", tags=["games"])


@router.get("/", response_model=List[schemas.GameRecordResponse])
async def get_game_records(
    db: AsyncSession = Depends(get_db),
    limit: int = 20,
    offset: int = 0
):
    result = await db.execute(
        select(models.GameRecord)
        .order_by(models.GameRecord.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    records = result.scalars().all()

    responses = []
    for record in records:
        moves = json.loads(record.moves_json) if record.moves_json else []
        analysis = json.loads(record.analysis_json) if record.analysis_json else None
        responses.append(schemas.GameRecordResponse(
            id=record.id,
            player_black=record.player_black,
            player_white=record.player_white,
            board_size=record.board_size,
            handicap=record.handicap,
            komi=record.komi,
            result=record.result,
            tags=record.tags,
            moves=moves,
            analysis=analysis,
            created_at=record.created_at,
            updated_at=record.updated_at
        ))
    return responses


@router.get("/{game_id}", response_model=schemas.GameRecordResponse)
async def get_game_record(game_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(models.GameRecord).where(models.GameRecord.id == game_id)
    )
    record = result.scalar_one_or_none()

    if not record:
        raise HTTPException(status_code=404, detail="Game record not found")

    moves = json.loads(record.moves_json) if record.moves_json else []
    analysis = json.loads(record.analysis_json) if record.analysis_json else None

    return schemas.GameRecordResponse(
        id=record.id,
        player_black=record.player_black,
        player_white=record.player_white,
        board_size=record.board_size,
        handicap=record.handicap,
        komi=record.komi,
        result=record.result,
        tags=record.tags,
        moves=moves,
        analysis=analysis,
        created_at=record.created_at,
        updated_at=record.updated_at
    )


@router.post("/", response_model=schemas.GameRecordResponse)
async def create_game_record(
    record: schemas.GameRecordCreate,
    db: AsyncSession = Depends(get_db)
):
    db_record = models.GameRecord(
        player_black=record.player_black,
        player_white=record.player_white,
        board_size=record.board_size,
        handicap=record.handicap,
        komi=record.komi,
        result=record.result,
        tags=record.tags,
        moves_json=json.dumps([m.model_dump() for m in record.moves]) if record.moves else None
    )
    db.add(db_record)
    await db.commit()
    await db.refresh(db_record)

    moves = json.loads(db_record.moves_json) if db_record.moves_json else []
    return schemas.GameRecordResponse(
        id=db_record.id,
        player_black=db_record.player_black,
        player_white=db_record.player_white,
        board_size=db_record.board_size,
        handicap=db_record.handicap,
        komi=db_record.komi,
        result=db_record.result,
        tags=db_record.tags,
        moves=moves,
        created_at=db_record.created_at,
        updated_at=db_record.updated_at
    )


@router.put("/{game_id}", response_model=schemas.GameRecordResponse)
async def update_game_record(
    game_id: int,
    record: schemas.GameRecordCreate,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(models.GameRecord).where(models.GameRecord.id == game_id)
    )
    db_record = result.scalar_one_or_none()

    if not db_record:
        raise HTTPException(status_code=404, detail="Game record not found")

    db_record.player_black = record.player_black
    db_record.player_white = record.player_white
    db_record.board_size = record.board_size
    db_record.handicap = record.handicap
    db_record.komi = record.komi
    db_record.result = record.result
    db_record.tags = record.tags
    db_record.moves_json = json.dumps([m.model_dump() for m in record.moves]) if record.moves else None

    await db.commit()
    await db.refresh(db_record)

    moves = json.loads(db_record.moves_json) if db_record.moves_json else []
    return schemas.GameRecordResponse(
        id=db_record.id,
        player_black=db_record.player_black,
        player_white=db_record.player_white,
        board_size=db_record.board_size,
        handicap=db_record.handicap,
        komi=db_record.komi,
        result=db_record.result,
        tags=db_record.tags,
        moves=moves,
        created_at=db_record.created_at,
        updated_at=db_record.updated_at
    )


@router.delete("/{game_id}")
async def delete_game_record(game_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(models.GameRecord).where(models.GameRecord.id == game_id)
    )
    record = result.scalar_one_or_none()

    if not record:
        raise HTTPException(status_code=404, detail="Game record not found")

    await db.delete(record)
    await db.commit()
    return {"success": True, "message": "Game record deleted"}


@router.post("/{game_id}/analysis")
async def save_analysis(
    game_id: int,
    analysis: dict,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(models.GameRecord).where(models.GameRecord.id == game_id)
    )
    record = result.scalar_one_or_none()

    if not record:
        raise HTTPException(status_code=404, detail="Game record not found")

    record.analysis_json = json.dumps(analysis)
    await db.commit()
    return {"success": True, "message": "Analysis saved"}
