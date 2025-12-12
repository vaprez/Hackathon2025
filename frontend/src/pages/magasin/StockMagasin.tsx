import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  Search, 
  Download, 
  RefreshCw, 
  Filter,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/common';
import { concentrateursService } from '../../services/concentrateurs.service';
import { magasinService, MagasinStats } from '../../services/magasin.service';
import type { Concentrateur } from '../../types';
import styles from './StockMagasin.module.css';

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

export function StockMagasin() {
  const navigate = useNavigate();
  const [concentrateurs, setConcentrateurs] = useState<Concentrateur[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterOperateur, setFilterOperateur] = useState('');
  const [filterEtat, setFilterEtat] = useState('');
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<MagasinStats | null>(null);

  const fetchConcentrateurs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Charger les concentrateurs et les stats en parallele
      const [response, magasinStats] = await Promise.all([
        concentrateursService.getConcentrateurs({
          affectation: 'Magasin',
          search: search || undefined,
          operateur: filterOperateur || undefined,
          etat: filterEtat as any || undefined,
          limit: 100,
        }),
        magasinService.getStats()
      ]);
      
      setConcentrateurs(response.data);
      setTotal(response.total);
      setStats(magasinStats);
    } catch (err) {
      setError('Erreur lors du chargement');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, filterOperateur, filterEtat]);

  useEffect(() => {
    fetchConcentrateurs();
  }, [fetchConcentrateurs]);

  const handleExportCSV = () => {
    const headers = ['Numero Serie', 'Modele', 'Operateur', 'Etat', 'Date Affectation', 'Carton'];
    const rows = concentrateurs.map(c => [
      c.numero_serie,
      c.modele || '',
      c.operateur,
      etatLabels[c.etat] || c.etat,
      c.date_affectation || '',
      c.numero_carton || ''
    ]);
    
    // Ajouter BOM UTF-8 pour Excel
    const BOM = '\uFEFF';
    const csv = BOM + [headers, ...rows].map(row => row.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stock_magasin_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const displayStats = {
    total: stats?.total ?? 0,
    enStock: stats?.en_stock ?? 0,
    enLivraison: stats?.en_livraison ?? 0,
    // Calculer le nombre de cartons basé sur les concentrateurs (4 par carton)
    nbCartons: Math.ceil((stats?.total ?? 0) / 4),
  };

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerTitle}>
            <Package size={28} />
            <div>
              <h1>Stock Magasin</h1>
              <p>Gestion des concentrateurs en stock</p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Button variant="outline" size="sm" onClick={fetchConcentrateurs} disabled={loading}>
              <RefreshCw size={16} className={loading ? styles.spinning : ''} />
            </Button>
            <Button variant="primary" size="sm" onClick={handleExportCSV}>
              <Download size={16} />
              Export CSV
            </Button>
          </div>
        </header>

        <div className={styles.stats}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{displayStats.total}</span>
            <span className={styles.statLabel}>Total Magasin</span>
          </div>
          <div className={`${styles.statCard} ${styles.green}`}>
            <span className={styles.statValue}>{displayStats.enStock}</span>
            <span className={styles.statLabel}>En stock</span>
          </div>
          <div className={`${styles.statCard} ${styles.blue}`}>
            <span className={styles.statValue}>{displayStats.enLivraison}</span>
            <span className={styles.statLabel}>En livraison</span>
          </div>
          <div className={`${styles.statCard} ${styles.purple}`}>
            <span className={styles.statValue}>{displayStats.nbCartons}</span>
            <span className={styles.statLabel}>Cartons</span>
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
            <select value={filterOperateur} onChange={(e) => setFilterOperateur(e.target.value)}>
              <option value="">Tous opérateurs</option>
              <option value="Bouygues">Bouygues</option>
              <option value="Orange">Orange</option>
              <option value="SFR">SFR</option>
            </select>
            <select value={filterEtat} onChange={(e) => setFilterEtat(e.target.value)}>
              <option value="">Tous états</option>
              <option value="en_livraison">En livraison</option>
              <option value="en_stock">En stock</option>
            </select>
          </div>
        </div>

        {error && (
          <div className={styles.error}>
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Vue tableau pour desktop */}
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>N° Série</th>
                <th>Modèle</th>
                <th>Opérateur</th>
                <th>État</th>
                <th>N° Carton</th>
                <th>Date affectation</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className={styles.loading}>Chargement...</td>
                </tr>
              ) : concentrateurs.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.empty}>Aucun concentrateur</td>
                </tr>
              ) : (
                concentrateurs.map((c) => (
                  <tr 
                    key={c.numero_serie} 
                    className={styles.clickableRow}
                    onClick={() => navigate(`/concentrateurs/${c.numero_serie}`)}
                  >
                    <td className={styles.serial}>{c.numero_serie}</td>
                    <td>{c.modele || '-'}</td>
                    <td>{c.operateur}</td>
                    <td>
                      <span className={`${styles.badge} ${styles[etatColors[c.etat] || 'gray']}`}>
                        {etatLabels[c.etat] || c.etat}
                      </span>
                    </td>
                    <td>{c.numero_carton || '-'}</td>
                    <td className={styles.dateCell}>
                      {formatDate(c.date_affectation)}
                      <ChevronRight size={16} className={styles.rowArrow} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Vue cartes pour mobile */}
        <div className={styles.mobileCards}>
          {loading ? (
            <div className={styles.loading}>Chargement...</div>
          ) : concentrateurs.length === 0 ? (
            <div className={styles.empty}>Aucun concentrateur</div>
          ) : (
            concentrateurs.map((c) => (
              <div 
                key={c.numero_serie} 
                className={styles.mobileCard}
                onClick={() => navigate(`/concentrateurs/${c.numero_serie}`)}
              >
                <div className={styles.cardHeader}>
                  <span className={styles.cardSerial}>{c.numero_serie}</span>
                  <span className={`${styles.badge} ${styles[etatColors[c.etat] || 'gray']}`}>
                    {etatLabels[c.etat] || c.etat}
                  </span>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.cardRow}>
                    <span className={styles.cardLabel}>Modèle</span>
                    <span>{c.modele || '-'}</span>
                  </div>
                  <div className={styles.cardRow}>
                    <span className={styles.cardLabel}>Opérateur</span>
                    <span>{c.operateur}</span>
                  </div>
                  <div className={styles.cardRow}>
                    <span className={styles.cardLabel}>Carton</span>
                    <span>{c.numero_carton || '-'}</span>
                  </div>
                  <div className={styles.cardRow}>
                    <span className={styles.cardLabel}>Date</span>
                    <span>{formatDate(c.date_affectation)}</span>
                  </div>
                </div>
                <ChevronRight size={20} className={styles.cardArrow} />
              </div>
            ))
          )}
        </div>

        <div className={styles.footer}>
          <span>{total} concentrateur(s) au total</span>
        </div>
      </div>
    </DashboardLayout>
  );
}
