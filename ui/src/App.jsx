import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import Hero from './components/Hero';
import TokenModal from './components/TokenModal';
import Dashboard from './components/Dashboard';
import LorebookReview from './components/LorebookReview';
import CoachAnalysisTabs from './components/CoachAnalysisTabs';
import './index.css';

function App() {
  const [view, setView] = useState('hero'); // 'hero' | 'dashboard' | 'lorebook' | 'inkwell'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [token, setToken] = useState(() => localStorage.getItem('duels_ink_token') || '');

  const [decks, setDecks] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [errorData, setErrorData] = useState(null);

  const [selectedDeckId, setSelectedDeckId] = useState(null);
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [previousView, setPreviousView] = useState('dashboard');

  // Fetch match history and decks when token is set/changed
  useEffect(() => {
    if (!token) {
      setView('hero');
      return;
    }

    const fetchData = async () => {
      setLoadingData(true);
      setErrorData(null);
      try {
        const [decksRes, matchesRes] = await Promise.all([
          fetch('/api/decks', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/matches', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (!decksRes.ok || !matchesRes.ok) {
          throw new Error('Failed to retrieve user data from FastAPI backend.');
        }

        const decksData = await decksRes.json();
        const matchesData = await matchesRes.json();

        setDecks(decksData);
        setMatches(matchesData.matches || []);
        setView('dashboard');
      } catch (err) {
        setErrorData(err.message);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [token]);

  const handleConnect = (newToken) => {
    console.log("Token connected:", newToken);
    localStorage.setItem('duels_ink_token', newToken);
    setToken(newToken);
    setIsModalOpen(false);
  };

  const handleDisconnect = () => {
    localStorage.removeItem('duels_ink_token');
    setToken('');
    setDecks([]);
    setMatches([]);
    setSelectedDeckId(null);
    setSelectedMatchId(null);
    setView('hero');
  };

  const handleSelectDeck = (deckId) => {
    setSelectedDeckId(deckId);
    setView('lorebook');
  };

  const handleSelectMatch = (matchId) => {
    setSelectedMatchId(matchId);
    setPreviousView(view); // save current view to return to it
    setView('inkwell');
  };

  const handleBackFromMatch = () => {
    setView(previousView);
    setSelectedMatchId(null);
  };

  const handleBackToDashboard = () => {
    setSelectedDeckId(null);
    setView('dashboard');
  };

  return (
    <div>
      {view === 'hero' && (
        <Hero onGetStarted={() => setIsModalOpen(true)} />
      )}
      
      {view === 'dashboard' && (
        <Dashboard 
          token={token} 
          onDisconnect={handleDisconnect} 
          onSelectDeck={handleSelectDeck}
          onSelectMatch={handleSelectMatch}
          decks={decks}
          matches={matches}
          loading={loadingData}
          error={errorData}
        />
      )}

      {view === 'lorebook' && (
        <LorebookReview
          deckId={selectedDeckId}
          decks={decks}
          token={token}
          onSelectDeck={handleSelectDeck}
          onBackToDashboard={handleBackToDashboard}
          onSelectMatch={handleSelectMatch}
          matches={matches}
        />
      )}

      {view === 'inkwell' && (
        <div style={{ padding: '2rem 3rem', background: 'var(--obsidian-base)', minHeight: '100vh' }}>
          <div className="starfield-bg" />
          <CoachAnalysisTabs 
            gameId={selectedMatchId} 
            token={token} 
            onBack={handleBackFromMatch} 
          />
        </div>
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
