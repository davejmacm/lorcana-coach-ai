import React, { useState } from 'react';

const inkColors = {
  Amber: { name: 'Amber', color: '#ffb300', bg: 'rgba(255,179,0,0.15)', border: 'rgba(255,179,0,0.4)', text: 'A' },
  Amethyst: { name: 'Amethyst', color: '#ab47bc', bg: 'rgba(171,71,188,0.15)', border: 'rgba(171,71,188,0.4)', text: 'Am' },
  Emerald: { name: 'Emerald', color: '#2ec4b6', bg: 'rgba(46,196,182,0.15)', border: 'rgba(46,196,182,0.4)', text: 'E' },
  Ruby: { name: 'Ruby', color: '#e71d36', bg: 'rgba(231,29,54,0.15)', border: 'rgba(231,29,54,0.4)', text: 'R' },
  Sapphire: { name: 'Sapphire', color: '#118ab2', bg: 'rgba(17,138,178,0.15)', border: 'rgba(17,138,178,0.4)', text: 'S' },
  Steel: { name: 'Steel', color: '#90a4ae', bg: 'rgba(144,164,174,0.15)', border: 'rgba(144,164,174,0.4)', text: 'St' }
};

const DeckColorBadge = ({ colors = [], size = 24 }) => {
  const [imageErrors, setImageErrors] = useState({});

  if (!colors || colors.length === 0) return null;

  const handleImageError = (color) => {
    setImageErrors(prev => ({ ...prev, [color]: true }));
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <div style={{ display: 'flex', position: 'relative', height: `${size}px`, width: `${size + (colors.length - 1) * (size * 0.5)}px` }}>
        {colors.map((colorName, idx) => {
          const matchedColor = inkColors[colorName] || { color: '#ffffff', bg: 'rgba(255,255,255,0.1)', text: '?' };
          const useFallback = imageErrors[colorName];
          const lowerColor = colorName.toLowerCase();
          
          return (
            <div
              key={colorName}
              style={{
                position: 'absolute',
                left: `${idx * (size * 0.45)}px`,
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: '50%',
                background: matchedColor.bg,
                border: `1.5px solid ${matchedColor.color}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 0 10px ${matchedColor.color}80`,
                zIndex: colors.length - idx,
                overflow: 'hidden',
                transition: 'all 0.2s ease'
              }}
            >
              {!useFallback ? (
                <img
                  src={`/ink-icons/${lowerColor}.svg`}
                  alt={colorName}
                  onError={() => handleImageError(colorName)}
                  style={{
                    width: '70%',
                    height: '70%',
                    objectFit: 'contain'
                  }}
                />
              ) : (
                <span style={{
                  fontSize: size > 24 ? '11px' : '9px',
                  fontWeight: '800',
                  color: matchedColor.color,
                  textTransform: 'uppercase'
                }}>
                  {matchedColor.text}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--on-surface-variant)', marginLeft: '4px' }}>
        {colors.join('/')}
      </span>
    </div>
  );
};

export default DeckColorBadge;
