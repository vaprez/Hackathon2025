import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { PosteElectrique } from '../../services/postes.service';
import styles from './PostesMap.module.css';

// Token Mapbox - récupérez le vôtre sur https://www.mapbox.com/
// Ajoutez VITE_MAPBOX_TOKEN dans votre fichier .env
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

interface PostesMapProps {
  postes: PosteElectrique[];
  loading?: boolean;
  onPosteClick?: (poste: PosteElectrique) => void;
  selectedPosteId?: number | null;
  routeInfo?: RouteInfo | null;
  onRouteCalculated?: (info: RouteInfo | null) => void;
}

export interface RouteInfo {
  distance: number; // en mètres
  duration: number; // en secondes
  coordinates: [number, number][];
}

// Centre de la Corse
const CORSE_CENTER: [number, number] = [9.0129, 42.0396]; // [lng, lat]
const CORSE_BOUNDS: [[number, number], [number, number]] = [
  [8.5, 41.3], // SW
  [9.6, 43.0], // NE
];

// Couleurs selon l'état du poste
const getPosteColor = (poste: PosteElectrique): string => {
  if (poste.nb_concentrateurs_a_tester > 0) {
    return '#EF4444'; // Rouge - à tester
  }
  if (poste.nb_concentrateurs_pose > 0) {
    return '#10B981'; // Vert - en service
  }
  if (poste.nb_concentrateurs > 0) {
    return '#F59E0B'; // Orange - avec concentrateurs
  }
  return '#6B7280'; // Gris - sans concentrateur
};

const getPosteStatus = (poste: PosteElectrique): string => {
  if (poste.nb_concentrateurs_a_tester > 0) {
    return 'À tester';
  }
  if (poste.nb_concentrateurs_pose > 0) {
    return 'En service';
  }
  if (poste.nb_concentrateurs > 0) {
    return 'Avec concentrateurs';
  }
  return 'Sans concentrateur';
};

