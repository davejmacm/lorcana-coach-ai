import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import {
  Loader2, CornerDownRight, TrendingUp, Cpu,
  ArrowLeft, ChevronRight, AlertCircle,
  Sparkles, Zap, Clock, Award,
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
const MulliganCard = ({ card, onClick, discarded }) => {
  const [imgError, setImgError] = useState(false);
  if (!card) return null;
  const colorStyle = inkColors[card.ink] || { color: '#00dbe9' };
  
  return (
    <div
      style={{
        width: '120px',
        height: '170px',
        borderRadius: '8px',
        border: discarded ? '2px solid var(--ink-magenta)' : `1.5px solid ${colorStyle.color}80`,
        background: 'rgba(5, 7, 10, 0.95)',
        boxShadow: discarded ? '0 0 10px rgba(255, 45, 85, 0.2)' : `0 8px 16px rgba(0,0,0,0.6)`,
        overflow: 'hidden',
        position: 'relative',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s',
        cursor: 'zoom-in',
        zIndex: 1
      }}
      className="mulligan-card-item"
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.5) translateY(-10px)';
        e.currentTarget.style.borderColor = discarded ? 'var(--ink-magenta)' : colorStyle.color;
        e.currentTarget.style.boxShadow = discarded ? '0 0 25px var(--ink-magenta)' : `0 0 20px ${colorStyle.color}`;
        e.currentTarget.style.zIndex = 10;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.borderColor = discarded ? 'var(--ink-magenta)' : `${colorStyle.color}80`;
        e.currentTarget.style.boxShadow = discarded ? '0 0 10px rgba(255, 45, 85, 0.2)' : `0 8px 16px rgba(0,0,0,0.6)`;
        e.currentTarget.style.zIndex = 1;
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

      {/* Discarded Overlay */}
      {discarded && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(255, 45, 85, 0.45)',
          backdropFilter: 'blur(1px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontFamily: 'var(--font-technical)',
          fontSize: '0.75rem',
          fontWeight: '900',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          pointerEvents: 'none'
        }}>
          Discarded
        </div>
      )}
    </div>
  );
};

const ZoomedCardModal = ({ card, onClose }) => {
  const [imgError, setImgError] = useState(false);
  if (!card) return null;
  const colorStyle = inkColors[card.ink] || { color: '#00dbe9' };

  return createPortal(
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(3, 5, 8, 0.85)',
          backdropFilter: 'blur(8px)',
          webkitBackdropFilter: 'blur(8px)',
          cursor: 'zoom-out'
        }}
      />

      {/* Actual Zoomed Card */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 2.8, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        onClick={onClose}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        style={{
          position: 'relative',
          width: '120px',
          height: '170px',
          borderRadius: '8px',
          border: `2px solid ${colorStyle.color}`,
          background: 'rgba(5, 7, 10, 0.98)',
          boxShadow: `0 30px 60px rgba(0,0,0,0.8), 0 0 40px ${colorStyle.color}`,
          cursor: 'zoom-out',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 100000
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
            padding: '12px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            fontSize: '0.35rem'
          }}>
            <div style={{ fontWeight: 800, color: colorStyle.color, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
              {card.name}
            </div>
            <div style={{ opacity: 0.6, fontSize: '0.3rem' }}>
              Cost: {card.cost !== null ? card.cost : '?'} • {card.ink || 'Unknown'}
            </div>
          </div>
        )}
      </motion.div>
    </div>,
    document.body
  );
};

