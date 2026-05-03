from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class StoneColor(str, Enum):
    BLACK = "B"
    WHITE = "W"


class Position(BaseModel):
    row: int
    col: int


class Move(BaseModel):
    color: StoneColor
    position: Optional[Position] = None
    is_pass: bool = False
    annotation: Optional[str] = None


class AnalysisRecommendation(BaseModel):
    move: str
    winrate: float
    score_lead: float
    visits: int
    rank: int


class AnalysisMove(BaseModel):
    move_number: int
    move: str
    color: StoneColor
    winrate: float
    score_lead: float
    recommendations: List[AnalysisRecommendation]
    winrate_change: float = 0.0
    classification: str = "normal"


class BoardAnalysis(BaseModel):
    board_size: int
    current_player: StoneColor
    winrate: float
    score_lead: float
    recommendations: List[AnalysisRecommendation]
    move_analyses: List[AnalysisMove]


class JosekiBase(BaseModel):
    name: str
    name_cn: Optional[str] = None
    category: str
    board_size: int = 19
    description: Optional[str] = None
    difficulty: str = "beginner"


class JosekiCreate(JosekiBase):
    moves: List[Move]


class JosekiResponse(JosekiBase):
    id: int
    moves: List[Move]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class JosekiCategory(BaseModel):
    name: str
    count: int
    difficulties: Dict[str, int]


class GameRecordBase(BaseModel):
    player_black: str = "Black"
    player_white: str = "White"
    board_size: int = 19
    handicap: int = 0
    komi: float = 6.5
    result: Optional[str] = None
    tags: Optional[str] = None


class GameRecordCreate(GameRecordBase):
    moves: List[Move] = []


class GameRecordResponse(GameRecordBase):
    id: int
    moves: List[Move]
    analysis: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MoveSuggestion(BaseModel):
    row: int
    col: int
    label: str
    winRate: float
    scoreLead: float
    visits: int
    isCorrect: Optional[bool] = None


class TrainingAttempt(BaseModel):
    joseki_id: int
    user_moves: List[Move]
    correct: bool
    score: int


class TrainingProgressResponse(BaseModel):
    joseki_id: int
    attempts: int
    correct_attempts: int
    accuracy: float
    last_attempt_at: Optional[datetime]


class KataGoStatus(BaseModel):
    available: bool
    message: str
    version: Optional[str] = None
