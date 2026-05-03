from datetime import datetime
from typing import Optional, List, Any
from sqlalchemy import String, Text, DateTime, Integer, Float, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class Joseki(Base):
    __tablename__ = "joseki"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    name_cn: Mapped[str] = mapped_column(String(200), nullable=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    board_size: Mapped[int] = mapped_column(Integer, default=19)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    difficulty: Mapped[str] = mapped_column(String(20), default="beginner")
    moves_json: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class GameRecord(Base):
    __tablename__ = "game_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    player_black: Mapped[str] = mapped_column(String(100), default="Black")
    player_white: Mapped[str] = mapped_column(String(100), default="White")
    board_size: Mapped[int] = mapped_column(Integer, default=19)
    handicap: Mapped[int] = mapped_column(Integer, default=0)
    komi: Mapped[float] = mapped_column(Float, default=6.5)
    result: Mapped[str] = mapped_column(String(50), nullable=True)
    moves_json: Mapped[str] = mapped_column(Text, nullable=True)
    analysis_json: Mapped[str] = mapped_column(Text, nullable=True)
    tags: Mapped[str] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class TrainingProgress(Base):
    __tablename__ = "training_progress"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    joseki_id: Mapped[int] = mapped_column(Integer, ForeignKey("joseki.id"), index=True)
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    correct_attempts: Mapped[int] = mapped_column(Integer, default=0)
    last_attempt_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
