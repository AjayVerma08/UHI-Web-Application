import React from "react";
import '../../styles/Legend.css';

const Legend = ({ legendInfo, orientation = "horizontal" }) => {
  if (!legendInfo) {
    return null;
  }

  const { title, type, classes, palette, min, max } = legendInfo;

  // Handle discrete legends (LULC, Population Density, Heat Vulnerability Zones)
  if (type === "discrete" && classes && classes.length > 0) {
    // For mobile screens, use horizontal layout if too many classes
    const isMobile = window.innerWidth <= 480;
    const tooManyClasses = classes.length > 8;
    
    if (isMobile && tooManyClasses) {
      return (
        <div className="legend-container">
          <div className="legend-title">{title}</div>
          <div className="discrete-legend-horizontal">
            {classes.map((item, index) => (
              <div key={index} className="discrete-legend-item">
                <div 
                  className="discrete-color-box"
                  style={{ backgroundColor: item.color }}
                />
                <span className="discrete-label">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="legend-container vertical">
        <div className="legend-title">{title}</div>
        <div className="vertical-legend-wrapper">
          <div className="vertical-values">
            {classes.slice().reverse().map((item, index) => (
              <span key={index} className="vertical-value">{item.label}</span>
            ))}
          </div>
          <div className="discrete-colors-column">
            {classes.slice().reverse().map((item, index) => (
              <div 
                key={index}
                className="discrete-color-segment"
                style={{ backgroundColor: item.color }}
                data-label={item.label}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Handle continuous legends (existing functionality)
  if (!palette || palette.length === 0) {
    return null;
  }
  
  // Generate intermediate values with inequality signs
  const generateIntermediateValues = (min, max, steps = 5) => {
    const values = [];
    
    // Add minimum value with < sign
    values.push({ value: min, label: `< ${min.toFixed(1)}` });
    
    // Add intermediate values
    for (let i = 1; i < steps - 1; i++) {
      const value = min + (max - min) * (i / (steps - 1));
      values.push({ value, label: value.toFixed(1) });
    }
    
    // Add maximum value with > sign
    values.push({ value: max, label: `> ${max.toFixed(1)}` });
    
    return values;
  };

  const intermediateValues = generateIntermediateValues(min, max);

  if (orientation === "vertical") {
    return (
      <div className="legend-container vertical">
        <div className="legend-title">{title}</div>
        <div className="vertical-legend-wrapper">
          <div className="vertical-values">
            {intermediateValues.slice().reverse().map((item, index) => (
              <span key={index} className="vertical-value">{item.label}</span>
            ))}
          </div>
          <div 
            className="legend-gradient vertical-gradient"
            style={{
              background: `linear-gradient(to bottom, ${palette.slice().reverse().join(', ')})`
            }}
          />
        </div>
      </div>
    );
  }

  // Horizontal legend (default)
  return (
    <div className="legend-container horizontal">
      <div className="legend-title">{title}</div>
      <div 
        className="legend-gradient horizontal-gradient"
        style={{
          background: `linear-gradient(to right, ${palette.join(', ')})`
        }}
      />
      <div className="legend-labels">
        <span>{`< ${min.toFixed(1)}`}</span>
        <span>{`> ${max.toFixed(1)}`}</span>
      </div>
    </div>
  );
};

export default Legend;