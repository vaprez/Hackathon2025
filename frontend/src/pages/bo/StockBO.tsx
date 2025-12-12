import { useState, useEffect, useCallback } from 'react';
import { 
  Package, 
  Search, 
  RefreshCw, 
  Filter,
  AlertTriangle,
  Zap,
  Building2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/common';
import { concentrateursService } from '../../services/concentrateurs.service';
import { boService, BOStats } from '../../services/bo.service';
import { useAuth } from '../../hooks/useAuth';
import type { Concentrateur } from '../../types';
import styles from './StockBO.module.css';

const etatLabels: Record<string, string> = {
  en_livraison: 'En livraison',
  en_stock: 'En stock',
  pose: 'Posé',
  retour_constructeur: 'Retour',
  hs: 'HS',
};

const etatColors: Record<string, string> = {
  en_livraison: 'blue',
  en_stock: 'green',
  pose: 'orange',
  retour_constructeur: 'red',
  hs: 'gray',
};

export function StockBO() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const defaultBo = user?.base_affectee || 'BO Nord';
  
  const [selectedBo, setSelectedBo] = useState<string>(defaultBo);
  const [listeBo, setListeBo] = useState<string[]>([]);
  const [concentrateurs, setConcentrateurs] = useState<Concentrateur[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterEtat, setFilterEtat] = useState('');
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<BOStats | null>(null);

  // Liste des BO disponibles (statique)
  const listeBosDisponibles = ['BO Nord', 'BO Sud', 'BO Centre', 'Magasin', 'Labo'];
  
  // Charger la liste des BO pour l'admin
  useEffect(() => {
    if (isAdmin) {
      setListeBo(listeBosDisponibles);
      if (!selectedBo) {
        setSelectedBo(listeBosDisponibles[0]);
      }
    }
  }, [isAdmin]);

  const boToDisplay = isAdmin ? selectedBo : defaultBo;

  const fetchConcentrateurs = useCallback(async () => {
    if (!boToDisplay) {
      setConcentrateurs([]);
      setTotal(0);
      setStats(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      
      // Charger les stats et les concentrateurs en parallele
      const [response, boStats] = await Promise.all([
        concentrateursService.getConcentrateurs({
          affectation: boToDisplay,
          search: search || undefined,
          etat: filterEtat as any || undefined,
          limit: 100,
        }),
        boService.getStats(boToDisplay)
      ]);
      
      setConcentrateurs(response.data);
      setTotal(response.total);
      setStats(boStats);
    } catch (err) {
      setError('Erreur lors du chargement');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [boToDisplay, search, filterEtat]);

  useEffect(() => {
    fetchConcentrateurs();
  }, [fetchConcentrateurs]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const displayStats = {
    total: stats?.total ?? 0,
    enStock: stats?.en_stock ?? 0,
    poses: stats?.poses ?? 0,
    aTester: stats?.a_tester ?? 0,
  };

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerTitle}>
            <Package size={28} />
            <div>
              <h1>Stock {boToDisplay || 'BO'}</h1>
              <p>{isAdmin ? 'Vue administrateur - Selectionnez une BO' : 'Concentrateurs affectes a votre base'}</p>
            </div>
          </div>
          <div className={styles.headerActions}>
            {isAdmin && listeBo.length > 0 && (
              <div className={styles.boSelector}>
                <Building2 size={16} />
                <select 
                  value={selectedBo} 
                  onChange={(e) => setSelectedBo(e.target.value)}
                  className={styles.boSelect}
                >
                  <option value="">-- Choisir une BO --</option>
                  {listeBo.map(bo => (
                    <option key={bo} value={bo}>{bo}</option>
                  ))}
                </select>
              </div>
            )}
            <Button variant="outline" size="sm" onClick={fetchConcentrateurs} disabled={loading}>
              <RefreshCw size={16} className={loading ? styles.spinning : ''} />
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/bo/pose')}>
              <Zap size={16} />
              Poser
            </Button>
          </div>
        </header>

        <div className={styles.stats}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{displayStats.total}</span>
            <span className={styles.statLabel}>Total affectes</span>
          </div>
          <div className={`${styles.statCard} ${styles.green}`}>
            <span className={styles.statValue}>{displayStats.enStock}</span>
            <span className={styles.statLabel}>En stock</span>
          </div>
          <div className={`${styles.statCard} ${styles.orange}`}>
            <span className={styles.statValue}>{displayStats.poses}</span>
            <span className={styles.statLabel}>Poses</span>
          </div>
          <div className={`${styles.statCard} ${styles.yellow}`}>
            <span className={styles.statValue}>{displayStats.aTester}</span>
            <span className={styles.statLabel}>A tester</span>
          </div>
        </div>

        <div className={styles.filters}>
          <div className={styles.searchBox}>
            <Search size={18} />
            <input
              type="search"
              placeholder="Rechercher par N° série..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className={styles.filterGroup}>
            <Filter size={16} />
            <select value={filterEtat} onChange={(e) => setFilterEtat(e.target.value)}>
              <option value="">Tous états</option>
              <option value="en_stock">En stock</option>
              <option value="pose">Posé</option>
            </select>
          </div>
        </div>

        {error && (
          <div className={styles.error}>
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>N° Série</th>
                <th>Modèle</th>
                <th>État</th>
                <th>Poste</th>
                <th>Date pose</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className={styles.loading}>Chargement...</td>
                </tr>
              ) : concentrateurs.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.emptyCell}>
                    <div className={styles.emptyMessage}>Aucun concentrateur</div>
                  </td>
                </tr>
              ) : (
                concentrateurs.map((c) => (
                  <tr key={c.numero_serie}>
                    <td className={styles.serial}>{c.numero_serie}</td>
                    <td>{c.modele || '-'}</td>
                    <td>
                      <span className={`${styles.badge} ${styles[etatColors[c.etat] || 'gray']}`}>
                        {etatLabels[c.etat] || c.etat}
                      </span>
                    </td>
                    <td>{c.poste_id || '-'}</td>
                    <td>{formatDate(c.date_pose)}</td>
                    <td>
                      <div className={styles.rowActions}>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigate(`/concentrateur/${c.numero_serie}`)}
                        >
                          Détail
                        </Button>
                        {c.etat === 'pose' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/bo/depose?numero_serie=${c.numero_serie}`)}
                          >
                            Déposer
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.footer}>
          <span>{total} concentrateur(s) au total</span>
        </div>
      </div>
    </DashboardLayout>
  );
}
