import { api } from './api';

export const processAnalysis = async (analysisData) => {
  try {
    const response = await api.post('/process', analysisData);
    return response.data;
  } catch (error) {
    console.error('Analysis processing error:', error);
    
    if (error.response && error.response.data) {
      throw new Error(error.response.data.error || 'Analysis failed');
    }
    throw new Error('Network error. Please check your connection.');
  }
};

export const validateGeometry = (geometry) => {
  if (!geometry) {
    return { valid: false, error: 'No geometry provided' };
  }

  if (!geometry.type) {
    return { valid: false, error: 'Geometry type is required' };
  }

  if (geometry.type !== 'Polygon') {
    return { valid: false, error: 'Only Polygon geometry is supported' };
  }

  if (!geometry.coordinates || !Array.isArray(geometry.coordinates)) {
    return { valid: false, error: 'Invalid coordinates format' };
  }

  const coordinates = geometry.coordinates[0];
  if (coordinates.length < 4) {
    return { valid: false, error: 'Polygon must have at least 4 points' };
  }

  // Check if polygon is closed
  const firstPoint = coordinates[0];
  const lastPoint = coordinates[coordinates.length - 1];
  if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
    // Auto-close the polygon
    coordinates.push([firstPoint[0], firstPoint[1]]);
  }

  return { valid: true };
};

export const validateDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();

  if (start >= end) {
    return { valid: false, error: 'End date must be after start date' };
  }

  if (end > now) {
    return { valid: false, error: 'End date cannot be in the future' };
  }

  // Check for reasonable date range (not too far back, not too long)
  const yearsDiff = (end - start) / (1000 * 60 * 60 * 24 * 365);
  if (yearsDiff > 2) {
    return { valid: false, error: 'Date range should not exceed 2 years' };
  }

  const earliestDate = new Date('2013-01-01'); // Landsat 8 launch
  if (start < earliestDate) {
    return { valid: false, error: 'Start date cannot be earlier than 2013' };
  }

  return { valid: true };
};

export const formatAnalysisRequest = (dateRange, geometry, metrics) => {
  // Validate inputs
  const geometryValidation = validateGeometry(geometry);
  if (!geometryValidation.valid) {
    throw new Error(geometryValidation.error);
  }

  const dateValidation = validateDateRange(dateRange.startDate, dateRange.endDate);
  if (!dateValidation.valid) {
    throw new Error(dateValidation.error);
  }

  if (!metrics || metrics.length === 0) {
    throw new Error('At least one metric must be selected');
  }

  return {
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    geometry: geometry,
    metrics: metrics
  };
};

// Helper function to estimate processing time
export const estimateProcessingTime = (geometry, metrics) => {
  // Calculate approximate area (very rough estimation)
  const bounds = getBounds(geometry);
  const area = (bounds.maxLat - bounds.minLat) * (bounds.maxLng - bounds.minLng);
  
  // Base time per metric (seconds)
  const baseTime = 30;
  const areaMultiplier = Math.max(1, area * 100);
  const metricsCount = metrics.length;
  
  return Math.round(baseTime * metricsCount * areaMultiplier);
};

const getBounds = (geometry) => {
  const coordinates = geometry.coordinates[0];
  let minLat = Infinity, maxLat = -Infinity;
  let minLng = Infinity, maxLng = -Infinity;
  
  coordinates.forEach(([lng, lat]) => {
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
  });
  
  return { minLat, maxLat, minLng, maxLng };
};