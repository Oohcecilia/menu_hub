import os
import aiomysql
import logging
from dotenv import load_dotenv
from fastapi import HTTPException

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
    try:
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

        print("\n\n ✅ Successfully connected to MariaDB (pool created) \n\n")

    except Exception as e:
        print("❌ Failed to initialize DB pool")
        raise


# ---------------------------
# GET CONNECTION (DEPENDENCY)
# ---------------------------
async def get_conn():
    try:
        if not pool:
            logger.error("DB pool not initialized")
            raise HTTPException(
                status_code=500,
                detail="Database connection not initialized"
            )

        async with pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:
                yield cur

    except aiomysql.MySQLError as e:
        logger.error(f"MySQL error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Database query failed"
        )

    except Exception as e:
        logger.exception("Unexpected database error")
        raise HTTPException(
            status_code=500,
            detail="Internal server error while accessing database"
        )