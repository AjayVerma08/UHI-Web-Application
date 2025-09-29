import React, { useState } from 'react';
import { login } from '../../services/auth';
import '../../styles/components.css';

const LoginForm = ({ onSuccess, onSwitchToRegister }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await login(formData.email, formData.password);
      
      if (response.success) {
        // Store token in localStorage
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        onSuccess();
      } else {
        setErrors({ general: response.error || 'Login failed' });
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ 
        general: error.message || 'An error occurred during login. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2 className="form-title">Welcome Back</h2>
      <p className="form-subtitle">Sign in to your account</p>
      
      <form onSubmit={handleSubmit}>
        {errors.general && (
          <div className="form-error" style={{ marginBottom: '1rem', textAlign: 'center' }}>
            {errors.general}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="email" className="form-label">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`form-input ${errors.email ? 'error' : ''}`}
            placeholder="Enter your email"
            autoComplete="email"
          />
          {errors.email && <div className="form-error">{errors.email}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={`form-input ${errors.password ? 'error' : ''}`}
            placeholder="Enter your password"
            autoComplete="current-password"
          />
          {errors.password && <div className="form-error">{errors.password}</div>}
        </div>

        <button 
          type="submit" 
          className="form-button"
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="spinner"></div>
              Signing In...
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      <div className="form-switch">
        Don't have an account?{' '}
        <span className="form-switch-link" onClick={onSwitchToRegister}>
          Sign up
        </span>
      </div>
    </div>
  );
};

export default LoginForm;