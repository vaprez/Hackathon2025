import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, RefreshCw, Search, ArrowRight, MapPin, MessageSquare } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { actionsService, ActionResponse } from '../services/actions.service';
import styles from './Actions.module.css';

const actionTypeLabels: Record<string, string> = {
  reception: 'Réception',
  reception_magasin: 'Réception magasin',
  transfert: 'Transfert',
  transfert_bo: 'Transfert BO',
  pose: 'Pose',
  depose: 'Dépose',
  retour_constructeur: 'Retour constructeur',
  test_labo: 'Test labo',
  mise_au_rebut: 'Mise au rebut',
  destruction: 'Destruction',
};

const actionTypeColors: Record<string, string> = {
  reception: 'blue',
  reception_magasin: 'blue',
  transfert: 'orange',
  transfert_bo: 'orange',
  pose: 'green',
  depose: 'gray',
  retour_constructeur: 'red',
  test_labo: 'purple',
  mise_au_rebut: 'red',
  destruction: 'red',
};

export function Actions() {
  const navigate = useNavigate();
  const [actions, setActions] = useState<ActionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filteredActions = actions.filter(action => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      action.type_action.toLowerCase().includes(searchLower) ||
      action.concentrateur_id?.toLowerCase().includes(searchLower) ||
      action.concentrateur?.numero_serie?.toLowerCase().includes(searchLower) ||
      action.commentaire?.toLowerCase().includes(searchLower)
    );
  });

  const fetchActions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await actionsService.getMyActions(1, 100);
      setActions(response.data);
    } catch (err) {
      setError('Erreur lors du chargement des actions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, []);

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.headerIcon}>
              <ClipboardList size={24} />
            </div>
            <div>
              <h1 className={styles.title}>Mes Actions</h1>
              <p className={styles.subtitle}>
                {actions.length} action{actions.length > 1 ? 's' : ''} enregistrée{actions.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            className={styles.refreshButton}
            onClick={fetchActions}
            disabled={loading}
          >
            <RefreshCw size={18} className={loading ? styles.spinning : ''} />
            Actualiser
          </button>
        </header>

        {/* Barre de recherche */}
        <div className={styles.searchBar}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="search"
            placeholder="Rechercher une action..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        {loading ? (
          <div className={styles.grid}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className={styles.skeletonCard}>
                <div className={styles.skeletonHeader}>
                  <div className={styles.skeletonBadge} />
                  <div className={styles.skeletonDate} />
                </div>
                <div className={styles.skeletonBody}>
                  <div className={styles.skeletonLine} />
                  <div className={styles.skeletonLine} />
                  <div className={styles.skeletonLineShort} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredActions.length === 0 ? (
          <div className={styles.empty}>
            <ClipboardList size={48} />
            <p>{search ? 'Aucune action trouvée' : 'Aucune action enregistrée'}</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {filteredActions.map((action) => (
              <div key={action.id_action} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.actionType}>
                    <span className={`${styles.badge} ${styles[actionTypeColors[action.type_action] || 'gray']}`}>
                      {actionTypeLabels[action.type_action] || action.type_action}
                    </span>
                    <span className={styles.date}>{formatDateTime(action.date_action)}</span>
                  </div>
                </div>
                
                <div className={styles.cardBody}>
                  {/* Concentrateur - cliquable */}
                  <div 
                    className={styles.concentrateurRow}
                    onClick={() => {
                      const id = action.concentrateur?.numero_serie || action.concentrateur_id;
                      if (id) navigate(`/concentrateurs/${id}`);
                    }}
                  >
                    <div className={styles.concentrateurInfo}>
                      <strong>
                        {action.concentrateur?.numero_serie || action.concentrateur_id || '-'}
                      </strong>
                      <span className={styles.modele}>
                        {action.concentrateur?.modele || 'Concentrateur IOT'}
                      </span>
                    </div>
                    {(action.concentrateur || action.concentrateur_id) && (
                      <ArrowRight size={16} className={styles.arrowIcon} />
                    )}
                  </div>
                  
                  {/* Transition d'état */}
                  {(action.ancien_etat || action.nouvel_etat) && (
                    <div className={styles.stateTransition}>
                      <span className={styles.stateOld}>{action.ancien_etat || '-'}</span>
                      <ArrowRight size={14} />
                      <span className={styles.stateNew}>{action.nouvel_etat || '-'}</span>
                    </div>
                  )}
                  
                  {/* Base */}
                  <div className={styles.infoRow}>
                    <MapPin size={14} className={styles.infoIcon} />
                    <span className={styles.value}>{action.nouvelle_affectation || action.ancienne_affectation || 'Non affecté'}</span>
                  </div>
                  
                  {/* Commentaire */}
                  {action.commentaire && (
                    <div className={styles.commentSection}>
                      <MessageSquare size={14} className={styles.infoIcon} />
                      <p className={styles.commentText}>{action.commentaire}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
