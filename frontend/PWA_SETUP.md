# 📱 Configuration PWA - EDF Corse Gestion CPL

## 🎯 Fonctionnalités PWA Implémentées

### ✅ Fonctionnalités Principales
- **Installation sur écran d'accueil** (iOS & Android)
- **Mode hors ligne** avec cache intelligent
- **Accès caméra** optimisé pour le scanner
- **Géolocalisation** pour la carte et navigation
- **Raccourcis d'application** (Scanner, Carte)
- **Notifications push** (prêt à configurer)
- **Mises à jour automatiques**

### 🔒 Permissions Requises
- ✅ **Caméra** : Scanner les codes-barres des concentrateurs
- ✅ **Géolocalisation** : Navigation vers les postes électriques

---

## 🖼️ Génération des Icônes PWA

### Option 1 : Utiliser un générateur en ligne (RECOMMANDÉ)

1. Allez sur **https://realfavicongenerator.net/** ou **https://www.pwabuilder.com/imageGenerator**
2. Uploadez votre logo EDF (idéalement 512x512 px, format PNG avec fond transparent)
3. Générez les icônes pour toutes les plateformes
4. Téléchargez et placez dans `public/icons/`

### Option 2 : Script de génération automatique

Installez imagemagick puis utilisez ce script :

```bash
# Windows (avec ImageMagick installé)
magick edf-logo.png -resize 72x72 public/icons/icon-72x72.png
magick edf-logo.png -resize 96x96 public/icons/icon-96x96.png
magick edf-logo.png -resize 128x128 public/icons/icon-128x128.png
magick edf-logo.png -resize 144x144 public/icons/icon-144x144.png
magick edf-logo.png -resize 152x152 public/icons/icon-152x152.png
magick edf-logo.png -resize 192x192 public/icons/icon-192x192.png
magick edf-logo.png -resize 384x384 public/icons/icon-384x384.png
magick edf-logo.png -resize 512x512 public/icons/icon-512x512.png
```

### Icônes Maskable (Android)
Les icônes maskables ont une zone de sécurité de 20% :
- Créez une version avec 20% de padding autour du logo
- Nommez-les `icon-XXX-maskable.png`

---

## 📦 Installation de la PWA

### 🤖 Android (Chrome/Edge)

1. Ouvrez l'application dans Chrome
2. Appuyez sur le menu **⋮** (3 points verticaux)
3. Sélectionnez **"Installer l'application"** ou **"Ajouter à l'écran d'accueil"**
4. Confirmez l'installation
5. L'icône EDF Corse apparaîtra sur votre écran d'accueil

**Raccourcis rapides :**
- Appui long sur l'icône → **Scanner** ou **Carte**

### 🍎 iOS (Safari)

1. Ouvrez l'application dans Safari
2. Appuyez sur le bouton **Partager** 🔗 (en bas au centre)
3. Faites défiler et sélectionnez **"Sur l'écran d'accueil"**
4. Nommez l'application **"EDF Corse"**
5. Appuyez sur **"Ajouter"**

**Note iOS :** Les permissions caméra et géolocalisation seront demandées lors de la première utilisation.

### 💻 Desktop (Chrome/Edge/Firefox)

1. Ouvrez l'application
2. Cherchez l'icône **🔽 Installer** dans la barre d'adresse
3. Cliquez sur **"Installer"**
4. L'application s'ouvrira dans une fenêtre dédiée

---

## 🔧 Configuration Développeur

### Build Production avec PWA

```bash
npm run build
```

Les fichiers suivants seront générés :
- `dist/manifest.webmanifest` : Manifest de l'application
- `dist/sw.js` : Service Worker
- `dist/workbox-*.js` : Scripts de cache

### Test en Local

```bash
npm run dev
```

La PWA est activée même en développement grâce à `devOptions.enabled: true`.

### Vérifier la PWA

**Chrome DevTools :**
1. F12 → onglet **Application**
2. Section **Manifest** : Vérifiez les icônes et métadonnées
3. Section **Service Workers** : Vérifiez que le SW est actif
4. Section **Cache Storage** : Vérifiez les caches

**Lighthouse Audit :**
1. F12 → onglet **Lighthouse**
2. Sélectionnez **"Progressive Web App"**
3. Lancez l'audit
4. Score cible : **90+/100**

---

## 📸 Optimisation Scanner Mobile

### Permissions Caméra

Le code demande automatiquement les permissions :

