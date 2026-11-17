import json
import os
import platform
import re as _re
import sqlite3
import subprocess
import sys
from datetime import datetime
from pathlib import Path

from langchain_openai import ChatOpenAI
from mcp.server.fastmcp import FastMCP
from openai import OpenAI
from tavily import TavilyClient

from db import DB_PATH, get_db_connection, init_db

if platform.system() != "Windows":
    import resource
else:
    resource = None

# ------------------------------------------------------------------------------
# 기본 설정
# ------------------------------------------------------------------------------
BASE_TEMP_DIR = str(
    Path(os.getenv("KATTPAW_TEMP_DIR", str(Path.home() / "Downloads" / "kattpaw_temp"))).resolve()
)
os.makedirs(BASE_TEMP_DIR, exist_ok=True)
mcp = FastMCP("KattPaw")

def _make_llm(api_key: str, model: str = "gpt-4o-mini") -> ChatOpenAI:
    """유저 API 키로 LLM 인스턴스를 생성한다."""
    if not api_key:
        raise ValueError("API 키가 없다냥! 유저 키가 필요하다냥")
    return ChatOpenAI(model=model, temperature=0, api_key=api_key)

# ------------------------------------------------------------------------------
# DB 초기화
# ------------------------------------------------------------------------------
def get_db_connection():
    return sqlite3.connect(DB_PATH)

def init_db():
    ...
    # Note by Karyx💫: This code is omitted to protect my intellectual property.

# ------------------------------------------------------------------------------
# 서버 실행
# ------------------------------------------------------------------------------
if __name__ == "__main__":
    mcp.run(transport="stdio")
