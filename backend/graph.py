import os
import json
import re as _re
import time
from datetime import datetime
from typing import Any

from langchain.agents import create_agent
from langchain.agents.middleware import AgentMiddleware, AgentState
from langchain.agents.middleware.types import ModelRequest
from langchain_core.runnables import RunnableConfig
from langgraph.config import get_config
from langgraph.runtime import Runtime
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_openai import ChatOpenAI
from typing_extensions import NotRequired

from db import get_db_connection

# ------------------------------------------------------------------------------
# 전역 변수
# ------------------------------------------------------------------------------
MCP_SERVER_PATH = os.path.join(os.path.dirname(__file__), "mcp_server.py")
global_tools = []

# ------------------------------------------------------------------------------
# RAG 키워드 감지
# ------------------------------------------------------------------------------
_CODE_KEYWORDS = (
    "코드", "구현", "작성", "사용", "방법", "예시", "예제", "패턴", "개선", "리뷰",
    "함수", "def", "메서드", "클래스", "class", "객체", "호출", "import", "비동기", "API",
    "반환", "리턴", "return", "파라미터", "인수", "인자", "로직", "알고리즘", "최적화", "리팩토링",
    "에러", "error", "오류", "예외", "exception", "버그", "수정", "fix", "디버깅", "debug",
    "traceback", "라이브러리", "모듈", "패키지", "설치", "pip", "DB", "SQL", "테스트", "test",
)

def _is_code_related_query(query: str) -> bool:
    return any(kw in query.lower() for kw in _CODE_KEYWORDS)

# ------------------------------------------------------------------------------
# configurable에서 API 키를 안전하게 꺼내는 helper
# ------------------------------------------------------------------------------
def _get_api_key(config: RunnableConfig) -> str:
    key = (config.get("configurable") or {}).get("api_key", "")
    if not key:
        raise ValueError("API 키가 없다냥! configurable에 api_key를 전달해야 한다냥")
    return key

# ------------------------------------------------------------------------------
# 커스텀 state 스키마: AgentState 확장
# ------------------------------------------------------------------------------
class KattPawState(AgentState):
    code_snippet: NotRequired[str]
    file_name: NotRequired[str]
    intent: NotRequired[str]
    rag_used: NotRequired[bool]
    usage_metadata: NotRequired[dict]
    node_start_time: NotRequired[float]  # 미들웨어 간 타이머 공유용

# ------------------------------------------------------------------------------
# 커스텀 미들웨어 #1: RAG 컨텍스트 + 동적 시스템 프롬프트
# ------------------------------------------------------------------------------
class RAGPromptMiddleware(AgentMiddleware[KattPawState]):
    ...
    # Note by Karyx💫: This code is omitted to protect my intellectual property.

# ------------------------------------------------------------------------------
# 커스텀 미들웨어 #2: 토큰/시간 모니터링 + CLAW 보안 가드레일
# ------------------------------------------------------------------------------
class MonitorGuardrailMiddleware(AgentMiddleware[KattPawState]):
    ...
    # Note by Karyx💫: This code is omitted to protect my intellectual property.
