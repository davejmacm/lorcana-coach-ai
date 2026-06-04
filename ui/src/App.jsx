import React, { useState, useEffect } from 'react';
import Hero from './components/Hero';
import TokenModal from './components/TokenModal';
import Dashboard from './components/Dashboard';
import { AnimatePresence } from 'framer-motion';
import './index.css';

function App() {
  const [view, setView] = useState('hero'); // 'hero' | 'dashboard'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [token, setToken] = useState(() => localStorage.getItem('duels_ink_token') || '');

  useEffect(() => {
    if (token) {
      setView('dashboard');
    }
  }, [token]);

  const handleConnect = (newToken) => {
    console.log("Token connected:", newToken);
    localStorage.setItem('duels_ink_token', newToken);
    setToken(newToken);
    setIsModalOpen(false);
    setView('dashboard');
  };

  const handleDisconnect = () => {
    localStorage.removeItem('duels_ink_token');
    setToken('');
    setView('hero');
  };

  return (
    <div>
      {view === 'hero' && (
        <Hero onGetStarted={() => setIsModalOpen(true)} />
      )}
      
      {view === 'dashboard' && (
        <Dashboard token={token} onDisconnect={handleDisconnect} />
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
