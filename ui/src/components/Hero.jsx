import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import heroVideo from '../assets/heroAssets/LorcanaCoachAIHero.mp4';
import heroFallback from '../assets/heroAssets/staticHeroBGCards.jpeg';
import '../index.css';

const Hero = ({ onGetStarted }) => {
  const [useVideo, setUseVideo] = useState(true);

  useEffect(() => {
    // Fallback to static image on small viewports for battery/bandwidth efficiency
    const checkViewport = () => {
      if (window.innerWidth < 768) {
        setUseVideo(false);
      } else {
        setUseVideo(true);
      }
    };
    
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      background: '#0f0c29'
    }}>
      {/* Background Media */}
      {useVideo ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          poster={heroFallback}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 1
          }}
          onError={() => setUseVideo(false)}
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
      ) : (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: `url(${heroFallback})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            zIndex: 1
          }}
        />
      )}

      {/* Visual Overlay for readability */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(15, 12, 41, 0.45)',
        zIndex: 2
      }} />

      {/* Hero content overlayed top-middle */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        style={{
          position: 'relative',
          zIndex: 3,
          textAlign: 'center',
          padding: '2rem',
          maxWidth: '650px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem'
        }}
      >
        <h1 style={{
          fontSize: '3rem',
          fontWeight: 'bold',
          color: '#ffffff',
          textShadow: '0 0 25px rgba(142, 45, 226, 0.7)',
          margin: 0,
          letterSpacing: '2px'
        }}>
          Lorcana Coach AI
        </h1>
        <p style={{
          fontSize: '1.15rem',
          color: '#e2e8f0',
          margin: '0 0 1rem 0',
          textShadow: '0 2px 4px rgba(0,0,0,0.6)',
          maxWidth: '500px',
          lineHeight: '1.6'
        }}>
          Enhance your gameplay, eliminate mechanical errors, and master the meta with advanced match reviews.
        </p>

        {/* Pulsing Glowing Button */}
        <motion.button
          onClick={onGetStarted}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={{
            boxShadow: [
              "0 0 15px rgba(142, 45, 226, 0.5)",
              "0 0 30px rgba(142, 45, 226, 0.9)",
              "0 0 15px rgba(142, 45, 226, 0.5)"
            ]
          }}
          transition={{
            repeat: Infinity,
            duration: 2.5,
            ease: "easeInOut"
          }}
          style={{
            fontSize: '1.25rem',
            padding: '16px 44px',
            borderRadius: '50px',
            border: 'none',
            color: '#ffffff',
            background: 'linear-gradient(90deg, #8e2de2, #4a00e0)',
            cursor: 'pointer',
            fontWeight: 'bold',
            boxShadow: '0 0 15px rgba(142, 45, 226, 0.5)'
          }}
        >
          Connect Your Account
        </motion.button>
      </motion.div>
    </div>
  );
};

export default Hero;
