import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Loader2, CornerDownRight, TrendingUp } from 'lucide-react';

const getRatingBadgeStyle = (rating) => {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '0.85rem',
    fontWeight: 'bold',
    border: '1px solid',
    marginBottom: '1rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  };

  switch (rating?.toLowerCase()) {
    case 'optimal':
      return {
        ...base,
        background: 'rgba(16, 185, 129, 0.1)',
        color: '#34d399',
        borderColor: 'rgba(16, 185, 129, 0.2)'
      };
    case 'suboptimal':
      return {
        ...base,
        background: 'rgba(245, 158, 11, 0.1)',
        color: '#fbbf24',
        borderColor: 'rgba(245, 158, 11, 0.2)'
      };
    case 'mistake':
      return {
        ...base,
        background: 'rgba(244, 63, 94, 0.1)',
        color: '#fb7185',
        borderColor: 'rgba(244, 63, 94, 0.2)'
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

const CoachAnalysisTabs = ({ gameId, token }) => {
  const [activeTab, setActiveTab] = useState('mulligan');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const tabs = [
    { id: 'mulligan', label: 'Mulligan Phase' },
    { id: 'pivot', label: 'The Pivot Turn' },
    { id: 'takeaways', label: 'Takeaways' }
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', color: '#a0aec0' }}>
        <Loader2 className="animate-spin" size={32} style={{ color: '#b388ff', marginBottom: '1rem' }} />
        <span style={{ fontSize: '0.95rem' }}>Coach is studying the inklines...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#ff1744', background: 'rgba(255,23,68,0.1)', borderRadius: '8px', border: '1px solid rgba(255,23,68,0.2)' }}>
        <p>Error loading coaching review: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  const { mulligan_analysis, pivot_turn, takeaways } = data;

  return (
    <div style={{ background: 'rgba(20, 20, 30, 0.9)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(142, 45, 226, 0.3)', marginTop: '1rem' }}>
      {/* Tab headers */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'transparent',
              color: activeTab === tab.id ? '#b388ff' : '#a0aec0',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #b388ff' : '2px solid transparent',
              padding: '10px 20px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'color 0.2s',
              marginRight: '0.5rem'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab body */}
      <div style={{ color: '#e2e8f0', minHeight: '150px' }}>
        {activeTab === 'mulligan' && (
          <div>
            {mulligan_analysis?.execution_rating && (
              <div style={getRatingBadgeStyle(mulligan_analysis.execution_rating)}>
                Mulligan: {mulligan_analysis.execution_rating}
              </div>
            )}
            <p style={{ fontStyle: 'italic', color: '#cbd5e1', lineHeight: '1.6', fontSize: '1.05rem', marginBottom: '1.5rem', borderLeft: '3px solid #b388ff', paddingLeft: '1rem' }}>
              "{mulligan_analysis?.coach_verdict}"
            </p>
            {/* Visualizing Card Details */}
            {mulligan_analysis?.cards_details && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <h5 style={{ margin: '0 0 0.75rem 0', color: '#a0aec0' }}>Initial Keepers</h5>
                  <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.9rem', color: '#cbd5e1', listStyleType: 'square' }}>
                    {mulligan_analysis.cards_details.initial_hand?.map((c, i) => (
                      <li key={i} style={{ marginBottom: '0.4rem' }}>
                        <strong>{c.name}</strong> {c.cost !== undefined && `(${c.cost}¤)`}
                      </li>
                    ))}
                    {(!mulligan_analysis.cards_details.initial_hand || mulligan_analysis.cards_details.initial_hand.length === 0) && <li>No cards logged</li>}
                  </ul>
                </div>
                <div style={{ background: 'rgba(255,23,68,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,23,68,0.05)' }}>
                  <h5 style={{ margin: '0 0 0.75rem 0', color: '#ff8a80' }}>Mulliganed Out</h5>
                  <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.9rem', color: '#ff8a80', listStyleType: 'square' }}>
                    {mulligan_analysis.cards_details.mulliganed?.map((c, i) => (
                      <li key={i} style={{ marginBottom: '0.4rem' }}>
                        {c.name}
                      </li>
                    ))}
                    {(!mulligan_analysis.cards_details.mulliganed || mulligan_analysis.cards_details.mulliganed.length === 0) && <li>None</li>}
                  </ul>
                </div>
                <div style={{ background: 'rgba(0,230,118,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(0,230,118,0.05)' }}>
                  <h5 style={{ margin: '0 0 0.75rem 0', color: '#b9f6ca' }}>Drawn Replacements</h5>
                  <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.9rem', color: '#b9f6ca', listStyleType: 'square' }}>
                    {mulligan_analysis.cards_details.drawn?.map((c, i) => (
                      <li key={i} style={{ marginBottom: '0.4rem' }}>
                        {c.name}
                      </li>
                    ))}
                    {(!mulligan_analysis.cards_details.drawn || mulligan_analysis.cards_details.drawn.length === 0) && <li>None</li>}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'pivot' && pivot_turn && (
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#cbd5e1' }}>
                Turn {pivot_turn.round_number}
              </span>
              <span style={{ background: 'rgba(179,136,255,0.2)', border: '1px solid #b388ff', color: '#b388ff', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                {pivot_turn.tag}
              </span>
            </div>

            {/* Lore and Ink comparison cards */}
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '150px', background: 'rgba(255,255,255,0.03)', padding: '0.75rem 1rem', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.8rem', color: '#a0aec0', marginBottom: '0.2rem' }}>Player State</div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{pivot_turn.player_state?.lore} Lore</span>
                  <span>{pivot_turn.player_state?.ink} Ink</span>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: '150px', background: 'rgba(255,255,255,0.03)', padding: '0.75rem 1rem', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.8rem', color: '#a0aec0', marginBottom: '0.2rem' }}>Opponent State</div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{pivot_turn.opponent_state?.lore} Lore</span>
                  <span>{pivot_turn.opponent_state?.ink} Ink</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
              <CornerDownRight size={20} style={{ color: '#b388ff', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: '#a0aec0', display: 'block', fontSize: '0.85rem', textTransform: 'uppercase' }}>Your Actions</strong>
                <p style={{ margin: '4px 0 0 0', color: '#cbd5e1' }}>{pivot_turn.your_actions}</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <TrendingUp size={20} style={{ color: '#00e676', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: '#a0aec0', display: 'block', fontSize: '0.85rem', textTransform: 'uppercase' }}>Momentum Shift</strong>
                <p style={{ margin: '4px 0 0 0', color: '#cbd5e1' }}>{pivot_turn.momentum_shift}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'takeaways' && (
          <div className="markdown-body">
            <ReactMarkdown>{takeaways}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoachAnalysisTabs;
