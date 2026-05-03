import json
from typing import List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from database import get_db
import models
import schemas
from services.katago_service import move_to_gtp

router = APIRouter(prefix="/joseki", tags=["joseki"])

SAMPLE_JOSEKI = [
    {
        "name": "Small Avalanche",
        "name_cn": "小雪崩",
        "category": "corner",
        "board_size": 19,
        "description": "经典小雪崩定式，白棋雪崩型进攻",
        "difficulty": "intermediate",
        "moves": [
            {"color": "B", "position": {"row": 3, "col": 15}, "is_pass": False},
            {"color": "W", "position": {"row": 3, "col": 3}, "is_pass": False},
            {"color": "B", "position": {"row": 15, "col": 3}, "is_pass": False},
            {"color": "W", "position": {"row": 16, "col": 3}, "is_pass": False},
            {"color": "B", "position": {"row": 15, "col": 4}, "is_pass": False},
            {"color": "W", "position": {"row": 14, "col": 4}, "is_pass": False},
        ]
    },
    {
        "name": "Large Avalanche",
        "name_cn": "大雪崩",
        "category": "corner",
        "board_size": 19,
        "description": "复杂的大雪崩定式，包含多种变化",
        "difficulty": "advanced",
        "moves": [
            {"color": "B", "position": {"row": 3, "col": 15}, "is_pass": False},
            {"color": "W", "position": {"row": 3, "col": 3}, "is_pass": False},
            {"color": "B", "position": {"row": 15, "col": 3}, "is_pass": False},
            {"color": "W", "position": {"row": 16, "col": 3}, "is_pass": False},
            {"color": "B", "position": {"row": 15, "col": 4}, "is_pass": False},
            {"color": "W", "position": {"row": 16, "col": 4}, "is_pass": False},
            {"color": "B", "position": {"row": 14, "col": 4}, "is_pass": False},
        ]
    },
    {
        "name": "Chinese Opening",
        "name_cn": "中国流",
        "category": "opening",
        "board_size": 19,
        "description": "经典中国流布局",
        "difficulty": "intermediate",
        "moves": [
            {"color": "B", "position": {"row": 15, "col": 15}, "is_pass": False},
            {"color": "W", "position": {"row": 3, "col": 3}, "is_pass": False},
            {"color": "B", "position": {"row": 13, "col": 5}, "is_pass": False},
            {"color": "W", "position": {"row": 3, "col": 15}, "is_pass": False},
            {"color": "B", "position": {"row": 15, "col": 9}, "is_pass": False},
        ]
    },
    {
        "name": "Nirensei",
        "name_cn": "二连星",
        "category": "opening",
        "board_size": 19,
        "description": "现代流行布局，注重速度",
        "difficulty": "beginner",
        "moves": [
            {"color": "B", "position": {"row": 15, "col": 15}, "is_pass": False},
            {"color": "W", "position": {"row": 3, "col": 3}, "is_pass": False},
            {"color": "B", "position": {"row": 15, "col": 3}, "is_pass": False},
            {"color": "W", "position": {"row": 3, "col": 15}, "is_pass": False},
        ]
    },
    {
        "name": "Sanrensei",
        "name_cn": "三连星",
        "category": "opening",
        "board_size": 19,
        "description": "武宫正树宇宙流代表布局",
        "difficulty": "intermediate",
        "moves": [
            {"color": "B", "position": {"row": 15, "col": 15}, "is_pass": False},
            {"color": "W", "position": {"row": 3, "col": 3}, "is_pass": False},
            {"color": "B", "position": {"row": 15, "col": 3}, "is_pass": False},
            {"color": "W", "position": {"row": 3, "col": 15}, "is_pass": False},
            {"color": "B", "position": {"row": 15, "col": 9}, "is_pass": False},
        ]
    },
    {
        "name": "Low Approach",
        "name_cn": "低挂",
        "category": "corner",
        "board_size": 19,
        "description": "小目低挂基础定式",
        "difficulty": "beginner",
        "moves": [
            {"color": "B", "position": {"row": 3, "col": 15}, "is_pass": False},
            {"color": "W", "position": {"row": 15, "col": 15}, "is_pass": False},
            {"color": "B", "position": {"row": 16, "col": 3}, "is_pass": False},
        ]
    },
    {
        "name": "High Approach",
        "name_cn": "高挂",
        "category": "corner",
        "board_size": 19,
        "description": "小目高挂定式",
        "difficulty": "intermediate",
        "moves": [
            {"color": "B", "position": {"row": 3, "col": 15}, "is_pass": False},
            {"color": "W", "position": {"row": 15, "col": 15}, "is_pass": False},
            {"color": "B", "position": {"row": 15, "col": 5}, "is_pass": False},
        ]
    },
    {
        "name": "Knight's Move",
        "name_cn": "小飞挂",
        "category": "corner",
        "board_size": 19,
        "description": "星位小飞挂定式",
        "difficulty": "beginner",
        "moves": [
            {"color": "B", "position": {"row": 15, "col": 15}, "is_pass": False},
            {"color": "W", "position": {"row": 16, "col": 17}, "is_pass": False},
            {"color": "B", "position": {"row": 17, "col": 16}, "is_pass": False},
        ]
    },
]


