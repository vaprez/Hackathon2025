import { useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, AlertCircle, Loader2 } from 'lucide-react';
import styles from './BarcodeScanner.module.css';

interface BarcodeScannerProps {
  onScan: (result: string) => void;
  onError?: (error: string) => void;
}

export function BarcodeScanner({ onScan, onError }: BarcodeScannerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  const handleCapture = () => {
    fileInputRef.current?.click();
  };

  const optimizeImageFile = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(file);
            return;
          }

          // Dimensions optimales pour scan (max 1600px pour meilleure qualité)
          const maxSize = 1600;
          let width = img.width;
          let height = img.height;

          if (width > height && width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }

          canvas.width = width;
          canvas.height = height;

          // Fond blanc pour meilleur contraste
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);

          // Dessiner l'image
          ctx.drawImage(img, 0, 0, width, height);

          // Améliorer le contraste pour faciliter la détection
          const imageData = ctx.getImageData(0, 0, width, height);
          const data = imageData.data;
          
          // Augmenter le contraste
          const contrast = 1.3;
          const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
          
          for (let i = 0; i < data.length; i += 4) {
            data[i] = factor * (data[i] - 128) + 128;     // R
            data[i + 1] = factor * (data[i + 1] - 128) + 128; // G
            data[i + 2] = factor * (data[i + 2] - 128) + 128; // B
          }
          
          ctx.putImageData(imageData, 0, 0);

          // Convertir en blob avec qualité maximale
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const optimizedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                console.log('Image optimisée:', width, 'x', height, 'Taille:', optimizedFile.size);
                resolve(optimizedFile);
              } else {
                resolve(file);
              }
            },
            'image/jpeg',
            1.0
          );
        };
        img.onerror = () => resolve(file);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setScanning(true);
    setError(null);

    try {
      console.log('📸 Image originale:', file.name, 'Taille:', file.size, 'Type:', file.type);
      
      // Optimiser l'image pour mobile
      const optimizedFile = await optimizeImageFile(file);
      
      const html5QrCode = new Html5Qrcode('qr-reader', {
        formatsToSupport: [
          0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16
        ],
        verbose: false,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        }
      });
      
      console.log('🔍 Début du scan...');
      
      const result = await html5QrCode.scanFile(optimizedFile, true);
      
      console.log('✅ Code détecté:', result);
      
      const codeText = typeof result === 'string' ? result : (result as any).decodedText || (result as any).text || String(result);
      
      console.log('📝 Texte extrait:', codeText);
      onScan(codeText);
      
    } catch (err: any) {
      console.error('❌ Erreur scan:', err);
      console.error('Message:', err.message);
      
      const errorMsg = `Aucun code détecté dans l'image.

Conseils :
• Prenez une photo NETTE et STABLE
• CODE en GROS PLAN (remplir l'image)
• Bon ÉCLAIRAGE uniforme
• Évitez les ombres et reflets
• Essayez plusieurs fois si nécessaire`;
      
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setScanning(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };


  return (
    <div className={styles.scannerContainer}>
      <div className={styles.captureCard}>
        <Camera size={64} className={styles.cameraIcon} />
        <h3>Scanner un code-barres</h3>
        <p>Prenez une photo du code-barres du concentrateur</p>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        
        <div className={styles.buttonGroup}>
          <button 
            className={styles.captureButton} 
            onClick={handleCapture}
            disabled={scanning}
          >
            {scanning ? (
              <>
                <Loader2 size={20} className={styles.spinning} />
                Analyse...
              </>
            ) : (
              <>
                <Camera size={20} />
                Prendre une photo
              </>
            )}
          </button>
        </div>
        
        {error && (
          <div className={styles.error}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}
        
        <div className={styles.instructions}>
          <p><strong>Conseils pour un meilleur scan :</strong></p>
          <ul>
            <li>Positionnez le code-barres bien en face</li>
            <li>Assurez-vous d'avoir un bon éclairage</li>
            <li>Le code-barres doit être net et lisible</li>
          </ul>
        </div>
      </div>
      <div id="qr-reader" style={{ display: 'none' }}></div>
    </div>
  );
}
