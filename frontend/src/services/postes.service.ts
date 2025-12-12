import api from './api';

export interface PosteElectrique {
  id_poste: number;
  code_poste: string;
  nom_poste?: string;
  localisation?: string;
  bo_affectee?: string;
  latitude?: number;
  longitude?: number;
  nb_concentrateurs: number;
  nb_concentrateurs_pose: number;
  nb_concentrateurs_a_tester: number;
}

export interface PosteConcentrateur {
  numero_serie: string;
  modele?: string;
  operateur: string;
  etat: string;
  date_pose?: string;
}

export interface PosteConcentrateursResponse {
  poste: {
    id_poste: number;
    code_poste: string;
    nom_poste?: string;
  };
  concentrateurs: PosteConcentrateur[];
}

export const postesService = {
  async getPostes(params?: { bo_affectee?: string; with_coords_only?: boolean }): Promise<PosteElectrique[]> {
    const response = await api.get<PosteElectrique[]>('/postes/', { params });
    return response.data;
  },

  async getPoste(posteId: number): Promise<PosteElectrique> {
    const response = await api.get<PosteElectrique>(`/postes/${posteId}`);
    return response.data;
  },

  async getPosteConcentrateurs(posteId: number): Promise<PosteConcentrateursResponse> {
    const response = await api.get<PosteConcentrateursResponse>(`/postes/${posteId}/concentrateurs`);
    return response.data;
  }
};
