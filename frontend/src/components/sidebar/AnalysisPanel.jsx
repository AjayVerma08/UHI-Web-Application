import React from 'react';

const AnalysisPanel = ({ 
  onAnalysisStart,
  onGenerateAdditionals,
  isProcessing, 
  analysisResults, 
  selectedMetrics,
  additionalOptions = [], // Default to empty array
  onAdditionalOptionsChange
}) => {
  const canStartAnalysis = selectedMetrics.length > 0;
  const hasAnalysisResults = analysisResults !== null;

  const getButtonText = () => {
    if (isProcessing) return ('Processing...');
    if (hasAnalysisResults) return 'Generate';
    return 'Start Analysis';
  };

  const getButtonIcon = () => {
    if (isProcessing) return '⏳';
    if (hasAnalysisResults) return '🔄';
    return '🚀';
  };

  const handleButtonClick = () => {
    if (hasAnalysisResults) {
      // Button is in "Generate" state - call additionals endpoint
      onGenerateAdditionals();
    } else {
      // Button is in "Start Analysis" state - call data endpoint
      onAnalysisStart();
    }
  };

  const handleAdditionalOptionToggle = (optionId) => {
    console.log('Toggle clicked for:', optionId);
    console.log('Current additionalOptions:', additionalOptions);
    console.log('onAdditionalOptionsChange function:', onAdditionalOptionsChange);
    
    const isSelected = additionalOptions.includes(optionId);
    console.log('Is selected:', isSelected);
    
    let newOptions;
    if (isSelected) {
      newOptions = additionalOptions.filter(id => id !== optionId);
    } else {
      newOptions = [...additionalOptions, optionId];
    }
    
    console.log('New options:', newOptions);
    
    if (onAdditionalOptionsChange) {
      onAdditionalOptionsChange(newOptions);
    } else {
      console.error('onAdditionalOptionsChange is not a function');
    }
  };

  return (
    <div className="analysis-panel">
      {/* Additional Options - Only show when analysis results exist */}
      {hasAnalysisResults && (
        <div className="additional-options">
          <h4>Additional Layers:</h4>
          <div className="options-grid">
            <div className="option-item">
              <label className="option-checkbox">
                <input
                  type="checkbox"
                  checked={additionalOptions.includes('LULC')}
                  onChange={() => handleAdditionalOptionToggle('LULC')}
                />
                <div className="option-info">
                  <span className="option-icon">👥</span>
                  <span className="option-label">Overlay Land Use Land Cover</span>
                </div>
              </label>
            </div>
            <div className="option-item">
              <label className="option-checkbox">
                <input
                  type="checkbox"
                  checked={additionalOptions.includes('heatVulnerabilityZones')}
                  onChange={() => handleAdditionalOptionToggle('heatVulnerabilityZones')}
                />
                <div className="option-info">
                  <span className="option-icon">🌡️</span>
                  <span className="option-label">Heat Vulnerability Zones</span>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Button */}
      <div className="analysis-section">
        <button 
          className={`analysis-button ${isProcessing ? 'processing' : ''}`}
          onClick={handleButtonClick}
          disabled={(!canStartAnalysis && !hasAnalysisResults) || isProcessing}
        >
          <span className="button-icon">{getButtonIcon()}</span>
          {getButtonText()}
        </button>
        
        {!canStartAnalysis && !hasAnalysisResults && (
          <p className="analysis-warning">
            ⚠️ Please select at least one metric to begin analysis
          </p>
        )}
        
        {hasAnalysisResults && additionalOptions.length === 0 && (
          <p className="analysis-warning">
            ℹ️ Select additional layers to generate
          </p>
        )}
      </div>
    </div>
  );
};

export default AnalysisPanel;