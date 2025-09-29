import React, { useState, useMemo } from "react";
import "../../styles/StatisticsPanel.css";

export default function StatisticsPanel({ layers }) {
  if (!layers || layers.length === 0) return null;

  const [activeTab, setActiveTab] = useState(layers[0].id);

  const normalizeData = (histogram) => {
    if (!histogram || !histogram.histogram) return null;
    
    const counts = histogram.histogram;
    const means = histogram.bucketMeans;
    const maxCount = Math.max(...counts);
    
    return means.map((mean, i) => ({
      x: mean,
      y: (counts[i] / maxCount) * 100, // Normalize to percentage
      count: counts[i]
    }));
  };

  const generatePathData = (data) => {
    if (!data || data.length === 0) return '';
    
    const width = 300; // Approximate chart width
    const height = 100;
    const xStep = width / (data.length - 1);
    
    return data.map((point, i) => 
      `${i === 0 ? 'M' : 'L'}${i * xStep},${height - point.y}`
    ).join(' ');
  };

  const generateAreaPath = (data) => {
    if (!data || data.length === 0) return '';
    
    const width = 300;
    const height = 100;
    const xStep = width / (data.length - 1);
    
    const topPoints = data.map((point, i) => `${i * xStep},${height - point.y}`);
    const bottomPoints = data.map((_, i) => `${(data.length - 1 - i) * xStep},${height}`).reverse();
    
    return `M${topPoints.join('L')}L${bottomPoints.join('L')}Z`;
  };

  return (
    <div className="stats-panel">
      <div className="stats-header">
        <h3>Statistics</h3>
      </div>

      <div className="stats-tabs">
        {layers.map((layer) => (
          <button
            key={layer.id}
            className={`tab ${activeTab === layer.id ? "active" : ""}`}
            onClick={() => setActiveTab(layer.id)}
          >
            {layer.name}
          </button>
        ))}
      </div>

      <div className="stats-content">
        {layers
          .filter((layer) => layer.id === activeTab)
          .map((layer) => {
            const chartData = normalizeData(layer.histogram);
            
            return (
              <div key={layer.id}>
                <div className="stat-item">
                  <span><strong>Mean:</strong></span>
                  <span>{layer.statistics?.mean?.toFixed(3) || 'N/A'}</span>
                </div>
                <div className="stat-item">
                  <span><strong>Min:</strong></span>
                  <span>{layer.statistics?.min?.toFixed(3) || 'N/A'}</span>
                </div>
                <div className="stat-item">
                  <span><strong>Max:</strong></span>
                  <span>{layer.statistics?.max?.toFixed(3) || 'N/A'}</span>
                </div>
                <div className="stat-item">
                  <span><strong>StdDev:</strong></span>
                  <span>{layer.statistics?.stdDev?.toFixed(3) || 'N/A'}</span>
                </div>

                {/* LINE CHART HISTOGRAM */}
                {chartData && (
                  <div className="histogram">
                    <div className="line-chart-container">
                      <svg className="line-chart" viewBox="0 0 300 100">
                        {/* Area fill */}
                        <path 
                          className="chart-area" 
                          d={generateAreaPath(chartData)}
                        />
                        
                        {/* Line */}
                        <path 
                          className="chart-line" 
                          d={generatePathData(chartData)}
                        />
                        
                        {/* Points */}
                        {chartData.map((point, i) => {
                          const x = (i / (chartData.length - 1)) * 300;
                          const y = 100 - point.y;
                          return (
                            <circle
                              key={i}
                              className="chart-point"
                              cx={x}
                              cy={y}
                              data-tooltip={`Value: ${point.x.toFixed(2)}, Count: ${point.count}`}
                            />
                          );
                        })}
                      </svg>
                    </div>

                    {/* X-axis labels */}
                    <div className="chart-axis">
                      {chartData.map((point, i) => 
                        i % 4 === 0 && (
                          <span key={i} className="axis-label">
                            {point.x.toFixed(1)}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}