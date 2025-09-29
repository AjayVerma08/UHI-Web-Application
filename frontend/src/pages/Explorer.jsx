import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/common/Header';
import MapContainer from '../components/map/MapContainer';
import Sidebar from '../components/sidebar/Sidebar';
import Modal from '../components/common/Modal';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import StatisticsPanel from '../components/map/StatisticsPanel';  
import { getCurrentUser, logout } from '../services/auth';
import '../styles/explorer.css';

const Explorer = () => {
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('login');
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: '2023-06-01',
    endDate: '2023-08-31'
  });
  const [selectedMetrics, setSelectedMetrics] = useState([]);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mapLayers, setMapLayers] = useState({});
  const [layers, setLayers] = useState(null);
  
  // New state for additional options
  const [additionalOptions, setAdditionalOptions] = useState([]);
  const [additionalLayers, setAdditionalLayers] = useState({});
  
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
  }, []);

  const handleAuthClick = (type) => {
    setModalType(type);
    setShowModal(true);
  };

  const handleAuthSuccess = () => {
    setShowModal(false);
    const currentUser = getCurrentUser();
    setUser(currentUser);
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    navigate('/');
  };

  const handleRegionSelect = (region) => {
    setSelectedRegion(region);
    console.log('Region selected:', region);
  };

  const handleDateRangeChange = (newDateRange) => {
    setDateRange(newDateRange);
  };

  const handleMetricsChange = (metrics) => {
    setSelectedMetrics(metrics);
  };

  const handleAdditionalOptionsChange = (options) => {
    setAdditionalOptions(options);
  };

  const handleAnalysisStart = async () => {
    if (!selectedRegion || selectedMetrics.length === 0) {
      alert('Please select a region and at least one metric');
      return;
    }

    setIsProcessing(true);
    try {
      // Process the analysis with your backend - hits /data endpoint
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/process/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          geometry: selectedRegion,
          metrics: selectedMetrics
        })
      });

      if (response.ok) {
        const results = await response.json();
        const tileUrlDict = {};
        results.layers.forEach(layer => {
          tileUrlDict[layer.id] = layer.tileUrl;
        });
        setLayers(results);
        console.log('Layers set:', results);
        setAnalysisResults(results);
        console.log('Analysis results:', results);
        setMapLayers(tileUrlDict);
        console.log('Analysis completed:', results);
      } else {
        throw new Error('Analysis failed');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Analysis failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateAdditionals = async () => {
    if (!selectedRegion || additionalOptions.length === 0) {
      alert('Please select additional options to generate');
      return;
    }

    setIsProcessing(true);
    try {
      // Hit the /additionals endpoint
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/process/additionals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          geometry: selectedRegion,
          options: additionalOptions,
          // You might need to pass year for population density
          year: new Date(dateRange.endDate).getFullYear()
        })
      });

      if (response.ok) {
        const additionalResults = await response.json();
        console.log('Additional results:', additionalResults);
        
        // Process additional layers and add them to map layers
        const newTileUrls = {};
        
        // Handle heat vulnerability zones  
        if (additionalResults.heatVulneratbiltyZones && additionalResults.heatVulneratbiltyZones.tileUrl) {
          newTileUrls.heatVulnerabilityZones = additionalResults.heatVulneratbiltyZones.tileUrl;
        }
        
        // Handle LULC 
        if (additionalResults.LULC && additionalResults.LULC.tileURL) {
          newTileUrls.lulc = additionalResults.LULC.tileURL;
        }
        
        // Merge with existing map layers
        setMapLayers(prev => ({
          ...prev,
          ...newTileUrls
        }));
        
        // Store additional layers data for potential downloads
        setAdditionalLayers(additionalResults);
        
        console.log('Additional layers added to map:', newTileUrls);
      } else {
        throw new Error('Additional data generation failed');
      }
    } catch (error) {
      console.error('Additional data error:', error);
      alert('Failed to generate additional layers. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="explorer-page">
      <Header 
        user={user}
        onAuthClick={handleAuthClick}
        onLogout={handleLogout}
      />
      
      <main className="explorer-main">
        <div className="explorer-content">
          <div className="map-section">
            <MapContainer 
              onRegionSelect={handleRegionSelect}
              selectedRegion={selectedRegion}
              mapLayers={mapLayers}
              analysisResults={analysisResults}
            />
            {!selectedRegion && (
            <div className='hover-container'>
              <div className='hover-button'>i</div>
              <div className="map-instructions">
                <ol>
                  <li>Click the "Draw Polygon" button on the map</li>
                  <li>Draw a polygon by clicking points on the map & double-click to finish</li>
                  <li>You can also upload your own shapefile/kml/GeoJSON as zip file</li>
                </ol>
                <div className="tips">
                  <p><strong>Tips:</strong></p>
                  <ul>
                    <li>Select summer months (June-August) for best UHI detection</li>
                    <li>Ensure your polygon covers both urban and rural areas</li>
                    <li>Smaller areas process faster than large regions</li>
                    <li>Cloud cover may affect results in some areas</li>
                    <li>To download results you need to login first</li>
                  </ul>
                </div>
              </div>
            </div>
            )}
          {analysisResults && Object.keys(mapLayers).length > 0 && (
            <StatisticsPanel layers={analysisResults.layers} />
          )}
          </div>
          
          <Sidebar 
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
            selectedMetrics={selectedMetrics}
            onMetricsChange={handleMetricsChange}
            onAnalysisStart={handleAnalysisStart}
            onGenerateAdditionals={handleGenerateAdditionals}
            isProcessing={isProcessing}
            analysisResults={analysisResults}
            additionalOptions={additionalOptions}
            onAdditionalOptionsChange={handleAdditionalOptionsChange}
            additionalLayers={additionalLayers}
            selectedRegion={selectedRegion}
            user={user}
          />
        </div>
      </main>

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

export default Explorer;