import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import Hero from './components/Hero';
import TokenModal from './components/TokenModal';
import Dashboard from './components/Dashboard';
import LorebookReview from './components/LorebookReview';
import CoachAnalysisTabs from './components/CoachAnalysisTabs';
import Login from './components/Login';
import SignUp from './components/SignUp';
import './index.css';

function App() {
  const [view, setView] = useState(() => localStorage.getItem('duels_ink_token') ? 'dashboard' : 'landing');
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [token, setToken] = useState(() => localStorage.getItem('duels_ink_token') || '');

  const [decks, setDecks] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [errorData, setErrorData] = useState(null);

  const [selectedDeckId, setSelectedDeckId] = useState(null);
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [previousView, setPreviousView] = useState('dashboard');
  const [rateLimitType, setRateLimitType] = useState('none'); // 'none' | 'rpm' | 'rpd'
  const [cooldownTime, setCooldownTime] = useState(0);

  // Cooldown countdown timer for minute-level rate limits
  useEffect(() => {
    if (rateLimitType === 'rpm' && cooldownTime > 0) {
      const timer = setTimeout(() => {
        setCooldownTime(prev => {
          if (prev <= 1) {
            setRateLimitType('none');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [rateLimitType, cooldownTime]);

  const handleRateLimitHit = (isDaily) => {
    if (isDaily) {
      setRateLimitType('rpd');
    } else {
      setRateLimitType('rpm');
      setCooldownTime(60);
    }
  };

  // Fetch match history and decks when token is set/changed
  useEffect(() => {
    if (!token) return;

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
        setErrorData(err.message || 'Connection failed.');
        setView('landing');
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [token]);

  const handleRegisterSubmit = async (username, email, password, newToken) => {
    setLoadingData(true);
    setErrorData(null);
    try {
      console.log("Validating token for registration...");
      const [decksRes, matchesRes] = await Promise.all([
        fetch('/api/decks', { headers: { 'Authorization': `Bearer ${newToken}` } }),
        fetch('/api/matches', { headers: { 'Authorization': `Bearer ${newToken}` } })
      ]);

      if (!decksRes.ok || !matchesRes.ok) {
        throw new Error('Failed to connect. Make sure your FastAPI backend is running and the token is correct.');
      }

      const decksData = await decksRes.json();
      const matchesData = await matchesRes.json();

      // Retrieve existing simulated user database
      const users = JSON.parse(localStorage.getItem('illumineer_users') || '{}');
      users[email.trim().toLowerCase()] = {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password: password,
        token: newToken
      };

      // Save user database and active credentials
      localStorage.setItem('illumineer_users', JSON.stringify(users));
      localStorage.setItem('duels_ink_token', newToken);

      setDecks(decksData);
      setMatches(matchesData.matches || []);
      setToken(newToken);
      setView('dashboard');
    } catch (err) {
      setErrorData(err.message || 'FastAPI backend is offline or token is invalid.');
    } finally {
      setLoadingData(false);
    }
  };

  const handleLoginSubmit = (newToken) => {
    localStorage.setItem('duels_ink_token', newToken);
    setToken(newToken);
    setView('dashboard');
  };

  const handleDisconnect = () => {
    localStorage.removeItem('duels_ink_token');
    setToken('');
    setDecks([]);
    setMatches([]);
    setSelectedDeckId(null);
    setSelectedMatchId(null);
    setView('landing');
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
      {view === 'landing' && (
        <Hero 
          onGetStarted={() => { setErrorData(null); setView('signup'); }} 
          onNavigateToLogin={() => { setErrorData(null); setView('login'); }}
          onShowHelp={() => setIsHelpOpen(true)}
        />
      )}

      {view === 'login' && (
        <Login 
          onLogin={handleLoginSubmit} 
          onNavigateToSignUp={() => { setErrorData(null); setView('signup'); }}
        />
      )}

      {view === 'signup' && (
        <SignUp 
          onRegister={handleRegisterSubmit}
          onNavigateToLogin={() => { setErrorData(null); setView('login'); }}
          onShowHelp={() => setIsHelpOpen(true)}
          loading={loadingData}
          error={errorData}
          setError={setErrorData}
        />
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
          rateLimitType={rateLimitType}
          cooldownTime={cooldownTime}
          onRateLimitHit={handleRateLimitHit}
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
          rateLimitType={rateLimitType}
          cooldownTime={cooldownTime}
          onRateLimitHit={handleRateLimitHit}
        />
      )}

      {view === 'inkwell' && (
        <div style={{ padding: '2rem 3rem', background: 'var(--obsidian-base)', minHeight: '100vh' }}>
          <div className="starfield-bg" />
          <CoachAnalysisTabs 
            gameId={selectedMatchId} 
            token={token} 
            onBack={handleBackFromMatch} 
            rateLimitType={rateLimitType}
            cooldownTime={cooldownTime}
            onRateLimitHit={handleRateLimitHit}
          />
        </div>
      )}

      <AnimatePresence>
        {isHelpOpen && (
          <TokenModal 
            onClose={() => setIsHelpOpen(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
