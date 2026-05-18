import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import '../index.css';

const Hero = ({ onGetStarted }) => {
  const cards = [
    { id: 1, text: "Gain Powerful Insights", color: "#8e2de2" },
    { id: 2, text: "Gameplay Analysis", color: "#4a00e0" },
    { id: 3, text: "Automated Match Logs", color: "#24243e" },
  ];

  return (
    <div className="hero-container">
      <div className="cards-container">
        {cards.map((card, index) => (
          <motion.div
            key={card.id}
            className="card"
            style={{ 
              background: `linear-gradient(145deg, rgba(255,255,255,0.1), ${card.color})`,
              zIndex: 10 - index
            }}
            initial={{ 
              rotateX: 60, 
              rotateZ: -45, 
              y: index * -20, 
              x: index * -20,
              opacity: 0 
            }}
            animate={{ 
              rotateX: 0, 
              rotateZ: 0, 
              x: index === 0 ? -200 : index === 1 ? 0 : 200,
              y: index === 1 ? -50 : 50,
              opacity: 1
            }}
            transition={{ 
              duration: 1, 
              delay: 0.5 + index * 0.4,
              type: "spring",
              bounce: 0.4
            }}
          >
            {card.text}
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.5, duration: 0.8 }}
      >
        <button className="btn-primary" onClick={onGetStarted}>
          Connect Your Account
        </button>
      </motion.div>
    </div>
  );
};

export default Hero;
