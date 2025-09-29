import React from 'react';

const MetricsSelector = ({ selectedMetrics, onChange }) => {
  const metrics = [
    {
      id: 'lst',
      name: 'Land Surface Temperature',
      description: 'Surface temperature in Celsius',
      icon: '🌡️'
    },
    {
      id: 'uhi',
      name: 'Urban Heat Island',
      description: 'Temperature difference between urban and rural areas',
      icon: '🌡️'
    },
    {
      id: 'utfvi',
      name: 'Urban Thermal Field Variance Index',
      description: 'Temperature difference between urban and rural areas',
      icon: '🌡️'
    },
    {
      id: 'ndvi',
      name: 'Vegetation Index (NDVI)',
      description: 'Normalized Difference Vegetation Index',
      icon: '🌿'
    },
    {
      id: 'ndbi',
      name: 'Built-up Index (NDBI)',
      description: 'Normalized Difference Built-up Index',
      icon: '🏢'
    }
    
  ];

  const handleMetricToggle = (metricId) => {
    const isSelected = selectedMetrics.includes(metricId);
    
    if (isSelected) {
      onChange(selectedMetrics.filter(id => id !== metricId));
    } else {
      onChange([...selectedMetrics, metricId]);
    }
  };

  return (
    <div className="metrics-selector">
      <div className="metrics-grid">
        {metrics.map((metric) => (
          <div 
            key={metric.id}
            className={`metric-option ${selectedMetrics.includes(metric.id) ? 'selected' : ''}`}
          >
            <label className="metric-checkbox">
              <input
                type="checkbox"
                checked={selectedMetrics.includes(metric.id)}
                onChange={() => handleMetricToggle(metric.id)}
              />
              <div className="metric-info">
                <h4>
                  <span className="metric-icon">{metric.icon}</span>
                  {metric.name}
                </h4>
                <p>{metric.description}</p>
              </div>
            </label>
          </div>
        ))}
      </div>
      
      <div className="metrics-info">
        <p className="info-text">
          Select the metrics you want to analyze. Multiple metrics can be processed simultaneously.
        </p>
      </div>
    </div>
  );
};

export default MetricsSelector;