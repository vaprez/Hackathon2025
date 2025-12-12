import api from './api';
import { cacheService, CACHE_TTL, CACHE_RESOURCES } from './cache.service';

export interface BOInfo {
  nom_bo: string;
  utilisateur: string;
  role: string;
  stats: {
    total: number;
    en_stock: number;
    poses: number;
    a_tester: number;
    demandes_en_cours: number;
  };
}

export interface BOStats {
  bo_name: string;
  total: number;
  en_stock: number;
  poses: number;
  a_tester: number;
  en_livraison: number;
}

export interface ActionResult {
  message: string;
  numero_serie: string;
  ancien_etat: string;
  nouvel_etat: string;
  date_pose?: string;
  ancienne_affectation?: string;
  nouvelle_affectation?: string;
}

export interface DemandeTransfert {
  id_commande: number;
  quantite: number;
  operateur_souhaite: string | null;
  date_commande: string;
  statut: string;
  date_validation: string | null;
  date_livraison: string | null;
}

export interface ConcentrateurBO {
  numero_serie: string;
  modele: string | null;
  operateur: string;
  etat: string;
  date_affectation: string | null;
  date_pose: string | null;
  date_dernier_etat: string | null;
}

export const boService = {
  async getListeBo(): Promise<string[]> {
    const cacheKey = `${CACHE_RESOURCES.BO}/liste`;
    const cached = cacheService.get<string[]>(cacheKey);
    if (cached) return cached;
    
    const response = await api.get<string[]>('/bo/liste');
    cacheService.set(cacheKey, response.data, CACHE_TTL.STATIC); // Liste quasi-statique
    return response.data;
  },

  async getStats(boName: string): Promise<BOStats> {
    const cacheKey = `${CACHE_RESOURCES.BO}/stats/${boName}`;
    const cached = cacheService.get<BOStats>(cacheKey);
    if (cached) return cached;
    
    const response = await api.get<BOStats>(`/bo/stats/${encodeURIComponent(boName)}`);
    cacheService.set(cacheKey, response.data, CACHE_TTL.MEDIUM);
    return response.data;
  },

  async getInfo(): Promise<BOInfo> {
    const cacheKey = `${CACHE_RESOURCES.BO}/info`;
    const cached = cacheService.get<BOInfo>(cacheKey);
    if (cached) return cached;
    
    const response = await api.get<BOInfo>('/bo/info');
    cacheService.set(cacheKey, response.data, CACHE_TTL.MEDIUM);
    return response.data;
  },

  async pose(numeroSerie: string, options?: { commentaire?: string; photo?: string }): Promise<ActionResult> {
    const response = await api.post<ActionResult>('/bo/pose', { 
      numero_serie: numeroSerie,
      commentaire: options?.commentaire,
      photo: options?.photo
    });
    // Invalider le cache après une action
    cacheService.invalidateResource(CACHE_RESOURCES.BO);
    cacheService.invalidateResource(CACHE_RESOURCES.CONCENTRATEURS);
    cacheService.invalidateResource(CACHE_RESOURCES.DASHBOARD);
    return response.data;
  },

  async depose(numeroSerie: string, options?: { commentaire?: string; photo?: string }): Promise<ActionResult> {
    const response = await api.post<ActionResult>('/bo/depose', { 
      numero_serie: numeroSerie,
      commentaire: options?.commentaire,
      photo: options?.photo
    });
    cacheService.invalidateResource(CACHE_RESOURCES.BO);
    cacheService.invalidateResource(CACHE_RESOURCES.CONCENTRATEURS);
    cacheService.invalidateResource(CACHE_RESOURCES.DASHBOARD);
    return response.data;
  },

  async reception(numeroSerie: string): Promise<ActionResult> {
    const response = await api.post<ActionResult>('/bo/reception', { numero_serie: numeroSerie });
    cacheService.invalidateResource(CACHE_RESOURCES.BO);
    cacheService.invalidateResource(CACHE_RESOURCES.CONCENTRATEURS);
    cacheService.invalidateResource(CACHE_RESOURCES.DASHBOARD);
    return response.data;
  },

  async creerDemande(quantite: number, operateurSouhaite?: string): Promise<any> {
    const response = await api.post('/bo/demande-transfert', {
      quantite,
      operateur_souhaite: operateurSouhaite
    });
    cacheService.invalidatePattern(`${CACHE_RESOURCES.BO}/demandes`);
    return response.data;
  },

  async getDemandes(): Promise<DemandeTransfert[]> {
    const cacheKey = `${CACHE_RESOURCES.BO}/demandes`;
    const cached = cacheService.get<DemandeTransfert[]>(cacheKey);
    if (cached) return cached;
    
    const response = await api.get<DemandeTransfert[]>('/bo/demandes');
    cacheService.set(cacheKey, response.data, CACHE_TTL.SHORT); // Court car peut changer
    return response.data;
  },

  async getConcentrateurs(etat?: string): Promise<ConcentrateurBO[]> {
    const cacheKey = cacheService.generateKey(`${CACHE_RESOURCES.BO}/concentrateurs`, { etat });
    const cached = cacheService.get<ConcentrateurBO[]>(cacheKey);
    if (cached) return cached;
    
    const params = etat ? { etat } : {};
    const response = await api.get<ConcentrateurBO[]>('/bo/concentrateurs', { params });
    cacheService.set(cacheKey, response.data, CACHE_TTL.MEDIUM);
    return response.data;
  }
};
