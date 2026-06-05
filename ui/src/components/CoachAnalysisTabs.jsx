import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Loader2, CornerDownRight, TrendingUp, Cpu, 
  HelpCircle, ArrowLeft, ChevronRight, User, AlertCircle,
  Sparkles, CheckCircle2, XCircle, ArrowRight, Zap, Play, Clock, Award,
  ChevronDown, ChevronUp
} from 'lucide-react';

const inkColors = {
  Amber: { color: '#ffb300', bg: 'rgba(255,179,0,0.12)' },
  Amethyst: { color: '#ab47bc', bg: 'rgba(171,71,188,0.12)' },
  Emerald: { color: '#2ec4b6', bg: 'rgba(46,196,182,0.12)' },
  Ruby: { color: '#e71d36', bg: 'rgba(231,29,54,0.12)' },
  Sapphire: { color: '#118ab2', bg: 'rgba(17,138,178,0.12)' },
  Steel: { color: '#90a4ae', bg: 'rgba(144,164,174,0.12)' }
};

const getRatingBadgeStyle = (rating) => {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    border: '1px solid',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  };

  switch (rating?.toLowerCase()) {
    case 'optimal':
      return {
        ...base,
        background: 'rgba(0, 240, 255, 0.1)',
        color: 'var(--primary-fixed-dim)',
        borderColor: 'rgba(0, 240, 255, 0.3)',
        boxShadow: '0 0 10px rgba(0, 240, 255, 0.15)'
      };
    case 'suboptimal':
      return {
        ...base,
        background: 'rgba(245, 158, 11, 0.1)',
        color: '#ffe179',
        borderColor: 'rgba(245, 158, 11, 0.3)',
        boxShadow: '0 0 10px rgba(245, 158, 11, 0.15)'
      };
    case 'mistake':
      return {
        ...base,
        background: 'rgba(255, 45, 85, 0.1)',
        color: 'var(--ink-magenta)',
        borderColor: 'rgba(255, 45, 85, 0.3)',
        boxShadow: '0 0 10px rgba(255, 45, 85, 0.15)'
      };
    default:
      return {
        ...base,
        background: 'rgba(255, 255, 255, 0.05)',
        color: '#cbd5e1',
        borderColor: 'rgba(255, 255, 255, 0.1)'
      };
  }
};

