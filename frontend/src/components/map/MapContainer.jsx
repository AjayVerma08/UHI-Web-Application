import React, { use, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import shp from 'shpjs';
import Legend from './Legend';
import { legendConfig } from './legendConfig';
import '../../styles/explorer.css';
import { map } from 'leaflet';

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapContainer = ({ onRegionSelect, mapLayers, analysisResults }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const drawingRef = useRef(null);
  const drawnLayersRef = useRef(null);
  const tileLayersRef = useRef({});
  const fileInputRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const isDrawingRef = useRef(false);
  const [layersConfig, setLayersConfig] = useState({
    openStreetMap: { 
      visible: true, 
      opacity: 1,
      isBaseLayer: true 
    },
    nightTime: { 
      visible: false, 
      opacity: 1,
      isBaseLayer: true 
    },
    satellite : {
      visible: false,
      opacity: 1,
      isBaseLayer: true
    }
  });

  // Track which layers are available (default base layers + any analysis layers)
  const [availableLayers, setAvailableLayers] = useState([
    'openStreetMap',
    'nightTime',
    'satellite'
  ]);
  
  // Track layer activation order for proper legend hierarchy
  const [layerOrder, setLayerOrder] = useState([]);
  const [activeLegends, setActiveLegends] = useState({});

  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth <= 1150);
  const [mouseCoords, setMouseCoords] = useState({ lat: null, lng: null });

  // Improved legend management - show only the topmost analysis layer's legend
  useEffect(() => {
    console.log('Legend update - LayersConfig:', layersConfig);
    console.log('Legend update - LayerOrder:', layerOrder);
    
    // Get all visible analysis layers (non-base layers) with legend configs
    const visibleAnalysisLayers = layerOrder
      .filter(layerId => {
        const config = layersConfig[layerId];
        return config?.visible && !config?.isBaseLayer && legendConfig[layerId];
      })
      .reverse(); // Most recently activated first
    
    console.log('Visible analysis layers:', visibleAnalysisLayers);
    
    if (visibleAnalysisLayers.length > 0) {
      const topLayer = visibleAnalysisLayers[0];
      const legendInfo = legendConfig[topLayer];
      console.log('Setting legend for top layer:', topLayer, legendInfo);
      setActiveLegends({ [topLayer]: legendInfo });
    } else {
      console.log('No visible analysis layers with legends, clearing legends');
      setActiveLegends({});
    }
  }, [layersConfig, layerOrder]);

  useEffect(() => {
    if (!mapInstanceRef.current && mapRef.current) {
      // Initialize map
      const map = L.map(mapRef.current).setView([31.777, 77.3133], 10);
      
      map.on('mousemove', (e)=> {
        setMouseCoords({
          lat: e.latlng.lat.toFixed(5),
          lng: e.latlng.lng.toFixed(5)
        });
      });

      map.on('mouseout', ()=> {
        setMouseCoords({
          lat: null,
          lng: null
        });
      });

      // Add base tile layer
      const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        opacity: 1
      });
      osmLayer.addTo(map);
      tileLayersRef.current.openStreetMap = osmLayer;

      const nightTime = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png?api_key=94f68b97-9a81-4a1d-bd4b-e33fd147cba9', {
        attribution: '© Stadia Maps, © OpenMapTiles © OpenStreetMap contributors',
        opacity: 1
      });
      tileLayersRef.current.nightTime = nightTime;

      const satellite = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.{ext}?api_key=94f68b97-9a81-4a1d-bd4b-e33fd147cba9', {
        attribution: '&copy; CNES, Distribution Airbus DS, © Airbus DS, © PlanetObserver (Contains Copernicus Data) | &copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a>',
        ext: 'jpg',
        opacity: 1
      });
      tileLayersRef.current.satellite = satellite;


      // Initialize layer groups
      drawnLayersRef.current = L.layerGroup().addTo(map);
      
      mapInstanceRef.current = map;

      // Add drawing controls
      addDrawingControls(map);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map layers when mapLayers prop changes
  useEffect(() => {
    if (mapLayers && mapInstanceRef.current) {
      updateMapLayers(mapLayers);
    }
  }, [mapLayers]);

  const toggleLayer = (layerName) => {
    const map = mapInstanceRef.current;
    const layer = tileLayersRef.current[layerName];
    const config = layersConfig[layerName];
    
    if (!layer || !map || !config) return;
    
    const newVisibility = !config.visible;
    
    if (newVisibility) {
      layer.addTo(map);
      layer.setOpacity(config.opacity);

      // Update layer order - add to end (making it topmost)
      setLayerOrder(prev => {
        const filtered = prev.filter(id => id !== layerName);
        return [...filtered, layerName];
      });
    } else {
      map.removeLayer(layer);

      // Remove from layer order
      setLayerOrder(prev => prev.filter(id => id !== layerName));
    }
    
    setLayersConfig(prev => ({
      ...prev,
      [layerName]: {
        ...prev[layerName],
        visible: newVisibility
      }
    }));
  };

  useEffect(() => {
    const handleResize = () => {
      const newIsSmallScreen = window.innerWidth <= 1150;
      setIsSmallScreen(newIsSmallScreen);
      if (!newIsSmallScreen) {
        setIsControlsOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const setLayerOpacity = (layerName, opacity) => {
    const layer = tileLayersRef.current[layerName];
    if (layer) {
      layer.setOpacity(opacity);
    }
    
    setLayersConfig(prev => ({
      ...prev,
      [layerName]: {
        ...prev[layerName],
        opacity: opacity
      }
    }));
  };

  const addDrawingControls = (map) => {
    const drawingControl = L.control({ position: 'topleft' });
    
    drawingControl.onAdd = function() {
      const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
      div.style.background = 'white';
      div.style.padding = '10px';
      div.style.borderRadius = '5px';
      div.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
      div.style.display = 'flex';
      div.style.flexDirection = 'column';
      div.style.gap = '5px';
      
      // Draw Polygon Button
      const drawButton = L.DomUtil.create('button', '', div);
      drawButton.innerHTML = isDrawing ? '⏹️ Stop Drawing' : '🔷 Draw Polygon';
      drawButton.style.border = 'none';
      drawButton.style.background = isDrawing ? '#ff6b6b' : '#4ecdc4';
      drawButton.style.color = 'white';
      drawButton.style.cursor = 'pointer';
      drawButton.style.fontSize = '12px';
      drawButton.style.fontWeight = 'bold';
      drawButton.style.padding = '5px 8px';
      drawButton.style.borderRadius = '3px';
      drawButton.style.minWidth = '140px';
      
      // Upload File Button
      const uploadButton = L.DomUtil.create('button', '', div);
      uploadButton.innerHTML = '📁 Upload Shape';
      uploadButton.style.border = 'none';
      uploadButton.style.background = '#667eea';
      uploadButton.style.color = 'white';
      uploadButton.style.cursor = 'pointer';
      uploadButton.style.fontSize = '12px';
      uploadButton.style.fontWeight = 'bold';
      uploadButton.style.padding = '5px 8px';
      uploadButton.style.borderRadius = '3px';
      uploadButton.style.minWidth = '140px';
      
      // Hidden file input
      const fileInput = L.DomUtil.create('input', '', div);
      fileInput.type = 'file';
      fileInput.accept = '.geojson,.json,.kml';
      fileInput.style.display = 'none';
      fileInputRef.current = fileInput;
      
      // Clear Button
      const clearButton = L.DomUtil.create('button', '', div);
      clearButton.innerHTML = '🗑️ Clear';
      clearButton.style.border = 'none';
      clearButton.style.background = '#95a5a6';
      clearButton.style.color = 'white';
      clearButton.style.cursor = 'pointer';
      clearButton.style.fontSize = '12px';
      clearButton.style.fontWeight = 'bold';
      clearButton.style.padding = '5px 8px';
      clearButton.style.borderRadius = '3px';
      clearButton.style.minWidth = '140px';
      
      drawButton.onclick = () => {
        if (!isDrawingRef.current) {
          startDrawing(map);
          drawButton.innerHTML = '⏹️ Stop Drawing';
          drawButton.style.background = '#ff6b6b';
        } else {
          stopDrawing(map);
          drawButton.innerHTML = '🔷 Draw Polygon';
          drawButton.style.background = '#4ecdc4';
        }
      };
      
      uploadButton.onclick = () => {
        fileInput.click();
      };
      
      clearButton.onclick = () => {
        clearDrawnLayers();
      };
      
      fileInput.onchange = (e) => {
        handleFileUpload(e, map);
      };
      
      L.DomEvent.disableClickPropagation(div);
      return div;
    };
    
    drawingControl.addTo(map);
  };

  const startDrawing = (map) => {
    setIsDrawing(true);
    isDrawingRef.current = true;
    // Clear existing drawn layers
    drawnLayersRef.current.clearLayers();
    
    const points = [];
    let tempPolyline = null;
    
    const onMapClick = (e) => {
      points.push([e.latlng.lat, e.latlng.lng]);
      
      // Remove existing temp line
      if (tempPolyline) {
        map.removeLayer(tempPolyline);
      }
      
      // Draw temporary line
      if (points.length > 1) {
        tempPolyline = L.polyline(points, { 
          color: '#667eea', 
          weight: 2, 
          dashArray: '5, 5' 
        }).addTo(map);
      }
      
      // Add point marker
      L.circleMarker([e.latlng.lat, e.latlng.lng], {
        radius: 5,
        color: '#667eea',
        fillColor: '#667eea',
        fillOpacity: 1
      }).addTo(drawnLayersRef.current);
    };
    
    const onMapDoubleClick = () => {
      if (points.length >= 3) {
        finishDrawing(map, points, tempPolyline);
      }
    };
    
    map.on('click', onMapClick);
    map.on('dblclick', onMapDoubleClick);
    
    // Store references for cleanup
    map._drawingHandlers = { onMapClick, onMapDoubleClick, points, tempPolyline };
  };

  const stopDrawing = (map) => {
    setIsDrawing(false);
    isDrawingRef.current = false;

    // Remove event listeners
    if (map._drawingHandlers) {
      const { onMapClick, onMapDoubleClick, tempPolyline } = map._drawingHandlers;
      map.off('click', onMapClick);
      map.off('dblclick', onMapDoubleClick);
      
      // Remove temp line
      if (tempPolyline) {
        map.removeLayer(tempPolyline);
      }
      
      delete map._drawingHandlers;
    }
    
    // Clear point markers but keep any completed polygons
    drawnLayersRef.current.eachLayer(layer => {
      if (layer instanceof L.CircleMarker) {
        drawnLayersRef.current.removeLayer(layer);
      }
    });
  };

  const finishDrawing = (map, points, tempPolyline) => {
    setIsDrawing(false);
    
    // Remove event listeners
    if (map._drawingHandlers) {
      map.off('click', map._drawingHandlers.onMapClick);
      map.off('dblclick', map._drawingHandlers.onMapDoubleClick);
      delete map._drawingHandlers;
    }
    
    // Remove temp line
    if (tempPolyline) {
      map.removeLayer(tempPolyline);
    }
    
    // Clear point markers
    drawnLayersRef.current.clearLayers();
    
    // Create final polygon
    const polygon = L.polygon(points, {
      color: '#667eea',
      weight: 2,
      fillColor: '#667eea',
      fillOpacity: 0.2
    }).addTo(drawnLayersRef.current);
    
    // Fit map to polygon
    map.fitBounds(polygon.getBounds());
    
    // Create GeoJSON
    const geoJson = {
      type: "Polygon",
      coordinates: [points.map(point => [point[1], point[0]])] // [lng, lat] format
    };
    
    onRegionSelect(geoJson);
  };

  const clearDrawnLayers = () => {
    if (drawnLayersRef.current) {
      drawnLayersRef.current.clearLayers();
    }
    
    // Also stop drawing if in progress
    if (isDrawing && mapInstanceRef.current) {
      stopDrawing(mapInstanceRef.current);
    }
    
    // Clear the selected region
    onRegionSelect(null);
  };

  const parseKML = (kmlString) => {
    const parser = new DOMParser();
    const kmlDoc = parser.parseFromString(kmlString, 'application/xml');
    
    // Simple KML to GeoJSON conversion for Polygon coordinates
    const coordinates = kmlDoc.getElementsByTagName('coordinates')[0];
    if (coordinates) {
      const coordString = coordinates.textContent.trim();
      const coords = coordString.split(/\s+/).map(coord => {
        const [lng, lat] = coord.split(',').map(Number);
        return [lng, lat];
      });
      
      return {
        type: "Polygon",
        coordinates: [coords]
      };
    }
    
    throw new Error('No valid coordinates found in KML file');
  };

  const handleFileUpload = async (event, map) => {
    const file = event.target.files[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.split('.').pop();

    try {
      let geoJson;

      if (fileExtension === 'json' || fileExtension === 'geojson') {
        // Handle GeoJSON files
        const text = await readFileAsText(file);
        geoJson = JSON.parse(text);

      } else if (fileExtension === 'kml') {
        // Handle KML files
        const kmlText = await readFileAsText(file);
        geoJson = parseKML(kmlText);

      } else if (fileExtension === 'zip') {
        // Handle Shapefile ZIP
        const arrayBuffer = await file.arrayBuffer();
        geoJson = await shp(arrayBuffer); // shpjs automatically extracts & parses

      } else {
        alert('Unsupported file format. Please upload: GeoJSON (.json/.geojson), KML (.kml), or Shapefile (.zip)');
        return;
      }

      // Process the GeoJSON
      processGeoJSON(geoJson, map);

    } catch (error) {
      console.error('File upload error:', error);
      alert(`Error processing file: ${error.message}`);
    }

    // Clear the file input
    event.target.value = '';
  };

  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const processGeoJSON = (geoJson, map) => {
    // Clear existing layers
    drawnLayersRef.current.clearLayers();

    let geometry;

    if (geoJson.type === 'FeatureCollection') {
      if (geoJson.features && geoJson.features.length > 0) {
        geometry = geoJson.features[0].geometry; // Take first feature for now
      } else {
        throw new Error('No features found in FeatureCollection');
      }
    } else if (geoJson.type === 'Feature') {
      geometry = geoJson.geometry;
    } else if (geoJson.type === 'Polygon' || geoJson.type === 'MultiPolygon') {
      geometry = geoJson;
    } else {
      throw new Error('Unsupported geometry type. Please upload Polygon or MultiPolygon geometries.');
    }

    // Add GeoJSON to map
    const layer = L.geoJSON(geometry, {
      style: {
        color: '#667eea',
        weight: 2,
        fillColor: '#667eea',
        fillOpacity: 0.2
      }
    }).addTo(drawnLayersRef.current);

    map.fitBounds(layer.getBounds());

    onRegionSelect(geometry);
  };

  const updateMapLayers = (layers) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    Object.entries(layers).forEach(([layerName, tileUrl]) => {
      if (!tileLayersRef.current[layerName]) {
        const tileLayer = L.tileLayer(tileUrl, {
          attribution: 'Earth Engine | CityHeatAtlas',
          opacity: 1,
          maxZoom: 18
        });
        
        tileLayersRef.current[layerName] = tileLayer;
        
        // Add to layers config if it's a new layer
        if (!layersConfig[layerName]) {
          setLayersConfig(prev => ({
            ...prev,
            [layerName]: {
              visible: true,
              opacity: 1,
              isBaseLayer: false
            }
          }));
        }

        // Add to available layers
        if (!availableLayers.includes(layerName)) {
          setAvailableLayers(prev => [...prev, layerName]);
        }
        
        // Auto-enable the layer and add to order
        const config = layersConfig[layerName];
        if (config && config.visible !== false) {
          tileLayer.addTo(map);
          tileLayer.setOpacity(1);
          
          // Add to layer order (making it topmost)
          setLayerOrder(prev => {
            const filtered = prev.filter(id => id !== layerName);
            return [...filtered, layerName];
          });
        }
      }
    });
  };

  return (
    <div className="map-container">
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      
      {/* Layer Controls - Responsive */}
      <div className="map-layer-controls">
        {isSmallScreen && (
          <button 
            className={`map-controls-toggle ${isControlsOpen ? 'open' : ''}`}
            onClick={() => setIsControlsOpen(!isControlsOpen)}
          >
            Map Layers ({availableLayers.filter(name => layersConfig[name]?.visible).length} active)
          </button>
        )}
        
        {!isSmallScreen && <h4>Map Layers</h4>}
        
        <div className={`layer-content ${isSmallScreen && !isControlsOpen ? 'collapsed' : ''}`}>
          <div className="layer-list">
            {availableLayers.map((layerName) => {
              const config = layersConfig[layerName];
              
              if (!config) return null;
              
              return (
                <div key={layerName} className="layer-item">
                  <div className="layer-header">
                    <label className="layer-toggle">
                      <input
                        type="checkbox"
                        checked={config.visible}
                        onChange={() => toggleLayer(layerName)}
                      />
                      <span className="layer-name">
                        {layerName.charAt(0).toUpperCase() + layerName.slice(1).replace(/([A-Z])/g, ' $1')}
                      </span>
                    </label>
                  </div>
                  
                  {config.visible && (
                    <div className="opacity-control">
                      <label>Opacity:</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={config.opacity}
                        onChange={(e) => setLayerOpacity(layerName, parseFloat(e.target.value))}
                      />
                      <span className="opacity-value">{Math.round(config.opacity * 100)}%</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>  
      
      {mouseCoords.lat && mouseCoords.lng && (
        <div className='mouse-coords-panel'>
          <div className='coords-display'>
            <span className='coord-label'>Lat: </span>
            <span className='coord-value'>{mouseCoords.lat}</span>
            <span className='coord-label'>Long: </span>
            <span className='coord-value'>{mouseCoords.lng}</span>
          </div>
        </div>
      )}

      {/* Legends - Now shows only the topmost analysis layer's legend */}
      <div className="map-legends">
        {Object.entries(activeLegends).map(([layerId, legendInfo]) => (
          <Legend
            key={layerId}
            legendInfo={legendInfo}
            orientation="vertical"
          />
        ))}
      </div>
    </div>
  );
};

export default MapContainer;