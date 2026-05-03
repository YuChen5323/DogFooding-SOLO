import asyncio
import json
import re
from typing import List, Optional, Dict, Any
from abc import ABC, abstractmethod
from config import settings


class KataGoInterface(ABC):
    @abstractmethod
    async def analyze_position(
        self,
        board_size: int,
        moves: List[str],
        komi: float,
        max_visits: int = 1000
    ) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def get_status(self) -> Dict[str, Any]:
        pass


class MockKataGoService(KataGoInterface):
    def __init__(self):
        self.available = False
        self._mock_wr_cache = {}

    def _generate_mock_analysis(
        self,
        board_size: int,
        moves: List[str],
        komi: float
    ) -> Dict[str, Any]:
        move_count = len(moves)
        base_winrate = 0.55 - (move_count * 0.002)
        base_winrate = max(0.1, min(0.9, base_winrate))

        if move_count % 2 == 1:
            base_winrate = 1 - base_winrate

        recommendations = self._generate_mock_recommendations(board_size, move_count)

        return {
            "board_size": board_size,
            "current_player": "W" if move_count % 2 == 1 else "B",
            "winrate": base_winrate,
            "score_lead": (base_winrate - 0.5) * 20,
            "recommendations": recommendations,
            "move_analyses": []
        }

    def _generate_mock_recommendations(
        self,
        board_size: int,
        move_count: int
    ) -> List[Dict[str, Any]]:
        corner_positions = [
            (3, 3), (3, 15), (15, 3), (15, 15),
            (4, 16), (16, 4), (16, 16), (4, 4),
            (3, 16), (16, 3), (4, 3), (3, 4),
            (16, 15), (15, 16), (6, 3), (3, 6),
        ]

        base_winrate = 0.55 - (move_count * 0.002)
        recommendations = []

        for i, (row, col) in enumerate(corner_positions[:8]):
            if row >= board_size or col >= board_size:
                continue

            move_letter = chr(ord('A') + col) if col < 8 else chr(ord('A') + col + 1)
            move_num = board_size - row

            winrate_delta = 0.08 - (i * 0.01)
            visits = 2000 - (i * 200)

            recommendations.append({
                "move": f"{move_letter}{move_num}",
                "winrate": base_winrate + winrate_delta - 0.04,
                "score_lead": (winrate_delta - 0.04) * 15,
                "visits": max(100, visits),
                "rank": i + 1
            })

        return sorted(recommendations, key=lambda x: x["winrate"], reverse=True)

    async def analyze_position(
        self,
        board_size: int,
        moves: List[str],
        komi: float,
        max_visits: int = 1000
    ) -> Dict[str, Any]:
        await asyncio.sleep(0.3)
        return self._generate_mock_analysis(board_size, moves, komi)

    async def get_status(self) -> Dict[str, Any]:
        return {
            "available": False,
            "message": "KataGo not configured - using mock analysis",
            "version": None
        }


