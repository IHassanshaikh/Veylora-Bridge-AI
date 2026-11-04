from fastapi import APIRouter
from .auth import router as auth_router
from .projects import router as projects_router
from .contracts import router as contracts_router
from .milestones import router as milestones_router
from .verifications import router as verifications_router
from .disputes import router as disputes_router
from .payments import router as payments_router
from .timeline import router as timeline_router
from .demo_store import router as demo_store_router
from .invitations import router as invitations_router
from .admin import router as admin_router
from .invoices import router as invoices_router
from .chat import router as chat_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(projects_router)
api_router.include_router(contracts_router)
api_router.include_router(milestones_router)
api_router.include_router(verifications_router)
api_router.include_router(disputes_router)
api_router.include_router(payments_router)
api_router.include_router(timeline_router)
api_router.include_router(demo_store_router)
api_router.include_router(invitations_router)
api_router.include_router(admin_router)
api_router.include_router(invoices_router)
api_router.include_router(chat_router)

