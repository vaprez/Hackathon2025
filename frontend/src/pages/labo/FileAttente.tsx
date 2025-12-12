import { useState, useEffect, useCallback } from 'react';
import { 
  FlaskConical, 
  RefreshCw, 
  AlertTriangle,
  Clock,
  QrCode
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/common';
import { concentrateursService } from '../../services/concentrateurs.service';
import type { Concentrateur } from '../../types';
import styles from './FileAttente.module.css';

export function FileAttente() {
  const navigate = useNavigate();
  const [concentrateurs, setConcentrateurs] = useState<Concentrateur[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConcentrateurs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await concentrateursService.getConcentrateurs({
        affectation: 'Labo',
        limit: 100,
      });
      
      // Trier par ancienneté (plus vieux en premier = date_affectation la plus ancienne)
      const sorted = [...response.data].sort((a, b) => {
        const dateA = a.date_affectation ? new Date(a.date_affectation).getTime() : Date.now();
        const dateB = b.date_affectation ? new Date(b.date_affectation).getTime() : Date.now();
        return dateA - dateB; // Plus ancien en premier
      });
      
      setConcentrateurs(sorted);
    } catch (err) {
      setError('Erreur lors du chargement');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConcentrateurs();
  }, [fetchConcentrateurs]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDaysWaiting = (dateString?: string) => {
    if (!dateString) return 0;
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerTitle}>
            <FlaskConical size={28} />
            <div>
              <h1>File d'attente des tests</h1>
              <p>Concentrateurs à tester au laboratoire</p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Button variant="primary" size="sm" onClick={() => navigate('/labo/test')}>
              <QrCode size={16} />
              Scanner
            </Button>
            <Button variant="outline" size="sm" onClick={fetchConcentrateurs} disabled={loading}>
              <RefreshCw size={16} className={loading ? styles.spinning : ''} />
            </Button>
          </div>
        </header>

        <div className={styles.stats}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{concentrateurs.length}</span>
            <span className={styles.statLabel}>À tester</span>
          </div>
          <div className={`${styles.statCard} ${styles.orange}`}>
            <span className={styles.statValue}>
              {concentrateurs.filter(c => getDaysWaiting(c.date_affectation) > 7).length}
            </span>
            <span className={styles.statLabel}>En attente &gt; 7j</span>
          </div>
        </div>

        {error && (
          <div className={styles.error}>
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <p>Chargement...</p>
          </div>
        ) : concentrateurs.length === 0 ? (
          <div className={styles.empty}>
            <FlaskConical size={48} />
            <p>Aucun concentrateur en attente de test</p>
          </div>
        ) : (
          <div className={styles.list}>
            {concentrateurs.map((c) => {
              const daysWaiting = getDaysWaiting(c.date_affectation);
              const isUrgent = daysWaiting > 7;
              
              return (
                <div key={c.numero_serie} className={`${styles.card} ${isUrgent ? styles.urgent : ''}`}>
                  <div className={styles.cardHeader}>
                    <span className={styles.serial}>{c.numero_serie}</span>
                    {isUrgent && (
                      <span className={styles.urgentBadge}>
                        <Clock size={14} />
                        Urgent
                      </span>
                    )}
                  </div>
                  <div className={styles.cardBody}>
                    <div className={styles.info}>
                      <span className={styles.label}>Modèle</span>
                      <span className={styles.value}>{c.modele || '-'}</span>
                    </div>
                    <div className={styles.info}>
                      <span className={styles.label}>Opérateur</span>
                      <span className={styles.value}>{c.operateur}</span>
                    </div>
                    <div className={styles.info}>
                      <span className={styles.label}>Arrivée au labo</span>
                      <span className={styles.value}>{formatDate(c.date_affectation)}</span>
                    </div>
                    <div className={styles.info}>
                      <span className={styles.label}>En attente</span>
                      <span className={`${styles.value} ${isUrgent ? styles.urgent : ''}`}>
                        {daysWaiting} jour(s)
                      </span>
                    </div>
                    {c.commentaire && (
                      <div className={styles.comment}>
                        <span className={styles.label}>Commentaire</span>
                        <p>{c.commentaire}</p>
                      </div>
                    )}
                  </div>
                  <div className={styles.cardFooter}>
                    <Button 
                      variant="primary" 
                      size="sm"
                      onClick={() => navigate('/labo/test')}
                    >
                      Effectuer le test
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
