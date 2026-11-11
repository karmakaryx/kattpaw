import json
import logging
import traceback
from typing import Optional

from fastapi import APIRouter, HTTPException, Header, Request
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address

logger = logging.getLogger("kattpaw")
limiter = Limiter(key_func=get_remote_address)
router = APIRouter()

def _require_api_key(key: Optional[str]) -> str:
    if not key:
        raise HTTPException(status_code=401, detail="API Key가 필요하다냥")
    return key

class SearchRequest(BaseModel):
    ...
    # Note by Karyx💫: This code is omitted to protect my intellectual property.
