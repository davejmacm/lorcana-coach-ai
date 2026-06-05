import React from 'react';
import { motion } from 'framer-motion';
import { 
  LogOut, Target, Cpu, Trophy, BarChart3, Settings, 
  HelpCircle, Eye, CheckCircle, XCircle
} from 'lucide-react';
import DeckColorBadge from './DeckColorBadge';

const inkColors = {
  Amber: { color: '#ffb300', bg: 'rgba(255,179,0,0.12)' },
  Amethyst: { color: '#ab47bc', bg: 'rgba(171,71,188,0.12)' },
  Emerald: { color: '#2ec4b6', bg: 'rgba(46,196,182,0.12)' },
  Ruby: { color: '#e71d36', bg: 'rgba(231,29,54,0.12)' },
  Sapphire: { color: '#118ab2', bg: 'rgba(17,138,178,0.12)' },
  Steel: { color: '#90a4ae', bg: 'rgba(144,164,174,0.12)' }
};

const renderDiagonalBackground = (colors) => {
  if (!colors || colors.length === 0) {
    return <div style={{ background: 'var(--surface-container-highest)', width: '100%', height: '100%' }} />;
  }
  
  if (colors.length === 1) {
    const colName = colors[0].toLowerCase();
    const colObj = inkColors[colors[0]] || { color: '#8e2de2' };
    return (
      <div style={{
        backgroundImage: `url(/ink-icons/${colName}.png)`,
        backgroundSize: '120%',
        backgroundPosition: 'center',
        width: '100%',
        height: '100%'
      }} />
    );
  }
  
  const col1 = colors[0].toLowerCase();
  const col2 = colors[1].toLowerCase();
  const color1Hex = inkColors[colors[0]]?.color || '#00dbe9';
  const color2Hex = inkColors[colors[1]]?.color || '#7d01b1';
  
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* Left Ink Color Image */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url(/ink-icons/${col1}.png)`,
        backgroundSize: '120%',
        backgroundPosition: 'center',
        clipPath: 'polygon(0 0, 60% 0, 40% 100%, 0 100%)'
      }} />
      {/* Right Ink Color Image */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url(/ink-icons/${col2}.png)`,
        backgroundSize: '120%',
        backgroundPosition: 'center',
        clipPath: 'polygon(60% 0, 100% 0, 100% 100%, 40% 100%)'
      }} />
      {/* Middle Neon Divider Line */}
      <div style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: '50%',
        width: '2px',
        background: `linear-gradient(to bottom, ${color1Hex}, ${color2Hex})`,
        transform: 'translateX(-50%) rotate(16.5deg)',
        boxShadow: `0 0 12px ${color1Hex}, 0 0 12px ${color2Hex}`,
        zIndex: 2,
        opacity: 0.9
      }} />
    </div>
  );
};

