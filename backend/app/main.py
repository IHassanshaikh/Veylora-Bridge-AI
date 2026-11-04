import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .config import settings
from .database import engine, Base
from .api import api_router
from .services.playwright_runner import EVIDENCE_DIR

# Ensure database tables exist and auto-seed if empty
Base.metadata.create_all(bind=engine)
try:
    from .database import SessionLocal
    from .models import User
    from ..seed_data import seed_database
    db_check = SessionLocal()
    if db_check.query(User).count() == 0:
        db_check.close()
        seed_database()
    else:
        db_check.close()
except Exception as e:
    pass

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Independent AI Trust Layer, Automated Proof of Work & PayPal Payment Protection Platform",
    version="1.0.0"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For hackathon ease of access
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Mount evidence directory for screenshots
os.makedirs(EVIDENCE_DIR, exist_ok=True)
app.mount("/evidence", StaticFiles(directory=EVIDENCE_DIR), name="evidence")

@app.get("/")
def root():
    return {
        "service": settings.PROJECT_NAME,
        "status": "active",
        "tagline": "Don't just trust the promise. Verify the work.",
        "docs_url": "/docs",
        "paypal_mode": settings.PAYPAL_MODE
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": "ok"}

