import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, LogOut, ChevronDown, ChevronUp, Activity, Target, 
  Shuffle, Shield, Sword, AlertCircle, Clock, TrendingUp, Award
} from 'lucide-react';
import CoachAnalysisTabs from './CoachAnalysisTabs';

const inkColors = {
  Amber: { name: 'Amber', color: '#ffb300', bg: 'rgba(255,179,0,0.15)', border: 'rgba(255,179,0,0.4)' },
  Amethyst: { name: 'Amethyst', color: '#ab47bc', bg: 'rgba(171,71,188,0.15)', border: 'rgba(171,71,188,0.4)' },
  Emerald: { name: 'Emerald', color: '#2ec4b6', bg: 'rgba(46,196,182,0.15)', border: 'rgba(46,196,182,0.4)' },
  Ruby: { name: 'Ruby', color: '#e71d36', bg: 'rgba(231,29,54,0.15)', border: 'rgba(231,29,54,0.4)' },
  Sapphire: { name: 'Sapphire', color: '#118ab2', bg: 'rgba(17,138,178,0.15)', border: 'rgba(17,138,178,0.4)' },
  Steel: { name: 'Steel', color: '#90a4ae', bg: 'rgba(144,164,174,0.15)', border: 'rgba(144,164,174,0.4)' }
};

const getDirectiveIcon = (iconName) => {
  switch (iconName?.toLowerCase()) {
    case 'shuffle': return <Shuffle size={20} />;
    case 'shield': return <Shield size={20} />;
    case 'sword': return <Sword size={20} />;
    case 'activity': return <Activity size={20} />;
    case 'target': return <Target size={20} />;
    default: return <Target size={20} />;
  }
};

