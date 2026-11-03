import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
ENV = os.getenv("ENV", "dev")
env_file = BASE_DIR / f".env.{ENV}"

if not env_file.exists():
    raise FileNotFoundError(f"No {env_file} (ENV={ENV})")

load_dotenv(env_file)
