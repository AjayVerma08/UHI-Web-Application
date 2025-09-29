import React, { useState } from 'react';
import DateRangeSelector from './DateRangeSelector';
import MetricsSelector from './MetricsSelector';
import AnalysisPanel from './AnalysisPanel';
import DownloadPanel from './DownloadPanel';
import '../../styles/explorer.css';

const Sidebar = ({ 
  dateRange, 
  onDateRangeChange, 
  selectedMetrics, 
  onMetricsChange,
  onAnalysisStart,
  onGenerateAdditionals,
  isProcessing,
  analysisResults,
  additionalOptions = [], // Add default value here too
  onAdditionalOptionsChange,
  additionalLayers = {}, // Add this new prop
  selectedRegion, // Add this new prop
  user 
}) => {
  const [expandedSections, setExpandedSections] = useState({
    dateRange: true,
    metrics: true,
    analysis: true,
    download: false
  });

  console.log('Sidebar - additionalOptions:', additionalOptions);
  console.log('Sidebar - onAdditionalOptionsChange:', onAdditionalOptionsChange);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-title">Control Panel</h2>
      </div>
      
      <div className="sidebar-content">
        {/* Date Range Section */}
        <div className="sidebar-section">
          <div 
            className={`section-header ${expandedSections.dateRange ? 'active' : ''}`}
            onClick={() => toggleSection('dateRange')}
          >
            <span>Date Range</span>
            <span className={`section-toggle ${expandedSections.dateRange ? 'expanded' : ''}`}>
              ▼
            </span>
          </div>
          <div className={`section-content ${!expandedSections.dateRange ? 'collapsed' : ''}`}>
            <DateRangeSelector 
              dateRange={dateRange}
              onChange={onDateRangeChange}
            />
          </div>
        </div>

        {/* Metrics Section */}
        <div className="sidebar-section">
          <div 
            className={`section-header ${expandedSections.metrics ? 'active' : ''}`}
            onClick={() => toggleSection('metrics')}
          >
            <span>Metrics</span>
            <span className={`section-toggle ${expandedSections.metrics ? 'expanded' : ''}`}>
              ▼
            </span>
          </div>
          <div className={`section-content ${!expandedSections.metrics ? 'collapsed' : ''}`}>
            <MetricsSelector 
              selectedMetrics={selectedMetrics}
              onChange={onMetricsChange}
            />
          </div>
        </div>

        {/* Analysis Section */}
        <div className="sidebar-section">
          <div 
            className={`section-header ${expandedSections.analysis ? 'active' : ''}`}
            onClick={() => toggleSection('analysis')}
          >
            <span>Analysis</span>
            <span className={`section-toggle ${expandedSections.analysis ? 'expanded' : ''}`}>
              ▼
            </span>
          </div>
          <div className={`section-content ${!expandedSections.analysis ? 'collapsed' : ''}`}>
            <AnalysisPanel 
              onAnalysisStart={onAnalysisStart}
              onGenerateAdditionals={onGenerateAdditionals}
              isProcessing={isProcessing}
              analysisResults={analysisResults}
              selectedMetrics={selectedMetrics}
              additionalOptions={additionalOptions}
              onAdditionalOptionsChange={onAdditionalOptionsChange}
            />
          </div>
        </div>

        {/* Download Section */}
        {analysisResults && (
          <div className="sidebar-section">
            <div 
              className={`section-header ${expandedSections.download ? 'active' : ''}`}
              onClick={() => toggleSection('download')}
            >
              <span>Download Results</span>
              <span className={`section-toggle ${expandedSections.download ? 'expanded' : ''}`}>
                ▼
              </span>
            </div>
            <div className={`section-content ${!expandedSections.download ? 'collapsed' : ''}`}>
              <DownloadPanel 
                analysisResults={analysisResults}
                additionalLayers={additionalLayers}
                user={user}
                dateRange={dateRange}
                selectedRegion={selectedRegion}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;