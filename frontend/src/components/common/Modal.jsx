import React, { useEffect } from 'react';
import '../../styles/components.css';

const Modal = ({ children, onClose, title }) => {
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (event) => {
      if (event.target.classList.contains('modal-overlay')) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('click', handleClickOutside);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('click', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button 
          className="modal-close" 
          onClick={onClose}
          aria-label="Close modal"
        >
          ×
        </button>
        {title && <h2 className="modal-title">{title}</h2>}
        {children}
      </div>
    </div>
  );
};

export default Modal;