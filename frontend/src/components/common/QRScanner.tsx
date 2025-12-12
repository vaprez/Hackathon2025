import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, Upload, X } from 'lucide-react';
import styles from './QRScanner.module.css';

interface QRScannerProps {
  onScan: (result: string) => void;
  onClose?: () => void;
  placeholder?: string;
}

export function QRScanner({ onScan, onClose, placeholder = 'Résultat du scan...' }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const startScanner = async () => {
    if (!containerRef.current) return;
    
    try {
      setError(null);
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          onScan(decodedText);
          stopScanner();
        },
        () => {}
      );
      
      setIsScanning(true);
    } catch (err: any) {
      console.error('Erreur scanner:', err);
      if (err.toString().includes('NotAllowedError')) {
        setError('Accès à la caméra refusé. Veuillez autoriser l\'accès.');
      } else if (err.toString().includes('NotFoundError')) {
        setError('Aucune caméra détectée sur cet appareil.');
      } else {
        setError('Impossible de démarrer le scanner. Utilisez la saisie manuelle.');
      }
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error('Erreur arrêt scanner:', err);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      const scanner = new Html5Qrcode('qr-reader-file');
      const result = await scanner.scanFile(file, true);
      onScan(result);
      scanner.clear();
    } catch (err) {
      setError('Impossible de lire le QR code de cette image.');
    }
  };

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      onScan(manualInput.trim());
      setManualInput('');
    }
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div className={styles.container} onClick={(e) => e.stopPropagation()}>
      <div className={styles.header}>
        <h3>Scanner QR Code</h3>
        {onClose && (
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        )}
      </div>

      <div className={styles.scannerArea}>
        <div id="qr-reader" ref={containerRef} className={styles.reader}></div>
        <div id="qr-reader-file" style={{ display: 'none' }}></div>
        
        {!isScanning && (
          <div className={styles.placeholder}>
            <Camera size={48} />
            <p>Cliquez sur "Démarrer" pour activer la caméra</p>
          </div>
        )}
      </div>

      {error && (
        <div className={styles.error}>
          <CameraOff size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className={styles.controls}>
        {!isScanning ? (
          <button 
            className={styles.startBtn} 
            onClick={(e) => {
              e.stopPropagation();
              startScanner();
            }}
            type="button"
          >
            <Camera size={18} />
            Démarrer la caméra
          </button>
        ) : (
          <button 
            className={styles.stopBtn} 
            onClick={(e) => {
              e.stopPropagation();
              stopScanner();
            }}
            type="button"
          >
            <CameraOff size={18} />
            Arrêter
          </button>
        )}

        <label className={styles.uploadBtn}>
          <Upload size={18} />
          Importer image
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      <div className={styles.divider}>
        <span>ou saisie manuelle</span>
      </div>

      <div className={styles.manualInput}>
        <input
          type="text"
          placeholder={placeholder}
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
        />
        <button onClick={handleManualSubmit} disabled={!manualInput.trim()}>
          Valider
        </button>
      </div>
    </div>
  );
}
