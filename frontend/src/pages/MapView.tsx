import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Map, RefreshCw, Navigation, Zap, X } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { PostesMap, RouteInfo } from '../components/map';
import { Button } from '../components/common';
import { postesService, PosteElectrique } from '../services/postes.service';
import styles from './MapView.module.css';

export function MapView() {
  const navigate = useNavigate();
  const [postes, setPostes] = useState<PosteElectrique[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPoste, setSelectedPoste] = useState<PosteElectrique | null>(null);
  const [filterBo, setFilterBo] = useState<string>('');
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);

  const fetchPostes = async () => {
    try {
      setLoading(true);
      setError(null);
      setSelectedPoste(null); // Fermer le panneau de détails lors du changement
      const data = await postesService.getPostes({ 
        with_coords_only: true,
        bo_affectee: filterBo || undefined 
      });
      setPostes(data);
    } catch (err) {
      setError('Erreur lors du chargement des postes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPostes();
  }, [filterBo]);

  const handlePosteClick = (poste: PosteElectrique) => {
    setSelectedPoste(poste);
  };

  const handleNavigate = () => {
    if (selectedPoste && selectedPoste.latitude && selectedPoste.longitude) {
      // Appeler la fonction de calcul d'itinéraire de la carte
      if ((window as any).calculateRoute) {
        (window as any).calculateRoute([selectedPoste.longitude, selectedPoste.latitude]);
      }
    }
  };

  const handleClearRoute = () => {
    setRouteInfo(null);
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins.toString().padStart(2, '0')}`;
  };

  const handleIntervention = () => {
    if (selectedPoste) {
      // Rediriger vers la page de pose avec le poste pré-sélectionné
      navigate(`/bo/pose?poste_id=${selectedPoste.id_poste}`);
    }
  };

  const postesWithCoords = postes.filter(p => p.latitude && p.longitude);
  const stats = {
    total: postesWithCoords.length,
    enService: postesWithCoords.filter(p => p.nb_concentrateurs_pose > 0).length,
    aTester: postesWithCoords.filter(p => p.nb_concentrateurs_a_tester > 0).length,
    sansConcentrateur: postesWithCoords.filter(p => p.nb_concentrateurs === 0).length,
  };

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerTitle}>
            <Map size={28} />
            <div>
              <h1>Carte des postes électriques</h1>
              <p>Visualisation des postes en Corse</p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <select 
              className={styles.filterSelect}
              value={filterBo}
              onChange={(e) => setFilterBo(e.target.value)}
            >
              <option value="">Toutes les BO</option>
              <option value="BO Nord">BO Nord</option>
              <option value="BO Sud">BO Sud</option>
              <option value="BO Centre">BO Centre</option>
            </select>
            <Button variant="outline" size="sm" onClick={fetchPostes} disabled={loading}>
              <RefreshCw size={16} className={loading ? styles.spinning : ''} />
            </Button>
          </div>
        </header>

        <div className={styles.stats}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{stats.total}</span>
            <span className={styles.statLabel}>Postes</span>
          </div>
          <div className={`${styles.statCard} ${styles.green}`}>
            <span className={styles.statValue}>{stats.enService}</span>
            <span className={styles.statLabel}>En service</span>
          </div>
          <div className={`${styles.statCard} ${styles.red}`}>
            <span className={styles.statValue}>{stats.aTester}</span>
            <span className={styles.statLabel}>À tester</span>
          </div>
          <div className={`${styles.statCard} ${styles.gray}`}>
            <span className={styles.statValue}>{stats.sansConcentrateur}</span>
            <span className={styles.statLabel}>Sans CPL</span>
          </div>
        </div>

        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        <div className={styles.content}>
          <div className={styles.mapSection}>
            <div className={styles.mapContainer}>
              <PostesMap 
                postes={postes} 
                loading={loading}
                onPosteClick={handlePosteClick}
                selectedPosteId={selectedPoste?.id_poste}
                routeInfo={routeInfo}
                onRouteCalculated={setRouteInfo}
              />
              
              {/* Informations d'itinéraire */}
              {routeInfo && (
                <div className={styles.routeInfo}>
                  <div className={styles.routeInfoHeader}>
                    <Navigation size={16} />
                    <span>Itinéraire</span>
                    <button className={styles.closeRouteButton} onClick={handleClearRoute}>
                      <X size={16} />
                    </button>
                  </div>
                  <div className={styles.routeInfoContent}>
                    <div className={styles.routeInfoItem}>
                      <span className={styles.routeInfoLabel}>Distance:</span>
                      <span className={styles.routeInfoValue}>{formatDistance(routeInfo.distance)}</span>
                    </div>
                    <div className={styles.routeInfoItem}>
                      <span className={styles.routeInfoLabel}>Durée:</span>
                      <span className={styles.routeInfoValue}>{formatDuration(routeInfo.duration)}</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Légende */}
              <div className={styles.legend}>
                <h4 className={styles.legendTitle}>Légende</h4>
                <div className={styles.legendItems}>
                  <div className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ backgroundColor: '#10B981' }} />
                    <span>En service</span>
                  </div>
                  <div className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ backgroundColor: '#EF4444' }} />
                    <span>À tester</span>
                  </div>
                  <div className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ backgroundColor: '#F59E0B' }} />
                    <span>Avec CPL</span>
                  </div>
                  <div className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ backgroundColor: '#6B7280' }} />
                    <span>Sans CPL</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Panneau de détails du poste sélectionné */}
          {selectedPoste && (
            <div className={styles.detailsPanel}>
              <div className={styles.detailsHeader}>
                <h3>{selectedPoste.code_poste}</h3>
                <button 
                  className={styles.closeButton}
                  onClick={() => setSelectedPoste(null)}
                >
                  ×
                </button>
              </div>
              
              {selectedPoste.nom_poste && (
                <p className={styles.detailsSubtitle}>{selectedPoste.nom_poste}</p>
              )}

              <div className={styles.detailsContent}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>BO affectée</span>
                  <span className={styles.detailValue}>{selectedPoste.bo_affectee || '-'}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Localisation</span>
                  <span className={styles.detailValue}>{selectedPoste.localisation || '-'}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Coordonnées</span>
                  <span className={styles.detailValue}>
                    {selectedPoste.latitude?.toFixed(5)}, {selectedPoste.longitude?.toFixed(5)}
                  </span>
                </div>

                <div className={styles.detailsDivider} />

                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Concentrateurs</span>
                  <span className={styles.detailValue}>{selectedPoste.nb_concentrateurs}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>En pose</span>
                  <span className={`${styles.detailValue} ${styles.green}`}>
                    {selectedPoste.nb_concentrateurs_pose}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>À tester</span>
                  <span className={`${styles.detailValue} ${styles.red}`}>
                    {selectedPoste.nb_concentrateurs_a_tester}
                  </span>
                </div>
              </div>

              <div className={styles.detailsActions}>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleNavigate}
                  className={styles.actionButton}
                >
                  <Navigation size={16} />
                  S'y rendre
                </Button>
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={handleIntervention}
                  className={styles.actionButton}
                >
                  <Zap size={16} />
                  Intervention
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
