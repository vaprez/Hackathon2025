import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PackageCheck, 
  QrCode, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  Keyboard,
  Scan
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button, BarcodeScanner } from '../../components/common';
import { boService } from '../../services/bo.service';
import { useAuth } from '../../hooks/useAuth';
import styles from './ReceptionBO.module.css';

type InputMode = 'scan' | 'manual';

export function ReceptionBO() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const boName = user?.base_affectee || 'BO';
  
  const [step, setStep] = useState<'mode' | 'input' | 'success'>('mode');
  const [inputMode, setInputMode] = useState<InputMode>('scan');
  const [numeroSerie, setNumeroSerie] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [showScanner, setShowScanner] = useState(false);

  const handleModeSelect = (mode: InputMode) => {
    setInputMode(mode);
    if (mode === 'scan') {
      setShowScanner(true);
    } else {
      setStep('input');
    }
    setError(null);
  };

  const handleScanResult = (result: string) => {
    setNumeroSerie(result);
    setShowScanner(false);
    setStep('input');
  };

  const handleReception = async () => {
    if (!numeroSerie.trim()) {
      setError('Veuillez saisir le numero de serie');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await boService.reception(numeroSerie.trim());
      setResult(res);
      setStep('success');
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Erreur lors de la reception';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep('mode');
    setNumeroSerie('');
    setError(null);
    setResult(null);
  };

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <header className={styles.header}>
          <PackageCheck size={28} />
          <div>
            <h1>Reception concentrateur</h1>
            <p>{boName} - Receptionner un concentrateur en livraison</p>
          </div>
        </header>

        {step === 'mode' && (
          <div className={styles.modeSelection}>
            <h2>Comment identifier le concentrateur ?</h2>
            <div className={styles.modeButtons}>
              <button className={styles.modeButton} onClick={() => handleModeSelect('scan')}>
                <Scan size={48} />
                <span className={styles.modeTitle}>Scanner QR Code</span>
                <span className={styles.modeDesc}>Utilisez la camera pour scanner</span>
              </button>
              <button className={styles.modeButton} onClick={() => handleModeSelect('manual')}>
                <Keyboard size={48} />
                <span className={styles.modeTitle}>Saisie manuelle</span>
                <span className={styles.modeDesc}>Entrez le numero de serie</span>
              </button>
            </div>
          </div>
        )}

        {step === 'input' && (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              {inputMode === 'scan' ? <QrCode size={24} /> : <Keyboard size={24} />}
              <h2>{inputMode === 'scan' ? 'Scanner le concentrateur' : 'Saisir le numero de serie'}</h2>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.field}>
                <label>Numero de serie</label>
                {inputMode === 'scan' && (
                  <Button 
                    variant="outline" 
                    onClick={() => setShowScanner(true)}
                    style={{ marginBottom: '1rem', width: '100%' }}
                  >
                    <Scan size={18} />
                    Scanner avec caméra
                  </Button>
                )}
                <input
                  type="text"
                  placeholder="Ex: CPL-BOU-20241211-ABC123"
                  value={numeroSerie}
                  onChange={(e) => setNumeroSerie(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleReception()}
                  autoFocus={inputMode === 'manual'}
                />
              </div>

              <div className={styles.infoBox}>
                <p>Le concentrateur passera de "en_livraison" a "en_stock" et sera affecte a {boName}</p>
              </div>

              {error && (
                <div className={styles.error}>
                  <AlertTriangle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div className={styles.actions}>
                <Button variant="outline" onClick={() => setStep('mode')}>
                  Retour
                </Button>
                <Button variant="primary" onClick={handleReception} disabled={loading || !numeroSerie.trim()}>
                  {loading ? (
                    <>
                      <Loader2 size={18} className={styles.spinning} />
                      Reception en cours...
                    </>
                  ) : (
                    'Valider la reception'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 'success' && result && (
          <div className={styles.successCard}>
            <CheckCircle size={64} />
            <h2>Reception validee !</h2>
            <p>{result.message}</p>
            <div className={styles.successDetails}>
              <div>
                <span className={styles.label}>Concentrateur</span>
                <span className={styles.value}>{result.numero_serie}</span>
              </div>
              <div>
                <span className={styles.label}>Ancienne affectation</span>
                <span className={styles.value}>{result.ancienne_affectation || '-'}</span>
              </div>
              <div>
                <span className={styles.label}>Nouvelle affectation</span>
                <span className={styles.value}>{result.nouvelle_affectation}</span>
              </div>
            </div>
            <div className={styles.actions}>
              <Button variant="outline" onClick={handleReset}>
                Nouvelle reception
              </Button>
              <Button variant="primary" onClick={() => navigate('/bo/stock')}>
                Voir le stock
              </Button>
            </div>
          </div>
        )}

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