@router.get("/categories", response_model=List[schemas.JosekiCategory])
async def get_categories():
    categories = {}
    for joseki in SAMPLE_JOSEKI:
        cat = joseki["category"]
        diff = joseki["difficulty"]
        if cat not in categories:
            categories[cat] = {"name": cat, "count": 0, "difficulties": {"beginner": 0, "intermediate": 0, "advanced": 0}}
        categories[cat]["count"] += 1
        if diff in categories[cat]["difficulties"]:
            categories[cat]["difficulties"][diff] += 1
    return list(categories.values())


@router.get("/", response_model=List[schemas.JosekiResponse])
async def get_joseki_list(
    category: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    result = []
    for i, joseki in enumerate(SAMPLE_JOSEKI):
        if category and joseki["category"] != category:
            continue
        if difficulty and joseki["difficulty"] != difficulty:
            continue
        if search:
            search_lower = search.lower()
            if (search_lower not in joseki["name"].lower() and
                (not joseki.get("name_cn") or search_lower not in joseki["name_cn"])):
                continue
        result.append({
            "id": i + 1,
            **joseki,
            "created_at": "2024-01-01T00:00:00",
            "updated_at": "2024-01-01T00:00:00"
        })

    return result[offset:offset + limit]


@router.get("/{joseki_id}", response_model=schemas.JosekiResponse)
async def get_joseki(joseki_id: int):
    if joseki_id < 1 or joseki_id > len(SAMPLE_JOSEKI):
        raise HTTPException(status_code=404, detail="Joseki not found")

    joseki = SAMPLE_JOSEKI[joseki_id - 1]
    return {
        "id": joseki_id,
        **joseki,
        "created_at": "2024-01-01T00:00:00",
        "updated_at": "2024-01-01T00:00:00"
    }


@router.get("/random/{category}", response_model=schemas.JosekiResponse)
async def get_random_joseki(category: str = "corner", difficulty: Optional[str] = None):
    filtered = []
    for i, joseki in enumerate(SAMPLE_JOSEKI):
        if category != "all" and joseki["category"] != category:
            continue
        if difficulty and joseki["difficulty"] != difficulty:
            continue
        filtered.append((i + 1, joseki))

    if not filtered:
        if SAMPLE_JOSEKI:
            filtered = [(1, SAMPLE_JOSEKI[0])]
        else:
            raise HTTPException(status_code=404, detail="No joseki found")

    import random
    joseki_id, joseki = random.choice(filtered)

    return {
        "id": joseki_id,
        **joseki,
        "created_at": "2024-01-01T00:00:00",
        "updated_at": "2024-01-01T00:00:00"
    }
