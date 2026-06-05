import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, TrendingUp, Clock, Sparkles, Cpu, Layers, 
  ArrowRight, ChevronRight, AlertCircle, CheckCircle2, 
  XCircle, ArrowLeft, Loader2, Award, ExternalLink
} from 'lucide-react';
import DeckColorBadge from './DeckColorBadge';

const inkColors = {
  Amber: { color: '#ffb300', bg: 'rgba(255,179,0,0.15)' },
  Amethyst: { color: '#ab47bc', bg: 'rgba(171,71,188,0.15)' },
  Emerald: { color: '#2ec4b6', bg: 'rgba(46,196,182,0.15)' },
  Ruby: { color: '#e71d36', bg: 'rgba(231,29,54,0.15)' },
  Sapphire: { color: '#118ab2', bg: 'rgba(17,138,178,0.15)' },
  Steel: { color: '#90a4ae', bg: 'rgba(144,164,174,0.15)' }
};

const LorebookReview = ({ deckId, decks = [], token, onSelectDeck, onBackToDashboard, onSelectMatch, matches = [] }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredCardKey, setHoveredCardKey] = useState(null);

  const activeDeck = decks.find(d => d.id === deckId);
  const primaryColorName = activeDeck?.colors?.[0]?.toLowerCase();
  const secondaryColorName = activeDeck?.colors?.[1]?.toLowerCase();

  useEffect(() => {
    if (!deckId) return;

    const fetchAnalysis = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/decks/${deckId}/analysis`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
          throw new Error(`Failed to load deck analysis (HTTP ${res.status})`);
        }
        const data = await res.json();
        setAnalysis(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [deckId, token]);

  const getFilteredMatches = () => {
    if (!activeDeck) return [];
    return matches.filter(m => {
      const colorsMatch = m.your_deck_colors === activeDeck.colors.join('/');
      const formatMatch = activeDeck.format ? (m.format_type === 'infinity' ? 'Infinity' : 'Core') === activeDeck.format : true;
      return colorsMatch && formatMatch;
    });
  };

  const deckMatches = getFilteredMatches();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--obsidian-base)', color: 'var(--on-surface)' }}>
      <div className="starfield-bg" />

      {/* Sidebar Switcher (Desktop only) */}
      <nav style={{
        width: '280px',
        borderRight: '1px solid var(--glass-stroke)',
        background: 'rgba(5, 7, 10, 0.8)',
        backdropFilter: 'blur(20px)',
        padding: '2rem 0',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        zIndex: 10,
        overflowY: 'auto'
      }}>
        <div 
          onClick={onBackToDashboard}
          style={{ padding: '0 1.5rem', marginBottom: '2rem', cursor: 'pointer' }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = 0.8}
          onMouseLeave={(e) => e.currentTarget.style.opacity = 1}
        >
          <h1 style={{ 
            fontFamily: 'var(--font-headline)', 
            fontSize: '1.4rem', 
            margin: 0, 
            color: 'var(--primary-fixed)',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }} className="neon-text-primary">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span> The Library
          </h1>
          <p style={{ fontFamily: 'var(--font-technical)', fontSize: '0.72rem', color: 'var(--on-surface-variant)', margin: '4px 0 0 0' }}>
            Lorcana Coach AI (Return to Hub)
          </p>
        </div>

        <div style={{ flex: 1 }}>
          <p style={{
            padding: '0 1.5rem',
            fontFamily: 'var(--font-technical)',
            fontSize: '0.65rem',
            color: 'rgba(220, 228, 229, 0.4)',
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            marginBottom: '0.75rem'
          }}>
            My Decks
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {decks.map(d => {
              const isSelected = d.id === deckId;
              return (
                <button
                  key={d.id}
                  onClick={() => onSelectDeck(d.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    padding: '0.75rem 1.5rem',
                    background: isSelected ? 'rgba(0, 240, 255, 0.08)' : 'transparent',
                    border: 'none',
                    borderLeft: isSelected ? '3px solid var(--primary-fixed-dim)' : '3px solid transparent',
                    color: isSelected ? '#ffffff' : 'var(--on-surface-variant)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    transition: 'all 0.2s'
                  }}
                  className="sidebar-deck-btn"
                >
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{d.name.split(' (')[0]}</span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '0.75rem', opacity: 0.8 }}>
                    <span>{d.winRate} WR</span>
                    <span>{d.matches} games</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ padding: '0 1.5rem', marginTop: 'auto' }}>
          <button 
            onClick={onBackToDashboard}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--glass-stroke)',
              color: 'var(--on-surface-variant)',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 240, 255, 0.05)';
              e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.3)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
              e.currentTarget.style.borderColor = 'var(--glass-stroke)';
              e.currentTarget.style.color = 'var(--on-surface-variant)';
            }}
          >
            <ArrowLeft size={16} /> Command Center
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main style={{ flex: 1, marginLeft: '280px', padding: '2.5rem 3rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          {/* Breadcrumbs */}
          <nav style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            fontFamily: 'var(--font-technical)', 
            fontSize: '0.75rem',
            color: 'var(--on-surface-variant)',
            marginBottom: '1rem'
          }}>
            <button 
              onClick={onBackToDashboard} 
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary-fixed)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}
            >
              Library
            </button>
            <ChevronRight size={12} />
            <span style={{ color: 'var(--primary-fixed)' }}>{activeDeck?.name}</span>
          </nav>

          {/* Heading block */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <h2 style={{ 
                  fontFamily: 'var(--font-headline)', 
                  fontSize: '2.2rem', 
                  fontWeight: 800, 
                  margin: 0,
                  color: '#ffffff'
                }}>
                  The Lorebook <span style={{ color: 'var(--primary-fixed-dim)', fontWeight: 300 }}>// {activeDeck?.colors.join('/')}</span>
                </h2>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  background: 'rgba(0, 240, 255, 0.1)',
                  border: '1px solid rgba(0, 240, 255, 0.3)',
                  color: 'var(--primary-fixed)',
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}>
                  {activeDeck?.format}
                </span>
              </div>
              
              {/* Tags Row */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                {analysis?.tags?.map(t => (
                  <span 
                    key={t}
                    style={{
                      fontSize: '0.75rem',
                      padding: '2px 10px',
                      borderRadius: '12px',
                      background: 'var(--surface-container-highest)',
                      border: '1px solid var(--outline-variant)',
                      color: 'var(--on-surface-variant)'
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Top Improvement Card */}
            {analysis?.top_improvement && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-panel"
                style={{
                  padding: '1rem 1.5rem',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  borderColor: 'rgba(0, 240, 255, 0.3)',
                  background: 'rgba(0, 240, 255, 0.03)',
                  maxWidth: '450px'
                }}
              >
                <div style={{
                  background: 'rgba(0, 240, 255, 0.15)',
                  color: 'var(--primary-fixed)',
                  padding: '8px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <TrendingUp size={20} />
                </div>
                <div>
                  <span style={{ 
                    fontFamily: 'var(--font-technical)', 
                    fontSize: '0.65rem', 
                    color: 'var(--primary-fixed)', 
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    letterSpacing: '1px',
                    display: 'block'
                  }}>
                    Top Improvement
                  </span>
                  <p style={{ margin: '2px 0 0 0', fontWeight: 600, fontSize: '0.9rem', color: '#fff', lineHeight: 1.4 }}>
                    {analysis.top_improvement}
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '40vh', color: 'var(--on-surface-variant)' }}>
              <Loader2 className="animate-spin" size={40} style={{ color: 'var(--primary-fixed-dim)', marginBottom: '1rem' }} />
              <p>Studying match logs & compiling deck insights...</p>
            </div>
          ) : error ? (
            <div style={{
              padding: '2rem',
              borderRadius: '12px',
              background: 'rgba(255, 23, 68, 0.05)',
              border: '1px solid rgba(255, 23, 68, 0.15)',
              color: 'var(--error)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              <AlertCircle size={28} />
              <div>
                <h4 style={{ margin: '0 0 4px 0' }}>Failed to compile analysis</h4>
                <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>{error}</p>
              </div>
            </div>
          ) : analysis?.status === 'need_more_data' ? (
            <div className="glass-panel" style={{
              padding: '2.5rem',
              borderRadius: '16px',
              display: 'flex',
              gap: '1.5rem',
              alignItems: 'flex-start',
              borderColor: 'rgba(171, 71, 188, 0.3)',
              background: 'rgba(171, 71, 188, 0.02)',
              marginBottom: '3rem'
            }}>
              <div style={{
                background: 'rgba(171, 71, 188, 0.15)',
                color: 'var(--secondary)',
                padding: '12px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <BookOpen size={32} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '1.3rem', fontFamily: 'var(--font-headline)' }}>
                  Lorebook Study in Progress
                </h3>
                <p style={{ margin: 0, color: 'var(--on-surface-variant)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                  Our AI Coach needs at least <strong>3 games</strong> logged with <strong>{activeDeck?.name.split(' (')[0]}</strong> on Duels.ink to run comprehensive archetype analytics.
                </p>
                <div style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  background: 'rgba(255,255,255,0.03)', 
                  border: '1px solid var(--glass-stroke)',
                  padding: '6px 12px', 
                  borderRadius: '6px',
                  marginTop: '1.5rem',
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-technical)'
                }}>
                  Current match count: <strong style={{ color: 'var(--secondary)' }}>{analysis.match_count} / 3</strong>
                </div>
              </div>
            </div>
          ) : (
            <div>
              
              {/* Stats Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                
                {/* Stat 1 */}
                <div className="glass-panel gradient-stroke" style={{ padding: '1.5rem', borderRadius: '14px', overflow: 'hidden', position: 'relative' }}>
                  {primaryColorName && (
                    <div style={{
                      position: 'absolute',
                      bottom: '-15px',
                      right: '-15px',
                      width: '80px',
                      height: '80px',
                      backgroundImage: `url(/ink-icons/${primaryColorName}.png)`,
                      backgroundSize: 'contain',
                      backgroundRepeat: 'no-repeat',
                      opacity: 0.05,
                      pointerEvents: 'none',
                      zIndex: 0
                    }} />
                  )}
                  <span style={{ 
                    fontFamily: 'var(--font-technical)', 
                    fontSize: '0.7rem', 
                    color: 'var(--on-surface-variant)', 
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    position: 'relative',
                    zIndex: 1
                  }}>
                    Archetype Win Rate
                  </span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '10px', position: 'relative', zIndex: 1 }}>
                    <span style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--primary-fixed)', fontFamily: 'var(--font-headline)' }}>
                      {analysis.metrics?.personal_win_rate}
                    </span>
                    <span style={{ 
                      fontSize: '0.8rem', 
                      color: analysis.metrics?.win_rate_delta?.startsWith('+') ? 'var(--primary-fixed-dim)' : 'var(--error)',
                      fontWeight: 600
                    }}>
                      {analysis.metrics?.win_rate_delta} vs Meta ({analysis.metrics?.meta_win_rate})
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginTop: '1rem', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
                    <div style={{ 
                      width: analysis.metrics?.personal_win_rate || '0%', 
                      height: '100%', 
                      background: 'var(--primary-fixed-dim)',
                      boxShadow: '0 0 10px var(--primary-fixed-dim)'
                    }} />
                  </div>
                </div>

                {/* Stat 2 */}
                <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '14px', overflow: 'hidden', position: 'relative' }}>
                  {(secondaryColorName || primaryColorName) && (
                    <div style={{
                      position: 'absolute',
                      bottom: '-15px',
                      right: '-15px',
                      width: '80px',
                      height: '80px',
                      backgroundImage: `url(/ink-icons/${secondaryColorName || primaryColorName}.png)`,
                      backgroundSize: 'contain',
                      backgroundRepeat: 'no-repeat',
                      opacity: 0.05,
                      pointerEvents: 'none',
                      zIndex: 0
                    }} />
                  )}
                  <span style={{ 
                    fontFamily: 'var(--font-technical)', 
                    fontSize: '0.7rem', 
                    color: 'var(--on-surface-variant)', 
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    position: 'relative',
                    zIndex: 1
                  }}>
                    Avg. Match Duration
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', position: 'relative', zIndex: 1 }}>
                    <Clock size={24} style={{ color: 'var(--secondary)' }} />
                    <span style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-headline)' }}>
                      {analysis.metrics?.avg_match_duration}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px', position: 'relative', zIndex: 1 }}>
                    <span style={{ 
                      fontFamily: 'var(--font-technical)', 
                      fontSize: '0.75rem', 
                      color: 'var(--secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      {analysis.metrics?.pacing_label}
                    </span>
                  </div>
                </div>

                {/* Stat 3 */}
                <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '14px', overflow: 'hidden', position: 'relative' }}>
                  {primaryColorName && (
                    <div style={{
                      position: 'absolute',
                      bottom: '-15px',
                      right: '-15px',
                      width: '80px',
                      height: '80px',
                      backgroundImage: `url(/ink-icons/${primaryColorName}.png)`,
                      backgroundSize: 'contain',
                      backgroundRepeat: 'no-repeat',
                      opacity: 0.05,
                      pointerEvents: 'none',
                      zIndex: 0
                    }} />
                  )}
                  <span style={{ 
                    fontFamily: 'var(--font-technical)', 
                    fontSize: '0.7rem', 
                    color: 'var(--on-surface-variant)', 
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    position: 'relative',
                    zIndex: 1
                  }}>
                    Ink Efficiency
                  </span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '10px', position: 'relative', zIndex: 1 }}>
                    <span style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--tertiary-fixed)', fontFamily: 'var(--font-headline)' }}>
                      {analysis.metrics?.ink_efficiency?.rating}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', position: 'relative', zIndex: 1 }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>
                      {analysis.metrics?.ink_efficiency?.label}
                    </span>
                  </div>
                </div>

              </div>

              {/* Bento Grid Layout */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
                
                {/* Left: Meta Breakdown & Synergies (Span 8) */}
                <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  
                  {/* Performance Narrative */}
                  <section className="glass-panel" style={{ 
                    padding: '2rem', 
                    borderRadius: '16px', 
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: '4px',
                      background: 'var(--primary-fixed-dim)'
                    }} />
                    <h3 style={{ 
                      margin: '0 0 1rem 0', 
                      fontSize: '1.25rem', 
                      fontFamily: 'var(--font-headline)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      color: '#ffffff'
                    }}>
                      <Cpu size={20} style={{ color: 'var(--primary-fixed)' }} /> Meta Performance Breakdown
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--on-surface-variant)', lineHeight: 1.6 }}>
                      {analysis.meta_performance_breakdown}
                    </p>
                  </section>

                  {/* Tactical Synergies */}
                  <section className="glass-panel" style={{ padding: '2rem', borderRadius: '16px' }}>
                    <h3 style={{ 
                      margin: '0 0 1.5rem 0', 
                      fontSize: '1.25rem', 
                      fontFamily: 'var(--font-headline)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      color: '#ffffff'
                    }}>
                      <Layers size={20} style={{ color: 'var(--secondary)' }} /> Key Tactical Synergies
                    </h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                      {analysis.key_synergies?.map((syn, idx) => (
                        <div 
                          key={idx} 
                          style={{
                            padding: '1.5rem',
                            borderRadius: '12px',
                            background: 'rgba(255,255,255,0.01)',
                            border: '1px solid var(--outline-variant)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            position: 'relative'
                          }}
                          className="synergy-card-wrapper"
                        >
                          {/* 3D Overlapping Card Artwork illustrations */}
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'center', 
                            position: 'relative',
                            height: '190px',
                            width: '220px',
                            marginBottom: '1rem',
                            perspective: '800px'
                          }}>
                             {syn.cards?.map((card, cidx) => {
                                const isHovered = hoveredCardKey === `${idx}-${cidx}`;
                                const rotateVal = isHovered ? 0 : (cidx === 0 ? -8 : 8);
                                const shiftX = cidx === 0 ? -24 : 24;
                                const zIndexVal = isHovered ? 10 : (cidx === 0 ? 1 : 2);
                                const colorStyle = inkColors[card.ink] || { color: '#00dbe9' };
                                
                                return (
                                  <motion.div
                                    key={cidx}
                                    onMouseEnter={() => setHoveredCardKey(`${idx}-${cidx}`)}
                                    onMouseLeave={() => setHoveredCardKey(null)}
                                    whileHover={{ 
                                      scale: 1.1,
                                      boxShadow: `0 0 30px ${colorStyle.color}`
                                    }}
                                    style={{
                                      position: 'absolute',
                                      width: '120px',
                                      height: '170px',
                                      borderRadius: '8px',
                                      border: `2px solid ${colorStyle.color}a0`,
                                      background: 'rgba(5, 7, 10, 0.95)',
                                      transform: `translateX(${shiftX}px) rotateZ(${rotateVal}deg)`,
                                      transformStyle: 'preserve-3d',
                                      boxShadow: '0 8px 16px rgba(0,0,0,0.6)',
                                      zIndex: zIndexVal,
                                      cursor: 'pointer',
                                      overflow: 'hidden',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      transition: 'transform 0.2s ease-out, z-index 0.1s'
                                    }}
                                  >
                                    {card.image_url ? (
                                      <img 
                                        src={card.image_url} 
                                        alt={card.name} 
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                      />
                                    ) : (
                                      <div style={{
                                        padding: '10px',
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        fontSize: '0.65rem'
                                      }}>
                                        <div style={{ fontWeight: 800, color: colorStyle.color, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
                                          {card.name}
                                        </div>
                                        <div style={{ opacity: 0.6, fontSize: '0.55rem' }}>
                                          Cost: {card.cost} • {card.ink}
                                        </div>
                                      </div>
                                    )}
                                  </motion.div>
                                );
                              })}
                          </div>

                          <h4 style={{ 
                            margin: '0 0 6px 0', 
                            fontSize: '0.95rem', 
                            color: 'var(--primary-fixed)', 
                            fontWeight: 600,
                            textAlign: 'center'
                          }}>
                            {syn.title}
                          </h4>
                          <p style={{ 
                            margin: 0, 
                            fontSize: '0.8rem', 
                            color: 'var(--on-surface-variant)', 
                            textAlign: 'center', 
                            lineHeight: 1.5,
                            opacity: 0.8
                          }}>
                            {syn.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>

                </div>

                {/* Right: Directives & Timeline (Span 4) */}
                <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  
                  {/* Coaching Directives Rail */}
                  <aside className="glass-panel" style={{ 
                    padding: '2rem', 
                    borderRadius: '16px', 
                    display: 'flex', 
                    flexDirection: 'column',
                    height: '100%',
                    background: 'linear-gradient(to bottom, rgba(13, 17, 23, 0.45), rgba(5, 7, 10, 0.6))'
                  }}>
                    <h3 style={{ 
                      margin: '0 0 1.5rem 0', 
                      fontSize: '1.25rem', 
                      fontFamily: 'var(--font-headline)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      color: '#ffffff'
                    }}>
                      <Award size={20} style={{ color: 'var(--tertiary-fixed)' }} /> AI Directives
                    </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>
                      {analysis.coaching_directives?.map((dir, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                          <div style={{
                            padding: '6px',
                            background: 'rgba(0, 240, 255, 0.1)',
                            border: '1px solid rgba(0, 240, 255, 0.25)',
                            borderRadius: '6px',
                            color: 'var(--primary-fixed)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginTop: '2px'
                          }}>
                            {/* Map string icons to simple symbols */}
                            <Sparkles size={14} />
                          </div>
                          <div>
                            <span style={{ 
                              fontFamily: 'var(--font-technical)', 
                              fontSize: '0.65rem', 
                              color: 'var(--primary-fixed-dim)',
                              textTransform: 'uppercase',
                              fontWeight: 700,
                              letterSpacing: '0.5px',
                              display: 'block'
                            }}>
                              {dir.type}
                            </span>
                            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--on-surface-variant)', lineHeight: 1.4 }}>
                              {dir.instruction}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Timeline Graph */}
                    <div style={{ borderTop: '1px solid var(--glass-stroke)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
                      <h4 style={{ 
                        fontFamily: 'var(--font-technical)', 
                        fontSize: '0.7rem', 
                        color: 'var(--on-surface-variant)',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        marginBottom: '1rem'
                      }}>
                        Win Condition Timeline
                      </h4>
                      <div style={{ height: '120px', display: 'flex', alignItems: 'end', gap: '12px', padding: '0 8px' }}>
                        {Object.entries(analysis.win_condition_timeline || {}).map(([key, val]) => {
                          const percent = val.percentage || 0;
                          const barColor = key === 'early' ? 'var(--primary-fixed)' : key === 'mid' ? 'var(--secondary)' : 'var(--tertiary-fixed)';
                          const glowShadow = key === 'early' ? 'rgba(0, 240, 255, 0.25)' : key === 'mid' ? 'rgba(171, 71, 188, 0.25)' : 'rgba(234, 195, 36, 0.25)';
                          
                          return (
                            <div key={key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'end' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: barColor }}>{percent}%</span>
                              <motion.div 
                                initial={{ height: 0 }}
                                animate={{ height: `${percent * 0.8}%` }}
                                style={{
                                  width: '100%',
                                  background: barColor,
                                  borderRadius: '4px 4px 0 0',
                                  boxShadow: `0 0 12px ${glowShadow}`
                                }}
                                whileHover={{ filter: 'brightness(1.2)' }}
                              />
                              <span style={{ 
                                fontSize: '0.65rem', 
                                color: 'rgba(220, 228, 229, 0.4)', 
                                fontFamily: 'var(--font-technical)',
                                textTransform: 'capitalize',
                                marginTop: '4px'
                              }}>
                                {key}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </aside>

                </div>

              </div>

              {/* Filtered Matches List */}
              <div style={{ marginBottom: '4rem' }}>
                <h3 style={{ 
                  fontFamily: 'var(--font-headline)', 
                  fontSize: '1.4rem', 
                  marginBottom: '1.5rem',
                  color: '#ffffff'
                }}>
                  Recent Matches ({activeDeck?.name.split(' (')[0]})
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {deckMatches.map(m => {
                    const isWin = m.result?.toLowerCase() === 'win';
                    return (
                      <div 
                        key={m.game_id} 
                        className="glass-panel glass-panel-hover" 
                        style={{
                          padding: '1.25rem 2rem',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '1rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            padding: '4px 12px',
                            borderRadius: '20px',
                            textTransform: 'uppercase',
                            background: isWin ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255, 45, 85, 0.1)',
                            border: isWin ? '1px solid rgba(0, 240, 255, 0.3)' : '1px solid rgba(255, 45, 85, 0.3)',
                            color: isWin ? 'var(--primary-fixed-dim)' : 'var(--ink-magenta)'
                          }}>
                            {isWin ? 'Win' : 'Loss'}
                          </span>
                          <div>
                            <strong style={{ fontSize: '1.05rem', color: '#fff' }}>vs {m.opp_display_name}</strong>
                            <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginTop: '2px' }}>
                              Opponent Deck: {m.opp_deck_colors} • Format: {m.format_type?.toUpperCase()}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                          <div style={{ textAlign: 'right', display: 'none', md: 'block' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--on-surface)' }}>{m.turns} Turns</span>
                            <div style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', marginTop: '2px' }}>
                              {m.went_first ? 'Went First' : 'Went Second'}
                            </div>
                          </div>

                          <button
                            onClick={() => onSelectMatch(m.game_id)}
                            style={{
                              padding: '8px 18px',
                              borderRadius: '6px',
                              background: 'rgba(0, 240, 255, 0.08)',
                              border: '1px solid var(--primary-fixed-dim)',
                              color: 'var(--primary-fixed)',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '0.85rem',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'var(--primary-container)';
                              e.currentTarget.style.color = 'var(--on-primary)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(0, 240, 255, 0.08)';
                              e.currentTarget.style.color = 'var(--primary-fixed)';
                            }}
                          >
                            Coach Analysis <ArrowRight size={14} />
                          </button>
                        </div>

                      </div>
                    );
                  })}

                  {deckMatches.length === 0 && (
                    <div style={{
                      textAlign: 'center',
                      padding: '3rem',
                      color: 'var(--on-surface-variant)',
                      background: 'rgba(255,255,255,0.01)',
                      border: '1px dashed var(--outline-variant)',
                      borderRadius: '12px'
                    }}>
                      No matches detected with this deck in history.
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default LorebookReview;
