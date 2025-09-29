import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/common/Header';
import Modal from '../components/common/Modal';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import '../styles/landing.css';
import uhiIMG from '../assets/images/UHI_effect.png'
import healthIMG from '../assets/images/Health.png'

const Landing = () => {
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('login');
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const navigate = useNavigate();

  // Handle header scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 50;
      setHeaderScrolled(scrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAuthClick = (type) => {
    setModalType(type);
    setShowModal(true);
  };

  const handleAuthSuccess = () => {
    setShowModal(false);
    navigate('/explorer');
  };

  const handleExploreClick = () => {
    navigate('/explorer');
  };

  return (
    <div className="landing-page">
      {/* Fixed Background */}
      <div className="landing-background">
        <div className="heat-overlay"></div>
      </div>
      
      {/* Fixed Header */}
      <Header 
        onAuthClick={handleAuthClick}
        showAuthButton={true}
        className={headerScrolled ? 'scrolled' : ''}
      />
      
      {/* Hero Section - Full Viewport */}
      <div className="hero-wrapper">
        <main className="landing-content">
          <div className="hero-section">
            <h1 className="hero-title">Welcome to CityHeatAtlas</h1>
            <p className="hero-subtitle">A (prototype) Urban Heat Island dynamics explorer</p>
            
            <div className="cta-section">
              <button 
                className="cta-button primary"
                onClick={handleExploreClick}
              >
                Start Exploring
              </button>
              <button 
                className="cta-button secondary"
                onClick={() => handleAuthClick('register')}
              >
                Get Started
              </button>
            </div>
          </div>
        </main>

        <div className='read-more-line'>
          <span className='label'>Read More</span>
          <span className='line'></span>
          <span className='arrows'>
            <i></i><i></i><i></i>
          </span>
        </div>
      </div>

      {/* Educational Sections - Below the fold */}
      <section className="info-sections">
        
        {/* UHI Explanation Section */}
        <div className="info-section uhi-explanation">
          <div className="section-container">
            <div className="section-heading">
              <h2>What is Urban Heat Island Effect?</h2>
              <p className="section-subtitle">Understanding the phenomenon that makes cities hotter than their surroundings</p>
            </div>
            
            <div className="content-grid">
              <div className="content-text">
                <div className="explanation-block">
                  <h3>The Phenomenon</h3>
                  <p>
                    Urban Heat Islands (UHI) occur when urban areas experience significantly warmer temperatures 
                    than surrounding rural areas. This temperature difference can reach up to 5-7°C during peak conditions, 
                    creating distinct "islands" of heat within cities. The UHI effect is most prominent at night and during periods of calm and clear weather. 
                  </p>
                </div>
                
                <div className="explanation-block">
                  <h3>Key Causes</h3>
                  <div className="causes-list">
                    <div className="cause-item">
                      <div className="cause-text">
                        <strong>Reduced Vegetation:</strong> <br />Less shading and evapotranspiration leads to higher surface and air temperatures
                      </div>
                    </div>
                    <div className="cause-item">
                      <div className="cause-text">
                        <strong>Dark Surfaces:</strong> <br />Asphalt and concrete absorb more solar radiation than natural surfaces
                      </div>
                    </div>
                    <div className="cause-item">
                      <div className="cause-text">
                        <strong>Waste Heat:</strong> <br />Energy consumption from buildings, vehicles, and industry adds heat
                      </div>
                    </div>
                    <div className="cause-item">
                      <div className="cause-text">
                        <strong>Altered Airflow:</strong> <br />Buildings create wind patterns that trap hot air
                      </div>
                    </div>
                    <div className="cause-item">
                      <div className="cause-text">
                        <strong>Industrial and Commercial Activities</strong> <br />Factories, cooling systems, and energy-intensive operations generate waste heat
                      </div>
                    </div>
                    <div className="cause-item">
                      <div className="cause-text">
                        <strong>Vehicular emissions</strong> <br />Vehicles release heat directly and increase air pollutants that trap heat
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="visual-representation">
                <div className="uhi-diagram">
                  <div className="temperature-profile">
                    <div className="temp-section rural-left">
                      <div className="temp-bar-rural" style={{height: '40px'}}></div>
                      <span className="temp-label">Rural</span>
                      <span className="temp-value">25°C</span>
                    </div>
                    <div className="temp-section suburban">
                      <div className="temp-bar-suburban" style={{height: '60px'}}></div>
                      <span className="temp-label">Suburban</span>
                      <span className="temp-value">27°C</span>
                    </div>
                    <div className="temp-section urban">
                      <div className="temp-bar-urban" style={{height: '100px'}}></div>
                      <span className="temp-label">Urban Core</span>
                      <span className="temp-value">32°C</span>
                    </div>
                    <div className="temp-section park">
                      <div className="temp-bar-park" style={{height: '50px'}}></div>
                      <span className="temp-label">Urban Park</span>
                      <span className="temp-value">26°C</span>
                    </div>
                    <div className="temp-section rural-right">
                      <div className="temp-bar-rural" style={{height: '40px'}}></div>
                      <span className="temp-label">Rural</span>
                      <span className="temp-value">25°C</span>
                    </div>
                  </div>
                  <div className="diagram-label">Temperature Profile Across Urban-Rural Gradient</div>
                </div>
                <div className='uhi-image'>
                    <img className='uhi-effect' src={uhiIMG} alt="UHI Effect" />
                </div>

                <div className="effects-visualization">
                  <h4>Observable Effects</h4>
                  <div className="effects-grid">
                    <div className="effect-item">
                      <div className="effect-icon">🌡️</div>
                      <div className="effect-text">Higher air & surface temperatures</div>
                    </div>
                    <div className="effect-item">
                      <div className="effect-icon">💨</div>
                      <div className="effect-text">Altered wind patterns</div>
                    </div>
                    <div className="effect-item">
                      <div className="effect-icon">☁️</div>
                      <div className="effect-text">Changed precipitation patterns</div>
                    </div>
                    <div className="effect-item">
                      <div className="effect-icon">🌅</div>
                      <div className="effect-text">Reduced nighttime cooling</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Why Study UHI Section */}
        <div className="info-section why-study-uhi">
          <div className="section-container">
            <div className="section-heading">
              <h2>Why is UHI Research Critical?</h2>
              <p className="section-subtitle">Understanding the far-reaching impacts on health, environment, and economy</p>
            </div>
            
            <div className="importance-grid">
              <div className="importance-card health">
                <h3>Public Health</h3>
                <div className="impact-list">
                  <div className="impact-item">
                    <strong>Heat-related illness:</strong> Increased hospitalizations during heat waves
                  </div>
                  <div className="impact-item">
                    <strong>Vulnerable populations:</strong> Elderly, children, and low-income communities at higher risk
                  </div>
                  <div className="impact-item">
                    <strong>Air quality:</strong> Higher temperatures worsen smog and ozone formation
                  </div>
                  <div className="impact-item">
                    <strong>Sleep disruption:</strong> Elevated nighttime temperatures affect rest quality
                  </div>
                </div>
              </div>
              
              <div className="importance-card environment">
                <h3>Environmental Impact</h3>
                <div className="impact-list">
                  <div className="impact-item">
                    <strong>Energy consumption:</strong> 2-8% increase per 1°C temperature rise
                  </div>
                  <div className="impact-item">
                    <strong>Water stress:</strong> Higher evaporation rates and increased irrigation needs
                  </div>
                  <div className="impact-item">
                    <strong>Ecosystem disruption:</strong> Urban wildlife and plant stress
                  </div>
                  <div className="impact-item">
                    <strong>Climate feedback:</strong> Cities contribute to regional warming
                  </div>
                </div>
              </div>
              
              <div className="importance-card economy">
                <h3>Economic Consequences</h3>
                <div className="impact-list">
                  <div className="impact-item">
                    <strong>Energy costs:</strong> Billions in additional cooling expenses annually
                  </div>
                  <div className="impact-item">
                    <strong>Productivity loss:</strong> Heat stress reduces worker efficiency
                  </div>
                  <div className="impact-item">
                    <strong>Infrastructure stress:</strong> Roads, railways, and buildings deteriorate faster
                  </div>
                  <div className="impact-item">
                    <strong>Healthcare burden:</strong> Rising costs for heat-related medical care
                  </div>
                </div>
              </div>
            </div>
            <div className="call-to-action-section">
              <div className="cta-content">
                <h3>Ready to Explore Urban Heat Patterns?</h3>  
                <button 
                  className="cta-button primary"
                  onClick={handleExploreClick}
                >
                  Start Your Analysis
                </button>
              </div>
            </div>
          </div>
        </div>

      </section>

      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          {modalType === 'login' ? (
            <LoginForm 
              onSuccess={handleAuthSuccess}
              onSwitchToRegister={() => setModalType('register')}
            />
          ) : (
            <RegisterForm 
              onSuccess={handleAuthSuccess}
              onSwitchToLogin={() => setModalType('login')}
            />
          )}
        </Modal>
      )}
    </div>
  );
};

export default Landing;