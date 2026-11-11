import json
import logging
import os
import traceback
from typing import Literal, List, Dict, Optional

from fastapi import APIRouter, HTTPException, Header, Request
from pydantic import BaseModel
from langchain_core.messages import AIMessage, HumanMessage
from slowapi import Limiter
from slowapi.util import get_remote_address

import conf
from db import get_db_connection

GRAPH_RECURSION_LIMIT = int(os.getenv("GRAPH_RECURSION_LIMIT"))

logger = logging.getLogger("kattpaw")
limiter = Limiter(key_func=get_remote_address)
router = APIRouter()
_app_graph = None  # main.py에서 주입

def _require_api_key(key: Optional[str]) -> str:
    if not key:
        raise HTTPException(status_code=401, detail="API Key가 필요하다냥")
    return key

def set_graph(graph):
    global _app_graph
    _app_graph = graph

class KattRequest(BaseModel):
    ...
    # Note by Karyx💫: This code is omitted to protect my intellectual property.
