import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../styles/components.css';
import myIcon from '../../assets/images/CityHeatAtlasLogo.png';
const Header = ({ onAuthClick, showAuthButton = false, user = null, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isLandingPage = location.pathname === '/';

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleExploreClick = () => {
    navigate('/explorer');
  };

  const handleGithubClick = () => {
    window.open('https://github.com/AjayVerma08/UHI-Web-Application');
  };

  return (
    <header className={`header ${isLandingPage ? 'header-landing' : 'header-app'}`}>
      <div className="header-content">
        <div className="header-left">
          <div className="logo" onClick={handleLogoClick}>
            <div className="logo-icon">
              <img 
                src={myIcon} 
                alt="Icon" 
                width="35" 
                height="35" 
                style={{ objectFit: "contain" }}
              />
            </div>
            <span className="logo-text">CityHeatAtlas</span>
          </div>
        </div>

        <nav className="header-nav">
          {!isLandingPage && (
            <button 
              className="nav-link"
              onClick={handleLogoClick}
            >
              Home
            </button>
          )}
          
          {isLandingPage && (
            <button 
              className="nav-link"
              onClick={handleExploreClick}
            >
              Explore
            </button>
          )}
          
          <button 
            className="nav-link"
            onClick={handleGithubClick}
          >
            Github
          </button>
        </nav>

        <div className="header-right">
          {user ? (
            <div className="user-menu">
              <span className="user-name">{user.name}</span>
              <button 
                className="logout-button"
                onClick={onLogout}
              >
                Logout
              </button>
            </div>
          ) : showAuthButton ? (
            <button 
              className="auth-button"
              onClick={() => onAuthClick('login')}
            >
              Login/Register
            </button>
          ) : (
            <button 
              className="auth-button"
              onClick={() => onAuthClick('login')}
            >
              Login/Register
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;