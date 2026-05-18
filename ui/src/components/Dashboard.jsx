import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Activity, Target } from 'lucide-react';
import CoachAnalysisTabs from './CoachAnalysisTabs';

const Dashboard = () => {
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [expandedMatch, setExpandedMatch] = useState(null);

  const decks = [
    { id: 'sapphire-steel', name: 'Sapphire/Steel', winRate: '68%', matches: 12 },
    { id: 'amethyst-emerald', name: 'Amethyst/Emerald', winRate: '54%', matches: 8 },
    { id: 'amber-steel', name: 'Amber/Steel Aggro', winRate: '71%', matches: 15 }
  ];

  const recentMatches = [
    { id: 'game_001', opponent: 'Da_merk', oppDeck: 'Amber/Steel Aggro', result: 'Win', turns: 7 },
    { id: 'game_002', opponent: 'Geo', oppDeck: 'Amethyst/Ruby Control', result: 'Loss', turns: 12 },
    { id: 'game_003', opponent: 'LorcanaMaster', oppDeck: 'Sapphire/Emerald', result: 'Win', turns: 9 }
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', background: '-webkit-linear-gradient(#fff, #a0aec0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Coach Dashboard
        </h1>
      </header>

      {/* Deck Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        {decks.map(deck => (
          <motion.div 
            key={deck.id}
            whileHover={{ y: -5, boxShadow: '0 10px 25px rgba(142, 45, 226, 0.4)' }}
            onClick={() => setSelectedDeck(deck.id)}
            style={{
              padding: '1.5rem',
              background: selectedDeck === deck.id ? 'rgba(142, 45, 226, 0.3)' : 'rgba(255,255,255,0.05)',
              border: selectedDeck === deck.id ? '1px solid #8e2de2' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <h3 style={{ margin: '0 0 1rem 0' }}>{deck.name}</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a0aec0' }}>
              <span style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><Target size={18}/> {deck.winRate} WR</span>
              <span style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><Activity size={18}/> {deck.matches} Matches</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Deck Details & Match History */}
      <AnimatePresence>
        {selectedDeck && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '16px', padding: '2rem', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px' }}>
                  <h4 style={{marginTop: 0, color: '#b388ff'}}>Overall Analysis</h4>
                  <div style={{ width: '100px', height: '100px', borderRadius: '50%', border: '8px solid #8e2de2', borderTopColor: '#4a00e0', margin: '1rem auto' }}></div>
                  <p style={{textAlign: 'center', color: '#a0aec0', fontSize: '0.9rem'}}>Win rate by matchup placeholder</p>
                </div>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px' }}>
                  <h4 style={{marginTop: 0, color: '#b388ff'}}>Top Improvements</h4>
                  <ul style={{ paddingLeft: '1rem', color: '#a0aec0', lineHeight: '1.6' }}>
                    <li>Mulligan aggressively for 1-drops against Emerald.</li>
                    <li>Hold AWNW until turn 6.</li>
                    <li>Avoid playing into Be Prepared on turn 7.</li>
                  </ul>
                </div>
              </div>

              <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Recent Matches</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {recentMatches.map(match => (
                  <div key={match.id} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div 
                      onClick={() => setExpandedMatch(expandedMatch === match.id ? null : match.id)}
                      style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                    >
                      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                        <span style={{ color: match.result === 'Win' ? '#00e676' : '#ff1744', fontWeight: 'bold' }}>{match.result}</span>
                        <span>vs <strong>{match.opponent}</strong></span>
                        <span style={{ color: '#a0aec0', fontSize: '0.9rem' }}>({match.oppDeck})</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ color: '#a0aec0', fontSize: '0.9rem' }}>{match.turns} Turns</span>
                        <button style={{ background: 'rgba(142, 45, 226, 0.2)', border: '1px solid #8e2de2', color: 'white', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          Coach Analysis {expandedMatch === match.id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                        </button>
                      </div>
                    </div>
                    
                    <AnimatePresence>
                      {expandedMatch === match.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div style={{ padding: '0 1.5rem 1.5rem 1.5rem' }}>
                            <CoachAnalysisTabs />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
