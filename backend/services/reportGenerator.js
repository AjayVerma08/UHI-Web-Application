import fs from 'fs';
import path, { resolve } from 'path';
import archiver from 'archiver';
import { v4 as uuidv4 } from 'uuid';
import AIAnalyzer from './aiAnalyzer.js';
import PDFGenerator from './pdfGenerator.js';
import axios from 'axios';

class ReportGenerator {
  constructor() {
    // Create temporary directories for report generation
    this.tempDir = path.join(process.cwd(), 'temp');
    this.reportsDir = path.join(this.tempDir, 'reports');
    this.rastersDir = path.join(this.tempDir, 'rasters');
    
    // Initialize services
    this.aiAnalyzer = new AIAnalyzer();
    this.pdfGenerator = new PDFGenerator();
    
    this.ensureDirectories();
  }

  ensureDirectories() {
    [this.tempDir, this.reportsDir, this.rastersDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async generateComprehensiveReport(analysisData, additionalData = null, metadata) {
    const reportId = uuidv4();
    const reportDir = path.join(this.reportsDir, reportId);
    
    try {
      // Create report-specific directory
      fs.mkdirSync(reportDir, { recursive: true });
      
      console.log(`Starting report generation for ID: ${reportId}`);
      
      // Step 1: Enhance data with metadata
      const enhancedData = this.enhanceAnalysisData(analysisData, additionalData, metadata);
      
      // Step 2: Generate AI insights using the new structure
      console.log('Generating AI insights...');
      const aiInsights = await this.generateAIInsights(enhancedData);
      
      // Step 3: Download and organize raster files (optional - can be implemented later)
      console.log('Downloading raster files...');
      const rasterFiles = await this.downloadRasterFiles(enhancedData, reportDir);
      
      // Step 4: Generate PDF report
      console.log('Generating PDF report...');
      const pdfPath = await this.generatePDFReport(enhancedData, aiInsights, reportDir);
      
      // Step 5: Create final ZIP archive
      console.log('Creating ZIP archive...');
      const zipPath = await this.createZipArchive(reportDir, pdfPath, rasterFiles);
      
      console.log(`Report generation completed: ${zipPath}`);
      
      // Schedule cleanup after 1 hour
      setTimeout(() => this.cleanupReport(reportDir), 60 * 60 * 1000);
      
      return {
        success: true,
        reportId,
        downloadUrl: `/download/report/${reportId}`,
        zipPath
      };
      
    } catch (error) {
      console.error(`Report generation failed for ${reportId}:`, error);
      
      // Cleanup on failure
      if (fs.existsSync(reportDir)) {
        fs.rmSync(reportDir, { recursive: true, force: true });
      }
      
      throw new Error(`Report generation failed: ${error.message}`);
    }
  }

  enhanceAnalysisData(analysisData, additionalData, metadata) {
    const { geometry, startDate, endDate, year } = metadata;
    
    // Calculate study area characteristics
    const bounds = this.calculateBounds(geometry);
    const area = this.calculateArea(geometry);
    const centroid = this.calculateCentroid(geometry);
    
    // Determine season
    const season = this.determineSeason(startDate, endDate);
    
    // Enhanced metadata - UPDATED to match new structure
    const enhancedMetadata = {
      studyArea: {
        geometry,
        bounds,
        area_km2: area,
        centroid,
        coordinates_description: this.formatCoordinates(bounds)
      },
      timeRange: {
        start: startDate,
        end: endDate,
        year: year || new Date(endDate).getFullYear(),
        season,
        duration_days: this.calculateDaysDifference(startDate, endDate)
      },
      processingDate: new Date().toISOString()
    };

    return {
      metadata: enhancedMetadata,
      layers: analysisData.layers || [],
      additionalLayers: additionalData || {},
      statistics: this.calculateOverallStatistics(analysisData, additionalData)
    };
  }

  // Utility methods for metadata enhancement (keep these as they are)
  calculateBounds(geometry) {
    const coords = geometry.coordinates[0];
    const lats = coords.map(coord => coord[1]);
    const lngs = coords.map(coord => coord[0]);
    
    return {
      north: Math.max(...lats),
      south: Math.min(...lats),
      east: Math.max(...lngs),
      west: Math.min(...lngs)
    };
  }

  calculateArea(geometry) {
    const coords = geometry.coordinates[0];
    let area = 0;
    const earthRadius = 6371; // km
    
    for (let i = 0; i < coords.length - 1; i++) {
      const [lng1, lat1] = coords[i];
      const [lng2, lat2] = coords[i + 1];
      area += (lng2 - lng1) * (lat2 + lat1);
    }
    
    area = Math.abs(area * earthRadius * earthRadius * Math.PI / 180 / 2);
    return Math.round(area * 100) / 100;
  }

  calculateCentroid(geometry) {
    const coords = geometry.coordinates[0];
    const lats = coords.map(coord => coord[1]);
    const lngs = coords.map(coord => coord[0]);
    
    return {
      lat: lats.reduce((sum, lat) => sum + lat, 0) / lats.length,
      lng: lngs.reduce((sum, lng) => sum + lng, 0) / lngs.length
    };
  }

  determineSeason(startDate, endDate) {
    const startMonth = new Date(startDate).getMonth() + 1;
    const endMonth = new Date(endDate).getMonth() + 1;
    
    if (startMonth >= 6 && endMonth <= 8) return 'Summer';
    if (startMonth >= 3 && endMonth <= 5) return 'Spring';
    if (startMonth >= 9 && endMonth <= 11) return 'Autumn';
    if (startMonth >= 12 || endMonth <= 2) return 'Winter';
    return 'Mixed';
  }

  calculateDaysDifference(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  formatCoordinates(bounds) {
    return `${bounds.north.toFixed(4)}°N, ${bounds.south.toFixed(4)}°S, ${bounds.east.toFixed(4)}°E, ${bounds.west.toFixed(4)}°W`;
  }

  calculateOverallStatistics(analysisData, additionalData) {
    const stats = {
      layersProcessed: analysisData.layers ? analysisData.layers.length : 0,
      additionalLayersProcessed: additionalData ? Object.keys(additionalData).length : 0,
      totalDataPoints: 0
    };

    // Calculate total data points from histograms
    if (analysisData.layers) {
      analysisData.layers.forEach(layer => {
        if (layer.histogram && layer.histogram.histogram) {
          stats.totalDataPoints += layer.histogram.histogram.reduce((sum, val) => sum + val, 0);
        }
      });
    }

    return stats;
  }

  // UPDATED: Generate AI insights using the new aiAnalyzer structure
  async generateAIInsights(enhancedData) {
    try {
      console.log('Generating AI insights for study area...');
      const insights = await this.aiAnalyzer.generateComprehensiveInsights(enhancedData);
      console.log('AI insights generated successfully');
      return insights;
    } catch (error) {
      console.error('AI insights generation failed:', error);
      // Return fallback insights structure that matches the expected format
      return this.getFallbackInsights(enhancedData);
    }
  }

  // NEW: Fallback insights structure to match the new aiAnalyzer output
  getFallbackInsights(enhancedData) {
    const { metadata, layers } = enhancedData;
    
    // Create basic fallback content that matches the new structure
    const introduction = `**Analysis:**\nThis report presents an urban heat island analysis for a ${metadata.studyArea.area_km2} km² study area centered at ${metadata.studyArea.centroid.lat.toFixed(4)}°N, ${metadata.studyArea.centroid.lng.toFixed(4)}°E. The analysis covers the ${metadata.timeRange.season.toLowerCase()} season from ${metadata.timeRange.start} to ${metadata.timeRange.end}.`;
    
    const statisticsInterpretations = {};
    layers.forEach(layer => {
      if (layer.statistics) {
        statisticsInterpretations[layer.id] = `**Analysis:**\nThe ${layer.name} layer shows a mean value of ${layer.statistics.mean.toFixed(3)} with a range from ${layer.statistics.min.toFixed(3)} to ${layer.statistics.max.toFixed(3)}.`;
      }
    });
    
    const supplementaryAnalysis = '**Analysis:**\nSupplementary data analysis provides additional context for urban heat assessment.';
    
    const conclusion = `**Analysis:**\nThis urban heat island analysis reveals thermal patterns across the ${metadata.studyArea.area_km2} km² study area during ${metadata.timeRange.season} ${metadata.timeRange.year}.`;
    
    return {
      introduction: introduction,
      statistics_interpretations: statisticsInterpretations,
      supplementary_analysis: supplementaryAnalysis,
      conclusion: conclusion
    };
  }

  // UPDATED: Download raster files (optional - can remain as is or be enhanced)
  async downloadRasterFiles(enhancedData, reportDir) {
    // We'll implement raster download in a later step
    console.log(enhancedData);
    
    const rasterFiles = [];
    const rasterDir = path.join(reportDir, 'rasters');
    
    if (!fs.existsSync(rasterDir)) {
      fs.mkdirSync(rasterDir, { recursive: true});
    }

    try {
      if (enhancedData.layers) {
        for (const layer of enhancedData.layers) {
          if (layer.downloadUrl) {
            const fileName = `${layer.name}_analysis.tif`;
            const filePath = await this.downloadFile(layer.downloadUrl, rasterDir, fileName);
            if (filePath) {
              rasterFiles.push({ path: filePath, name: fileName });
            }
          }
        }
      }

      if (enhancedData.additionalLayers) {
        for (const [key, layerData] of Object.entries(enhancedData.additionalLayers)) {
          if (layerData.downloadURL || layerData.downloadUrl) {
            const downloadUrl = layerData.downloadURL || layerData.downloadUrl;
            const fileName = `${this.formatLayerName(key)}_additional.tif`;
            const filePath = await this.downloadFile(downloadUrl, rasterDir, fileName);

            if (filePath) {
              rasterFiles.push({ path: filePath, name: fileName });
            }
          }
        }
      }

      console.log(`Downloaded ${rasterFiles.length} raster files`);
      return rasterFiles;
    } catch (error) {
      console.error('Error downloading raster files', error);
      return rasterFiles;
    }
  }

  async downloadFile(url, directory, fileName) {
  const filePath = path.join(directory, fileName);
  const maxRetries = 3;
  const timeoutMs = 60000; // 1 minute timeout

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Downloading ${fileName} (attempt ${attempt}/${maxRetries})`);
      
      const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream',
        timeout: timeoutMs,
        headers: {
          'User-Agent': 'UHI-Analysis-Platform/1.0'
        },
        maxContentLength: 100 * 1024 * 1024, // 100MB limit
        maxBodyLength: 100 * 1024 * 1024
      });

      // Create write stream
      const fileStream = fs.createWriteStream(filePath);
      
      // Pipe the response data to file
      await new Promise((resolve, reject) => {
        response.data.pipe(fileStream);
        
        response.data.on('error', (error) => {
          fileStream.destroy();
          reject(error);
        });
        
        fileStream.on('error', (error) => {
          reject(error);
        });
        
        fileStream.on('finish', () => {
          resolve();
        });
      });

      // Verify file was created and has content
      const stats = fs.statSync(filePath);
      if (stats.size === 0) {
        throw new Error('Downloaded file is empty');
      }

      console.log(`Successfully downloaded ${fileName} (${stats.size} bytes)`);
      return filePath;

    } catch (error) {
      console.error(`Download attempt ${attempt} failed for ${fileName}:`, error.message);
      
      // Clean up failed download
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      if (attempt === maxRetries) {
        console.error(`Failed to download ${fileName} after ${maxRetries} attempts`);
        return null;
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
    }
  }
}

  formatLayerName(key){
    const nameMap = {
      'LULC': 'Land_Use_Land_Cover',
      'heatVulnerabilityZones': ' Heat_Vulnerability_Zones'
    }
    return nameMap[key] || key.replace(/([A-Z])/g, '_$1').toLowerCase();
  }

  // UPDATED: Generate PDF report using the new pdfGenerator
  async generatePDFReport(enhancedData, aiInsights, reportDir) {
    try {
      console.log('Generating PDF report...');
      const pdfPath = path.join(reportDir, 'UHI_Research_Report.pdf');
      
      await this.pdfGenerator.generateReport(enhancedData, aiInsights, pdfPath);
      
      console.log('PDF report generated successfully');
      return pdfPath;
    } catch (error) {
      console.error('PDF generation failed:', error);
      
      // Create a simple fallback text report if PDF generation fails
      const fallbackPath = await this.generateFallbackReport(enhancedData, aiInsights, reportDir);
      console.log('Created fallback text report:', fallbackPath);
      return fallbackPath;
    }
  }

  // UPDATED: Fallback text report to match new structure
  async generateFallbackReport(enhancedData, aiInsights, reportDir) {
    const textPath = path.join(reportDir, 'UHI_Research_Report.txt');
    const { metadata, layers, additionalLayers } = enhancedData;
    
    let content = `URBAN HEAT ISLAND RESEARCH REPORT
=====================================

INTRODUCTION
------------
Area: ${metadata.studyArea.area_km2} km²
Coordinates: ${metadata.studyArea.coordinates_description}
Centroid: ${metadata.studyArea.centroid.lat.toFixed(4)}°N, ${metadata.studyArea.centroid.lng.toFixed(4)}°E
Period: ${metadata.timeRange.start} to ${metadata.timeRange.end}
Season: ${metadata.timeRange.season}
Duration: ${metadata.timeRange.duration_days} days

${this.extractAnalysisContent(aiInsights.introduction)}

ANALYTICAL RESULTS
------------------

STATISTICAL SUMMARY:
`;

    // Add layer statistics
    layers.forEach(layer => {
      content += `
${layer.name}:
  Mean: ${layer.statistics.mean.toFixed(4)}
  Range: ${layer.statistics.min.toFixed(4)} to ${layer.statistics.max.toFixed(4)}
  Standard Deviation: ${layer.statistics.stdDev.toFixed(4)}
`;
    });

    // Add layer interpretations
    if (aiInsights.statistics_interpretations) {
      content += `\nLAYER INTERPRETATIONS:\n`;
      Object.entries(aiInsights.statistics_interpretations).forEach(([layerId, interpretation]) => {
        const layer = layers.find(l => l.id === layerId);
        const layerName = layer ? layer.name : layerId.toUpperCase();
        content += `\n${layerName}:\n${this.extractAnalysisContent(interpretation)}\n`;
      });
    }

    // Add supplementary analysis
    if (additionalLayers && Object.keys(additionalLayers).length > 0) {
      content += `\nSUPPLEMENTARY ANALYSIS:\n${this.extractAnalysisContent(aiInsights.supplementary_analysis)}\n`;
    }

    // Add conclusion
    content += `\nCONCLUSION:\n${this.extractAnalysisContent(aiInsights.conclusion)}

TECHNICAL DETAILS
-----------------
Processing Date: ${metadata.processingDate}
Report Generated: ${new Date().toISOString()}
System: Urban Heat Island Research Platform
`;

    fs.writeFileSync(textPath, content);
    return textPath;
  }

  // NEW: Helper method to extract analysis content from AI responses
  extractAnalysisContent(content) {
    if (!content) return 'Analysis content not available.';
    
    // Remove the **Analysis:** prefix and clean up the content
    return content.replace(/\*\*Analysis:\*\*\s*/g, '').trim();
  }

  // Keep the existing createZipArchive method (no changes needed)
  async createZipArchive(reportDir, pdfPath, rasterFiles) {
    const zipPath = path.join(reportDir, 'comprehensive_report.zip');
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    return new Promise((resolve, reject) => {
      output.on('close', () => {
        console.log(`ZIP archive created: ${archive.pointer()} total bytes`);
        resolve(zipPath);
      });

      archive.on('error', (err) => {
        reject(err);
      });

      archive.pipe(output);

      // Add PDF report if it exists
      if (fs.existsSync(pdfPath)) {
        archive.file(pdfPath, { name: 'UHI_Research_Report.pdf' });
      }

      // Add raster files if they exist
      rasterFiles.forEach(rasterFile => {
        if (fs.existsSync(rasterFile.path)) {
          archive.file(rasterFile.path, { name: `rasters/${rasterFile.name}` });
        }
      });

      archive.finalize();
    });
  }

  // Keep the existing cleanupReport method (no changes needed)
  cleanupReport(reportDir) {
    try {
      if (fs.existsSync(reportDir)) {
        fs.rmSync(reportDir, { recursive: true, force: true });
        console.log(`Cleaned up report directory: ${reportDir}`);
      }
    } catch (error) {
      console.error(`Failed to cleanup report directory: ${error.message}`);
    }
  }
}

export default ReportGenerator;