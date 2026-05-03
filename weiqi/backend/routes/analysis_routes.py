import json
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel
import schemas
from services.katago_service import get_katago_service, move_to_gtp, gtp_to_move

router = APIRouter(prefix="/analysis", tags=["analysis"])


class PositionAnalysisRequest(BaseModel):
    board_size: int = 19
    moves: List[Dict[str, Any]] = []
    komi: float = 6.5
    max_visits: int = 1000


class FullAnalysisRequest(BaseModel):
    board_size: int = 19
    moves: List[Dict[str, Any]] = []
    komi: float = 6.5
    max_visits: int = 500


@router.post("/position", response_model=Dict[str, Any])
async def analyze_position(request: PositionAnalysisRequest):
    katago = await get_katago_service()

    gtp_moves = []
    for move in request.moves:
        if move.get("is_pass"):
            gtp_moves.append("pass")
        elif move.get("position"):
            pos = move["position"]
            gtp_move = move_to_gtp(pos["row"], pos["col"], request.board_size)
            gtp_moves.append(gtp_move)

    analysis = await katago.analyze_position(
        board_size=request.board_size,
        moves=gtp_moves,
        komi=request.komi,
        max_visits=request.max_visits
    )

    suggestions = []
    for rec in analysis.get("recommendations", []):
        row, col = gtp_to_move(rec["move"], request.board_size)
        if row is not None and col is not None:
            suggestions.append({
                "row": row,
                "col": col,
                "label": str(rec["rank"]),
                "winRate": rec["winrate"],
                "scoreLead": rec["score_lead"],
                "visits": rec["visits"]
            })

    return {
        "success": True,
        "currentPlayer": analysis.get("current_player"),
        "winRate": analysis.get("winrate"),
        "scoreLead": analysis.get("score_lead"),
        "suggestions": suggestions[:8],
        "katagoAvailable": katago.available if hasattr(katago, 'available') else False
    }


@router.post("/full", response_model=Dict[str, Any])
async def analyze_full_game(request: FullAnalysisRequest):
    katago = await get_katago_service()

    move_analyses = []
    previous_winrate = 0.5

    gtp_moves = []
    for i, move in enumerate(request.moves):
        if move.get("is_pass"):
            gtp_moves.append("pass")
        elif move.get("position"):
            pos = move["position"]
            gtp_move = move_to_gtp(pos["row"], pos["col"], request.board_size)
            gtp_moves.append(gtp_move)

    for step in range(len(gtp_moves) + 1):
        current_moves = gtp_moves[:step]

        try:
            analysis = await katago.analyze_position(
                board_size=request.board_size,
                moves=current_moves,
                komi=request.komi,
                max_visits=request.max_visits
            )

            current_winrate = analysis.get("winrate", 0.5)

            if step > 0:
                color = "W" if step % 2 == 1 else "B"
                move_number = step
                move_str = gtp_moves[step - 1] if step - 1 < len(gtp_moves) else "pass"

                winrate_change = current_winrate - previous_winrate
                if color == "W":
                    winrate_change = -winrate_change

                if winrate_change < -0.15:
                    classification = "blunder"
                elif winrate_change < -0.08:
                    classification = "questionable"
                elif winrate_change > 0.1:
                    classification = "good"
                else:
                    classification = "normal"

                move_analyses.append({
                    "move_number": move_number,
                    "move": move_str,
                    "color": color,
                    "winrate": current_winrate,
                    "score_lead": analysis.get("score_lead", 0),
                    "winrate_change": winrate_change,
                    "classification": classification,
                    "recommendations": analysis.get("recommendations", [])
                })

            previous_winrate = current_winrate

        except Exception as e:
            print(f"Analysis error at step {step}: {e}")
            continue

    return {
        "success": True,
        "board_size": request.board_size,
        "komi": request.komi,
        "move_analyses": move_analyses,
        "katagoAvailable": katago.available if hasattr(katago, 'available') else False
    }


@router.get("/status", response_model=schemas.KataGoStatus)
async def get_katago_status():
    katago = await get_katago_service()
    status = await katago.get_status()
    return schemas.KataGoStatus(
        available=status.get("available", False),
        message=status.get("message", "Unknown status"),
        version=status.get("version")
    )