```typescript
navigator.mediaDevices.getUserMedia({ 
  video: { 
    facingMode: "environment", // Caméra arrière par défaut
    width: { ideal: 1920 },
    height: { ideal: 1080 }
  } 
})
```

### Conseils d'utilisation

**Pour les agents terrain :**
- ✅ Utilisez en **plein écran** (mode standalone)
- ✅ **Éclairage** suffisant pour scanner les codes-barres
- ✅ Tenez le téléphone **stable** à 10-15 cm du code
- ✅ Assurez-vous que le code-barres soit **net** et **centré**

**Résolution des problèmes caméra :**
- Vérifiez les permissions dans les paramètres du téléphone
- Redémarrez l'application si la caméra ne démarre pas
- Sur iOS : autorisez l'accès caméra à Safari

---

## 🗺️ Géolocalisation et Navigation

### Permissions Géolocalisation

Demandées automatiquement lors de l'accès à la carte :

```typescript
navigator.geolocation.getCurrentPosition(...)
```

### Mode Offline Carte

- Les tuiles Mapbox sont **cachées** pendant 30 jours
- L'itinéraire nécessite une **connexion internet**
- Les postes sont **synchronisés** au dernier chargement

---

## 🔄 Stratégie de Cache

### API Cache (5 minutes)
```
NetworkFirst → API calls
```
Priorise le réseau, fallback sur cache si offline.

### Mapbox Cache (30 jours)
```
CacheFirst → Tuiles de carte
```
Charge depuis le cache, économise la data mobile.

### Images Cache (30 jours)
```
CacheFirst → Photos et icônes
```
Une fois chargées, les images sont stockées.

### Update Strategy
```
autoUpdate + skipWaiting
```
L'application se met à jour automatiquement sans action utilisateur.

---

## 🚀 Déploiement Production

### HTTPS Obligatoire

⚠️ **IMPORTANT** : Les PWA nécessitent **HTTPS** en production.

**Options de déploiement :**

1. **Netlify** (Gratuit, HTTPS auto)
```bash
npm install -g netlify-cli
netlify deploy --prod
```

2. **Vercel** (Gratuit, HTTPS auto)
```bash
npm install -g vercel
vercel --prod
```

3. **Serveur custom avec Nginx**
```nginx
server {
    listen 443 ssl http2;
    server_name votre-domaine.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        root /path/to/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 📊 Monitoring PWA

### Métriques à surveiller

- **Installation Rate** : % d'utilisateurs qui installent la PWA
- **Retention Rate** : % d'utilisateurs qui reviennent
- **Cache Hit Rate** : % de requêtes servies depuis le cache
- **Offline Usage** : Temps passé offline

### Analytics Recommandé

Ajoutez Google Analytics ou Plausible pour tracker :
- Installations PWA
- Utilisation du scanner
- Utilisation de la navigation
- Temps passé sur la carte

---

## 🐛 Troubleshooting

### La PWA ne s'installe pas

✅ **Vérifications :**
- [ ] Application accessible en **HTTPS** (ou localhost)
- [ ] `manifest.json` valide et accessible
- [ ] Au moins une icône **192x192** et **512x512**
- [ ] Service Worker enregistré avec succès
- [ ] `display: "standalone"` dans le manifest

### La caméra ne fonctionne pas

✅ **Solutions :**
1. Vérifiez les permissions dans les paramètres du téléphone
2. Testez dans un autre navigateur (Chrome vs Safari)
3. Assurez-vous d'être en **HTTPS** (sauf localhost)
4. Redémarrez l'application

### L'itinéraire ne s'affiche pas

✅ **Solutions :**
1. Vérifiez le **token Mapbox** dans `.env`
2. Assurez-vous d'avoir une **connexion internet**
3. Autorisez la **géolocalisation**
4. Vérifiez la console pour les erreurs API

### Le cache ne fonctionne pas

✅ **Solutions :**
1. Effacez le cache du navigateur
2. Désinstallez et réinstallez la PWA
3. Vérifiez que le Service Worker est actif (DevTools → Application)
4. Rebuild l'application : `npm run build`

---

## 📞 Support

Pour toute question sur la PWA :
- Consultez la documentation Vite PWA : https://vite-pwa-org.netlify.app/
- Testez avec Lighthouse (Chrome DevTools)
- Vérifiez les logs du Service Worker

---

## ✨ Fonctionnalités Futures

- [ ] Notifications push pour alertes
- [ ] Synchronisation en arrière-plan
- [ ] Mode sombre automatique
- [ ] Partage de postes via Web Share API
- [ ] Backup automatique des données scannées
