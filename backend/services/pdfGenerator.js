import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import ChartGenerator from './chartGenerator.js';

class PDFGenerator {
  constructor() {
    this.templateDir = path.join(process.cwd(), 'templates');
    this.assetsDir = path.join(this.templateDir, 'assets');
    this.ensureDirectories();
  }

  ensureDirectories() {
    [this.templateDir, this.assetsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async generateReport(enhancedData, aiInsights, outputPath) {
    let browser = null;
    
    try {
      console.log('Starting PDF generation...');
      
      const htmlContent = this.generateHTMLReport(enhancedData, aiInsights);
      const htmlPath = outputPath.replace('.pdf', '.html');
      fs.writeFileSync(htmlPath, htmlContent);
      
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      await page.pdf({
        path: outputPath,
        format: 'A4',
        printBackground: true,
        margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
        displayHeaderFooter: true,
        headerTemplate: this.getHeaderTemplate(enhancedData),
        footerTemplate: this.getFooterTemplate(),
        preferCSSPageSize: false
      });
      
      console.log(`PDF generated successfully: ${outputPath}`);
      return outputPath;
      
    } catch (error) {
      console.error('PDF generation failed:', error);
      throw new Error(`PDF generation failed: ${error.message}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  generateHTMLReport(enhancedData, aiInsights) {
    const { metadata, layers, additionalLayers, statistics } = enhancedData;
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Urban Heat Island Research Report</title>
    <style>
        ${this.getReportCSS()}
    </style>
</head>
<body>
    <div class="report-container">
        ${this.generateCoverPage(metadata)}
        ${this.generateIntroductionPage(aiInsights, metadata)}
        ${this.generateAnalyticalResultsPage(layers, statistics)}
        ${this.generateLayerInterpretationsPage(layers, aiInsights, additionalLayers)}
        ${this.generateConclusionPage(aiInsights)}
    </div>
</body>
</html>`;
    
    return html;
  }

  getReportCSS() {
    return `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Georgia', 'Times New Roman', serif; line-height: 1.6; color: #333; background-color: #fff; font-size: 12px; }
      .report-container { max-width: 210mm; margin: 0 auto; padding: 0; }
      .page-break { page-break-before: always; }
      
      .cover-page {
        height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;
        text-align: center; background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%); color: white; padding: 40px;
      }
      .cover-title { font-size: 2.2em; font-weight: bold; margin-bottom: 15px; }
      .cover-subtitle { font-size: 1.1em; margin-bottom: 25px; font-style: italic; opacity: 0.9; }
      .cover-details { background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px; backdrop-filter: blur(10px); max-width: 400px; }
      
      .section { margin-bottom: 20px; padding: 15px 0; }
      .section-title { font-size: 1.6em; color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 8px; margin-bottom: 15px; }
      .subsection-title { font-size: 1.3em; color: #34495e; margin: 20px 0 12px 0; font-weight: 600; }
      
      .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 15px 0; }
      .info-card { background: #f8f9fa; padding: 12px; border-radius: 6px; border-left: 3px solid #3498db; font-size: 11px; }
      .info-card h4 { color: #2c3e50; margin-bottom: 6px; font-size: 1em; }
      .info-card p { color: #7f8c8d; font-size: 0.9em; margin: 2px 0; }
      
      .stats-table {
        width: 100%; border-collapse: collapse; margin: 15px 0; background: white; 
        box-shadow: 0 1px 5px rgba(0,0,0,0.1); border-radius: 6px; overflow: hidden; font-size: 11px;
      }
      .stats-table th, .stats-table td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #e0e0e0; }
      .stats-table th { background: #3498db; color: white; font-weight: 600; }
      
      .analysis-content { background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 10px 0; font-size: 11px; line-height: 1.5; }
      .analysis-content p { margin-bottom: 10px; }
      
      .histogram-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }
      .histogram-container { text-align: center; padding: 15px; background: #f8f9fa; border-radius: 6px; }
      .histogram-title { font-size: 1em; font-weight: 600; margin-bottom: 10px; color: #2c3e50; }
      
      .technical-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 8px; margin: 5px 0; font-size: 11px; }
      .technical-label { font-weight: 600; color: #495057; }
      .technical-value { color: #6c757d; }
      
      @media print {
        .page-break { page-break-before: always; }
        .section { break-inside: avoid; }
      }
    `;
  }

  generateCoverPage(metadata) {
    const { studyArea, timeRange } = metadata;
    const formattedDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    return `
      <div class="cover-page">
        <h1 class="cover-title">Urban Heat Island Research Report</h1>
        <p class="cover-subtitle">Scientific Analysis of Urban Thermal Patterns</p>
        <div class="cover-details">
          <p><strong>Study Area:</strong> ${studyArea.area_km2} km² region</p>
          <p><strong>Analysis Period:</strong> ${timeRange.start} to ${timeRange.end}</p>
          <p><strong>Season:</strong> ${timeRange.season} ${timeRange.year}</p>
          <p><strong>Report Date:</strong> ${formattedDate}</p>
        </div>
      </div>
    `;
  }

  generateIntroductionPage(aiInsights, metadata) {
    const { studyArea, timeRange } = metadata;
    
    return `
      <div class="page-break"></div>
      <div class="section">
        <h2 class="section-title">Introduction</h2>
        
        <div class="info-grid">
          <div class="info-card">
            <h4>Geographic Context</h4>
            <p><strong>Area Extent:</strong> ${studyArea.area_km2} km²</p>
            <p><strong>Centroid:</strong> ${studyArea.centroid.lat.toFixed(4)}°N, ${studyArea.centroid.lng.toFixed(4)}°E</p>
            <p><strong>Bounds:</strong> N ${studyArea.bounds.north.toFixed(4)}° to S ${studyArea.bounds.south.toFixed(4)}°</p>
            <p><strong>Bounds:</strong> E ${studyArea.bounds.east.toFixed(4)}° to W ${studyArea.bounds.west.toFixed(4)}°</p>
          </div>
          
          <div class="info-card">
            <h4>Temporal Framework</h4>
            <p><strong>Analysis Period:</strong> ${timeRange.start} to ${timeRange.end}</p>
            <p><strong>Duration:</strong> ${timeRange.duration_days} days</p>
            <p><strong>Season:</strong> ${timeRange.season}</p>
            <p><strong>Report Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
        </div>
        
        <div class="analysis-content">
          ${this.formatAnalysisContent(aiInsights.introduction)}
        </div>
      </div>
    `;
  }

  generateAnalyticalResultsPage(layers, statistics) {
    const statsTableRows = layers.map(layer => {
      const stats = layer.statistics;
      return `
        <tr>
          <td><strong>${layer.name}</strong></td>
          <td>${stats.mean.toFixed(3)}</td>
          <td>${stats.min.toFixed(3)}</td>
          <td>${stats.max.toFixed(3)}</td>
          <td>${stats.stdDev.toFixed(3)}</td>
        </tr>
      `;
    }).join('');

    const histogramGrid = this.generateHistogramGrid(layers);

    return `
      <div class="page-break"></div>
      <div class="section">
        <h2 class="section-title">Analytical Results</h2>
        
        <h3 class="subsection-title">Statistical Summary</h3>
        <table class="stats-table">
          <thead>
            <tr>
              <th>Parameter</th>
              <th>Mean</th>
              <th>Minimum</th>
              <th>Maximum</th>
              <th>Std. Deviation</th>
            </tr>
          </thead>
          <tbody>${statsTableRows}</tbody>
        </table>
        
        <h3 class="subsection-title">Data Distribution Analysis</h3>
        <div class="histogram-grid">${histogramGrid}</div>
      </div>
    `;
  }

  generateLayerInterpretationsPage(layers, aiInsights, additionalLayers) {
    let interpretationsHTML = '';
    if (aiInsights.statistics_interpretations) {
      interpretationsHTML = Object.entries(aiInsights.statistics_interpretations)
        .map(([layerId, interpretation]) => {
          const layer = layers.find(l => l.id === layerId);
          const layerName = layer ? layer.name : layerId.toUpperCase();
          
          return `
            <h3 class="subsection-title">${layerName} Analysis</h3>
            <div class="analysis-content">
              ${this.formatAnalysisContent(interpretation)}
            </div>
          `;
        }).join('');
    }

    let supplementaryHTML = '';
    if (additionalLayers && Object.keys(additionalLayers).length > 0) {
      supplementaryHTML = `
        <h3 class="subsection-title">Supplementary Analysis</h3>
        <div class="analysis-content">
          ${this.formatAnalysisContent(aiInsights.supplementary_analysis)}
        </div>
      `;
    }

    return `
      <div class="page-break"></div>
      <div class="section">
        <h2 class="section-title">Layer Interpretations</h2>
        ${interpretationsHTML}
        ${supplementaryHTML}
      </div>
    `;
  }

  generateConclusionPage(aiInsights) {
    return `
      <div class="page-break"></div>
      <div class="section">
        <h2 class="section-title">Conclusion</h2>
        <div class="analysis-content">
          ${this.formatAnalysisContent(aiInsights.conclusion)}
        </div>
        
        <div style="margin-top: 30px; padding: 15px; background: #f8f9fa; border-radius: 6px; text-align: center; font-size: 11px;">
          <p><strong>CityHeatAtlas</strong></p>
          <p>Copyright © 2025</p>
          <p>Generated using Google Earth Engine API and AI-powered analysis</p>
        </div>
      </div>
    `;
  }

  generateHistogramGrid(layers) {
    return layers.map(layer => {
      const histogram = ChartGenerator.generateEnhancedHistogramSVG(layer.histogram, layer.name, 280, 120);
      return histogram ? `
        <div class="histogram-container">
          <div class="histogram-title">${layer.name} Distribution</div>
          ${histogram}
        </div>
      ` : '';
    }).join('');
  }

  formatAnalysisContent(content) {
    if (!content) return '<p>Analysis content not available.</p>';
    
    // Remove markdown formatting and ensure proper paragraphs
    const cleaned = content.replace(/\*\*Analysis:\*\*\s*/g, '').replace(/\*\*/g, '');
    const paragraphs = cleaned.split(/\n\n+/).filter(p => p.trim().length > 0);
    
    return paragraphs.map(paragraph => `<p>${paragraph.trim()}</p>`).join('');
  }

  getHeaderTemplate(enhancedData) {
    return `
      <div style="font-size: 9px; color: #666; width: 100%; text-align: center; border-bottom: 1px solid #eee; padding: 4px 0;">
        Urban Heat Island Research Report - ${enhancedData.metadata.studyArea.area_km2} km² Study Area
      </div>
    `;
  }

  getFooterTemplate() {
    return `
      <div style="font-size: 9px; color: #666; width: 100%; text-align: center; border-top: 1px solid #eee; padding: 4px 0;">
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        <span style="float: right;">${new Date().toLocaleDateString()}</span>
      </div>
    `;
  }
}

export default PDFGenerator;