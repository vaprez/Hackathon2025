import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  QrCode, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  Truck,
  Keyboard,
  Plus,
  Trash2,
  Box,
  Scan
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button, BarcodeScanner } from '../../components/common';
import { magasinService, ConcentrateurCreate, SelectOption, ReceptionResult } from '../../services/magasin.service';
import styles from './ReceptionCartons.module.css';

type Step = 'carton_mode' | 'carton_info' | 'concentrateurs' | 'validation' | 'success';
type InputMode = 'scan' | 'manual';

interface ConcentrateurItem {
  numero_serie: string;
  modele: string;
  operateur: string;
  status: 'pending' | 'valid' | 'error';
  message?: string;
}

export function ReceptionCartons() {
  const navigate = useNavigate();
  
  // États principaux
  const [step, setStep] = useState<Step>('carton_mode');
  const [inputMode, setInputMode] = useState<InputMode>('scan');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Données carton
  const [numeroCarton, setNumeroCarton] = useState('');
  const [operateurCarton, setOperateurCarton] = useState('Enedis');
  
  // Données concentrateurs
  const [concentrateurs, setConcentrateurs] = useState<ConcentrateurItem[]>([]);
  const [currentNumeroSerie, setCurrentNumeroSerie] = useState('');
  const [currentModele, setCurrentModele] = useState('');
  const [concentrateurMode, setConcentrateurMode] = useState<InputMode>('scan');
  
  // Listes déroulantes
  const [operateurs, setOperateurs] = useState<SelectOption[]>([]);
  
  // Résultat
  const [result, setResult] = useState<ReceptionResult | null>(null);
  
  // Scanner QR
  const [showScanner, setShowScanner] = useState(false);
  const [scanTarget, setScanTarget] = useState<'carton' | 'concentrateur'>('carton');

  // Charger les opérateurs au montage
  useEffect(() => {
    const loadOperateurs = async () => {
      try {
        const ops = await magasinService.getOperateurs();
        setOperateurs(ops);
      } catch (err) {
        console.error('Erreur chargement opérateurs:', err);
        // Fallback
        setOperateurs([
          { value: 'Enedis', label: 'Enedis' },
          { value: 'EDF', label: 'EDF' },
          { value: 'Orange', label: 'Orange' },
          { value: 'Bouygues', label: 'Bouygues' },
          { value: 'SFR', label: 'SFR' }
        ]);
      }
    };
    loadOperateurs();
  }, []);

  // ============================================
  // ÉTAPE 1: Mode de saisie du carton
  // ============================================
  const handleCartonModeSelect = (mode: InputMode) => {
    setInputMode(mode);
    if (mode === 'scan') {
      setScanTarget('carton');
      setShowScanner(true);
    } else {
      setStep('carton_info');
    }
    setError(null);
  };

  const handleScanResult = (result: string) => {
    setShowScanner(false);
    if (scanTarget === 'carton') {
      setNumeroCarton(result);
      setStep('carton_info');
    } else {
      setCurrentNumeroSerie(result);
    }
  };

  const handleOpenConcentrateurScanner = () => {
    setScanTarget('concentrateur');
    setShowScanner(true);
  };

  // ============================================
  // ÉTAPE 2: Validation du carton (insertion directe)
  // ============================================
  const handleCartonValidate = () => {
    if (!numeroCarton.trim()) {
      setError('Veuillez saisir le numéro de carton');
      return;
    }
    setError(null);
    setStep('concentrateurs');
  };

  // ============================================
  // ÉTAPE 3: Ajout des concentrateurs (insertion directe)
  // ============================================
  const handleAddConcentrateur = () => {
    if (!currentNumeroSerie.trim()) {
      setError('Veuillez saisir le numéro de série');
      return;
    }

    // Vérifier si déjà dans la liste locale
    if (concentrateurs.some(c => c.numero_serie === currentNumeroSerie.trim())) {
      setError('Ce concentrateur est déjà dans la liste');
      return;
    }

    setError(null);
    
    // Ajouter directement à la liste
    setConcentrateurs(prev => [...prev, {
      numero_serie: currentNumeroSerie.trim(),
      modele: currentModele || '',
      operateur: operateurCarton,
      status: 'valid'
    }]);
    
    // Reset les champs
    setCurrentNumeroSerie('');
    setCurrentModele('');
  };

  const handleRemoveConcentrateur = (numeroSerie: string) => {
    setConcentrateurs(prev => prev.filter(c => c.numero_serie !== numeroSerie));
  };

  const handleUpdateConcentrateurOperateur = (numeroSerie: string, newOperateur: string) => {
    setConcentrateurs(prev => prev.map(c => 
      c.numero_serie === numeroSerie ? { ...c, operateur: newOperateur } : c
    ));
  };

  const handleGoToValidation = () => {
    const validConcentrateurs = concentrateurs.filter(c => c.status === 'valid');
    if (validConcentrateurs.length === 0) {
      setError('Aucun concentrateur valide à enregistrer');
      return;
    }
    setError(null);
    setStep('validation');
  };

  // ============================================
  // ÉTAPE 4: Validation finale
  // ============================================
  const handleFinalValidation = async () => {
    const validConcentrateurs = concentrateurs.filter(c => c.status === 'valid');
    
    if (validConcentrateurs.length === 0) {
      setError('Aucun concentrateur valide à enregistrer');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const concentrateursData: ConcentrateurCreate[] = validConcentrateurs.map(c => ({
        numero_serie: c.numero_serie,
        modele: c.modele || undefined,
        operateur: c.operateur,
        numero_carton: numeroCarton.trim()
      }));

      const response = await magasinService.reception({
        numero_carton: numeroCarton.trim(),
        operateur: operateurCarton,
        concentrateurs: concentrateursData
      });

      setResult(response);
      setStep('success');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de la réception');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // RESET
  // ============================================
  const handleReset = () => {
    setStep('carton_mode');
    setInputMode('scan');
    setNumeroCarton('');
    setOperateurCarton('Enedis');
    setConcentrateurs([]);
    setCurrentNumeroSerie('');
    setCurrentModele('');
    setError(null);
    setResult(null);
  };

  // Compter les concentrateurs valides
  const validCount = concentrateurs.filter(c => c.status === 'valid').length;
  const errorCount = concentrateurs.filter(c => c.status === 'error').length;

  return (
    <DashboardLayout>
      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <Truck size={28} />
          <div>
            <h1>Réception Cartons</h1>
            <p>Scanner ou saisir les cartons et concentrateurs fournisseurs</p>
          </div>
        </header>

        {/* Indicateur d'étapes */}
        <div className={styles.stepper}>
          <div className={`${styles.stepItem} ${step === 'carton_mode' || step === 'carton_info' ? styles.active : ''} ${['concentrateurs', 'validation', 'success'].includes(step) ? styles.completed : ''}`}>
            <span className={styles.stepNumber}>
              {['concentrateurs', 'validation', 'success'].includes(step) ? <CheckCircle size={16} /> : '1'}
            </span>
            <span className={styles.stepLabel}>Carton</span>
          </div>
          <div className={styles.stepLine}></div>
          <div className={`${styles.stepItem} ${step === 'concentrateurs' ? styles.active : ''} ${['validation', 'success'].includes(step) ? styles.completed : ''}`}>
            <span className={styles.stepNumber}>
              {['validation', 'success'].includes(step) ? <CheckCircle size={16} /> : '2'}
            </span>
            <span className={styles.stepLabel}>Concentrateurs</span>
          </div>
          <div className={styles.stepLine}></div>
          <div className={`${styles.stepItem} ${step === 'validation' ? styles.active : ''} ${step === 'success' ? styles.completed : ''}`}>
            <span className={styles.stepNumber}>
              {step === 'success' ? <CheckCircle size={16} /> : '3'}
            </span>
            <span className={styles.stepLabel}>Validation</span>
          </div>
        </div>

        {/* ÉTAPE 1: Choix du mode de saisie carton */}
        {step === 'carton_mode' && (
          <div className={styles.modeSelection}>
            <h2>Comment souhaitez-vous identifier le carton ?</h2>
            <div className={styles.modeButtons}>
              <button className={styles.modeButton} onClick={() => handleCartonModeSelect('scan')}>
                <QrCode size={48} />
                <span className={styles.modeTitle}>Scanner QR Code</span>
                <span className={styles.modeDesc}>Scannez le code QR du carton</span>
              </button>
              <button className={styles.modeButton} onClick={() => handleCartonModeSelect('manual')}>
                <Keyboard size={48} />
                <span className={styles.modeTitle}>Saisie manuelle</span>
                <span className={styles.modeDesc}>Entrez le numéro manuellement</span>
              </button>
            </div>
          </div>
        )}

        {/* ÉTAPE 2: Informations du carton */}
        {step === 'carton_info' && (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              {inputMode === 'scan' ? <QrCode size={24} /> : <Keyboard size={24} />}
              <h2>{inputMode === 'scan' ? 'Scanner le carton' : 'Saisir le numéro du carton'}</h2>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.field}>
                <label>Numéro de carton</label>
                <div className={styles.inputWithButton}>
                  <input
                    type="text"
                    placeholder="Ex: CART-2024-001234"
                    value={numeroCarton}
                    onChange={(e) => setNumeroCarton(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCartonValidate()}
                    autoFocus
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label>Opérateur du carton</label>
                <select 
                  value={operateurCarton} 
                  onChange={(e) => setOperateurCarton(e.target.value)}
                >
                  {operateurs.map(op => (
                    <option key={op.value} value={op.value}>{op.label}</option>
                  ))}
                </select>
              </div>

              {error && (
                <div className={styles.error}>
                  <AlertTriangle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div className={styles.actions}>
                <Button variant="outline" onClick={() => setStep('carton_mode')}>
                  Retour
                </Button>
                <Button variant="primary" onClick={handleCartonValidate} disabled={!numeroCarton.trim()}>
                  Continuer
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ÉTAPE 3: Ajout des concentrateurs */}
        {step === 'concentrateurs' && (
          <div className={styles.concentrateursSection}>
            {/* Résumé carton */}
            <div className={styles.cartonSummary}>
              <Box size={20} />
              <span><strong>Carton:</strong> {numeroCarton}</span>
              <span><strong>Opérateur:</strong> {operateurCarton}</span>
            </div>

            {/* Mode de saisie concentrateur */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2>Ajouter des concentrateurs</h2>
                <div className={styles.modeToggle}>
                  <button 
                    className={`${styles.toggleBtn} ${concentrateurMode === 'scan' ? styles.active : ''}`}
                    onClick={handleOpenConcentrateurScanner}
                  >
                    <Scan size={16} /> Scanner
                  </button>
                  <button 
                    className={`${styles.toggleBtn} ${concentrateurMode === 'manual' ? styles.active : ''}`}
                    onClick={() => setConcentrateurMode('manual')}
                  >
                    <Keyboard size={16} /> Manuel
                  </button>
                </div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.concentrateurForm}>
                  <div className={styles.field}>
                    <label>Numéro de série *</label>
                    <input
                      type="text"
                      placeholder={concentrateurMode === 'scan' ? 'Scannez le QR code...' : 'Ex: CONC-001234'}
                      value={currentNumeroSerie}
                      onChange={(e) => setCurrentNumeroSerie(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddConcentrateur()}
                      autoFocus
                    />
                  </div>
                  <div className={styles.field}>
                    <label>Modèle (optionnel)</label>
                    <input
                      type="text"
                      placeholder="Ex: G3-PLC"
                      value={currentModele}
                      onChange={(e) => setCurrentModele(e.target.value)}
                    />
                  </div>
                  <Button 
                    variant="primary" 
                    onClick={handleAddConcentrateur} 
                    disabled={loading || !currentNumeroSerie.trim()}
                  >
                    {loading ? <Loader2 size={18} className={styles.spinning} /> : <Plus size={18} />}
                    Ajouter
                  </Button>
                </div>

                {error && (
                  <div className={styles.error}>
                    <AlertTriangle size={16} />
                    <span>{error}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Liste des concentrateurs ajoutés */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2>Concentrateurs à enregistrer ({concentrateurs.length})</h2>
                {concentrateurs.length > 0 && (
                  <div className={styles.countBadges}>
                    <span className={styles.validBadge}>{validCount} valide(s)</span>
                    {errorCount > 0 && <span className={styles.errorBadge}>{errorCount} erreur(s)</span>}
                  </div>
                )}
              </div>
              <div className={styles.cardBody}>
                {concentrateurs.length === 0 ? (
                  <div className={styles.emptyList}>
                    <Package size={48} />
                    <p>Aucun concentrateur ajouté</p>
                    <span>Scannez ou saisissez les numéros de série</span>
                  </div>
                ) : (
                  <div className={styles.concentrateursList}>
                    {concentrateurs.map((conc, index) => (
                      <div 
                        key={conc.numero_serie} 
                        className={`${styles.concentrateurItem} ${conc.status === 'error' ? styles.itemError : styles.itemValid}`}
                      >
                        <div className={styles.itemInfo}>
                          <span className={styles.itemNumber}>#{index + 1}</span>
                          <div className={styles.itemDetails}>
                            <strong>{conc.numero_serie}</strong>
                            {conc.modele && <span>Modèle: {conc.modele}</span>}
                            {conc.status === 'error' && <span className={styles.errorMsg}>{conc.message}</span>}
                          </div>
                        </div>
                        <div className={styles.itemActions}>
                          <select 
                            value={conc.operateur} 
                            onChange={(e) => handleUpdateConcentrateurOperateur(conc.numero_serie, e.target.value)}
                            disabled={conc.status === 'error'}
                          >
                            {operateurs.map(op => (
                              <option key={op.value} value={op.value}>{op.label}</option>
                            ))}
                          </select>
                          <button 
                            className={styles.removeBtn}
                            onClick={() => handleRemoveConcentrateur(conc.numero_serie)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.actions}>
              <Button variant="outline" onClick={() => setStep('carton_info')}>
                Retour
              </Button>
              <Button 
                variant="primary" 
                onClick={handleGoToValidation} 
                disabled={validCount === 0}
              >
                Valider ({validCount} concentrateur{validCount > 1 ? 's' : ''})
              </Button>
            </div>
          </div>
        )}

        {/* ÉTAPE 4: Récapitulatif et validation */}
        {step === 'validation' && (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <CheckCircle size={24} />
              <h2>Récapitulatif de la réception</h2>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.recapSection}>
                <h3>Carton</h3>
                <div className={styles.recapItem}>
                  <span>Numéro:</span>
                  <strong>{numeroCarton}</strong>
                </div>
                <div className={styles.recapItem}>
                  <span>Opérateur:</span>
                  <strong>{operateurCarton}</strong>
                </div>
              </div>

              <div className={styles.recapSection}>
                <h3>Concentrateurs ({validCount})</h3>
                <div className={styles.recapList}>
                  {concentrateurs.filter(c => c.status === 'valid').map((conc, index) => (
                    <div key={conc.numero_serie} className={styles.recapConcentrateur}>
                      <span>{index + 1}. {conc.numero_serie}</span>
                      <span>{conc.operateur}</span>
                    </div>
                  ))}
                </div>
              </div>

              {errorCount > 0 && (
                <div className={styles.warningBox}>
                  <AlertTriangle size={20} />
                  <span>{errorCount} concentrateur(s) ignoré(s) car déjà existant(s)</span>
                </div>
              )}

              {error && (
                <div className={styles.error}>
                  <AlertTriangle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div className={styles.actions}>
                <Button variant="outline" onClick={() => setStep('concentrateurs')}>
                  Retour
                </Button>
                <Button variant="primary" onClick={handleFinalValidation} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 size={18} className={styles.spinning} />
                      Enregistrement...
                    </>
                  ) : (
                    'Confirmer la réception'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ÉTAPE 5: Succès */}
        {step === 'success' && result && (
          <div className={styles.successCard}>
            <CheckCircle size={64} />
            <h2>Réception validée !</h2>
            <p>{result.created} concentrateur(s) enregistré(s)</p>
            
            <div className={styles.successDetails}>
              <div>
                <span className={styles.label}>Carton</span>
                <span className={styles.value}>{result.carton}</span>
              </div>
              <div>
                <span className={styles.label}>Opérateur</span>
                <span className={styles.value}>{result.operateur}</span>
              </div>
            </div>

            {result.errors && result.errors.length > 0 && (
              <div className={styles.warningBox}>
                <AlertTriangle size={20} />
                <div>
                  <strong>Erreurs:</strong>
                  <ul>
                    {result.errors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                </div>
              </div>
            )}

            <div className={styles.actions}>
              <Button variant="outline" onClick={handleReset}>
                Nouvelle réception
              </Button>
              <Button variant="primary" onClick={() => navigate('/magasin/stock')}>
                Voir le stock
              </Button>
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
                onError={(err) => setError(err)}
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
