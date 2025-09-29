// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3
};

// Metrics Configuration
export const METRICS = {
  LST: {
    id: 'lst',
    name: 'Land Surface Temperature',
    description: 'Surface temperature in Celsius',
    icon: '🌡️',
    unit: '°C',
    colorScale: ['#040274', '#040281', '#0502a3', '#0502b8', '#0502ce', '#0502e6', '#0602ff', '#235cb1', '#307ef3', '#269db1', '#30c8e2', '#32d3ef', '#3be285', '#3ff38f', '#86e26f', '#3ae237', '#b5e22e', '#d6e21f', '#fff705', '#ffd611', '#ffb613', '#ff8b13', '#ff6e08', '#ff500d', '#ff0000', '#de0101', '#c21301', '#a71001', '#911003'],
    range: { min: 7, max: 50 }
  },
  NDVI: {
    id: 'ndvi',
    name: 'Vegetation Index (NDVI)',
    description: 'Normalized Difference Vegetation Index',
    icon: '🌿',
    unit: 'index',
    colorScale: ['blue', 'white', 'green'],
    range: { min: -1, max: 1 }
  },
  NDBI: {
    id: 'ndbi',
    name: 'Built-up Index (NDBI)',
    description: 'Normalized Difference Built-up Index',
    icon: '🏢',
    unit: 'index',
    colorScale: ['white', 'orange', 'red'],
    range: { min: -1, max: 1 }
  },
  UHI: {
    id: 'uhi',
    name: 'Urban Heat Island',
    description: 'Temperature difference between urban and rural areas',
    icon: '🏙️',
    unit: '°C',
    colorScale: ['#313695', '#74add1', '#fed976', '#feb24c', '#fd8d3c', '#fc4e2a', '#e31a1c', '#b10026'],
    range: { min: -4, max: 4 }
  },
  UTFVI: {
    id: 'utfvi',
    name: 'Urban Thermal Field Variance Index',
    description: 'Temperature difference between urban and rural areas',
    icon: '🌡️',
    unit: 'index',
    colorScale: ['#313695', '#74add1', '#fed976', '#feb24c', '#fd8d3c', '#fc4e2a', '#e31a1c', '#b10026'],
    range: { min: -1, max: 0.3 }
  }
};

// Analysis Statistics Options
export const ANALYSIS_STATS = [
  { id: 'minimum', label: 'Minimum', icon: '📉' },
  { id: 'maximum', label: 'Maximum', icon: '📈' },
  { id: 'mean', label: 'Mean', icon: '📊' },
  { id: 'stddev', label: 'Standard Deviation', icon: '📏' },
  { id: 'correlation', label: 'Correlation UHI - NDVI', icon: '🔗' },
  { id: 'percentiles', label: 'Intensity Percentiles', icon: '📊' }
];

// Date Configuration
export const DATE_CONFIG = {
  MIN_DATE: '2013-01-01', // Landsat 8 launch
  MAX_YEARS_RANGE: 2,
  RECOMMENDED_MONTHS: {
    SUMMER: ['06', '07', '08'],
    WINTER: ['12', '01', '02']
  }
};

// Map Configuration
export const MAP_CONFIG = {
  DEFAULT_CENTER: [31.777, 77.3133], // Chandigarh coordinates
  DEFAULT_ZOOM: 10,
  MIN_ZOOM: 3,
  MAX_ZOOM: 18,
  TILE_LAYERS: {
    OSM: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '© OpenStreetMap contributors'
    },
    SATELLITE: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '© Esri'
    }
  }
};

// UI Configuration
export const UI_CONFIG = {
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 500,
  TOAST_DURATION: 5000,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_FILE_TYPES: ['.geojson', '.json', '.kml', '.zip']
};

// Processing Configuration
export const PROCESSING_CONFIG = {
  MAX_POLYGON_POINTS: 1000,
  MIN_POLYGON_AREA: 0.001, // square degrees
  MAX_POLYGON_AREA: 10, // square degrees
  PROCESSING_STEPS: [
    '📡 Fetching satellite data...',
    '🗺️ Processing geometry...',
    '🧮 Computing metrics...',
    '📊 Generating results...'
  ]
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  INVALID_GEOMETRY: 'Invalid geometry. Please draw a valid polygon.',
  INVALID_DATE_RANGE: 'Invalid date range. Please check your dates.',
  NO_METRICS_SELECTED: 'Please select at least one metric to analyze.',
  PROCESSING_FAILED: 'Analysis failed. Please try again.',
  FILE_TOO_LARGE: 'File is too large. Maximum size is 10MB.',
  INVALID_FILE_TYPE: 'Invalid file type. Please upload a GeoJSON, KML, or ZIP file.',
  LOGIN_REQUIRED: 'Please login to access this feature.',
  POLYGON_TOO_LARGE: 'Polygon is too large. Please draw a smaller area.',
  POLYGON_TOO_SMALL: 'Polygon is too small. Please draw a larger area.'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  ANALYSIS_COMPLETE: 'Analysis completed successfully!',
  FILE_UPLOADED: 'File uploaded successfully!',
  LOGIN_SUCCESS: 'Welcome back!',
  REGISTER_SUCCESS: 'Account created successfully!',
  DOWNLOAD_STARTED: 'Download started...'
};

// Validation Rules
export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 6,
  POLYGON_MIN_POINTS: 3,
  DATE_FORMAT: /^\d{4}-\d{2}-\d{2}$/
};

// Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  LAST_ANALYSIS: 'lastAnalysis',
  USER_PREFERENCES: 'userPreferences'
};

// Application Metadata
export const APP_METADATA = {
  NAME: 'CityHeatAtlas',
  VERSION: '1.0.0',
  AUTHOR: 'Ajay Verma',
  COPYRIGHT_YEAR: 2025,
  DESCRIPTION: 'An Urban Heat Island dynamics explorer',
  GITHUB_URL: 'https://github.com/your-username/city-heat-atlas'
};