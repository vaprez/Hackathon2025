import { useState, useEffect, useCallback } from 'react';
import { 
  Truck, 
  QrCode, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  X,
  Package,
  Clock,
  User,
  MapPin,
  Keyboard,
  RefreshCw,
  Search
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button, BarcodeScanner } from '../../components/common';
import { transfertsService, Commande, CartonDisponible, ValidationResult } from '../../services/transferts.service';
import styles from './TransfertBO.module.css';

type PanelMode = 'scan' | 'manual';

export function TransfertBO() {
  // États principaux
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // États du SlidePanel
  const [selectedCommande, setSelectedCommande] = useState<Commande | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<PanelMode>('manual');
  const [numeroCarton, setNumeroCarton] = useState('');
  const [cartonsDisponibles, setCartonsDisponibles] = useState<CartonDisponible[]>([]);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [panelError, setPanelError] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  
  // Filtres
  const [statutFilter, setStatutFilter] = useState<string>('en_attente');
  const [searchTerm, setSearchTerm] = useState('');

  // Charger les commandes
  const fetchCommandes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await transfertsService.getCommandes(statutFilter || undefined);
      setCommandes(data);
    } catch (err) {
      setError('Erreur lors du chargement des commandes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statutFilter]);

  useEffect(() => {
    fetchCommandes();
  }, [fetchCommandes]);

  // Charger les cartons disponibles quand le panel s'ouvre
  const fetchCartonsDisponibles = async () => {
    try {
      const cartons = await transfertsService.getCartonsDisponibles();
      setCartonsDisponibles(cartons);
    } catch (err) {
      console.error('Erreur chargement cartons:', err);
    }
  };

  // Ouvrir le panel pour une commande
  const handleScanResult = (result: string) => {
    setNumeroCarton(result);
    setShowScanner(false);
    setPanelMode('manual');
  };

  const handleRowClick = async (commande: Commande) => {
    if (commande.statut_commande !== 'en_attente') return;
    setSelectedCommande(commande);
    setNumeroCarton('');
    setValidationResult(null);
    setPanelError(null);
    setPanelMode('manual');
    setPanelOpen(true);
    fetchCartonsDisponibles();
  };

  // Fermer le panel
  const handleClosePanel = () => {
    setPanelOpen(false);
    setSelectedCommande(null);
    setNumeroCarton('');
    setPanelError(null);
    setValidationResult(null);
  };

  // Valider le transfert
  const handleValidate = async () => {
    if (!selectedCommande || !numeroCarton.trim()) {
      setPanelError('Veuillez saisir ou scanner un numéro de carton');
      return;
    }

    setValidating(true);
    setPanelError(null);

    try {
      const result = await transfertsService.validerTransfert(
        selectedCommande.id_commande,
        numeroCarton.trim()
      );
      setValidationResult(result);
      // Rafraîchir la liste
      fetchCommandes();
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Erreur lors de la validation';
      setPanelError(message);
    } finally {
      setValidating(false);
    }
  };

  // Filtrer et trier les commandes
  const filteredCommandes = commandes
    .filter(c => {
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      return (
        c.bo_demandeur.toLowerCase().includes(search) ||
        c.demandeur_nom?.toLowerCase().includes(search) ||
        c.demandeur_prenom?.toLowerCase().includes(search) ||
        c.id_commande.toString().includes(search)
      );
    })
    .sort((a, b) => {
      // Trier par date décroissante (plus récent en premier)
      return new Date(b.date_commande).getTime() - new Date(a.date_commande).getTime();
    });

  // Formater la date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Badge de statut
  const getStatutBadge = (statut: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      en_attente: { label: 'En attente', className: styles.badgePending },
      en_preparation: { label: 'En préparation', className: styles.badgeProgress },
      validee: { label: 'Validée', className: styles.badgeSuccess },
      annulee: { label: 'Annulée', className: styles.badgeCancelled }
    };
    const badge = badges[statut] || { label: statut, className: '' };
    return <span className={`${styles.badge} ${badge.className}`}>{badge.label}</span>;
  };

  return (
    <DashboardLayout>
      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <Truck size={28} />
            <div>
              <h1>Transferts vers BO</h1>
              <p>Gérer les demandes de transfert des bases opérationnelles</p>
            </div>
          </div>
          <Button variant="outline" onClick={fetchCommandes} disabled={loading}>
            <RefreshCw size={16} className={loading ? styles.spinning : ''} />
            Actualiser
          </Button>
        </header>

        {/* Filtres */}
        <div className={styles.filters}>
          <div className={styles.searchBox}>
            <Search size={18} />
            <input
              type="search"
              placeholder="Rechercher par BO, demandeur ou N° commande..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className={styles.filterGroup}>
            <label>Statut</label>
            <select value={statutFilter} onChange={(e) => setStatutFilter(e.target.value)}>
              <option value="">Tous</option>
              <option value="en_attente">En attente</option>
              <option value="validee">Validées</option>
              <option value="annulee">Annulées</option>
            </select>
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className={styles.errorBanner}>
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Tableau des demandes */}
        <div className={styles.tableContainer}>
          {loading ? (
            <div className={styles.loadingState}>
              <Loader2 size={32} className={styles.spinning} />
              <span>Chargement des demandes...</span>
            </div>
          ) : filteredCommandes.length === 0 ? (
            <div className={styles.emptyState}>
              <Package size={48} />
              <h3>Aucune demande</h3>
              <p>Il n'y a pas de demande de transfert correspondant à vos critères</p>
            </div>
          ) : (
            <>
              {/* Tableau desktop */}
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>N°</th>
                    <th>BO Demandeur</th>
                    <th>Quantité</th>
                    <th>Demandeur</th>
                    <th>Date</th>
                    <th>Statut</th>
                    <th>Carton</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCommandes.map((commande) => (
                    <tr 
                      key={commande.id_commande}
                      onClick={() => handleRowClick(commande)}
                      className={commande.statut_commande === 'en_attente' ? styles.clickableRow : ''}
                    >
                      <td className={styles.idCell}>#{commande.id_commande}</td>
                      <td>
                        <div className={styles.boCell}>
                          <MapPin size={14} />
                          {commande.bo_demandeur}
                        </div>
                      </td>
                      <td className={styles.quantityCell}>{commande.quantite}</td>
                      <td>
                        <div className={styles.userCell}>
                          <User size={14} />
                          {commande.demandeur_prenom} {commande.demandeur_nom}
                        </div>
                      </td>
                      <td>
                        <div className={styles.dateCell}>
                          <Clock size={14} />
                          {formatDate(commande.date_commande)}
                        </div>
                      </td>
                      <td>{getStatutBadge(commande.statut_commande)}</td>
                      <td className={styles.cartonCell}>
                        -
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Cartes mobile */}
              <div className={styles.mobileCards}>
                {filteredCommandes.map((commande) => (
                  <div 
                    key={commande.id_commande}
                    className={`${styles.mobileCard} ${commande.statut_commande === 'en_attente' ? styles.clickable : ''}`}
                    onClick={() => handleRowClick(commande)}
                  >
                    <div className={styles.cardHeader}>
                      <span className={styles.cardId}>#{commande.id_commande}</span>
                      {getStatutBadge(commande.statut_commande)}
                    </div>
                    <div className={styles.cardBody}>
                      <div className={styles.cardMainInfo}>
                        <MapPin size={16} />
                        <span className={styles.cardBo}>{commande.bo_demandeur}</span>
                        <span className={styles.cardQty}>{commande.quantite} unités</span>
                      </div>
                      <div className={styles.cardDetails}>
                        <div className={styles.cardRow}>
                          <User size={14} />
                          <span>{commande.demandeur_prenom} {commande.demandeur_nom}</span>
                        </div>
                        <div className={styles.cardRow}>
                          <Clock size={14} />
                          <span>{formatDate(commande.date_commande)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* SlidePanel */}
        {panelOpen && selectedCommande && (
          <div className={styles.overlay} onClick={handleClosePanel}>
            <div className={styles.slidePanel} onClick={(e) => e.stopPropagation()}>
              <div className={styles.panelHeader}>
                <h2>Valider le transfert #{selectedCommande.id_commande}</h2>
                <button className={styles.closeBtn} onClick={handleClosePanel}>
                  <X size={20} />
                </button>
              </div>

              <div className={styles.panelContent}>
                {/* Résumé de la demande */}
                <div className={styles.demandeSummary}>
                  <div className={styles.summaryItem}>
                    <MapPin size={16} />
                    <div>
                      <span className={styles.summaryLabel}>Destination</span>
                      <span className={styles.summaryValue}>{selectedCommande.bo_demandeur}</span>
                    </div>
                  </div>
                  <div className={styles.summaryItem}>
                    <Package size={16} />
                    <div>
                      <span className={styles.summaryLabel}>Quantité demandée</span>
                      <span className={styles.summaryValue}>{selectedCommande.quantite} concentrateurs</span>
                    </div>
                  </div>
                  <div className={styles.summaryItem}>
                    <User size={16} />
                    <div>
                      <span className={styles.summaryLabel}>Demandeur</span>
                      <span className={styles.summaryValue}>
                        {selectedCommande.demandeur_prenom} {selectedCommande.demandeur_nom}
                      </span>
                    </div>
                  </div>
                  {selectedCommande.operateur_souhaite && (
                    <div className={styles.commentaire}>
                      <strong>Opérateur souhaité:</strong> {selectedCommande.operateur_souhaite}
                    </div>
                  )}
                </div>

                {/* Résultat de validation */}
                {validationResult ? (
                  <div className={styles.successResult}>
                    <CheckCircle size={48} />
                    <h3>Transfert validé !</h3>
                    <p>{validationResult.concentrateurs_transferes} concentrateur(s) transféré(s) vers {validationResult.bo_destination}</p>
                    <div className={styles.resultDetails}>
                      <span>Carton: <strong>{validationResult.carton}</strong></span>
                    </div>
                    <Button variant="primary" onClick={handleClosePanel}>
                      Fermer
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Choix du mode */}
                    <div className={styles.modeSelector}>
                      <button
                        className={`${styles.modeBtn} ${panelMode === 'scan' ? styles.active : ''}`}
                        onClick={() => setPanelMode('scan')}
                      >
                        <QrCode size={20} />
                        Scanner QR
                      </button>
                      <button
                        className={`${styles.modeBtn} ${panelMode === 'manual' ? styles.active : ''}`}
                        onClick={() => setPanelMode('manual')}
                      >
                        <Keyboard size={20} />
                        Saisie manuelle
                      </button>
                    </div>

                    {/* Zone de saisie */}
                    {panelMode === 'scan' ? (
                      <div className={styles.scanZone}>
                        <QrCode size={64} />
                        <p>Scannez le code-barres du carton</p>
                        <Button 
                          variant="primary" 
                          onClick={() => setShowScanner(true)}
                          style={{ marginBottom: '1rem', width: '100%' }}
                        >
                          <QrCode size={18} />
                          Scanner avec caméra
                        </Button>
                        <input
                          type="text"
                          placeholder="Ou saisie au clavier / scanner USB..."
                          value={numeroCarton}
                          onChange={(e) => setNumeroCarton(e.target.value)}
                          className={styles.scanInput}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && numeroCarton.trim()) {
                              handleValidate();
                            }
                          }}
                        />
                        <span className={styles.scanHint}>ou passez en mode manuel pour saisir</span>
                      </div>
                    ) : (
                      <div className={styles.manualZone}>
                        <label>Numéro du carton</label>
                        <input
                          type="text"
                          placeholder="Ex: CART-2024-001"
                          value={numeroCarton}
                          onChange={(e) => setNumeroCarton(e.target.value)}
                          autoFocus
                        />
                        
                        {/* Liste des cartons disponibles */}
                        {cartonsDisponibles.length > 0 && (
                          <div className={styles.cartonsListe}>
                            <h4>Cartons disponibles</h4>
                            <div className={styles.cartonsList}>
                              {cartonsDisponibles.map((carton) => (
                                <button
                                  key={carton.numero_carton}
                                  className={`${styles.cartonItem} ${numeroCarton === carton.numero_carton ? styles.selected : ''}`}
                                  onClick={() => setNumeroCarton(carton.numero_carton)}
                                >
                                  <div className={styles.cartonInfo}>
                                    <span className={styles.cartonNum}>{carton.numero_carton}</span>
                                    <span className={styles.cartonOp}>{carton.operateur}</span>
                                  </div>
                                  <span className={styles.cartonCount}>
                                    {carton.concentrateurs_disponibles} dispo.
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Erreur */}
                    {panelError && (
                      <div className={styles.panelError}>
                        <AlertTriangle size={16} />
                        <span>{panelError}</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className={styles.panelActions}>
                      <Button variant="outline" onClick={handleClosePanel}>
                        Annuler
                      </Button>
                      <Button 
                        variant="primary" 
                        onClick={handleValidate}
                        disabled={validating || !numeroCarton.trim()}
                      >
                        {validating ? (
                          <>
                            <Loader2 size={18} className={styles.spinning} />
                            Validation...
                          </>
                        ) : (
                          <>
                            <CheckCircle size={18} />
                            Valider le transfert
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal Scanner */}
        {showScanner && (
          <div className={styles.scannerModal}>
            <div className={styles.scannerOverlay} onClick={() => setShowScanner(false)} />
            <div className={styles.scannerContent}>
              <BarcodeScanner
                onScan={handleScanResult}
                onError={(err) => setPanelError(err)}
              />
              <Button variant="outline" onClick={() => setShowScanner(false)} style={{ marginTop: '1rem' }}>
                Annuler
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
