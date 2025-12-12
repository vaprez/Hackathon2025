import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  FlaskConical, 
  QrCode, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  FileText,
  Camera
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button, BarcodeScanner } from '../../components/common';
import { concentrateursService } from '../../services/concentrateurs.service';
import api from '../../services/api';
import type { Concentrateur } from '../../types';
import styles from './TestConcentrateur.module.css';

type TestResult = 'reparable' | 'hs';

export function TestConcentrateur() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [step, setStep] = useState<'scan' | 'test' | 'success'>('scan');
  const [numeroSerie, setNumeroSerie] = useState(searchParams.get('numero_serie') || '');
  const [concentrateur, setConcentrateur] = useState<Concentrateur | null>(null);
  const [resultat, setResultat] = useState<TestResult | null>(null);
  const [commentaire, setCommentaire] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  const handleScan = async () => {
    if (!numeroSerie.trim()) {
      setError('Veuillez saisir le numéro de série');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await concentrateursService.verifyConcentrateur(numeroSerie.trim());
      if (!response.exists || !response.concentrateur) {
        setError(`Concentrateur "${numeroSerie}" introuvable`);
      } else if (response.concentrateur.affectation !== 'Labo') {
        setError(`Ce concentrateur n'est pas au Labo (affectation: ${response.concentrateur.affectation})`);
      } else {
        setConcentrateur(response.concentrateur);
        setStep('test');
      }
    } catch (err) {
      setError('Erreur lors de la vérification');
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeScanned = (result: string) => {
    setNumeroSerie(result);
    setShowScanner(false);
    handleScan();
  };

  const handleValidate = async () => {
    if (!resultat) {
      setError('Veuillez sélectionner un résultat de test');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.post('/labo/test', {
        numero_serie: numeroSerie.trim(),
        resultat,
        commentaire: commentaire.trim() || undefined,
      });
      setStep('success');
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Erreur lors de l\'enregistrement du test';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep('scan');
    setNumeroSerie('');
    setConcentrateur(null);
    setResultat(null);
    setCommentaire('');
    setError(null);
  };

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <header className={styles.header}>
          <FlaskConical size={28} />
          <div>
            <h1>Test de concentrateur</h1>
            <p>Effectuer le diagnostic et enregistrer le résultat</p>
          </div>
        </header>

        {step === 'scan' && (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <QrCode size={24} />
              <h2>Scanner le concentrateur</h2>
            </div>
            <div className={styles.cardBody}>
              {showScanner ? (
                <div className={styles.scannerSection}>
                  <BarcodeScanner 
                    onScan={handleBarcodeScanned}
                    onError={(err) => setError(err)}
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => setShowScanner(false)}
                    style={{ marginTop: 'var(--spacing-4)' }}
                  >
                    Saisie manuelle
                  </Button>
                </div>
              ) : (
                <>
                  <div className={styles.field}>
                    <label>Numéro de série</label>
                    <input
                      type="text"
                      placeholder="Ex: CPL-BOU-20241211-ABC123"
                      value={numeroSerie}
                      onChange={(e) => setNumeroSerie(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                      autoFocus
                    />
                  </div>
                  {error && (
                    <div className={styles.error}>
                      <AlertTriangle size={16} />
                      <span>{error}</span>
                    </div>
                  )}
                  <div className={styles.scanActions}>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowScanner(true)}
                      style={{ flex: 1 }}
                    >
                      <Camera size={18} />
                      Scanner avec caméra
                    </Button>
                    <Button 
                      variant="primary" 
                      onClick={handleScan} 
                      disabled={loading || !numeroSerie.trim()}
                      style={{ flex: 1 }}
                    >
                      {loading ? (
                        <>
                          <Loader2 size={18} className={styles.spinning} />
                          Vérification...
                        </>
                      ) : (
                        'Vérifier'
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {step === 'test' && concentrateur && (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <FlaskConical size={24} />
              <h2>Résultat du test</h2>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.infoBox}>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Concentrateur</span>
                  <span className={styles.value}>{concentrateur.numero_serie}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Modèle</span>
                  <span className={styles.value}>{concentrateur.modele || '-'}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Opérateur</span>
                  <span className={styles.value}>{concentrateur.operateur}</span>
                </div>
              </div>

              <div className={styles.field}>
                <label>Résultat du test *</label>
                <div className={styles.resultButtons}>
                  <button
                    type="button"
                    className={`${styles.resultButton} ${styles.success} ${resultat === 'reparable' ? styles.selected : ''}`}
                    onClick={() => setResultat('reparable')}
                  >
                    <ThumbsUp size={24} />
                    <span>Réparable</span>
                    <small>Retour au Magasin</small>
                  </button>
                  <button
                    type="button"
                    className={`${styles.resultButton} ${styles.danger} ${resultat === 'hs' ? styles.selected : ''}`}
                    onClick={() => setResultat('hs')}
                  >
                    <ThumbsDown size={24} />
                    <span>HS</span>
                    <small>Mise au rebut</small>
                  </button>
                </div>
              </div>

              <div className={styles.field}>
                <label>Détail du diagnostic</label>
                <textarea
                  placeholder="Décrivez les tests effectués et le diagnostic..."
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  rows={4}
                />
              </div>

              {error && (
                <div className={styles.error}>
                  <AlertTriangle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div className={styles.actions}>
                <Button variant="outline" onClick={() => setStep('scan')}>
                  Annuler
                </Button>
                <Button variant="primary" onClick={handleValidate} disabled={loading || !resultat}>
                  {loading ? (
                    <>
                      <Loader2 size={18} className={styles.spinning} />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <FileText size={18} />
                      Valider et générer rapport
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className={styles.successCard}>
            <CheckCircle size={64} />
            <h2>Test enregistré !</h2>
            <p>
              {resultat === 'reparable' 
                ? 'Le concentrateur a été renvoyé au Magasin'
                : 'Le concentrateur a été marqué comme HS'
              }
            </p>
            <div className={styles.successDetails}>
              <div>
                <span className={styles.label}>Concentrateur</span>
                <span className={styles.value}>{numeroSerie}</span>
              </div>
              <div>
                <span className={styles.label}>Résultat</span>
                <span className={`${styles.value} ${resultat === 'reparable' ? styles.success : styles.danger}`}>
                  {resultat === 'reparable' ? 'Réparable' : 'HS'}
                </span>
              </div>
            </div>
            <div className={styles.actions}>
              <Button variant="outline" onClick={handleReset}>
                Nouveau test
              </Button>
              <Button variant="primary" onClick={() => navigate('/labo/file-attente')}>
                Voir la file d'attente
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
