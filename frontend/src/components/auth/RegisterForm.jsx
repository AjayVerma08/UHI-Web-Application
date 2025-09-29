import React, { useState } from 'react';
import { register } from '../../services/auth';
import '../../styles/components.css';

const RegisterForm = ({ onSuccess, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
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
    if (!formData.name) {
      newErrors.name = 'Name is required';
    }
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      const response = await register(formData.name, formData.email, formData.password);
      
      if (response.success) {
        // Store token in localStorage
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        onSuccess();
      } else {
        setErrors({ general: response.error || 'Registration failed' });
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ 
        general: error.message || 'An error occurred during registration. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2 className="form-title">Create Account</h2>
      <p className="form-subtitle">Join CityHeatAtlas today</p>
      
      <form onSubmit={handleSubmit}>
        {errors.general && (
          <div className="form-error" style={{ marginBottom: '1rem', textAlign: 'center' }}>
            {errors.general}
          </div>
        )}
        <div className="form-group">
          <label htmlFor="register-name" className='form-label'>
            Name
          </label>
          <input 
            type="name"
            id='register-name'
            name='name'
            value={formData.name}
            onChange={handleChange}
            className={`form-input ${errors.name ? 'error' : ''} `} 
            placeholder='Enter your username'
            autoComplete='name'
            />
        </div>

        <div className="form-group">
          <label htmlFor="register-email" className="form-label">
            Email Address
          </label>
          <input
            type="email"
            id="register-email"
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
          <label htmlFor="register-password" className="form-label">
            Password
          </label>
          <input
            type="password"
            id="register-password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={`form-input ${errors.password ? 'error' : ''}`}
            placeholder="Create a password"
            autoComplete="new-password"
          />
          {errors.password && <div className="form-error">{errors.password}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="register-confirm-password" className="form-label">
            Confirm Password
          </label>
          <input
            type="password"
            id="register-confirm-password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
            placeholder="Confirm your password"
            autoComplete="new-password"
          />
          {errors.confirmPassword && <div className="form-error">{errors.confirmPassword}</div>}
        </div>

        <button 
          type="submit" 
          className="form-button"
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="spinner"></div>
              Creating Account...
            </>
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      <div className="form-switch">
        Already have an account?{' '}
        <span className="form-switch-link" onClick={onSwitchToLogin}>
          Sign in
        </span>
      </div>
    </div>
  );
};

export default RegisterForm;