import { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  RotateCcw, 
  QrCode, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  Keyboard,
  Scan,
  Camera,
  X
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button, BarcodeScanner } from '../../components/common';
import { boService } from '../../services/bo.service';
import { useAuth } from '../../hooks/useAuth';
import styles from './DeposeConcentrateur.module.css';

type InputMode = 'scan' | 'manual';

export function DeposeConcentrateur() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const boName = user?.base_affectee || 'BO';
  
  const [step, setStep] = useState<'mode' | 'input' | 'success'>('mode');
  const [inputMode, setInputMode] = useState<InputMode>('scan');
  const [numeroSerie, setNumeroSerie] = useState(searchParams.get('numero_serie') || '');
  const [commentaire, setCommentaire] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [showScanner, setShowScanner] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhoto(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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

  const handleDepose = async () => {
    if (!numeroSerie.trim()) {
      setError('Veuillez saisir le numero de serie');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await boService.depose(numeroSerie.trim(), {
        commentaire: commentaire.trim() || undefined,
        photo: photo || undefined
      });
      setResult(res);
      setStep('success');
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Erreur lors de la depose';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep('mode');
    setNumeroSerie('');
    setCommentaire('');
    setPhoto(null);
    setError(null);
    setResult(null);
  };

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <header className={styles.header}>
          <RotateCcw size={28} />
          <div>
            <h1>Depose de concentrateur</h1>
            <p>{boName} - Passer un concentrateur de "pose" a "a_tester"</p>
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
                <label>Numero de serie *</label>
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
                  autoFocus={inputMode === 'manual'}
                />
              </div>

              <div className={styles.field}>
                <label>Commentaire (optionnel)</label>
                <textarea
                  placeholder="Raison de la dépose, observations..."
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  rows={3}
                />
              </div>

              <div className={styles.photoField}>
                <label>Photo (optionnel)</label>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoCapture}
                  ref={fileInputRef}
                  className={styles.fileInput}
                />
                {!photo ? (
                  <button 
                    type="button" 
                    className={styles.photoButton}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera size={20} />
                    Prendre une photo
                  </button>
                ) : (
                  <div className={styles.photoPreview}>
                    <img src={photo} alt="Aperçu" />
                    <button type="button" className={styles.removePhoto} onClick={removePhoto}>
                      <X size={16} />
                    </button>
                  </div>
                )}
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
                <Button variant="primary" onClick={handleDepose} disabled={loading || !numeroSerie.trim()}>
                  {loading ? (
                    <>
                      <Loader2 size={18} className={styles.spinning} />
                      Depose en cours...
                    </>
                  ) : (
                    'Valider la depose'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 'success' && result && (
          <div className={styles.successCard}>
            <CheckCircle size={64} />
            <h2>Depose validee !</h2>
            <p>{result.message}</p>
            <div className={styles.successDetails}>
              <div>
                <span className={styles.label}>Concentrateur</span>
                <span className={styles.value}>{result.numero_serie}</span>
              </div>
              <div>
                <span className={styles.label}>Ancien etat</span>
                <span className={styles.value}>{result.ancien_etat}</span>
              </div>
              <div>
                <span className={styles.label}>Nouvel etat</span>
                <span className={styles.value}>{result.nouvel_etat}</span>
              </div>
            </div>
            <div className={styles.actions}>
              <Button variant="outline" onClick={handleReset}>
                Nouvelle depose
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
