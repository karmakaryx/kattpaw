import json
import logging
import os
from pathlib import Path

from fastapi import APIRouter, HTTPException, Header, Request
from typing import Optional
from pydantic import BaseModel

from slowapi import Limiter
from slowapi.util import get_remote_address

# OS별 사용자 로컬 경로 자동 감지
# KATTPAW_TEMP_DIR 환경변수로 오버라이드 가능
_default_temp = Path.home() / "Downloads" / "kattpaw_temp"
BASE_TEMP_DIR = Path(os.getenv("KATTPAW_TEMP_DIR", str(_default_temp))).resolve()
BASE_TEMP_DIR.mkdir(parents=True, exist_ok=True)

logger = logging.getLogger("kattpaw")
limiter = Limiter(key_func=get_remote_address)
router = APIRouter()

def _require_api_key(key: Optional[str]) -> str:
    if not key:
        raise HTTPException(status_code=401, detail="API Key가 필요하다냥")
    return key

def safe_path(path: str) -> Path:
    resolved = (BASE_TEMP_DIR / path).resolve()
    if not str(resolved).startswith(str(BASE_TEMP_DIR)):
        raise HTTPException(status_code=400, detail="접근 권한이 없는 경로다냥")
    return resolved

class KattRequest(BaseModel):
    ...
    # Note by Karyx💫: This code is omitted to protect my intellectual property.