const Dashboard = ({ token, onDisconnect }) => {
  const [decks, setDecks] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedDeck, setSelectedDeck] = useState(null);
  const [deckAnalysis, setDeckAnalysis] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [errorAnalysis, setErrorAnalysis] = useState(null);

  const [expandedMatch, setExpandedMatch] = useState(null);

  // Fetch match history and decks on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
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
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // Fetch deck analysis when selection changes
  useEffect(() => {
    if (!selectedDeck) {
      setDeckAnalysis(null);
      return;
    }

    const fetchAnalysis = async () => {
      setLoadingAnalysis(true);
      setErrorAnalysis(null);
      try {
        const res = await fetch(`/api/decks/${selectedDeck}/analysis`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
          throw new Error(`Failed to load deck analysis (HTTP ${res.status})`);
        }
        const data = await res.json();
        setDeckAnalysis(data);
      } catch (err) {
        setErrorAnalysis(err.message);
      } finally {
        setLoadingAnalysis(false);
      }
    };

    fetchAnalysis();
  }, [selectedDeck, token]);

  const handleDeckClick = (deckId) => {
    setSelectedDeck(selectedDeck === deckId ? null : deckId);
  };

  const renderColorBadges = (colors) => {
    if (!colors) return null;
    return (
      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
        {colors.map(col => {
          const style = inkColors[col] || { color: '#ffffff', bg: 'rgba(255,255,255,0.1)', border: 'rgba(255,255,255,0.2)' };
          return (
            <span key={col} style={{
              fontSize: '0.7rem',
              padding: '2px 8px',
              borderRadius: '4px',
              background: style.bg,
              border: `1px solid ${style.border}`,
              color: style.color,
              fontWeight: 'bold',
              letterSpacing: '0.5px'
            }}>
              {col}
            </span>
          );
        })}
      </div>
    );
  };

  const getFilteredMatches = () => {
    if (!selectedDeck) return matches;
    const selected = decks.find(d => d.id === selectedDeck);
    if (!selected) return matches;
    return matches.filter(m => {
      const colorsMatch = m.your_deck_colors === selected.colors.join('/');
      const formatMatch = selected.format ? (m.format_type === 'infinity' ? 'Infinity' : 'Core') === selected.format : true;
      return colorsMatch && formatMatch;
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#a0aec0' }}>
        <Loader2 className="animate-spin" size={48} style={{ color: '#b388ff', marginBottom: '1rem' }} />
        <h3>Gathering match data from Duels.ink...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '600px', margin: '10vh auto', padding: '2rem', textAlign: 'center', background: 'rgba(255,23,68,0.1)', borderRadius: '16px', border: '1px solid rgba(255,23,68,0.2)' }}>
        <h2 style={{ color: '#ff1744' }}>Connection Failed</h2>
        <p style={{ color: '#a0aec0', margin: '1rem 0 2rem 0' }}>{error}</p>
        <button onClick={onDisconnect} style={{ background: '#ff1744', border: 'none', color: 'white', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          Back to Login
        </button>
      </div>
    );
  }

  const filteredMatches = getFilteredMatches();
  const selectedDeckObj = decks.find(d => d.id === selectedDeck);

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', minHeight: '100vh' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', margin: 0, background: '-webkit-linear-gradient(#fff, #a0aec0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            strategic companion tool
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#a0aec0', fontSize: '0.9rem' }}>Illumineer's journal & analysis portal</p>
        </div>
        <button 
          onClick={onDisconnect} 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#a0aec0', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          <LogOut size={16} /> Disconnect
        </button>
      </header>

      {/* Decks Grid */}
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#cbd5e1' }}>Your Library</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        {decks.map(deck => {
          const isSelected = selectedDeck === deck.id;
          return (
            <motion.div 
              key={deck.id}
              whileHover={{ y: -5, boxShadow: isSelected ? '0 10px 25px rgba(142, 45, 226, 0.4)' : '0 10px 20px rgba(0,0,0,0.3)' }}
              onClick={() => handleDeckClick(deck.id)}
              style={{
                padding: '1.5rem',
                background: isSelected ? 'rgba(142, 45, 226, 0.2)' : 'rgba(255,255,255,0.03)',
                border: isSelected ? '2px solid #8e2de2' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', color: '#f8fafc' }}>{deck.name}</h3>
              {renderColorBadges(deck.colors)}
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a0aec0', marginTop: '1.5rem', fontSize: '0.9rem' }}>
                <span style={{display: 'flex', alignItems: 'center', gap: '0.4rem'}}><Target size={16}/> {deck.winRate} WR</span>
                <span style={{display: 'flex', alignItems: 'center', gap: '0.4rem'}}><Activity size={16}/> {deck.matches} Matches</span>
              </div>
            </motion.div>
          );
        })}
        {decks.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: '#a0aec0', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
            No decks detected in your match history.
          </div>
        )}
      </div>

      {/* Deck details section */}
      <AnimatePresence>
        {selectedDeck && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden', marginBottom: '3rem' }}
          >
            <div style={{ background: 'rgba(15, 12, 41, 0.5)', borderRadius: '16px', padding: '2rem', border: '1px solid rgba(142, 45, 226, 0.25)', backdropFilter: 'blur(12px)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, color: '#f8fafc' }}>Deck Performance: {selectedDeckObj?.name}</h3>
                <button onClick={() => setSelectedDeck(null)} style={{ background: 'transparent', border: 'none', color: '#a0aec0', cursor: 'pointer', fontSize: '0.9rem' }}>
                  Close Analysis
                </button>
              </div>

              {loadingAnalysis ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem', color: '#a0aec0' }}>
                  <Loader2 className="animate-spin" size={32} style={{ color: '#b388ff', marginBottom: '1rem' }} />
                  <span>Coach is compiling deck statistics...</span>
                </div>
              ) : errorAnalysis ? (
                <div style={{ color: '#ff1744', padding: '1.5rem', background: 'rgba(255,23,68,0.05)', borderRadius: '8px', border: '1px solid rgba(255,23,68,0.1)' }}>
                  Error compiling analysis: {errorAnalysis}
                </div>
              ) : deckAnalysis?.status === 'need_more_data' ? (
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1.5rem', background: 'rgba(179,136,255,0.1)', borderRadius: '12px', border: '1px solid rgba(179,136,255,0.2)' }}>
                  <AlertCircle size={36} style={{ color: '#b388ff', flexShrink: 0 }} />
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', color: '#e8eaf6' }}>Study in Progress</h4>
                    <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.5' }}>
                      Not enough games logged with <strong>{selectedDeckObj?.name}</strong>. Play at least 3 games on Duels.ink with this deck so the Coach can analyze your playstyle. (Currently: {deckAnalysis.match_count} games).
                    </p>
                  </div>
                </div>
              ) : deckAnalysis ? (
                <div>
                  {/* Strategic Tags */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    {deckAnalysis.tags?.map(tag => (
                      <span key={tag} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    {/* Performance Metrics Card */}
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <h4 style={{ marginTop: 0, marginBottom: '1rem', color: '#b388ff', fontSize: '1.1rem' }}>Performance Metrics</h4>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                          <div style={{ fontSize: '0.8rem', color: '#a0aec0' }}>Personal Win Rate</div>
                          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#00e676', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                            {deckAnalysis.metrics?.personal_win_rate}
                            <span style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 'normal' }}>
                              ({deckAnalysis.metrics?.win_rate_delta} delta)
                            </span>
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.8rem', color: '#a0aec0' }}>Metagame Win Rate</div>
                          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#cbd5e1' }}>{deckAnalysis.metrics?.meta_win_rate}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.8rem', color: '#a0aec0' }}>Avg Match Duration</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#e2e8f0', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={16}/> {deckAnalysis.metrics?.avg_match_duration}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.8rem', color: '#a0aec0' }}>Ink Efficiency (Turns 1-5)</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#e2e8f0', marginTop: '4px' }}>
                            {deckAnalysis.metrics?.ink_efficiency?.label}
                          </div>
                        </div>
                      </div>

                      {/* Win Condition Timeline (Progress Bars) */}
                      <h5 style={{ margin: '1.5rem 0 0.5rem 0', color: '#a0aec0', fontSize: '0.9rem' }}>Win-Condition Timeline</h5>
                      {deckAnalysis.win_condition_timeline && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {Object.entries(deckAnalysis.win_condition_timeline).map(([key, val]) => (
                            <div key={key}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px' }}>
                                <span>{val.label}</span>
                                <span>{val.percentage}%</span>
                              </div>
                              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{
                                  width: `${val.percentage}%`,
                                  height: '100%',
                                  background: key === 'early' ? '#00e676' : key === 'mid' ? '#2979ff' : '#8e2de2',
                                  borderRadius: '3px'
                                }}></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Meta Positioning Card */}
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' }}>
                      <h4 style={{ marginTop: 0, marginBottom: '1rem', color: '#b388ff', fontSize: '1.1rem' }}>Meta Positioning</h4>
                      <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6', margin: 0, flex: 1 }}>
                        {deckAnalysis.meta_performance_breakdown}
                      </p>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(142,45,226,0.1)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid rgba(142,45,226,0.2)', marginTop: '1.5rem' }}>
                        <Award size={20} style={{ color: '#b388ff', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Pacing Profile: <strong>{deckAnalysis.metrics?.pacing_label}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Coaching Directives */}
                  <h4 style={{ margin: '0 0 1rem 0', color: '#cbd5e1', fontSize: '1.2rem' }}>Tactical Coaching Directives</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                    {deckAnalysis.coaching_directives?.map((dir, i) => (
                      <div key={i} style={{ display: 'flex', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ background: 'rgba(142,45,226,0.15)', color: '#b388ff', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'fit-content' }}>
                          {getDirectiveIcon(dir.icon)}
                        </div>
                        <div>
                          <strong style={{ color: '#a0aec0', fontSize: '0.8rem', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>{dir.type}</strong>
                          <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.5' }}>{dir.instruction}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Match History */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.5rem', margin: 0, color: '#cbd5e1' }}>
          {selectedDeck ? `Recent Matches: ${selectedDeckObj?.name}` : 'Recent Matches (All Decks)'}
        </h2>
        {selectedDeck && (
          <button 
            onClick={() => setSelectedDeck(null)}
            style={{ background: 'transparent', border: 'none', color: '#b388ff', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}
          >
            Clear Deck Filter
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredMatches.map(match => {
          const isWin = match.result?.toLowerCase() === 'win';
          const isExpanded = expandedMatch === match.game_id;
          
          return (
            <div key={match.game_id} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div 
                onClick={() => setExpandedMatch(isExpanded ? null : match.game_id)}
                style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', flexWrap: 'wrap', gap: '1rem' }}
              >
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ 
                    color: isWin ? '#00e676' : '#ff1744', 
                    background: isWin ? 'rgba(0,230,118,0.1)' : 'rgba(255,23,68,0.1)', 
                    padding: '4px 12px', 
                    borderRadius: '20px', 
                    fontSize: '0.85rem', 
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  }}>
                    {isWin ? 'Win' : 'Loss'}
                  </span>
                  <div>
                    <span style={{ color: '#e2e8f0', fontWeight: 'bold' }}>vs {match.opp_display_name}</span>
                    <div style={{ fontSize: '0.75rem', color: '#a0aec0', marginTop: '2px' }}>
                      Opponent: {match.opp_deck_colors || 'Unknown deck'} • Format: {match.format_type?.toUpperCase()}
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{ textAlign: 'right', fontSize: '0.85rem', color: '#a0aec0', display: 'none', sm: 'block' }}>
                    <div>{match.turns} Turns</div>
                    <div style={{ fontSize: '0.7rem', marginTop: '2px' }}>
                      {match.your_deck_colors}
                    </div>
                  </div>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedMatch(isExpanded ? null : match.game_id);
                    }}
                    style={{ 
                      background: 'rgba(142, 45, 226, 0.1)', 
                      border: '1px solid #8e2de2', 
                      color: 'white', 
                      padding: '8px 16px', 
                      borderRadius: '6px', 
                      cursor: 'pointer', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      transition: 'all 0.2s'
                    }}
                  >
                    Coach Analysis {isExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                  </button>
                </div>
              </div>
              
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ padding: '0 1.5rem 1.5rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <CoachAnalysisTabs gameId={match.game_id} token={token} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
        {filteredMatches.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#a0aec0', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
            No matches found for this selection.
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