class KataGoGTPInterface(KataGoInterface):
    def __init__(self):
        self.katago_path = settings.KATAGO_PATH
        self.katago_config = settings.KATAGO_CONFIG
        self.katago_model = settings.KATAGO_MODEL
        self.process: Optional[asyncio.subprocess.Process] = None
        self.available = False

    async def start(self):
        if not self.katago_path:
            return

        try:
            cmd = [self.katago_path, "gtp"]
            if self.katago_model:
                cmd.extend(["-model", self.katago_model])
            if self.katago_config:
                cmd.extend(["-config", self.katago_config])

            self.process = await asyncio.create_subprocess_exec(
                *cmd,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            await self._send_command("name")
            await self._send_command("version")

            self.available = True
        except Exception as e:
            print(f"Failed to start KataGo: {e}")
            self.available = False

    async def stop(self):
        if self.process:
            try:
                await self._send_command("quit")
                await asyncio.wait_for(self.process.wait(), timeout=5.0)
            except:
                self.process.terminate()
                try:
                    await asyncio.wait_for(self.process.wait(), timeout=3.0)
                except:
                    self.process.kill()
                    await self.process.wait()
            finally:
                self.process = None
                self.available = False

    async def _send_command(self, command: str, timeout: float = 60.0) -> str:
        if not self.process:
            raise RuntimeError("KataGo process not running")

        try:
            self.process.stdin.write(f"{command}\n".encode())
            await self.process.stdin.drain()

            response_lines = []
            done = False

            async def read_with_timeout():
                nonlocal done
                while not done:
                    line = await asyncio.wait_for(
                        self.process.stdout.readline(),
                        timeout=timeout
                    )
                    if not line:
                        break
                    decoded = line.decode().rstrip()
                    if decoded == "":
                        if response_lines:
                            done = True
                        continue
                    response_lines.append(decoded)

            await read_with_timeout()

            return "\n".join(response_lines)
        except asyncio.TimeoutError:
            raise TimeoutError("KataGo command timeout")

    async def analyze_position(
        self,
        board_size: int,
        moves: List[str],
        komi: float,
        max_visits: int = 1000
    ) -> Dict[str, Any]:
        if not self.available:
            raise RuntimeError("KataGo not available")

        await self._send_command(f"boardsize {board_size}")
        await self._send_command(f"komi {komi}")
        await self._send_command("clear_board")

        for i, move in enumerate(moves):
            color = "black" if i % 2 == 0 else "white"
            if move == "pass":
                await self._send_command(f"play {color} pass")
            else:
                await self._send_command(f"play {color} {move}")

        lz_query = f"lz-genmove_analyze"
        current_color = "white" if len(moves) % 2 == 1 else "black"
        lz_query += f" {current_color}"
        lz_query += f" -maxvisits {max_visits}"

        response = await self._send_command(lz_query, timeout=300.0)

        return self._parse_analysis_response(response, board_size, len(moves))

    def _parse_analysis_response(
        self,
        response: str,
        board_size: int,
        move_count: int
    ) -> Dict[str, Any]:
        recommendations = []
        winrate = 0.5
        score_lead = 0.0

        for line in response.split("\n"):
            if line.startswith("info"):
                parts = line.split()

                move_val = None
                winrate_val = None
                score_val = None
                visits_val = 0
                pv_val = []

                i = 0
                while i < len(parts):
                    if parts[i] == "move" and i + 1 < len(parts):
                        move_val = parts[i + 1]
                        i += 2
                    elif parts[i] == "winrate" and i + 1 < len(parts):
                        winrate_val = float(parts[i + 1]) / 100
                        i += 2
                    elif parts[i] == "scoreLead" and i + 1 < len(parts):
                        score_val = float(parts[i + 1])
                        i += 2
                    elif parts[i] == "visits" and i + 1 < len(parts):
                        visits_val = int(parts[i + 1])
                        i += 2
                    elif parts[i] == "pv":
                        pv_val = parts[i + 1:]
                        break
                    else:
                        i += 1

                if move_val and winrate_val is not None:
                    recommendations.append({
                        "move": move_val,
                        "winrate": winrate_val,
                        "score_lead": score_val or 0.0,
                        "visits": visits_val,
                        "rank": len(recommendations) + 1
                    })

        recommendations = sorted(recommendations, key=lambda x: x["winrate"], reverse=True)

        if recommendations:
            winrate = recommendations[0]["winrate"]
            score_lead = recommendations[0]["score_lead"]

        return {
            "board_size": board_size,
            "current_player": "W" if move_count % 2 == 1 else "B",
            "winrate": winrate,
            "score_lead": score_lead,
            "recommendations": recommendations[:8],
            "move_analyses": []
        }

    async def get_status(self) -> Dict[str, Any]:
        if not self.available:
            return {
                "available": False,
                "message": "KataGo not available",
                "version": None
            }

        try:
            name_resp = await self._send_command("name")
            version_resp = await self._send_command("version")
            return {
                "available": True,
                "message": f"Connected to {name_resp or 'KataGo'}",
                "version": version_resp or "unknown"
            }
        except:
            return {
                "available": False,
                "message": "KataGo connection error",
                "version": None
            }


_katago_instance: Optional[KataGoInterface] = None


async def get_katago_service() -> KataGoInterface:
    global _katago_instance
    if _katago_instance is None:
        if settings.KATAGO_PATH:
            _katago_instance = KataGoGTPInterface()
            await _katago_instance.start()
        else:
            _katago_instance = MockKataGoService()
    return _katago_instance


def move_to_gtp(row: int, col: int, board_size: int) -> str:
    if col >= 8:
        col += 1
    letter = chr(ord('A') + col)
    number = board_size - row
    return f"{letter}{number}"


def gtp_to_move(gtp_move: str, board_size: int) -> tuple:
    if gtp_move.lower() == "pass":
        return (None, None)
    gtp_move = gtp_move.upper()
    letter = gtp_move[0]
    num_str = gtp_move[1:]
    col = ord(letter) - ord('A')
    if col > 8:
        col -= 1
    number = int(num_str)
    row = board_size - number
    return (row, col)
