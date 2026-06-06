import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import {
  Loader2, CornerDownRight, TrendingUp, Cpu,
  ArrowLeft, ChevronRight, AlertCircle,
  Sparkles, Zap, Clock, Award,
  ChevronDown, ChevronUp,
  ShieldAlert, Swords, PlusCircle, GitCommit
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

const CoachAnalysisTabs = ({ gameId, token, onBack, rateLimitType = 'none', cooldownTime = 0, onRateLimitHit }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mulliganExpanded, setMulliganExpanded] = useState(false);
  const [activeZoomedCard, setActiveZoomedCard] = useState(null);

  // Phase 2 — pivot lazy-load state
  const [pivotData, setPivotData] = useState(null);
  const [pivotLoading, setPivotLoading] = useState(true);
  const [mainLoaded, setMainLoaded] = useState(false);

  // Phase 3 — structured timeline lazy-load state
  const [timelineData, setTimelineData] = useState(null);
  const [timelineLoading, setTimelineLoading] = useState(true);

  // Phase 1 — main coaching payload
  useEffect(() => {
    let isMounted = true;
    const fetchCoaching = async () => {
      setLoading(true);
      setError(null);
      setPivotData(null);
      setPivotLoading(true);
      setTimelineData(null);
      setTimelineLoading(true);
      setMainLoaded(false);
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
        if (result.rate_limit_exceeded && onRateLimitHit) {
          onRateLimitHit(result.daily_limit_exceeded);
        }
        if (isMounted) {
          setData(result);
          setLoading(false);
          setMainLoaded(true);
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

  // Phase 2 — pivot sidecar fetch, fires once main payload is ready
  useEffect(() => {
    if (!mainLoaded || !data) return;

    let isMounted = true;
    const fetchPivot = async () => {
      setPivotLoading(true);
      try {
        const response = await fetch(`/api/matches/${gameId}/coaching/pivot`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
          throw new Error(`Pivot fetch failed (HTTP ${response.status})`);
        }
        const result = await response.json();
        if (isMounted) {
          setPivotData(result.pivot_turn || null);
          setPivotLoading(false);
          // Propagate rate limit if pivot was the first to trigger it
          if (result.rate_limit_exceeded && onRateLimitHit) {
            onRateLimitHit(result.daily_limit_exceeded);
          }
        }
      } catch (err) {
        if (isMounted) {
          // On error fall back silently — pivot panel shows a soft error
          setPivotData(null);
          setPivotLoading(false);
        }
      }
    };

    fetchPivot();
    return () => { isMounted = false; };
  }, [mainLoaded, gameId, token]);

  // Phase 3 — structured timeline sidecar fetch (fires in parallel with Phase 2)
  useEffect(() => {
    if (!mainLoaded || !data) return;

    let isMounted = true;
    const fetchTimeline = async () => {
      setTimelineLoading(true);
      try {
        const response = await fetch(`/api/matches/${gameId}/coaching/timeline`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error(`Timeline fetch failed (HTTP ${response.status})`);
        const result = await response.json();
        if (isMounted) {
          setTimelineData(result.timeline || null);
          setTimelineLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setTimelineData(null);
          setTimelineLoading(false);
        }
      }
    };

    fetchTimeline();
    return () => { isMounted = false; };
  }, [mainLoaded, gameId, token]);

  const isRateLimited = rateLimitType !== 'none' || data?.rate_limit_exceeded;

  if (isRateLimited) {
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

        <div style={{
          padding: '4rem 2rem',
          borderRadius: '16px',
          background: 'rgba(13, 17, 23, 0.45)',
          backdropFilter: 'blur(20px)',
          border: (rateLimitType === 'rpd' || data?.daily_limit_exceeded) ? '1px solid rgba(171, 71, 188, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.5rem',
          marginTop: '2rem'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: (rateLimitType === 'rpd' || data?.daily_limit_exceeded) ? 'rgba(171, 71, 188, 0.15)' : 'rgba(245, 158, 11, 0.15)',
            color: (rateLimitType === 'rpd' || data?.daily_limit_exceeded) ? '#ab47bc' : '#ffe179',
            border: (rateLimitType === 'rpd' || data?.daily_limit_exceeded) ? '1px solid rgba(171, 71, 188, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '40px',
            boxShadow: (rateLimitType === 'rpd' || data?.daily_limit_exceeded) ? '0 0 25px rgba(171, 71, 188, 0.25)' : '0 0 25px rgba(245, 158, 11, 0.25)'
          }} className="animate-pulse">
            🔮
          </div>
          <h2 style={{
            fontFamily: 'var(--font-headline)',
            fontSize: '1.8rem',
            fontWeight: 800,
            margin: '10px 0 0 0',
            color: '#ffffff'
          }}>
            The Inkwells are Cooling
          </h2>
          <p style={{
            maxWidth: '550px',
            margin: 0,
            fontSize: '1rem',
            lineHeight: 1.7,
            color: 'var(--on-surface-variant)'
          }}>
            The Great Illuminary has temporarily run low on magical ink. The archives are recharging—please wait a brief moment before exploring further match reviews.
          </p>
          {onBack && (
            <button onClick={onBack} className="btn-primary" style={{ marginTop: '1rem' }}>
              Return to Library
            </button>
          )}
        </div>
      </div>
    );
  }

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

  const { mulligan_analysis, takeaways, match_metadata, timeline } = data;
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

        {/* 3. THE PIVOT TURN PANEL */}
        <AnimatePresence mode="wait">
          {pivotLoading ? (
            <motion.section
              key="pivot-loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="glass-panel"
              style={{
                padding: '2.5rem 2rem',
                borderRadius: '16px',
                border: '1px solid rgba(0, 240, 255, 0.15)',
                overflow: 'hidden',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1.25rem',
                textAlign: 'center',
                minHeight: '200px'
              }}
            >
              {/* Shimmer border animation */}
              <div style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '16px',
                background: 'linear-gradient(90deg, transparent, rgba(0,240,255,0.04), transparent)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s infinite linear',
                pointerEvents: 'none'
              }} />
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: 'rgba(0, 240, 255, 0.08)',
                border: '2px solid rgba(0, 240, 255, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '26px',
                boxShadow: '0 0 20px rgba(0, 240, 255, 0.15)'
              }} className="animate-pulse">
                🔮
              </div>
              <div>
                <div style={{
                  fontFamily: 'var(--font-headline)',
                  fontSize: '1.15rem',
                  fontWeight: 800,
                  color: '#fff',
                  marginBottom: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}>
                  <Zap size={18} style={{ color: 'rgba(0,240,255,0.8)' }} />
                  Deep Thinking
                  <span style={{ display: 'inline-flex', gap: '2px', marginLeft: '2px' }}>
                    <span style={{ animation: 'dot-pulse 1.4s infinite', animationDelay: '0s', width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(0,240,255,0.7)', display: 'inline-block' }} />
                    <span style={{ animation: 'dot-pulse 1.4s infinite', animationDelay: '0.2s', width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(0,240,255,0.7)', display: 'inline-block' }} />
                    <span style={{ animation: 'dot-pulse 1.4s infinite', animationDelay: '0.4s', width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(0,240,255,0.7)', display: 'inline-block' }} />
                  </span>
                </div>
                <p style={{
                  margin: 0,
                  fontSize: '0.85rem',
                  color: 'var(--on-surface-variant)',
                  lineHeight: 1.6,
                  maxWidth: '380px'
                }}>
                  The Pivot Analyst is scanning the inklines for the critical momentum shift.
                </p>
              </div>
            </motion.section>
          ) : pivotData ? (
            <motion.section
              key="pivot-content"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="glass-panel"
              style={{
                padding: '2rem',
                borderRadius: '16px',
                border: '1px solid rgba(0, 240, 255, 0.25)',
                boxShadow: '0 0 35px rgba(0, 240, 255, 0.1)',
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              {/* Pivot rate-limit state — scoped to panel only */}
              {pivotData.rate_limit_exceeded ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ fontSize: '32px' }} className="animate-pulse">🔮</div>
                  <p style={{ margin: 0, color: 'var(--on-surface-variant)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                    The Inkwells are Cooling — the Pivot Analyst will be ready shortly.
                  </p>
                </div>
              ) : (
                <>
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
                      Turn {pivotData.round_number} ({pivotData.tag || 'Momentum Shift'})
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
                          {pivotData.round_number}
                        </div>
                        <div>
                          <h4 style={{ margin: 0, color: 'var(--primary-fixed-dim)', textTransform: 'uppercase', fontFamily: 'var(--font-technical)', fontSize: '0.75rem', letterSpacing: '1px' }}>
                            Pivot Turn round
                          </h4>
                          <span style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
                            {pivotData.tag}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '8px' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>Player State</span>
                          <strong style={{ color: 'var(--primary-fixed-dim)' }}>
                            {pivotData.player_state?.lore} Lore / {pivotData.player_state?.ink} Ink
                          </strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '8px' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>Opponent State</span>
                          <strong style={{ color: 'var(--ink-magenta)' }}>
                            {pivotData.opponent_state?.lore} Lore / {pivotData.opponent_state?.ink} Ink
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
                            {pivotData.your_actions}
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
                            {pivotData.momentum_shift}
                          </p>
                        </div>
                      </div>
                    </div>

                  </div>
                </>
              )}
            </motion.section>
          ) : null}
        </AnimatePresence>

        {/* 4. MATCH MOMENTUM TIMELINE — Premium Structured Tracker */}
        <section className="glass-panel" style={{ padding: '2rem', borderRadius: '16px', border: '1px solid var(--glass-stroke)' }}>
          <h3 style={{ fontFamily: 'var(--font-headline)', color: '#fff', fontSize: '1.25rem', margin: '0 0 2rem 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock size={20} style={{ color: 'var(--primary-fixed-dim)' }} /> Match Momentum Timeline
          </h3>

          <AnimatePresence mode="wait">
            {timelineLoading ? (
              <motion.div
                key="tl-loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '1.25rem',
                  padding: '3rem 2rem',
                  textAlign: 'center'
                }}
              >
                <div style={{
                  width: '52px', height: '52px', borderRadius: '50%',
                  background: 'rgba(168,85,247,0.08)', border: '2px solid rgba(168,85,247,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '26px', boxShadow: '0 0 20px rgba(168,85,247,0.15)'
                }} className="animate-pulse">🔮</div>
                <div>
                  <div style={{
                    fontFamily: 'var(--font-headline)', fontSize: '1.1rem', fontWeight: 800,
                    color: '#fff', marginBottom: '6px', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: '8px'
                  }}>
                    <Zap size={16} style={{ color: 'rgba(168,85,247,0.9)' }} />
                    Charting the Momentum
                    <span style={{ display: 'inline-flex', gap: '2px', marginLeft: '2px' }}>
                      {[0, 0.2, 0.4].map((delay, i) => (
                        <span key={i} style={{ animation: 'dot-pulse 1.4s infinite', animationDelay: `${delay}s`, width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(168,85,247,0.8)', display: 'inline-block' }} />
                      ))}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--on-surface-variant)', lineHeight: 1.6, maxWidth: '320px' }}>
                    The Analyst is mapping significant turns into the tracker.
                  </p>
                </div>
              </motion.div>
            ) : timelineData && timelineData.length > 0 ? (
              <motion.div
                key="tl-content"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                style={{ position: 'relative', paddingLeft: '2.5rem', display: 'flex', flexDirection: 'column', gap: '0' }}
              >
                {/* Gradient vertical connector line */}
                <div style={{
                  position: 'absolute', left: '15px', top: '12px',
                  bottom: '12px', width: '2px',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(168,85,247,0.4) 50%, rgba(255,255,255,0.05) 100%)',
                  borderRadius: '1px'
                }} />

                {timelineData.map((entry, idx) => {
                  const isPivot = entry.isPivotTurn;
                  const isLast = idx === timelineData.length - 1;

                  return (
                    <div key={idx} style={{ position: 'relative', marginBottom: isLast ? 0 : '1.5rem' }}>
                      {/* Round marker ring */}
                      <div style={{
                        position: 'absolute', left: '-34px', top: '12px',
                        width: '20px', height: '20px', borderRadius: '50%',
                        background: isPivot ? 'rgba(168,85,247,0.15)' : 'rgba(13,17,23,0.8)',
                        border: isPivot ? '2px solid #c084fc' : '2px solid rgba(255,255,255,0.12)',
                        boxShadow: isPivot ? '0 0 15px #c084fc, 0 0 30px rgba(192,132,252,0.3)' : 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 2,
                        transition: 'all 0.2s ease'
                      }}>
                        <div style={{
                          width: '6px', height: '6px', borderRadius: '50%',
                          background: isPivot ? '#c084fc' : 'rgba(255,255,255,0.3)'
                        }} />
                      </div>

                      {/* Round card */}
                      <div style={{
                        background: isPivot ? 'rgba(168,85,247,0.06)' : 'rgba(255,255,255,0.01)',
                        border: isPivot ? '1px solid rgba(168,85,247,0.25)' : '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1.1rem 1.25rem',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        boxShadow: isPivot ? '0 0 25px rgba(168,85,247,0.1)' : 'none',
                        transition: 'all 0.2s ease'
                      }}>
                        {/* Round header */}
                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '0.85rem' }}>
                          <span style={{
                            fontFamily: 'var(--font-technical)',
                            fontSize: '0.75rem', fontWeight: 700,
                            color: isPivot ? '#c084fc' : 'var(--on-surface-variant)',
                            textTransform: 'uppercase', letterSpacing: '0.08em'
                          }}>
                            Round {entry.round}
                          </span>

                          {isPivot && (
                            <span style={{
                              background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(192,132,252,0.15))',
                              border: '1px solid rgba(192,132,252,0.4)',
                              color: '#c084fc',
                              padding: '2px 10px',
                              borderRadius: '20px',
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              fontFamily: 'var(--font-technical)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.06em',
                              display: 'flex', alignItems: 'center', gap: '4px',
                              boxShadow: '0 0 10px rgba(168,85,247,0.2)'
                            }}>
                              <Zap size={10} /> AI Insight: Pivot Turn
                            </span>
                          )}
                        </div>

                        {/* Action pills */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: entry.aiInsight ? '1rem' : 0 }}>
                          {entry.actions.map((action, aIdx) => {
                            const pillConfig = {
                              'wipe':          { bg: 'rgba(239,68,68,0.1)', border: 'rgba(185,28,28,0.4)', color: '#f87171', Icon: ShieldAlert },
                              'challenge':     { bg: 'rgba(251,191,36,0.1)', border: 'rgba(180,130,0,0.4)', color: '#fbbf24', Icon: Swords },
                              'win-condition': { bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.35)', color: '#c084fc', Icon: Sparkles },
                              'ink':           { bg: 'rgba(96,165,250,0.1)', border: 'rgba(59,130,246,0.3)', color: '#93c5fd', Icon: GitCommit },
                              'play':          { bg: 'rgba(52,211,153,0.1)', border: 'rgba(16,185,129,0.3)', color: '#6ee7b7', Icon: PlusCircle }
                            };
                            const cfg = pillConfig[action.type] || pillConfig['play'];
                            const { bg, border, color, Icon } = cfg;

                            return (
                              <span key={aIdx} style={{
                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                background: bg,
                                border: `1px solid ${border}`,
                                color: color,
                                padding: '3px 10px 3px 7px',
                                borderRadius: '20px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                fontFamily: 'var(--font-body)',
                                lineHeight: 1.4,
                                whiteSpace: 'nowrap'
                              }}>
                                <Icon size={11} />
                                {action.label}
                              </span>
                            );
                          })}
                        </div>

                        {/* aiInsight block */}
                        {entry.aiInsight && (
                          <div style={{
                            borderLeft: '3px solid rgba(168,85,247,0.4)',
                            paddingLeft: '12px',
                            marginTop: '2px'
                          }}>
                            <p style={{
                              margin: 0,
                              fontSize: '0.82rem',
                              fontStyle: 'italic',
                              color: 'rgba(192,132,252,0.85)',
                              lineHeight: 1.6
                            }}>
                              {entry.aiInsight}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            ) : !timelineLoading ? (
              <motion.div
                key="tl-empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ textAlign: 'center', padding: '2rem', color: 'var(--on-surface-variant)', fontSize: '0.9rem' }}
              >
                Timeline data unavailable for this match.
              </motion.div>
            ) : null}
          </AnimatePresence>
        </section>



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
