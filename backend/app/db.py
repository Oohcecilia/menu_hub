import os
import aiomysql
from dotenv import load_dotenv

load_dotenv()

# ---------------------------
# ENV CONFIG (safe defaults)
# ---------------------------
DB_HOST = os.getenv("DB_HOST", "host.docker.internal")
DB_PORT = int(os.getenv("DB_PORT", 3306))
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "")

pool = None


# ---------------------------
# INIT DB POOL
# ---------------------------
async def init_db_pool():
    global pool

    if pool:
        return  # prevent double init

    pool = await aiomysql.create_pool(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        db=DB_NAME,
        autocommit=True,
        minsize=1,
        maxsize=10,
    )


# ---------------------------
# GET CONNECTION (DEPENDENCY)
# ---------------------------
async def get_conn():
    if not pool:
        raise RuntimeError("DB pool not initialized. Call init_db_pool() first.")

    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            yield cur