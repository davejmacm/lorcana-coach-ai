import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZoomIn, X } from 'lucide-react';
import accountImg from '../assets/tokenScreenshots/account.PNG';
import apiTokensImg from '../assets/tokenScreenshots/API_tokens.PNG';
import copyTokenImg from '../assets/tokenScreenshots/copy_token.PNG';

const TokenModal = ({ onClose }) => {
  const [activeStep, setActiveStep] = useState(1);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getScreenshot = () => {
    switch (activeStep) {
      case 1: return accountImg;
      case 2: return apiTokensImg;
      case 3: return copyTokenImg;
      default: return accountImg;
    }
  };

  const steps = [
    { id: 1, text: "Open Duels.ink and access your account." },
    { id: 2, text: "Navigate to the 'API Tokens' section in your profile." },
    { id: 3, text: "Add any name you wish (e.g. 'Lorcana Coach AI'), then create it. Copy the token and paste it below." },
  ];

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <motion.div
          className="modal-content"
          onClick={e => e.stopPropagation()}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{
            maxWidth: '850px',
            width: '95%',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: isMobile ? '1.5rem' : '2rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0, fontSize: isMobile ? '1.5rem' : '1.8rem' }}>Connect Your Account</h2>
            <button 
              onClick={onClose} 
              style={{ background: 'transparent', border: 'none', color: '#a0aec0', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
          </div>

          <div style={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row', 
            gap: '1.5rem', 
            margin: '1.5rem 0',
            alignItems: 'stretch'
          }}>
            {/* Step Instructions */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {steps.map(step => (
                <div
                  key={step.id}
                  onMouseEnter={() => !isMobile && setActiveStep(step.id)}
                  onClick={() => setActiveStep(step.id)}
                  style={{
                    padding: '1rem',
                    background: activeStep === step.id ? 'rgba(142, 45, 226, 0.2)' : 'rgba(255,255,255,0.03)',
                    borderLeft: activeStep === step.id ? '4px solid #8e2de2' : '4px solid transparent',
                    cursor: 'pointer',
                    borderRadius: '0 8px 8px 0',
                    transition: 'all 0.2s',
                    fontSize: isMobile ? '0.9rem' : '1rem'
                  }}
                >
                  <strong>Step {step.id}:</strong> {step.text}
                </div>
              ))}
            </div>

            {/* Interactive Responsive Image Container with Zoom hint */}
            <div 
              onClick={() => setIsZoomed(true)}
              style={{ 
                flex: 1, 
                background: 'rgba(0,0,0,0.3)', 
                borderRadius: '8px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                border: '1px solid rgba(255,255,255,0.1)', 
                padding: '0.75rem', 
                height: isMobile ? '220px' : '280px',
                position: 'relative',
                cursor: 'zoom-in',
                overflow: 'hidden'
              }}
            >
              <img 
                src={getScreenshot()} 
                alt={`Step ${activeStep} instruction`} 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'contain', 
                  borderRadius: '4px',
                  transition: 'transform 0.2s' 
                }}
              />
              {/* Zoom badge overlay */}
              <div style={{
                position: 'absolute',
                bottom: '8px',
                right: '8px',
                background: 'rgba(15, 12, 41, 0.85)',
                border: '1px solid rgba(255,255,255,0.2)',
                padding: '4px 8px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
                color: '#e2e8f0',
                pointerEvents: 'none'
              }}>
                <ZoomIn size={12} />
                <span>Click to expand</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', marginTop: '2rem', justifyContent: 'center' }}>
            <button 
              className="btn-primary" 
              onClick={onClose}
              style={{ width: '100%', maxWidth: '300px' }}
            >
              Understood
            </button>
          </div>
        </motion.div>
      </div>

      {/* Lightbox / Zoom overlay */}
      <AnimatePresence>
        {isZoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsZoomed(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(0, 0, 0, 0.9)',
              zIndex: 2000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'zoom-out',
              padding: '2rem'
            }}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              style={{ position: 'relative', maxWidth: '95vw', maxHeight: '90vh' }}
            >
              <img
                src={getScreenshot()}
                alt={`Step ${activeStep} high res`}
                style={{
                  maxWidth: '100%',
                  maxHeight: '90vh',
                  objectFit: 'contain',
                  borderRadius: '8px',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }}
              />
              <button
                onClick={() => setIsZoomed(false)}
                style={{
                  position: 'absolute',
                  top: '-40px',
                  right: 0,
                  background: 'transparent',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 600
                }}
              >
                <X size={20} /> Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default TokenModal;
