import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/global.css';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <div className="error-code">404</div>
        <h1 className="error-title">Page Not Found</h1>
        <p className="error-description">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="error-actions">
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/')}
          >
            Go Home
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => navigate('/explorer')}
          >
            Open Explorer
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;