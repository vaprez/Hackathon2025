from fastapi import APIRouter

from app.api.v1 import auth, concentrateurs, stats, actions, magasin, labo, transferts, bo, postes

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(concentrateurs.router, prefix="/concentrateurs", tags=["Concentrateurs"])
api_router.include_router(stats.router, prefix="/stats", tags=["Statistiques"])
api_router.include_router(actions.router, prefix="/actions", tags=["Actions"])
api_router.include_router(magasin.router, prefix="/magasin", tags=["Magasin"])
api_router.include_router(labo.router, prefix="/labo", tags=["Labo"])
api_router.include_router(transferts.router, prefix="/transferts", tags=["Transferts"])
api_router.include_router(bo.router)
api_router.include_router(postes.router)