// Safe Mulligan Card component with local image error fallback state
const MulliganCard = ({ card }) => {
  const [imgError, setImgError] = useState(false);
  if (!card) return null;
  const colorStyle = inkColors[card.ink] || { color: '#00dbe9' };
  
  return (
    <div 
      style={{
        width: '120px',
        height: '170px',
        borderRadius: '8px',
        border: `1.5px solid ${colorStyle.color}80`,
        background: 'rgba(5, 7, 10, 0.95)',
        boxShadow: `0 8px 16px rgba(0,0,0,0.6)`,
        overflow: 'hidden',
        position: 'relative',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s'
      }}
      className="mulligan-card-item"
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05) translateY(-5px)';
        e.currentTarget.style.borderColor = colorStyle.color;
        e.currentTarget.style.boxShadow = `0 0 15px ${colorStyle.color}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.borderColor = `${colorStyle.color}80`;
        e.currentTarget.style.boxShadow = `0 8px 16px rgba(0,0,0,0.6)`;
      }}
    >
      {card.image_url && !imgError ? (
        <img 
          src={card.image_url} 
          alt={card.name} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          onError={() => setImgError(true)}
        />
      ) : (
        <div style={{
          padding: '10px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          fontSize: '0.65rem',
          background: 'rgba(5, 7, 10, 0.95)'
        }}>
          <div style={{ fontWeight: 800, color: colorStyle.color, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
            {card.name}
          </div>
          <div style={{ opacity: 0.6, fontSize: '0.55rem' }}>
            Cost: {card.cost !== null ? card.cost : '?'} • {card.ink || 'Unknown'}
          </div>
        </div>
      )}
    </div>
  );
};

const CoachAnalysisTabs = ({ gameId, token, onBack }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mulliganExpanded, setMulliganExpanded] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchCoaching = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/matches/${gameId}/coaching`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch coaching (HTTP ${response.status})`);
        }
        const result = await response.json();
        if (isMounted) {
          setData(result);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    fetchCoaching();
    return () => { isMounted = false; };
  }, [gameId, token]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', color: 'var(--on-surface-variant)' }}>
        <Loader2 className="animate-spin" size={40} style={{ color: 'var(--primary-fixed-dim)', marginBottom: '1rem' }} />
        <span style={{ fontSize: '0.95rem', fontFamily: 'var(--font-technical)' }}>Coach is studying the inklines...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--error)', background: 'rgba(255,23,68,0.05)', borderRadius: '16px', border: '1px solid rgba(255,23,68,0.15)' }}>
        <AlertCircle size={32} style={{ margin: '0 auto 10px auto' }} />
        <p>Error loading coaching review: {error}</p>
        {onBack && (
          <button onClick={onBack} className="btn-primary" style={{ marginTop: '1rem' }}>
            Go Back
          </button>
        )}
      </div>
    );
  }

  if (!data) return null;

  const { mulligan_analysis, pivot_turn, takeaways, match_metadata, timeline } = data;

  // Derive keepers: initial hand minus mulliganed cards
  const initialHand = mulligan_analysis?.cards_details?.initial_hand || [];
  const mulliganed = mulligan_analysis?.cards_details?.mulliganed || [];
  const drawn = mulligan_analysis?.cards_details?.drawn || [];

  const keepers = initialHand.filter(card => {
    const isMulliganed = mulliganed.some(m => m.name === card.name || (m.id && m.id === card.id));
    return !isMulliganed;
  });

  // Extract deck colors and player went first state
  const playedDeckPrimaryColor = match_metadata?.your_deck_colors?.split('/')[0]?.toLowerCase();
  const playedDeckSecondaryColor = match_metadata?.your_deck_colors?.split('/')[1]?.toLowerCase();

  // Parse timeline sections
  const parseTimeline = (md) => {
    if (!md) return [];
    const sections = [];
    const lines = md.split('\n');
    let currentSection = null;

    for (const line of lines) {
      const cleanLine = line.trim();
      if (cleanLine.startsWith('## ')) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          title: cleanLine.substring(3).trim(),
          content: []
        };
      } else if (currentSection && cleanLine) {
        let displayLine = cleanLine;
        if (displayLine.startsWith('- ')) displayLine = displayLine.substring(2);
        else if (displayLine.startsWith('* ')) displayLine = displayLine.substring(2);
        currentSection.content.push(displayLine);
      }
    }
    if (currentSection) {
      sections.push(currentSection);
    }
    return sections;
  };

  const parsedTimeline = parseTimeline(timeline);

  return (
    <div style={{ padding: '2rem 0', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Breadcrumbs Navigation */}
      <nav style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px', 
        fontFamily: 'var(--font-technical)', 
        fontSize: '0.75rem',
        color: 'var(--on-surface-variant)',
        marginBottom: '1rem',
        padding: '0 1rem'
      }}>
        {onBack && (
          <>
            <button 
              onClick={onBack} 
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary-fixed)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}
            >
              The Library
            </button>
            <ChevronRight size={12} />
          </>
        )}
        <span style={{ color: 'var(--primary-fixed)' }}>Match Coaching Report</span>
      </nav>

      {/* Header and Exit Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1.5rem', padding: '0 1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: '2.2rem', margin: 0, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
              The Inkwell <span style={{ color: 'var(--primary-fixed-dim)', fontWeight: 300, fontSize: '1.6rem' }}>// Game Review</span>
            </h2>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              padding: '4px 14px',
              borderRadius: '20px',
              textTransform: 'uppercase',
              background: match_metadata?.result?.toLowerCase() === 'victory' ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255, 45, 85, 0.1)',
              border: match_metadata?.result?.toLowerCase() === 'victory' ? '1px solid rgba(0, 240, 255, 0.3)' : '1px solid rgba(255, 45, 85, 0.3)',
              color: match_metadata?.result?.toLowerCase() === 'victory' ? 'var(--primary-fixed-dim)' : 'var(--ink-magenta)',
              boxShadow: match_metadata?.result?.toLowerCase() === 'victory' ? '0 0 10px rgba(0,240,255,0.1)' : '0 0 10px rgba(255,45,85,0.1)'
            }}>
              {match_metadata?.result}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '6px', alignItems: 'center' }}>
            <p style={{ margin: 0, color: 'var(--on-surface-variant)', fontSize: '0.85rem', fontFamily: 'var(--font-technical)' }}>
              ID: {gameId.substring(0, 8)}...
            </p>
            {match_metadata?.your_deck_colors && (
              <>
                <span style={{ color: 'rgba(255,255,255,0.1)' }}>•</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Played: <strong style={{ color: '#fff' }}>{match_metadata.your_deck_colors}</strong>
                  {match_metadata.went_first !== undefined && (
                    <span style={{ color: 'var(--primary-fixed-dim)', fontSize: '0.75rem', padding: '1px 6px', background: 'rgba(0,240,255,0.08)', borderRadius: '4px', border: '1px solid rgba(0,240,255,0.2)' }}>
                      {match_metadata.went_first ? '1st' : '2nd'}
                    </span>
                  )}
                </span>
              </>
            )}
          </div>
        </div>

        {onBack && (
          <button 
            onClick={onBack}
            className="glass-panel"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '10px',
              color: 'var(--on-surface)',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              border: '1px solid var(--glass-stroke)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary-fixed-dim)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--glass-stroke)'}
          >
            <ArrowLeft size={16} /> Exit Analysis
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', padding: '0 1rem' }}>

        {/* 1. MATCH OVERVIEW PANEL WITH BG LOGO AND GLOW */}
        <section className="glass-panel" style={{ 
          padding: '2rem', 
          borderRadius: '16px', 
          border: '1px solid rgba(0,240,255,0.25)', 
          position: 'relative', 
          overflow: 'hidden',
          boxShadow: '0 0 35px rgba(0, 240, 255, 0.07)'
        }}>
          {playedDeckPrimaryColor && (
            <div style={{
              position: 'absolute',
              bottom: '-30px',
              right: '-30px',
              width: '160px',
              height: '160px',
              backgroundImage: `url(/ink-icons/${playedDeckPrimaryColor}.png)`,
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              opacity: 0.05,
              pointerEvents: 'none',
              zIndex: 0
            }} />
          )}

          <h3 style={{ fontFamily: 'var(--font-headline)', color: '#fff', fontSize: '1.25rem', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '10px', position: 'relative', zIndex: 1 }}>
            <Award size={20} style={{ color: 'var(--primary-fixed-dim)' }} /> Match Summary
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem', position: 'relative', zIndex: 1 }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.03)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', fontFamily: 'var(--font-technical)' }}>Opponent</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginTop: '4px' }}>{match_metadata?.opponent_name}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.03)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', fontFamily: 'var(--font-technical)' }}>Opponent Deck</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink-magenta)', marginTop: '4px' }}>
                {match_metadata?.opponent_colors || 'Unknown Inks'}
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.03)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', fontFamily: 'var(--font-technical)' }}>Pacing Archetype</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginTop: '4px' }}>{match_metadata?.opponent_archetype || 'Unknown'}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.03)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', fontFamily: 'var(--font-technical)' }}>Game Length</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginTop: '4px' }}>{match_metadata?.turns} Turns</div>
            </div>
          </div>
        </section>

        {/* 2. MULLIGAN ASSESSMENT PANEL (COLLAPSIBLE) */}
        <section className="glass-panel" style={{ padding: '2rem', borderRadius: '16px', border: '1px solid var(--glass-stroke)' }}>
          <div 
            onClick={() => setMulliganExpanded(!mulliganExpanded)}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: mulliganExpanded ? '1.5rem' : '0', flexWrap: 'wrap', gap: '1rem', cursor: 'pointer' }}
          >
            <h3 style={{ fontFamily: 'var(--font-headline)', color: '#fff', fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Cpu size={20} style={{ color: 'var(--primary-fixed-dim)' }} /> Mulligan Phase Assessment
              {mulliganExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {mulligan_analysis?.execution_rating && (
                <div style={getRatingBadgeStyle(mulligan_analysis.execution_rating)}>
                  {mulligan_analysis.execution_rating}
                </div>
              )}
            </div>
          </div>

          {mulliganExpanded && (
            <div style={{ marginTop: '1rem' }}>
              <blockquote style={{
                margin: '0 0 2.5rem 0',
                padding: '1.25rem 1.5rem',
                borderLeft: '4px solid var(--primary-fixed-dim)',
                background: 'radial-gradient(circle at left, rgba(0, 240, 255, 0.08) 0%, transparent 80%)',
                borderRadius: '0 12px 12px 0',
                fontStyle: 'italic',
                fontSize: '1rem',
                color: '#e2e8f0',
                lineHeight: 1.6,
                border: '1px solid rgba(0,240,255,0.05)',
                borderLeftWidth: '4px'
              }}>
                "{mulligan_analysis?.coach_verdict}"
              </blockquote>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                {/* Keepers */}
                <div>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.8rem', color: 'var(--primary-fixed-dim)', fontFamily: 'var(--font-technical)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Kept Cards ({keepers.length})
                  </h4>
                  <div style={{ display: 'flex', gap: '1.25rem', overflowX: 'auto', paddingBottom: '12px' }}>
                    {keepers.map((card, cidx) => (
                      <MulliganCard key={cidx} card={card} />
                    ))}
                    {keepers.length === 0 && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', fontStyle: 'italic' }}>No kept cards found.</p>
                    )}
                  </div>
                </div>

                {/* Tossed and Drawn Replacements columns */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                  {mulliganed.length > 0 && (
                    <div>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '0.8rem', color: 'var(--ink-magenta)', fontFamily: 'var(--font-technical)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Tossed / Mulliganed ({mulliganed.length})
                      </h4>
                      <div style={{ display: 'flex', gap: '1.25rem', overflowX: 'auto', paddingBottom: '12px' }}>
                        {mulliganed.map((card, cidx) => (
                          <MulliganCard key={cidx} card={card} />
                        ))}
                      </div>
                    </div>
                  )}

                  {drawn.length > 0 && (
                    <div>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '0.8rem', color: 'rgba(0, 230, 118, 0.95)', fontFamily: 'var(--font-technical)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Drawn Replacements ({drawn.length})
                      </h4>
                      <div style={{ display: 'flex', gap: '1.25rem', overflowX: 'auto', paddingBottom: '12px' }}>
                        {drawn.map((card, cidx) => (
                          <MulliganCard key={cidx} card={card} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* 3. THE PIVOT TURN PANEL (PREMIUM LAYOUT WITH GLOW) */}
        {pivot_turn && (
          <section className="glass-panel" style={{ 
            padding: '2rem', 
            borderRadius: '16px', 
            border: '1px solid rgba(0, 240, 255, 0.25)',
            boxShadow: '0 0 35px rgba(0, 240, 255, 0.1)',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '14px', marginBottom: '2rem' }}>
              <h3 style={{ fontFamily: 'var(--font-headline)', color: '#fff', fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Zap size={20} style={{ color: 'rgba(0, 240, 255, 0.9)' }} /> The Pivot Turn
              </h3>
              <span style={{ 
                background: 'rgba(0, 240, 255, 0.1)', 
                border: '1px solid var(--primary-fixed-dim)', 
                color: 'var(--primary-fixed)', 
                padding: '4px 14px', 
                borderRadius: '20px', 
                fontSize: '0.75rem', 
                fontWeight: 'bold',
                fontFamily: 'var(--font-technical)',
                textTransform: 'uppercase'
              }}>
                Turn {pivot_turn.round_number} ({pivot_turn.tag || 'Momentum Shift'})
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
              
              {/* Left Column: Turn & State indicators */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'rgba(0,240,255,0.08)',
                    border: '2.5px solid var(--primary-fixed-dim)',
                    boxShadow: '0 0 15px rgba(0,240,255,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-headline)',
                    fontSize: '1.4rem',
                    fontWeight: 900,
                    color: '#fff'
                  }}>
                    {pivot_turn.round_number}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, color: 'var(--primary-fixed-dim)', textTransform: 'uppercase', fontFamily: 'var(--font-technical)', fontSize: '0.75rem', letterSpacing: '1px' }}>
                      Pivot Turn round
                    </h4>
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
                      {pivot_turn.tag}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>Player State</span>
                    <strong style={{ color: 'var(--primary-fixed-dim)' }}>
                      {pivot_turn.player_state?.lore} Lore / {pivot_turn.player_state?.ink} Ink
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>Opponent State</span>
                    <strong style={{ color: 'var(--ink-magenta)' }}>
                      {pivot_turn.opponent_state?.lore} Lore / {pivot_turn.opponent_state?.ink} Ink
                    </strong>
                  </div>
                </div>
              </div>

              {/* Right Column: Descriptions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{
                    padding: '8px',
                    borderRadius: '8px',
                    background: 'rgba(0, 240, 255, 0.08)',
                    color: 'var(--primary-fixed)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: '2px',
                    flexShrink: 0
                  }}>
                    <CornerDownRight size={16} />
                  </div>
                  <div>
                    <strong style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600 }}>Your Actions</strong>
                    <p style={{ margin: '4px 0 0 0', color: 'var(--on-surface-variant)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                      {pivot_turn.your_actions}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{
                    padding: '8px',
                    borderRadius: '8px',
                    background: 'rgba(0, 230, 118, 0.08)',
                    color: '#00e676',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: '2px',
                    flexShrink: 0
                  }}>
                    <TrendingUp size={16} />
                  </div>
                  <div>
                    <strong style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600 }}>Momentum Shift Impact</strong>
                    <p style={{ margin: '4px 0 0 0', color: 'var(--on-surface-variant)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                      {pivot_turn.momentum_shift}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </section>
        )}

        {/* 4. TURN-BY-TURN MOMENTUM TIMELINE PANEL */}
        {parsedTimeline.length > 0 && (
          <section className="glass-panel" style={{ padding: '2rem', borderRadius: '16px', border: '1px solid var(--glass-stroke)' }}>
            <h3 style={{ fontFamily: 'var(--font-headline)', color: '#fff', fontSize: '1.25rem', margin: '0 0 2rem 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock size={20} style={{ color: 'var(--primary-fixed-dim)' }} /> Turn-by-Turn Momentum Timeline
            </h3>

            <div style={{ position: 'relative', paddingLeft: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Vertical timeline connector line */}
              <div className="timeline-line" style={{ left: '15px', width: '2px', background: 'rgba(255,255,255,0.06)' }} />

              {parsedTimeline.map((sect, sIdx) => {
                const isActive = sect.title.toLowerCase().includes('turn') || sect.title.toLowerCase().includes('setup');
                return (
                  <div key={sIdx} style={{ position: 'relative' }}>
                    {/* Glowing Timeline Dot */}
                    <div 
                      className={`timeline-dot ${isActive ? 'active' : ''}`}
                      style={{ 
                        left: '-32px', 
                        top: '5px',
                        background: isActive ? 'var(--primary-fixed-dim)' : 'var(--outline-variant)',
                        boxShadow: isActive ? '0 0 10px var(--primary-fixed)' : 'none'
                      }} 
                    />

                    <div>
                      <h4 style={{ 
                        margin: 0, 
                        fontSize: '1rem', 
                        fontFamily: 'var(--font-technical)', 
                        color: isActive ? '#fff' : 'var(--on-surface-variant)',
                        fontWeight: 700 
                      }}>
                        {sect.title}
                      </h4>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                        {sect.content.map((act, aIdx) => {
                          const isYou = act.includes('You ') || act.includes('You(') || act.startsWith('You');
                          
                          return (
                            <p 
                              key={aIdx} 
                              style={{ 
                                margin: 0, 
                                fontSize: '0.85rem', 
                                color: isYou ? 'var(--on-surface)' : 'var(--on-surface-variant)',
                                lineHeight: 1.5,
                                background: isYou ? 'rgba(0, 240, 255, 0.02)' : 'transparent',
                                padding: isYou ? '4px 8px' : '0',
                                borderRadius: '4px',
                                borderLeft: isYou ? '2.5px solid var(--primary-fixed-dim)' : 'none',
                                paddingLeft: isYou ? '10px' : '0'
                              }}
                            >
                              {act}
                            </p>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 5. ULTIMATE TAKEAWAYS BENTO GRID */}
        {takeaways && (
          <section style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontFamily: 'var(--font-headline)', color: '#fff', fontSize: '1.25rem', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sparkles size={20} style={{ color: 'var(--primary-fixed-dim)' }} /> Ultimate Takeaways
            </h3>
            
            <div className="glass-panel" style={{ 
              padding: '2rem', 
              borderRadius: '16px', 
              border: '1px solid var(--glass-stroke)',
              lineHeight: 1.7,
              fontSize: '0.95rem',
              color: 'var(--on-surface-variant)'
            }}>
              <div className="markdown-body" style={{ color: '#cbd5e1' }}>
                <ReactMarkdown>
                  {Array.isArray(takeaways) ? takeaways.join('\n') : takeaways}
                </ReactMarkdown>
              </div>
            </div>
          </section>
        )}

      </div>
    </div>
  );
};

export default CoachAnalysisTabs;
