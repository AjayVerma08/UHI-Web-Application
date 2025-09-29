class ChartGenerator {
  static generateEnhancedHistogramSVG(histogramData, layerName, width = 280, height = 120) {
    if (!histogramData || !histogramData.histogram || !histogramData.bucketMeans) {
      return null;
    }

    const { histogram, bucketMeans } = histogramData;
    
    // Filter out zero values for better visualization
    const nonZeroIndices = histogram.map((val, idx) => val > 0 ? idx : -1).filter(idx => idx !== -1);
    if (nonZeroIndices.length === 0) return null;
    
    const minIndex = Math.min(...nonZeroIndices);
    const maxIndex = Math.max(...nonZeroIndices);
    const visibleHistogram = histogram.slice(minIndex, maxIndex + 1);
    const visibleBuckets = bucketMeans.slice(minIndex, maxIndex + 1);
    
    if (visibleHistogram.length === 0) return null;

    const maxValue = Math.max(...visibleHistogram);
    const barWidth = Math.max(2, (width - 40) / visibleHistogram.length);
    const padding = 30;

    // Generate gradient-based bars for better visual distinction
    let bars = '';
    let maxBarHeight = height - padding - 20;

    for (let i = 0; i < visibleHistogram.length; i++) {
      if (visibleHistogram[i] === 0) continue;
      
      const barHeight = (visibleHistogram[i] / maxValue) * maxBarHeight;
      const x = padding + (i * barWidth);
      const y = height - padding - barHeight;

      // Calculate color intensity based on value
      const intensity = Math.min(1, visibleHistogram[i] / maxValue * 1.5);
      const color = this.getColorForLayer(layerName, intensity);
      
      bars += `<rect x="${x}" y="${y}" width="${barWidth * 0.8}" height="${barHeight}" 
               fill="${color}" opacity="0.8" stroke="#2c3e50" stroke-width="0.3"/>`;
    }

    // Create axis with better labeling
    const axis = this.generateHistogramAxis(visibleBuckets, width, height, padding);
    
    // Add statistical indicators
    const stats = this.calculateHistogramStats(histogramData);
    const statsText = this.generateStatsText(stats, width);

    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <title>${layerName} Distribution Histogram</title>
        
        <!-- Background -->
        <rect width="${width}" height="${height}" fill="#f8f9fa" stroke="#dee2e6" stroke-width="1"/>
        
        <!-- Grid lines -->
        ${this.generateGridLines(width, height, padding, maxBarHeight)}
        
        <!-- Bars -->
        ${bars}
        
        <!-- Axis -->
        ${axis}
        
        <!-- Title -->
        <text x="${width/2}" y="15" text-anchor="middle" font-size="11" font-weight="600" fill="#2c3e50">
          ${layerName} Distribution
        </text>
        
        <!-- Statistics -->
        ${statsText}
      </svg>
    `;
  }

  static generateHistogramAxis(bucketMeans, width, height, padding) {
    if (bucketMeans.length === 0) return '';
    
    const numLabels = Math.min(5, bucketMeans.length);
    const labelStep = Math.max(1, Math.floor(bucketMeans.length / numLabels));
    let labels = '';
    let ticks = '';

    // X-axis line
    const axisLine = `<line x1="${padding}" y1="${height - padding}" x2="${width - 10}" y2="${height - padding}" stroke="#495057" stroke-width="1.5"/>`;

    for (let i = 0; i < numLabels; i++) {
      const index = Math.min(i * labelStep, bucketMeans.length - 1);
      const x = padding + (index / bucketMeans.length) * (width - padding - 10);
      const value = this.formatAxisLabel(bucketMeans[index]);
      
      ticks += `<line x1="${x}" y1="${height - padding}" x2="${x}" y2="${height - padding + 5}" stroke="#495057" stroke-width="1"/>`;
      labels += `<text x="${x}" y="${height - padding + 15}" text-anchor="middle" 
                   font-size="9" fill="#6c757d" font-family="Arial, sans-serif">${value}</text>`;
    }

    // Y-axis label
    const yLabel = `<text x="15" y="${height/2}" text-anchor="middle" font-size="9" fill="#6c757d" 
                   transform="rotate(-90, 15, ${height/2})" font-family="Arial, sans-serif">Frequency</text>`;

    return axisLine + ticks + labels + yLabel;
  }

  static generateGridLines(width, height, padding, maxBarHeight) {
    const numGridLines = 4;
    let gridLines = '';
    
    for (let i = 0; i <= numGridLines; i++) {
      const y = height - padding - (i / numGridLines) * maxBarHeight;
      gridLines += `<line x1="${padding}" y1="${y}" x2="${width - 10}" y2="${y}" 
                     stroke="#e9ecef" stroke-width="0.5" stroke-dasharray="2,2"/>`;
    }
    
    return gridLines;
  }

  static calculateHistogramStats(histogramData) {
    const { histogram, bucketMeans } = histogramData;
    const total = histogram.reduce((sum, val) => sum + val, 0);
    
    if (total === 0) return null;
    
    // Calculate weighted mean
    let weightedSum = 0;
    histogram.forEach((freq, idx) => {
      weightedSum += freq * bucketMeans[idx];
    });
    const mean = weightedSum / total;
    
    // Find mode (most frequent bucket)
    const maxFreq = Math.max(...histogram);
    const modeIndex = histogram.indexOf(maxFreq);
    const mode = bucketMeans[modeIndex];
    
    return { mean, mode, total };
  }

  static generateStatsText(stats, width) {
    if (!stats) return '';
    
    return `
      <text x="${width - 10}" y="25" text-anchor="end" font-size="8" fill="#6c757d" font-family="Arial, sans-serif">
        μ=${stats.mean.toFixed(2)}
      </text>
      <text x="${width - 10}" y="35" text-anchor="end" font-size="8" fill="#6c757d" font-family="Arial, sans-serif">
        mode=${stats.mode.toFixed(2)}
      </text>
      <text x="${width - 10}" y="45" text-anchor="end" font-size="8" fill="#6c757d" font-family="Arial, sans-serif">
        n=${stats.total.toLocaleString()}
      </text>
    `;
  }

  static getColorForLayer(layerName, intensity) {
    const colorMap = {
      'LST': `rgb(${Math.floor(220 * intensity)}, ${Math.floor(80 * intensity)}, ${Math.floor(80 * intensity)})`,
      'UHI': `rgb(${Math.floor(80 * intensity)}, ${Math.floor(120 * intensity)}, ${Math.floor(220 * intensity)})`,
      'NDVI': `rgb(${Math.floor(80 * intensity)}, ${Math.floor(180 * intensity)}, ${Math.floor(80 * intensity)})`,
      'NDBI': `rgb(${Math.floor(180 * intensity)}, ${Math.floor(120 * intensity)}, ${Math.floor(80 * intensity)})`,
      'UTFVI': `rgb(${Math.floor(160 * intensity)}, ${Math.floor(80 * intensity)}, ${Math.floor(160 * intensity)})`
    };
    
    return colorMap[layerName] || `rgb(${Math.floor(150 * intensity)}, ${Math.floor(150 * intensity)}, ${Math.floor(150 * intensity)})`;
  }

  static formatAxisLabel(value) {
    if (Math.abs(value) >= 100) {
      return value.toFixed(0);
    } else if (Math.abs(value) >= 10) {
      return value.toFixed(1);
    } else if (Math.abs(value) >= 1) {
      return value.toFixed(2);
    } else {
      return value.toFixed(3);
    }
  }

  // Remove statistical comparison chart method as requested
  // static generateStatisticsChart() { ... }

  static generateLegendSVG(visParams, layerName, width = 200, height = 25) {
    if (!visParams || !visParams.palette) return null;

    const { min, max, palette } = visParams;
    const segmentWidth = width / palette.length;
    
    let segments = '';
    let gradient = '';
    
    // Create gradient for smoother appearance
    if (palette.length > 1) {
      const gradientId = `gradient-${layerName.replace(/\s+/g, '-')}`;
      gradient = `<defs><linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="0%">`;
      
      palette.forEach((color, index) => {
        const offset = (index / (palette.length - 1)) * 100;
        const hexColor = color.startsWith('#') ? color : `#${color}`;
        gradient += `<stop offset="${offset}%" stop-color="${hexColor}"/>`;
      });
      
      gradient += `</linearGradient></defs>`;
      segments = `<rect x="0" y="5" width="${width}" height="15" fill="url(#${gradientId})"/>`;
    } else {
      const color = palette[0].startsWith('#') ? palette[0] : `#${palette[0]}`;
      segments = `<rect x="0" y="5" width="${width}" height="15" fill="${color}"/>`;
    }

    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        ${gradient}
        ${segments}
        <text x="0" y="23" font-size="8" fill="#495057" font-family="Arial, sans-serif">${this.formatAxisLabel(min)}</text>
        <text x="${width}" y="23" text-anchor="end" font-size="8" fill="#495057" font-family="Arial, sans-serif">${this.formatAxisLabel(max)}</text>
        <text x="${width/2}" y="23" text-anchor="middle" font-size="8" fill="#495057" font-family="Arial, sans-serif">${layerName}</text>
      </svg>
    `;
  }

  // Additional method for generating a combined distribution overview
  static generateDistributionOverview(layers, width = 400, height = 200) {
    const visibleLayers = layers.filter(layer => 
      layer.histogram && layer.histogram.histogram && layer.histogram.bucketMeans
    );
    
    if (visibleLayers.length === 0) return null;

    const padding = 40;
    const chartHeight = (height - padding * 2) / visibleLayers.length;
    
    let charts = '';
    
    visibleLayers.forEach((layer, index) => {
      const y = padding + index * chartHeight;
      const histogramSVG = this.generateEnhancedHistogramSVG(
        layer.histogram, 
        layer.name, 
        width - padding, 
        chartHeight - 10
      );
      
      if (histogramSVG) {
        charts += `<g transform="translate(${padding}, ${y})">${histogramSVG}</g>`;
      }
    });

    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <title>Parameter Distributions Overview</title>
        <rect width="${width}" height="${height}" fill="#f8f9fa" stroke="#dee2e6" stroke-width="1"/>
        <text x="${width/2}" y="20" text-anchor="middle" font-size="12" font-weight="600" fill="#2c3e50">
          Parameter Distributions
        </text>
        ${charts}
      </svg>
    `;
  }
}

export default ChartGenerator;