const Dashboard = ({ token, onDisconnect, onSelectDeck, onSelectMatch, decks = [], matches = [], loading = false, error = null }) => {
  const [showAllDecks, setShowAllDecks] = React.useState(false);
  const [matchPage, setMatchPage] = React.useState(1);
  const matchesPerPage = 10;

  const calculateGlobalStats = () => {
    if (!matches || matches.length === 0) return { totalGames: 0, winRate: '0', wins: 0, losses: 0 };
    const wins = matches.filter(m => m.result?.toLowerCase() === 'win').length;
    const losses = matches.filter(m => m.result?.toLowerCase() === 'loss').length;
    const total = matches.length;
    const wr = total > 0 ? (wins / total * 100).toFixed(0) : '0';
    return { totalGames: total, winRate: wr, wins, losses };
  };

  const stats = calculateGlobalStats();

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--on-surface-variant)' }}>
        <Loader2 className="animate-spin" size={48} style={{ color: 'var(--primary-fixed-dim)', marginBottom: '1rem' }} />
        <h3>Gathering match data from Duels.ink...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '600px', margin: '15vh auto', padding: '2.5rem', textAlign: 'center', background: 'rgba(255,23,68,0.05)', borderRadius: '16px', border: '1px solid rgba(255,23,68,0.2)' }}>
        <h2 style={{ color: 'var(--error)', fontFamily: 'var(--font-headline)' }}>Connection Failed</h2>
        <p style={{ color: 'var(--on-surface-variant)', margin: '1rem 0 2rem 0', lineHeight: 1.6 }}>{error}</p>
        <button onClick={onDisconnect} className="btn-primary">
          Back to Login
        </button>
      </div>
    );
  }

  // Decks rendering logic
  const displayedDecks = showAllDecks ? decks : decks.slice(0, 4);

  // Pagination calculations
  const totalMatchPages = Math.ceil(matches.length / matchesPerPage);
  const paginatedMatches = matches.slice((matchPage - 1) * matchesPerPage, matchPage * matchesPerPage);

  return (
    <div style={{ padding: '0 0 3rem 0', minHeight: '100vh', background: 'var(--obsidian-base)', color: 'var(--on-surface)' }} className="animate-landing">
      <div className="starfield-bg" />

      {/* Slim Top Bar */}
      <header style={{
        width: '100%',
        background: 'rgba(5, 7, 10, 0.6)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--glass-stroke)',
        padding: '0.75rem 3rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 50,
        position: 'sticky',
        top: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1', color: 'var(--primary-fixed)', fontSize: '24px' }}>auto_stories</span>
          <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.25rem', fontWeight: '800', margin: 0, color: 'var(--primary-fixed)', tracking: '-0.02em' }}>
            The Library
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button 
            onClick={onDisconnect}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--on-surface-variant)',
              cursor: 'pointer',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontFamily: 'var(--font-technical)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--on-surface-variant)'}
          >
            <LogOut size={14} /> Disconnect
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '1px solid var(--glass-stroke)', paddingLeft: '16px' }}>
            <Settings size={18} style={{ color: 'var(--on-surface-variant)', cursor: 'pointer' }} />
            <img 
              alt="User Avatar" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAM1h6cU1QWo-AEPoCCjvKDPQhJrIfX8wvTEU-9KKWQReC7Tl3RUcggpNQOlSEf8BaE9BQs_nq24O8XHDAnWA2Iq3c8PSbSYKyS0AqOlLU5EDDeWCtDRaL2Rftq15vcpMRuZ4hZx0tEqf1dBFfMaa7LBbEKP9juX8sxq-zH079EGjJg5Bn1o-sA5Q6gEB7Iqyhwe3GMjNnV3wLIh_1w_zvuapq0g6MXRUH4Q7rbkMezxxC5ms9BQrlBo0-elxV_eYfZpaIGV8TbmtsV"
              style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid rgba(125, 244, 255, 0.3)' }}
            />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2.5rem 3rem 0 3rem' }}>
        
        {/* Title Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }} className="stagger-item stagger-1">
          <div>
            <h2 className="gradient-text" style={{ fontFamily: 'var(--font-headline)', fontSize: '2.5rem', fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-0.01em' }}>
              Command Center
            </h2>
            <p style={{ margin: 0, color: 'var(--on-surface-variant)', fontSize: '1rem', maxW: '600px', lineHeight: 1.5 }}>
              Analyze your Lorcana gameplay data, review AI insights, and refine your decks within the Great Illuminary's Library.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              background: 'var(--surface-container-high)',
              border: '1px solid var(--glass-stroke)'
            }}>
              <span style={{ 
                width: '8px', 
                height: '8px', 
                background: 'var(--primary-fixed)', 
                borderRadius: '50%', 
                boxShadow: '0 0 10px #7df4ff',
                display: 'inline-block'
              }} className="animate-pulse" />
              <span style={{ fontFamily: 'var(--font-technical)', fontSize: '0.75rem', color: 'var(--on-surface)', fontWeight: 500 }}>
                System Online
              </span>
            </div>
          </div>
        </div>

        {/* Performance Bento Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '3rem' }} className="stagger-item stagger-2">
          
          {/* Bento Card 1 */}
          <div className="glass-panel shimmer-effect" style={{ padding: '1.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', height: '140px', justifyContent: 'space-between' }}>
            <p style={{ fontFamily: 'var(--font-technical)', fontSize: '0.7rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '1px', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--primary-fixed)' }}>swords</span> Total Games
            </p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-headline)' }}>
                {stats.totalGames}
              </h3>
              <span style={{ fontFamily: 'var(--font-technical)', fontSize: '0.75rem', color: 'var(--primary-fixed)' }}>+12 this week</span>
            </div>
          </div>

          {/* Bento Card 2 */}
          <div className="glass-panel shimmer-effect" style={{ padding: '1.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', height: '140px', justifyContent: 'space-between' }}>
            <p style={{ fontFamily: 'var(--font-technical)', fontSize: '0.7rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '1px', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--secondary)' }}>emoji_events</span> Win Rate
            </p>
            <h3 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-headline)' }}>
              {stats.winRate}%
            </h3>
            <div style={{ width: '100%', height: '4px', background: 'var(--surface-container-highest)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: `${stats.winRate}%`, height: '100%', background: 'var(--secondary-fixed)', boxShadow: '0 0 10px rgba(246, 217, 255, 0.5)' }} />
            </div>
          </div>

          {/* Bento Card 3 */}
          <div className="glass-panel shimmer-effect" style={{ padding: '1.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', height: '140px', justifyContent: 'space-between', borderColor: 'rgba(0,240,255,0.2)' }}>
            <p style={{ fontFamily: 'var(--font-technical)', fontSize: '0.7rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '1px', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--primary-fixed-dim)' }}>psychology</span> AI Insights Status
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', width: '100%' }}>
              <h3 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary-fixed-dim)', fontFamily: 'var(--font-headline)' }}>
                Active
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>Sync Complete</span>
            </div>
          </div>

        </div>

        {/* Decks Grid Section */}
        <div style={{ marginBottom: '3.5rem' }} className="stagger-item stagger-3">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ 
              fontFamily: 'var(--font-headline)', 
              fontSize: '1.4rem', 
              fontWeight: '700',
              margin: 0, 
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--secondary)', fontSize: '22px' }}>style</span> Active Deck Collections
            </h3>
            {decks.length > 4 && (
              <button 
                onClick={() => setShowAllDecks(!showAllDecks)}
                style={{
                  background: 'none',
                  border: '1px solid var(--glass-stroke)',
                  color: 'var(--primary-fixed-dim)',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-technical)',
                  fontWeight: 600,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary-fixed)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--glass-stroke)'}
              >
                {showAllDecks ? 'SHOW LESS' : `SHOW ALL (${decks.length})`}
              </button>
            )}
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
            {displayedDecks.map(deck => {
              const subtitle = deck.format === 'Core' ? 'Strategic Tier 1' : 'Economic Dominance';
              return (
                <div 
                  key={deck.id}
                  className="glass-panel"
                  style={{
                    borderRadius: '16px',
                    overflow: 'hidden',
                    transition: 'all 0.3s',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '240px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--ink-magenta)';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--glass-stroke)';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  {/* Image blending background */}
                  <div style={{ height: '140px', width: '100%', position: 'relative' }}>
                    {renderDiagonalBackground(deck.colors)}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(13, 17, 23, 1) 0%, rgba(13, 17, 23, 0.4) 70%, transparent 100%)' }} />
                    {/* Format Badge overlay on tile */}
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: 'rgba(5, 7, 10, 0.85)',
                      border: deck.format === 'Core' ? '1px solid rgba(0,240,255,0.4)' : '1px solid rgba(171,71,188,0.4)',
                      color: deck.format === 'Core' ? 'var(--primary-fixed)' : 'var(--secondary)',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      fontFamily: 'var(--font-technical)',
                      letterSpacing: '0.5px'
                    }}>
                      {deck.format?.toUpperCase()}
                    </div>
                  </div>

                  {/* Deck content block */}
                  <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontFamily: 'var(--font-technical)', fontSize: '0.65rem', color: 'var(--ink-magenta)', textTransform: 'uppercase', letterSpacing: '0.2em', display: 'block', marginBottom: '2px' }}>
                        {subtitle}
                      </span>
                      <h4 style={{ margin: 0, fontFamily: 'var(--font-headline)', fontSize: '1.25rem', color: 'var(--primary-fixed)', fontWeight: 700 }}>
                        {deck.name.split(' (')[0]}
                      </h4>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontFamily: 'var(--font-technical)', fontSize: '0.6rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Win Rate</span>
                          <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary-container)', fontFamily: 'var(--font-headline)', marginTop: '2px' }}>{deck.winRate}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontFamily: 'var(--font-technical)', fontSize: '0.6rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Games</span>
                          <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--on-surface)', fontFamily: 'var(--font-headline)', marginTop: '2px' }}>{deck.matches}</span>
                        </div>
                      </div>

                      <button 
                        onClick={() => onSelectDeck(deck.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 16px',
                          borderRadius: '30px',
                          background: 'rgba(0, 240, 255, 0.08)',
                          border: '1px solid rgba(0, 240, 255, 0.4)',
                          color: 'var(--primary-fixed)',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          boxShadow: '0 0 10px rgba(0, 240, 255, 0.1)',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(0, 240, 255, 0.18)';
                          e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 240, 255, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(0, 240, 255, 0.08)';
                          e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 240, 255, 0.1)';
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px', fontVariationSettings: '"FILL" 1' }}>psychology</span> Coach Analysis
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>

        {/* Tabular Match History section */}
        <div style={{ marginBottom: '4rem' }} className="stagger-item stagger-4">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ 
              fontFamily: 'var(--font-headline)', 
              fontSize: '1.4rem', 
              fontWeight: '700',
              margin: 0, 
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary-fixed)', fontSize: '22px' }}>history</span> Recent Match History
            </h3>
            {totalMatchPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  disabled={matchPage === 1}
                  onClick={() => setMatchPage(matchPage - 1)}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--glass-stroke)',
                    color: matchPage === 1 ? 'rgba(255,255,255,0.1)' : 'var(--primary-fixed-dim)',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    cursor: matchPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}
                >
                  PREV
                </button>
                <span style={{ fontFamily: 'var(--font-technical)', fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>
                  Page {matchPage} of {totalMatchPages}
                </span>
                <button
                  disabled={matchPage === totalMatchPages}
                  onClick={() => setMatchPage(matchPage + 1)}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--glass-stroke)',
                    color: matchPage === totalMatchPages ? 'rgba(255,255,255,0.1)' : 'var(--primary-fixed-dim)',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    cursor: matchPage === totalMatchPages ? 'not-allowed' : 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}
                >
                  NEXT
                </button>
              </div>
            )}
          </div>

          <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--glass-stroke)', position: 'relative', boxShadow: '0 12px 40px rgba(0,0,0,0.6)' }}>
            <div style={{ height: '1.5px', background: 'linear-gradient(90deg, transparent, var(--primary-fixed), transparent)', opacity: 0.5 }} />
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                <thead>
                  <tr style={{ background: 'rgba(35, 43, 44, 0.3)', borderBottom: '1px solid var(--glass-stroke)' }}>
                    <th style={{ padding: '1rem', fontFamily: 'var(--font-technical)', fontSize: '0.7rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Deck Name</th>
                    <th style={{ padding: '1rem', fontFamily: 'var(--font-technical)', fontSize: '0.7rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Opponent Archetype</th>
                    <th style={{ padding: '1rem', fontFamily: 'var(--font-technical)', fontSize: '0.7rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Result</th>
                    <th style={{ padding: '1rem', fontFamily: 'var(--font-technical)', fontSize: '0.7rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Turn Count</th>
                    <th style={{ padding: '1rem', fontFamily: 'var(--font-technical)', fontSize: '0.7rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, textAlign: 'right' }}>Coach Analysis</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: '0.85rem' }}>
                  {paginatedMatches.map((match, idx) => {
                    const isWin = match.result?.toLowerCase() === 'win';
                    const activeColor = inkColors[match.your_deck_colors?.split('/')[0]]?.color || '#00dbe9';
                    
                    return (
                      <tr 
                        key={match.game_id} 
                        style={{ borderBottom: idx !== paginatedMatches.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none', transition: 'background-color 0.2s' }}
                        className="match-history-row"
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ 
                            width: '8px', 
                            height: '8px', 
                            background: activeColor, 
                            borderRadius: '50%',
                            display: 'inline-block',
                            boxShadow: `0 0 8px ${activeColor}`
                          }} />
                          <strong style={{ color: '#fff', fontWeight: 600 }}>{match.your_deck_colors}</strong>
                        </td>
                        <td style={{ padding: '1rem', color: 'var(--on-surface-variant)' }}>
                          {match.opp_deck_colors} ({match.opp_display_name})
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '0.65rem',
                            fontWeight: 'bold',
                            fontFamily: 'var(--font-technical)',
                            background: isWin ? 'rgba(0, 240, 255, 0.08)' : 'rgba(255, 45, 85, 0.08)',
                            color: isWin ? 'var(--primary-fixed-dim)' : 'var(--ink-magenta)',
                            border: isWin ? '1px solid rgba(0, 240, 255, 0.15)' : '1px solid rgba(255, 45, 85, 0.15)'
                          }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
                              {isWin ? 'check_circle' : 'cancel'}
                            </span>
                            {isWin ? 'WIN' : 'LOSS'}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', color: 'var(--on-surface-variant)', fontFamily: 'var(--font-technical)' }}>
                          Turn {match.turns}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          <button
                            onClick={() => onSelectMatch(match.game_id)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '8px',
                              borderRadius: '8px',
                              background: 'var(--surface-container)',
                              border: '1px solid var(--glass-stroke)',
                              color: 'var(--primary-fixed)',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = 'var(--primary-fixed)';
                              e.currentTarget.style.background = 'rgba(0,240,255,0.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = 'var(--glass-stroke)';
                              e.currentTarget.style.background = 'var(--surface-container)';
                            }}
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
};

export default Dashboard;
