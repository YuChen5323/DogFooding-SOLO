from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from database import get_db
import models
import schemas

router = APIRouter(prefix="/training", tags=["training"])


@router.post("/attempt")
async def record_training_attempt(
    attempt: schemas.TrainingAttempt,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(models.TrainingProgress).where(
            models.TrainingProgress.joseki_id == attempt.joseki_id
        )
    )
    progress = result.scalar_one_or_none()

    if not progress:
        progress = models.TrainingProgress(
            joseki_id=attempt.joseki_id,
            attempts=1,
            correct_attempts=1 if attempt.correct else 0,
            last_attempt_at=datetime.utcnow()
        )
        db.add(progress)
    else:
        progress.attempts += 1
        if attempt.correct:
            progress.correct_attempts += 1
        progress.last_attempt_at = datetime.utcnow()

    await db.commit()

    return {
        "success": True,
        "attempts": progress.attempts,
        "correct_attempts": progress.correct_attempts,
        "accuracy": progress.correct_attempts / progress.attempts if progress.attempts > 0 else 0
    }


@router.get("/progress/{joseki_id}", response_model=schemas.TrainingProgressResponse)
async def get_training_progress(
    joseki_id: int,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(models.TrainingProgress).where(
            models.TrainingProgress.joseki_id == joseki_id
        )
    )
    progress = result.scalar_one_or_none()

    if not progress:
        return schemas.TrainingProgressResponse(
            joseki_id=joseki_id,
            attempts=0,
            correct_attempts=0,
            accuracy=0.0,
            last_attempt_at=None
        )

    accuracy = progress.correct_attempts / progress.attempts if progress.attempts > 0 else 0.0

    return schemas.TrainingProgressResponse(
        joseki_id=progress.joseki_id,
        attempts=progress.attempts,
        correct_attempts=progress.correct_attempts,
        accuracy=accuracy,
        last_attempt_at=progress.last_attempt_at
    )


@router.get("/stats")
async def get_training_stats(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.TrainingProgress))
    all_progress = result.scalars().all()

    total_attempts = sum(p.attempts for p in all_progress)
    total_correct = sum(p.correct_attempts for p in all_progress)

    accuracy = total_correct / total_attempts if total_attempts > 0 else 0.0

    category_stats = {}
    for p in all_progress:
        p_acc = p.correct_attempts / p.attempts if p.attempts > 0 else 0.0
        if p_acc >= 0.9:
            level = "mastered"
        elif p_acc >= 0.7:
            level = "learning"
        else:
            level = "beginner"
        if level not in category_stats:
            category_stats[level] = 0
        category_stats[level] += 1

    return {
        "total_attempts": total_attempts,
        "total_correct": total_correct,
        "overall_accuracy": accuracy,
        "total_joseki_attempted": len(all_progress),
        "level_distribution": category_stats
    }
