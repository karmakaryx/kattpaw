import logging
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from db import init_db
from graph import build_graph
from routers import files, chat, rag
from routers.chat import set_graph

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("kattpaw")

limiter = Limiter(key_func=get_remote_address)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🐾 [STARTUP] MCP 서버 연결 중...")
    init_db()
    app_graph, mcp_client = await build_graph()
    set_graph(app_graph)
    logger.info("🐈‍⬛ [STARTUP] KattPaw 그래프 준비 완료")
    yield
    logger.info("🐈‍⬛ [SHUTDOWN] MCP 클라이언트 종료")

app = FastAPI(lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

_raw_origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173")
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def verify_key(request: Request, data: dict):
    ...
    # Note by Karyx💫: This code is omitted to protect my intellectual property.

app.include_router(files.router)
app.include_router(chat.router)
app.include_router(rag.router)
