import React from 'react';

const DateRangeSelector = ({ dateRange, onChange }) => {
  const handleDateChange = (field, value) => {
    onChange({
      ...dateRange,
      [field]: value
    });
  };

  return (
    <div className="date-range-selector">
      <div className="date-group">
        <label htmlFor="start-date" className="date-label">
          Start Date:
        </label>
        <input
          type="date"
          id="start-date"
          className="date-input"
          value={dateRange.startDate}
          onChange={(e) => handleDateChange('startDate', e.target.value)}
          max={dateRange.endDate}
        />
      </div>
      
      <div className="date-group">
        <label htmlFor="end-date" className="date-label">
          End Date:
        </label>
        <input
          type="date"
          id="end-date"
          className="date-input"
          value={dateRange.endDate}
          onChange={(e) => handleDateChange('endDate', e.target.value)}
          min={dateRange.startDate}
        />
      </div>

      <div className="date-info">
        <p className="info-text">
          <strong>Tip:</strong> Summer months (June-August) are recommended for optimal Urban Heat Island analysis.
        </p>
      </div>
    </div>
  );
};

export default DateRangeSelector;