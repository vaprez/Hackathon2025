from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import List, Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import Utilisateur
from app.models.poste import PosteElectrique
from app.models.concentrateur import Concentrateur

router = APIRouter(prefix="/postes", tags=["Postes Électriques"])


class PosteWithStats(BaseModel):
    id_poste: int
    code_poste: str
    nom_poste: Optional[str] = None
    localisation: Optional[str] = None
    bo_affectee: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    nb_concentrateurs: int = 0
    nb_concentrateurs_pose: int = 0
    nb_concentrateurs_a_tester: int = 0

    class Config:
        from_attributes = True


@router.get("/", response_model=List[PosteWithStats])
async def get_postes(
    bo_affectee: Optional[str] = Query(None, description="Filtrer par BO affectée"),
    with_coords_only: bool = Query(False, description="Uniquement les postes avec coordonnées"),
    db: AsyncSession = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Récupérer la liste des postes électriques avec statistiques.
    """
    # Construire la requête de base
    query = select(PosteElectrique)
    
    if bo_affectee:
        query = query.where(PosteElectrique.bo_affectee == bo_affectee)
    
    if with_coords_only:
        query = query.where(
            PosteElectrique.latitude.isnot(None),
            PosteElectrique.longitude.isnot(None)
        )
    
    result = await db.execute(query)
    postes = result.scalars().all()
    
    response = []
    for poste in postes:
        # Compter les concentrateurs pour ce poste
        count_query = select(func.count()).select_from(Concentrateur).where(
            Concentrateur.poste_id == poste.id_poste
        )
        count_result = await db.execute(count_query)
        nb_concentrateurs = count_result.scalar() or 0
        
        # Compter les concentrateurs en pose
        pose_query = select(func.count()).select_from(Concentrateur).where(
            and_(
                Concentrateur.poste_id == poste.id_poste,
                Concentrateur.etat == 'pose'
            )
        )
        pose_result = await db.execute(pose_query)
        nb_pose = pose_result.scalar() or 0
        
        # Compter les concentrateurs à tester
        tester_query = select(func.count()).select_from(Concentrateur).where(
            and_(
                Concentrateur.poste_id == poste.id_poste,
                Concentrateur.etat == 'a_tester'
            )
        )
        tester_result = await db.execute(tester_query)
        nb_a_tester = tester_result.scalar() or 0
        
        response.append(PosteWithStats(
            id_poste=poste.id_poste,
            code_poste=poste.code_poste,
            nom_poste=poste.nom_poste,
            localisation=poste.localisation,
            bo_affectee=poste.bo_affectee,
            latitude=poste.latitude,
            longitude=poste.longitude,
            nb_concentrateurs=nb_concentrateurs,
            nb_concentrateurs_pose=nb_pose,
            nb_concentrateurs_a_tester=nb_a_tester
        ))
    
    return response


@router.get("/{poste_id}", response_model=PosteWithStats)
async def get_poste(
    poste_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Récupérer les détails d'un poste électrique.
    """
    result = await db.execute(
        select(PosteElectrique).where(PosteElectrique.id_poste == poste_id)
    )
    poste = result.scalar_one_or_none()
    
    if not poste:
        raise HTTPException(status_code=404, detail="Poste non trouvé")
    
    # Compter les concentrateurs
    count_result = await db.execute(
        select(func.count()).select_from(Concentrateur).where(
            Concentrateur.poste_id == poste.id_poste
        )
    )
    nb_concentrateurs = count_result.scalar() or 0
    
    pose_result = await db.execute(
        select(func.count()).select_from(Concentrateur).where(
            and_(
                Concentrateur.poste_id == poste.id_poste,
                Concentrateur.etat == 'pose'
            )
        )
    )
    nb_pose = pose_result.scalar() or 0
    
    tester_result = await db.execute(
        select(func.count()).select_from(Concentrateur).where(
            and_(
                Concentrateur.poste_id == poste.id_poste,
                Concentrateur.etat == 'a_tester'
            )
        )
    )
    nb_a_tester = tester_result.scalar() or 0
    
    return PosteWithStats(
        id_poste=poste.id_poste,
        code_poste=poste.code_poste,
        nom_poste=poste.nom_poste,
        localisation=poste.localisation,
        bo_affectee=poste.bo_affectee,
        latitude=poste.latitude,
        longitude=poste.longitude,
        nb_concentrateurs=nb_concentrateurs,
        nb_concentrateurs_pose=nb_pose,
        nb_concentrateurs_a_tester=nb_a_tester
    )


@router.get("/{poste_id}/concentrateurs")
async def get_poste_concentrateurs(
    poste_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Récupérer les concentrateurs d'un poste électrique.
    """
    result = await db.execute(
        select(PosteElectrique).where(PosteElectrique.id_poste == poste_id)
    )
    poste = result.scalar_one_or_none()
    
    if not poste:
        raise HTTPException(status_code=404, detail="Poste non trouvé")
    
    conc_result = await db.execute(
        select(Concentrateur).where(Concentrateur.poste_id == poste.id_poste)
    )
    concentrateurs = conc_result.scalars().all()
    
    return {
        "poste": {
            "id_poste": poste.id_poste,
            "code_poste": poste.code_poste,
            "nom_poste": poste.nom_poste
        },
        "concentrateurs": [
            {
                "numero_serie": c.numero_serie,
                "modele": c.modele,
                "operateur": c.operateur,
                "etat": c.etat,
                "date_pose": c.date_pose.isoformat() if c.date_pose else None
            }
            for c in concentrateurs
        ]
    }
