// Script Node.js pour générer toutes les icônes PWA à partir d'un logo source
// Usage: node generate-icons.js

import { createCanvas, loadImage } from 'canvas';
import fs from 'fs';
import path from 'path';

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const sourceImage = 'public/edf-icon.svg'; // ou votre logo PNG
const outputDir = 'public/icons';

// Créer le dossier icons s'il n'existe pas
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function generateIcon(size) {
  try {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Fond blanc pour les icônes standard
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);
    
    // Charger l'image source
    const image = await loadImage(sourceImage);
    
    // Calculer les dimensions pour centrer l'image avec padding
    const padding = size * 0.1; // 10% de padding
    const imgSize = size - (padding * 2);
    
    // Dessiner l'image centrée
    ctx.drawImage(image, padding, padding, imgSize, imgSize);
    
    // Sauvegarder
    const buffer = canvas.toBuffer('image/png');
    const filename = path.join(outputDir, `icon-${size}x${size}.png`);
    fs.writeFileSync(filename, buffer);
    
    console.log(`✅ Généré: icon-${size}x${size}.png`);
    
    // Générer version maskable pour Android (192 et 512)
    if (size === 192 || size === 512) {
      const maskableCanvas = createCanvas(size, size);
      const maskableCtx = maskableCanvas.getContext('2d');
      
      // Fond coloré pour maskable (bleu EDF)
      maskableCtx.fillStyle = '#003D7A';
      maskableCtx.fillRect(0, 0, size, size);
      
      // Zone de sécurité de 20% pour maskable
      const safePadding = size * 0.2;
      const safeSize = size - (safePadding * 2);
      
      // Dessiner l'image dans la zone de sécurité
      maskableCtx.drawImage(image, safePadding, safePadding, safeSize, safeSize);
      
      const maskableBuffer = maskableCanvas.toBuffer('image/png');
      const maskableFilename = path.join(outputDir, `icon-${size}x${size}-maskable.png`);
      fs.writeFileSync(maskableFilename, maskableBuffer);
      
      console.log(`✅ Généré: icon-${size}x${size}-maskable.png`);
    }
  } catch (error) {
    console.error(`❌ Erreur pour la taille ${size}:`, error.message);
  }
}

async function generateAllIcons() {
  console.log('🎨 Génération des icônes PWA...\n');
  
  // Vérifier que le fichier source existe
  if (!fs.existsSync(sourceImage)) {
    console.error(`❌ Fichier source introuvable: ${sourceImage}`);
    console.log('\n💡 Assurez-vous d\'avoir un logo au format PNG ou SVG dans le dossier public/');
    return;
  }
  
  // Générer toutes les tailles
  for (const size of sizes) {
    await generateIcon(size);
  }
  
  // Générer les icônes de raccourcis
  console.log('\n🔖 Génération des icônes de raccourcis...');
  await generateShortcutIcons();
  
  console.log('\n✨ Génération terminée !');
  console.log(`📁 Icônes générées dans: ${outputDir}/`);
}

async function generateShortcutIcons() {
  // Pour simplifier, créer des icônes 96x96 pour les shortcuts
  // avec des symboles différents
  
  const shortcuts = [
    { name: 'scanner', symbol: '📷', color: '#FF6B00' },
    { name: 'map', symbol: '🗺️', color: '#003D7A' }
  ];
  
  for (const shortcut of shortcuts) {
    try {
      const size = 96;
      const canvas = createCanvas(size, size);
      const ctx = canvas.getContext('2d');
      
      // Fond coloré
      ctx.fillStyle = shortcut.color;
      ctx.fillRect(0, 0, size, size);
      
      // Dessiner le symbole (emoji)
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(shortcut.symbol, size / 2, size / 2);
      
      const buffer = canvas.toBuffer('image/png');
      const filename = path.join(outputDir, `${shortcut.name}-96x96.png`);
      fs.writeFileSync(filename, buffer);
      
      console.log(`✅ Généré: ${shortcut.name}-96x96.png`);
    } catch (error) {
      console.error(`❌ Erreur pour ${shortcut.name}:`, error.message);
    }
  }
}

// Lancer la génération
generateAllIcons().catch(console.error);
