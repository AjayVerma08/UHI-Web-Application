import React, { useState } from 'react';

const DownloadPanel = ({ analysisResults, additionalLayers, user, dateRange, selectedRegion }) => {
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportProgress, setReportProgress] = useState('');
  const [downloadType, setDownloadType] = useState('comprehensive'); // 'json' or 'comprehensive'

  const handleLegacyDownload = () => {
    if (!user) {
      alert('Please login to download results');
      return;
    }

    // Create legacy JSON download
    const dataStr = JSON.stringify(analysisResults, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `heat_analysis_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  };

  const handleComprehensiveReport = async () => {
    if (!user) {
      alert('Please login to download comprehensive reports');
      return;
    }

    if (!analysisResults || !selectedRegion) {
      alert('Please complete analysis before generating report');
      return;
    }

    setIsGeneratingReport(true);
    setReportProgress('Initializing report generation...');

    try {
      // Prepare metadata for the report
      const metadata = {
        geometry: selectedRegion,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        year: new Date(dateRange.endDate).getFullYear()
      };

      setReportProgress('Analyzing data and generating insights...');

      // Call the new report generation endpoint
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/download/generate-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          analysisData: analysisResults,
          additionalData: additionalLayers,
          metadata: metadata
        })
      });

      if (response.ok) {
        const result = await response.json();
        setReportProgress('Report generated successfully! Starting download...');
        
        // Start the download
        const downloadUrl = `${import.meta.env.VITE_API_BASE_URL}/download/download-report/${result.reportId}`;
        
        // Create a link to download the ZIP file
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `UHI_Comprehensive_Report_${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setReportProgress('Download started successfully!');
        
        // Clear progress after 3 seconds
        setTimeout(() => {
          setReportProgress('');
        }, 3000);
        
      } else {
        throw new Error('Report generation failed');
      }
    } catch (error) {
      console.error('Report generation error:', error);
      alert('Failed to generate comprehensive report. Please try again.');
      setReportProgress('');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const getAvailableData = () => {
    const data = [];
    
    // Analysis layers
    if (analysisResults && analysisResults.layers) {
      analysisResults.layers.forEach(layer => {
        data.push({
          name: layer.name,
          type: 'Analysis Layer',
          format: '.tif (GeoTIFF)'
        });
      });
    }
    
    // Additional layers
    if (additionalLayers) {
      Object.keys(additionalLayers).forEach(key => {
        let name = key;
        if (key === 'populationDensity') name = 'Population Density';
        if (key === 'heatVulneratbiltyZones') name = 'Heat Vulnerability Zones';
        if (key === 'lulc') name = 'Land Use Land Cover';
        
        data.push({
          name: name,
          type: 'Additional Layer',
          format: '.tif (GeoTIFF)'
        });
      });
    }
    
    return data;
  };

  return (
    <div className="download-panel">
      <div className="download-info">
        <p>
          <strong>📋 Copyright @Ajay Verma 2025</strong>
        </p>
        {!user ? (
          <p className="login-required">
            🔐 Please login to download analysis results
          </p>
        ) : (
          <p className="download-ready">
            ✅ Results are ready for download
          </p>
        )}
      </div>

      {/* Download Type Selection */}
      {user && analysisResults && (
        <div className="download-options">
          <h5>Choose Download Type:</h5>
          <div className="download-type-selector">
            <label className="download-option">
              <input
                type="radio"
                name="downloadType"
                value="json"
                checked={downloadType === 'json'}
                onChange={(e) => setDownloadType(e.target.value)}
              />
              <div className="option-content">
                <strong>JSON Data Only</strong>
                <span>Raw analysis data in JSON format</span>
              </div>
            </label>
            
            <label className="download-option">
              <input
                type="radio"
                name="downloadType"
                value="comprehensive"
                checked={downloadType === 'comprehensive'}
                onChange={(e) => setDownloadType(e.target.value)}
              />
              <div className="option-content">
                <strong>Comprehensive Report</strong>
                <span>AI-generated PDF report + GeoTIFF rasters</span>
                <small>🤖 Includes AI analysis and insights</small>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Progress Display */}
      {isGeneratingReport && (
        <div className="report-progress">
          <div className="progress-spinner"></div>
          <p>{reportProgress}</p>
        </div>
      )}
      
      {/* Download Button */}
      <button 
        className={`download-button ${isGeneratingReport ? 'processing' : ''}`}
        onClick={downloadType === 'json' ? handleLegacyDownload : handleComprehensiveReport}
        disabled={!user || !analysisResults || isGeneratingReport}
      >
        <span>📥</span>
        {isGeneratingReport 
          ? 'Generating Report...' 
          : downloadType === 'json' 
            ? 'Download JSON Data'
            : 'Generate Comprehensive Report'
        }
      </button>
      
      {/* Available Data Preview */}
      {analysisResults && (
        <div className="download-details">
          <h5>Available Data:</h5>
          <div className="data-list">
            {getAvailableData().map((item, index) => (
              <div key={index} className="data-item">
                <span className="data-name">{item.name}</span>
                <span className="data-type">{item.type}</span>
                <span className="data-format">{item.format}</span>
              </div>
            ))}
          </div>
          
          {downloadType === 'comprehensive' && (
            <div className="comprehensive-info">
              <h6>Comprehensive Report Includes:</h6>
              <ul>
                <li>📊 AI-generated analysis and insights</li>
                <li>📈 Statistical summaries and interpretations</li>
                <li>🗺️ All raster data files (properly named)</li>
                <li>📄 Professional PDF report</li>
                <li>🎯 Recommendations and findings</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DownloadPanel;