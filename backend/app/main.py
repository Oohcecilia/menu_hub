from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db import init_db_pool
from app.routes.products import router as products_router

app = FastAPI(title="Product API")

# ---------------------------
# CORS SETUP
# ---------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------
# DB INIT
# ---------------------------
@app.on_event("startup")
async def startup():
    await init_db_pool()

# ---------------------------
# ROUTES
# ---------------------------
app.include_router(products_router)