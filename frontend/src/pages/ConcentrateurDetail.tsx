import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Package, 
  Calendar, 
  Clock, 
  Building2,
  AlertTriangle,
  Plus,
  FileDown,
  Truck
} from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { ActionTimeline } from '../components/concentrateur';
import { Button } from '../components/common';
import { concentrateursService, HistoriqueAction } from '../services/concentrateurs.service';
import { Concentrateur } from '../types';
import { useAuth } from '../hooks/useAuth';
import styles from './ConcentrateurDetail.module.css';

const etatLabels: Record<string, string> = {
  en_livraison: 'En livraison',
  en_stock: 'En stock',
  pose: 'Posé',
  retour_constructeur: 'Retour constructeur',
  hs: 'Hors service',
};

const etatColors: Record<string, string> = {
  en_livraison: 'blue',
  en_stock: 'yellow',
  pose: 'green',
  retour_constructeur: 'orange',
  hs: 'red',
};

export function ConcentrateurDetail() {
  const { numeroSerie } = useParams<{ numeroSerie: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [concentrateur, setConcentrateur] = useState<Concentrateur | null>(null);
  const [historique, setHistorique] = useState<HistoriqueAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isGestionnaire = user?.role === 'gestionnaire' || user?.role === 'admin';

  useEffect(() => {
    const fetchConcentrateur = async () => {
      if (!numeroSerie) return;
      
      try {
        setLoading(true);
        setError(null);
        const data = await concentrateursService.getConcentrateur(numeroSerie);
        setConcentrateur(data.concentrateur);
        setHistorique(data.historique || []);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError(`Concentrateur "${numeroSerie}" introuvable`);
        } else {
          setError('Erreur lors du chargement du concentrateur');
        }
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchConcentrateur();
  }, [numeroSerie]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleBack = () => {
    navigate('/inventaire');
  };

  const handleNewAction = () => {
    // TODO: Open modal for new action
    console.log('New action');
  };

  const handleExportCSV = () => {
    if (!concentrateur || historique.length === 0) return;
    
    const headers = ['Date', 'Type', 'Ancien Etat', 'Nouvel Etat', 'Ancienne Affectation', 'Nouvelle Affectation', 'Commentaire'];
    const rows = historique.map(action => [
      new Date(action.date_action).toLocaleString('fr-FR'),
      action.type_action,
      action.ancien_etat || '',
      action.nouvel_etat || '',
      action.ancienne_affectation || '',
      action.nouvelle_affectation || '',
      action.commentaire || ''
    ]);
    
    // Ajouter BOM UTF-8 pour Excel
    const BOM = '\uFEFF';
    const csv = BOM + [headers, ...rows].map(row => row.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `historique_${concentrateur.numero_serie}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className={styles.container}>
          <div className={styles.header}>
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft size={18} />
              Retour
            </Button>
          </div>
          <div className={styles.grid}>
            <div className={styles.leftColumn}>
              <div className={styles.card}>
                <div className={styles.skeletonTitle} />
                <div className={styles.skeletonLines}>
                  <div className={styles.skeletonLine} />
                  <div className={styles.skeletonLine} />
                  <div className={styles.skeletonLine} />
                  <div className={styles.skeletonLine} />
                </div>
              </div>
            </div>
            <div className={styles.rightColumn}>
              <ActionTimeline actions={[]} loading={true} />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !concentrateur) {
    return (
      <DashboardLayout>
        <div className={styles.container}>
          <div className={styles.header}>
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft size={18} />
              Retour
            </Button>
          </div>
          <div className={styles.errorCard}>
            <AlertTriangle size={48} />
            <h2>Concentrateur introuvable</h2>
            <p>{error || 'Une erreur est survenue'}</p>
            <Button variant="primary" onClick={handleBack}>
              Retour à l'inventaire
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft size={18} />
            Retour
          </Button>
          <div className={styles.headerActions}>
            {isGestionnaire && (
              <Button variant="primary" size="sm" onClick={handleNewAction}>
                <Plus size={16} />
                Nouvelle action
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              disabled={historique.length === 0}
              onClick={() => handleExportCSV()}
            >
              <FileDown size={16} />
              Export CSV
            </Button>
          </div>
        </div>

        <div className={styles.grid}>
          <div className={styles.leftColumn}>
            {/* Informations générales */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <Package size={20} />
                <h3>Informations générales</h3>
              </div>
              <div className={styles.serialNumber}>{concentrateur.numero_serie}</div>
              <span className={`${styles.badge} ${styles[etatColors[concentrateur.etat] || 'gray']}`}>
                {etatLabels[concentrateur.etat] || concentrateur.etat}
              </span>
              
              <div className={styles.infoList}>
                <div className={styles.infoItem}>
                  <Package size={16} />
                  <div>
                    <span className={styles.infoLabel}>Modèle</span>
                    <span className={styles.infoValue}>{concentrateur.modele || '-'}</span>
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <Truck size={16} />
                  <div>
                    <span className={styles.infoLabel}>Opérateur</span>
                    <span className={styles.infoValue}>{concentrateur.operateur}</span>
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <Building2 size={16} />
                  <div>
                    <span className={styles.infoLabel}>Affectation</span>
                    <span className={styles.infoValue}>{concentrateur.affectation || '-'}</span>
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <Package size={16} />
                  <div>
                    <span className={styles.infoLabel}>N° Carton</span>
                    <span className={styles.infoValue}>{concentrateur.numero_carton || '-'}</span>
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <Calendar size={16} />
                  <div>
                    <span className={styles.infoLabel}>Date d'affectation</span>
                    <span className={styles.infoValue}>
                      {concentrateur.date_affectation 
                        ? formatDate(concentrateur.date_affectation) 
                        : '-'}
                    </span>
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <Clock size={16} />
                  <div>
                    <span className={styles.infoLabel}>Dernier état</span>
                    <span className={styles.infoValue}>
                      {concentrateur.date_dernier_etat 
                        ? formatDate(concentrateur.date_dernier_etat) 
                        : '-'}
                    </span>
                  </div>
                </div>
                {concentrateur.commentaire && (
                  <div className={styles.infoItem}>
                    <AlertTriangle size={16} />
                    <div>
                      <span className={styles.infoLabel}>Commentaire</span>
                      <span className={styles.infoValue}>{concentrateur.commentaire}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={styles.rightColumn}>
            <ActionTimeline actions={historique} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
