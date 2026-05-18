import React, { useState } from 'react';
import Hero from './components/Hero';
import TokenModal from './components/TokenModal';
import Dashboard from './components/Dashboard';
import { AnimatePresence } from 'framer-motion';
import './index.css';

function App() {
  const [view, setView] = useState('hero'); // 'hero' | 'dashboard'
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleConnect = (token) => {
    console.log("Token connected:", token);
    setIsModalOpen(false);
    setView('dashboard');
  };

  return (
    <div>
      {view === 'hero' && (
        <Hero onGetStarted={() => setIsModalOpen(true)} />
      )}
      
      {view === 'dashboard' && (
        <Dashboard />
      )}

      <AnimatePresence>
        {isModalOpen && (
          <TokenModal 
            onClose={() => setIsModalOpen(false)} 
            onConnect={handleConnect} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