export function PostesMap({ postes, loading = false, onPosteClick, selectedPosteId, routeInfo, onRouteCalculated }: PostesMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  // Initialiser la carte
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/outdoors-v12',
        center: CORSE_CENTER,
        zoom: 8,
        maxBounds: CORSE_BOUNDS,
        minZoom: 7,
        maxZoom: 16,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');
      map.current.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
        }),
        'top-right'
      );

      map.current.on('load', () => {
        setMapLoaded(true);
        
        // Ajouter une source vide pour l'itinéraire
        map.current?.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: []
            }
          }
        });

        // Ajouter un calque pour afficher l'itinéraire
        map.current?.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#0066FF',
            'line-width': 4,
            'line-opacity': 0.8
          }
        });
      });

      map.current.on('error', (e) => {
        console.error('Erreur Mapbox:', e);
      });

      // Récupérer la position de l'utilisateur
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userPos: [number, number] = [
              position.coords.longitude,
              position.coords.latitude
            ];
            setUserLocation(userPos);
          },
          (error) => {
            console.warn('Géolocalisation non disponible:', error);
          }
        );
      }

    } catch (error) {
      console.error('Erreur lors de la création de la carte:', error);
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Ajouter les marqueurs des postes
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Supprimer les anciens marqueurs
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Filtrer les postes avec coordonnées
    const postesWithCoords = postes.filter(
      (p) => p.latitude !== null && p.longitude !== null && p.latitude !== undefined && p.longitude !== undefined
    );

    // Ajouter les nouveaux marqueurs
    postesWithCoords.forEach((poste) => {
      const color = getPosteColor(poste);
      const isSelected = selectedPosteId === poste.id_poste;

      // Créer l'élément du marqueur
      const el = document.createElement('div');
      el.className = styles.marker;
      el.style.backgroundColor = color;
      el.style.width = isSelected ? '24px' : '16px';
      el.style.height = isSelected ? '24px' : '16px';
      el.style.borderRadius = '50%';
      el.style.border = isSelected ? '3px solid white' : '2px solid white';
      el.style.boxShadow = isSelected 
        ? '0 0 0 3px ' + color + ', 0 4px 8px rgba(0,0,0,0.3)' 
        : '0 2px 4px rgba(0,0,0,0.3)';
      el.style.cursor = 'pointer';
      el.style.transition = 'all 0.2s ease';

      // Créer le popup
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: true,
        closeOnClick: false,
        className: styles.popup,
      }).setHTML(`
        <div class="${styles.popupContent}">
          <h3 class="${styles.popupTitle}">${poste.code_poste}</h3>
          ${poste.nom_poste ? `<p class="${styles.popupSubtitle}">${poste.nom_poste}</p>` : ''}
          <div class="${styles.popupInfo}">
            <div class="${styles.popupRow}">
              <span class="${styles.popupLabel}">Statut:</span>
              <span class="${styles.popupValue}" style="color: ${color}">${getPosteStatus(poste)}</span>
            </div>
            <div class="${styles.popupRow}">
              <span class="${styles.popupLabel}">BO:</span>
              <span class="${styles.popupValue}">${poste.bo_affectee || '-'}</span>
            </div>
            <div class="${styles.popupRow}">
              <span class="${styles.popupLabel}">Concentrateurs:</span>
              <span class="${styles.popupValue}">${poste.nb_concentrateurs}</span>
            </div>
            ${poste.nb_concentrateurs_pose > 0 ? `
              <div class="${styles.popupRow}">
                <span class="${styles.popupLabel}">En pose:</span>
                <span class="${styles.popupValue}" style="color: #10B981">${poste.nb_concentrateurs_pose}</span>
              </div>
            ` : ''}
            ${poste.nb_concentrateurs_a_tester > 0 ? `
              <div class="${styles.popupRow}">
                <span class="${styles.popupLabel}">À tester:</span>
                <span class="${styles.popupValue}" style="color: #EF4444">${poste.nb_concentrateurs_a_tester}</span>
              </div>
            ` : ''}
            ${poste.localisation ? `
              <div class="${styles.popupRow}">
                <span class="${styles.popupLabel}">Localisation:</span>
                <span class="${styles.popupValue}">${poste.localisation}</span>
              </div>
            ` : ''}
          </div>
          <button class="${styles.popupButton}" data-poste-id="${poste.id_poste}">
            Voir détails →
          </button>
        </div>
      `);

      // Créer le marqueur
      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([poste.longitude!, poste.latitude!])
        .setPopup(popup)
        .addTo(map.current!);

      // Gérer le clic sur le marqueur
      el.addEventListener('click', () => {
        if (onPosteClick) {
          onPosteClick(poste);
        }
      });

      // Gérer le clic sur le bouton du popup
      popup.on('open', () => {
        const btn = document.querySelector(`[data-poste-id="${poste.id_poste}"]`);
        if (btn) {
          btn.addEventListener('click', () => {
            if (onPosteClick) {
              onPosteClick(poste);
            }
          });
        }
      });

      markersRef.current.push(marker);
    });
  }, [postes, mapLoaded, selectedPosteId, onPosteClick]);

  // Centrer sur le poste sélectionné
  useEffect(() => {
    if (!map.current || !selectedPosteId) return;

    const poste = postes.find((p) => p.id_poste === selectedPosteId);
    if (poste && poste.latitude && poste.longitude) {
      map.current.flyTo({
        center: [poste.longitude, poste.latitude],
        zoom: 14,
        duration: 1000,
      });
    }
  }, [selectedPosteId, postes]);

  // Fonction pour calculer et afficher l'itinéraire
  const calculateRoute = async (destination: [number, number]) => {
    if (!userLocation) {
      console.warn('Position utilisateur non disponible');
      return;
    }

    try {
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${userLocation[0]},${userLocation[1]};${destination[0]},${destination[1]}?geometries=geojson&access_token=${mapboxgl.accessToken}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coords = route.geometry.coordinates;

        // Mettre à jour la source de l'itinéraire
        const source = map.current?.getSource('route') as mapboxgl.GeoJSONSource;
        if (source) {
          source.setData({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: coords
            }
          });
        }

        // Ajuster la vue pour voir tout l'itinéraire
        const bounds = new mapboxgl.LngLatBounds();
        coords.forEach((coord: [number, number]) => bounds.extend(coord));
        map.current?.fitBounds(bounds, { padding: 80 });

        // Notifier le parent avec les infos de l'itinéraire
        if (onRouteCalculated) {
          onRouteCalculated({
            distance: route.distance,
            duration: route.duration,
            coordinates: coords
          });
        }
      }
    } catch (error) {
      console.error('Erreur lors du calcul de l\'itinéraire:', error);
    }
  };

  // Afficher/masquer l'itinéraire selon routeInfo
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const source = map.current.getSource('route') as mapboxgl.GeoJSONSource;
    if (!source) return;

    if (routeInfo && routeInfo.coordinates.length > 0) {
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: routeInfo.coordinates
        }
      });
    } else {
      // Effacer l'itinéraire
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: []
        }
      });
    }
  }, [routeInfo, mapLoaded]);

  // Exposer la fonction calculateRoute via une prop non utilisée directement
  useEffect(() => {
    if (window) {
      (window as any).calculateRoute = calculateRoute;
    }
  }, [userLocation]);

  return (
    <div className={styles.mapWrapper}>
      <div ref={mapContainer} className={styles.map} />
      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner} />
          <p>Chargement...</p>
        </div>
      )}
    </div>
  );
}