const CoachAnalysisTabs = ({ gameId, token, onBack }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mulliganExpanded, setMulliganExpanded] = useState(false);
  const [activeZoomedCard, setActiveZoomedCard] = useState(null);

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
  const initialHand = mulligan_analysis?.cards_details?.initial_hand || [];
  const mulliganed = mulligan_analysis?.cards_details?.mulliganed || [];
  const drawn = mulligan_analysis?.cards_details?.drawn || [];

  // Match initial hand cards to their discarded status and replacements
  const remainingMulliganed = [...mulliganed];
  const remainingDrawn = [...drawn];

  const initialHandAnalysis = initialHand.map(card => {
    const mIdx = remainingMulliganed.findIndex(m => m.name === card.name || (m.id && m.id === card.id));
    if (mIdx !== -1) {
      remainingMulliganed.splice(mIdx, 1);
      const replacementCard = remainingDrawn.shift() || null;
      return {
        card,
        isDiscarded: true,
        replacementCard
      };
    }
    return {
      card,
      isDiscarded: false,
      replacementCard: null
    };
  });

  // Extract deck colors and player went first state
  const playedDeckPrimaryColor = match_metadata?.your_deck_colors?.split('/')[0]?.toLowerCase();

  // Helper to streamline the timeline to setup, turns 1 & 2, pivot turn, and final turn.
  const getStreamlinedTimeline = (timelineMd, pivotRound, totalTurns) => {
    if (!timelineMd) return [];
    const lines = timelineMd.split('\n');

    let currentSection = '';
    const setupLines = [];
    const roundMap = {};
    const overLines = [];

    let currentRoundNum = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      if (line.startsWith('## Match Setup')) {
        currentSection = 'setup';
        continue;
      } else if (line.startsWith('## Gameplay Timeline')) {
        currentSection = 'gameplay';
        continue;
      } else if (line.startsWith('## Match Over!')) {
        currentSection = 'over';
        continue;
      } else if (line.startsWith('## ')) {
        currentSection = '';
        continue;
      }

      if (currentSection === 'setup') {
        let clean = line;
        if (clean.startsWith('- ')) clean = clean.substring(2);
        else if (clean.startsWith('* ')) clean = clean.substring(2);
        setupLines.push(clean);
      } else if (currentSection === 'gameplay') {
        const roundMatch = line.match(/^###\s+Round\s+(\d+)/i);
        if (roundMatch) {
          currentRoundNum = parseInt(roundMatch[1], 10);
          if (!roundMap[currentRoundNum]) {
            roundMap[currentRoundNum] = [];
          }
          roundMap[currentRoundNum].push(`**${line.replace(/^###\s+/, '')}**`);
        } else if (currentRoundNum !== null) {
          let clean = line;
          if (clean.startsWith('- ')) clean = clean.substring(2);
          else if (clean.startsWith('* ')) clean = clean.substring(2);
          roundMap[currentRoundNum].push(clean);
        }
      } else if (currentSection === 'over') {
        let clean = line;
        if (clean.startsWith('- ')) clean = clean.substring(2);
        else if (clean.startsWith('* ')) clean = clean.substring(2);
        overLines.push(clean);
      }
    }

    const roundsInTimeline = Object.keys(roundMap).map(Number).sort((a, b) => a - b);
    const maxRound = roundsInTimeline.length > 0 ? roundsInTimeline[roundsInTimeline.length - 1] : (totalTurns || 0);

    const events = [];

    // 1. Setup Event
    if (setupLines.length > 0) {
      events.push({
        type: 'setup',
        roundNumber: 0,
        title: 'Match Setup',
        badge: 'Setup',
        content: setupLines
      });
    }

    const targetRounds = new Set([1, 2]);
    if (pivotRound) targetRounds.add(pivotRound);
    if (maxRound) targetRounds.add(maxRound);

    const sortedRounds = Array.from(targetRounds).sort((a, b) => a - b);

    for (const rNum of sortedRounds) {
      if (!roundMap[rNum]) continue;

      let badge = '';
      let title = `Round ${rNum}`;
      let isPivot = rNum === pivotRound;
      let isClimax = rNum === maxRound;

      if (isPivot && isClimax) {
        badge = 'PIVOT & CLIMAX';
        title = `Round ${rNum} (Pivot & Final Turn)`;
      } else if (isPivot) {
        badge = 'PIVOT TURN';
        title = `Round ${rNum} (Pivot Turn)`;
      } else if (isClimax) {
        badge = 'CLIMAX';
        title = `Round ${rNum} (Final Turn)`;
      } else if (rNum === 1 || rNum === 2) {
        badge = 'Opening';
      }

      events.push({
        type: 'round',
        roundNumber: rNum,
        title: title,
        badge: badge,
        isPivot,
        isClimax,
        content: roundMap[rNum]
      });
    }

    if (overLines.length > 0) {
      events.push({
        type: 'climax',
        roundNumber: maxRound + 1,
        title: 'Match Verdict',
        badge: 'Verdict',
        content: overLines
      });
    }

    return events;
  };

  const streamlinedTimeline = getStreamlinedTimeline(timeline, pivot_turn?.round_number, match_metadata?.turns);


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
          <span style={{
            fontFamily: 'var(--font-technical)',
            fontSize: '0.8rem',
            color: 'var(--primary-fixed-dim)',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            fontWeight: 700,
            display: 'block',
            marginBottom: '4px'
          }}>
            Analysis
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: '2.2rem', margin: 0, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
              The Inkwell
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

        {/* 2. MULLIGAN ASSESSMENT PANEL */}
        <section className="glass-panel" style={{ padding: '2rem', borderRadius: '16px', border: '1px solid var(--glass-stroke)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h3 style={{ fontFamily: 'var(--font-headline)', color: '#fff', fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Cpu size={20} style={{ color: 'var(--primary-fixed-dim)' }} /> Mulligan Phase Assessment
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {mulligan_analysis?.execution_rating && (
                <div style={getRatingBadgeStyle(mulligan_analysis.execution_rating)}>
                  {mulligan_analysis.execution_rating}
                </div>
              )}
            </div>
          </div>

          {/* Coach's Verdict - Always visible */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.75rem', color: 'var(--primary-fixed-dim)', fontFamily: 'var(--font-technical)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Coach's Verdict
            </h4>
            <blockquote style={{
              margin: 0,
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
          </div>

          {/* Collapsible Card Breakdown Trigger */}
          <button
            onClick={() => setMulliganExpanded(!mulliganExpanded)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--glass-stroke)',
              borderRadius: '8px',
              color: 'var(--on-surface-variant)',
              cursor: 'pointer',
              fontFamily: 'var(--font-technical)',
              fontSize: '0.8rem',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 240, 255, 0.05)';
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
              e.currentTarget.style.color = 'var(--on-surface-variant)';
              e.currentTarget.style.borderColor = 'var(--glass-stroke)';
            }}
          >
            <span>{mulliganExpanded ? 'Hide Card Breakdown' : 'Show Card Breakdown'}</span>
            {mulliganExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {/* Expanded Card Breakdown Content */}
          {mulliganExpanded && (
            <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Row Header Indicator */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--primary-fixed-dim)', fontFamily: 'var(--font-technical)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Mulligan Decisions & Replacements
                </span>
                {mulliganed.length > 0 && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', fontStyle: 'italic' }}>
                    Row 1: Initial Hand (Discarded cards marked) • Row 2: Replacement Cards (drawn directly below discarded cards)
                  </span>
                )}
              </div>

              {/* Grid Wrapper with Horizontal Scroll */}
              <div style={{ display: 'flex', gap: '1.25rem', overflowX: 'auto', paddingBottom: '20px', paddingTop: '20px', minHeight: mulliganed.length > 0 ? '420px' : '220px' }}>
                {initialHandAnalysis.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
                    {/* Row 1: Initial Card */}
                    <MulliganCard 
                      card={item.card} 
                      discarded={item.isDiscarded} 
                      onClick={() => setActiveZoomedCard(item.card)} 
                    />
                    
                    {/* Row 2: Replacement Card (only if there are mulliganed cards) */}
                    {mulliganed.length > 0 && (
                      <div style={{ height: '170px', width: '120px' }}>
                        {item.isDiscarded && item.replacementCard ? (
                          <MulliganCard 
                            card={item.replacementCard} 
                            onClick={() => setActiveZoomedCard(item.replacementCard)} 
                          />
                        ) : (
                          <div style={{ 
                            width: '120px', 
                            height: '170px', 
                            border: '1px dashed rgba(255,255,255,0.05)', 
                            borderRadius: '8px', 
                            background: 'rgba(255,255,255,0.01)' 
                          }} />
                        )}
                      </div>
                    )}
                  </div>
                ))}
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

        {/* 4. STREAMLINED GAME TIMELINE PANEL */}
        {streamlinedTimeline.length > 0 && (
          <section className="glass-panel" style={{ padding: '2rem', borderRadius: '16px', border: '1px solid var(--glass-stroke)' }}>
            <h3 style={{ fontFamily: 'var(--font-headline)', color: '#fff', fontSize: '1.25rem', margin: '0 0 2rem 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock size={20} style={{ color: 'var(--primary-fixed-dim)' }} /> Match Momentum Timeline
            </h3>

            <div style={{ position: 'relative', paddingLeft: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Vertical timeline connector line */}
              <div className="timeline-line" style={{ left: '15px', width: '2px', background: 'rgba(255,255,255,0.06)' }} />

              {streamlinedTimeline.map((event, sIdx) => {
                const isPivot = event.isPivot;
                const isClimax = event.isClimax;
                const isSetup = event.type === 'setup';
                const isVerdict = event.type === 'climax'; // Verdict event

                // Color configuration for timeline dots and badges
                let badgeStyle = {
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: '12px',
                  textTransform: 'uppercase',
                  fontFamily: 'var(--font-technical)',
                  border: '1px solid'
                };

                let dotBg;
                let dotGlow = 'none';
                let itemBorderColor = 'var(--glass-stroke)';
                let itemBg = 'transparent';

                if (isPivot) {
                  badgeStyle = {
                    ...badgeStyle,
                    background: 'rgba(0, 240, 255, 0.1)',
                    borderColor: 'rgba(0, 240, 255, 0.3)',
                    color: 'var(--primary-fixed-dim)',
                    boxShadow: '0 0 8px rgba(0, 240, 255, 0.15)'
                  };
                  dotBg = 'var(--primary-fixed-dim)';
                  dotGlow = '0 0 10px var(--primary-fixed)';
                  itemBorderColor = 'rgba(0, 240, 255, 0.2)';
                  itemBg = 'rgba(0, 240, 255, 0.01)';
                } else if (isClimax || isVerdict) {
                  badgeStyle = {
                    ...badgeStyle,
                    background: 'rgba(255, 45, 85, 0.1)',
                    borderColor: 'rgba(255, 45, 85, 0.3)',
                    color: 'var(--ink-magenta)',
                    boxShadow: '0 0 8px rgba(255, 45, 85, 0.15)'
                  };
                  dotBg = 'var(--ink-magenta)';
                  dotGlow = '0 0 10px rgba(255, 45, 85, 0.5)';
                  itemBorderColor = 'rgba(255, 45, 85, 0.2)';
                  itemBg = 'rgba(255, 45, 85, 0.01)';
                } else if (isSetup) {
                  badgeStyle = {
                    ...badgeStyle,
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'var(--on-surface-variant)'
                  };
                  dotBg = 'rgba(255, 255, 255, 0.3)';
                  dotGlow = 'none';
                } else {
                  // Standard opening turns
                  badgeStyle = {
                    ...badgeStyle,
                    background: 'rgba(0, 240, 255, 0.05)',
                    borderColor: 'rgba(0, 240, 255, 0.1)',
                    color: 'var(--primary-fixed-dim)'
                  };
                  dotBg = 'rgba(0, 240, 255, 0.4)';
                }

                const hasCustomBg = itemBg !== 'transparent';

                return (
                  <div key={sIdx} style={{
                    position: 'relative',
                    background: itemBg,
                    border: hasCustomBg ? `1px solid ${itemBorderColor}` : 'none',
                    borderRadius: '12px',
                    padding: hasCustomBg ? '1.25rem' : '0',
                    marginLeft: hasCustomBg ? '-1.25rem' : '0'
                  }}>
                    {/* Glowing Timeline Dot */}
                    <div
                      className="timeline-dot"
                      style={{
                        left: hasCustomBg ? '-20px' : '-32px',
                        top: hasCustomBg ? '25px' : '5px',
                        background: dotBg,
                        boxShadow: dotGlow,
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        position: 'absolute',
                        zIndex: 2
                      }}
                    />

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
                        <h4 style={{
                          margin: 0,
                          fontSize: '1rem',
                          fontFamily: 'var(--font-technical)',
                          color: '#fff',
                          fontWeight: 700
                        }}>
                          {event.title}
                        </h4>
                        {event.badge && (
                          <span style={badgeStyle}>
                            {event.badge}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {event.content.map((act, aIdx) => {
                          const isYou = act.includes('You ') || act.includes('You(') || act.startsWith('You');
                          const isSubHeader = act.startsWith('**') && act.endsWith('**');

                          if (isSubHeader) {
                            const cleanHeader = act.replace(/^\*\*|\*\*$/g, '');
                            return (
                              <h5 key={aIdx} style={{
                                margin: '12px 0 6px 0',
                                fontSize: '0.8rem',
                                color: 'rgba(255,255,255,0.7)',
                                fontWeight: 700,
                                fontFamily: 'var(--font-technical)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}>
                                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--primary-fixed-dim)' }} />
                                {cleanHeader}
                              </h5>
                            );
                          }

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

      {/* Portalled global zoomed card modal layer */}
      <AnimatePresence>
        {activeZoomedCard && (
          <ZoomedCardModal
            card={activeZoomedCard}
            onClose={() => setActiveZoomedCard(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CoachAnalysisTabs;
