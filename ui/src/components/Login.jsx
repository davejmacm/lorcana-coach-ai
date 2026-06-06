import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const Login = ({ onLogin, onNavigateToSignUp }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [particles, setParticles] = useState([]);

  // Generate particles on mount
  useEffect(() => {
    const generated = Array.from({ length: 30 }).map((_, idx) => ({
      id: idx,
      size: Math.random() * 3 + 1,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: Math.random() * 10,
      duration: Math.random() * 10 + 5,
      isMagenta: Math.random() > 0.8
    }));
    setParticles(generated);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    // Attempt to load users database
    const users = JSON.parse(localStorage.getItem('illumineer_users') || '{}');
    const user = users[email.trim().toLowerCase()];

    if (!user || user.password !== password) {
      setError('Invalid email or password. Do you need to Sign Up first?');
      return;
    }

    // Call authentication callback with the user's stored token
    onLogin(user.token, email.trim().toLowerCase());
  };

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--obsidian-base)',
      backgroundImage: `
        radial-gradient(circle at 15% 50%, rgba(125, 1, 177, 0.15), transparent 25%),
        radial-gradient(circle at 85% 30%, rgba(0, 240, 255, 0.15), transparent 25%)
      `,
      overflow: 'hidden',
      padding: '1.5rem'
    }}>
      {/* Starfield Particles */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        {particles.map(p => (
          <motion.div
            key={p.id}
            animate={{
              y: [0, -50],
              x: [0, 20],
              opacity: [0.2, 0.8, 0.2]
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: p.delay
            }}
            style={{
              position: 'absolute',
              width: `${p.size}px`,
              height: `${p.size}px`,
              left: p.left,
              top: p.top,
              backgroundColor: p.isMagenta ? 'rgba(255, 45, 85, 0.6)' : 'rgba(0, 240, 255, 0.6)',
              borderRadius: '50%',
              boxShadow: p.isMagenta 
                ? '0 0 8px 1px rgba(255, 45, 85, 0.3)' 
                : '0 0 10px 2px rgba(0, 240, 255, 0.4)'
            }}
          />
        ))}
      </div>

      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '440px' }}>
        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel"
          style={{
            borderRadius: '24px',
            padding: '2.5rem',
            boxShadow: '0 25px 60px rgba(0, 240, 255, 0.1)',
            border: '1px solid var(--glass-stroke)'
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <span className="material-symbols-outlined" style={{
              fontVariationSettings: '"FILL" 1',
              color: 'var(--primary-fixed-dim)',
              fontSize: '48px',
              display: 'inline-block',
              marginBottom: '1rem',
              textShadow: '0 0 15px rgba(0, 240, 255, 0.4)'
            }}>
              auto_awesome
            </span>
            <h2 style={{
              fontFamily: 'var(--font-headline)',
              fontSize: '1.75rem',
              fontWeight: 700,
              color: 'var(--primary-fixed)',
              margin: 0,
              textShadow: '0 0 10px rgba(0, 240, 255, 0.3)'
            }}>
              Welcome Back, Illumineer
            </h2>
            <p style={{
              color: 'var(--on-surface-variant)',
              fontSize: '0.9rem',
              marginTop: '0.5rem',
              fontFamily: 'var(--font-body)'
            }}>
              Enter the vault to access your Grimoire.
            </p>
          </div>

          {error && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(255, 45, 85, 0.15)',
              border: '1px solid rgba(255, 45, 85, 0.3)',
              color: '#ff8a9f',
              fontSize: '0.85rem',
              marginBottom: '1.5rem'
            }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{
                display: 'block',
                fontFamily: 'var(--font-technical)',
                fontSize: '0.7rem',
                color: 'var(--on-surface-variant)',
                letterSpacing: '1px',
                marginBottom: '0.5rem'
              }}>EMAIL ADDRESS</label>
              <input
                type="email"
                placeholder="acolyte@illuminari.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--obsidian-base)',
                  border: '1px solid var(--glass-stroke)',
                  borderRadius: '8px',
                  color: 'white',
                  padding: '12px 16px',
                  fontSize: '0.95rem',
                  fontFamily: 'var(--font-body)',
                  outline: 'none',
                  transition: 'all 0.3s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--primary-fixed-dim)';
                  e.target.style.boxShadow = '0 0 10px rgba(0, 240, 255, 0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--glass-stroke)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <label style={{
                  fontFamily: 'var(--font-technical)',
                  fontSize: '0.7rem',
                  color: 'var(--on-surface-variant)',
                  letterSpacing: '1px'
                }}>PASSWORD</label>
                <a href="#" style={{
                  fontFamily: 'var(--font-technical)',
                  fontSize: '0.7rem',
                  color: 'var(--primary-fixed-dim)',
                  textDecoration: 'none'
                }} onClick={(e) => e.preventDefault()}>Forgot Password?</a>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--obsidian-base)',
                  border: '1px solid var(--glass-stroke)',
                  borderRadius: '8px',
                  color: 'white',
                  padding: '12px 16px',
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'all 0.3s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--primary-fixed-dim)';
                  e.target.style.boxShadow = '0 0 10px rgba(0, 240, 255, 0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--glass-stroke)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              style={{
                width: '100%',
                background: 'linear-gradient(90deg, var(--primary-fixed-dim), var(--ink-magenta))',
                backgroundSize: '200% auto',
                color: 'var(--obsidian-base)',
                borderRadius: '50px',
                border: 'none',
                padding: '14px',
                fontWeight: 700,
                fontSize: '1rem',
                fontFamily: 'var(--font-headline)',
                cursor: 'pointer',
                marginTop: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 0 20px rgba(0, 240, 255, 0.25)'
              }}
            >
              Login to The Library
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>login</span>
            </motion.button>
          </form>

          {/* Social Sign In */}
          <div style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <div style={{ height: '1px', background: 'var(--glass-stroke)', flex: 1 }} />
              <span style={{
                padding: '0 10px',
                fontFamily: 'var(--font-technical)',
                fontSize: '0.65rem',
                color: 'var(--outline)',
                letterSpacing: '1px'
              }}>OR INITIATE VIA</span>
              <div style={{ height: '1px', background: 'var(--glass-stroke)', flex: 1 }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <button 
                onClick={() => setError('Discord OAuth integration is a mockup.')}
                style={{
                  background: 'rgba(5, 7, 10, 0.5)',
                  border: '1px solid var(--glass-stroke)',
                  borderRadius: '8px',
                  color: 'var(--on-surface-variant)',
                  padding: '10px',
                  fontSize: '0.85rem',
                  fontFamily: 'var(--font-body)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'all 0.2s'
                }}
              >
                Discord
              </button>
              <button 
                onClick={() => setError('Google OAuth integration is a mockup.')}
                style={{
                  background: 'rgba(5, 7, 10, 0.5)',
                  border: '1px solid var(--glass-stroke)',
                  borderRadius: '8px',
                  color: 'var(--on-surface-variant)',
                  padding: '10px',
                  fontSize: '0.85rem',
                  fontFamily: 'var(--font-body)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'all 0.2s'
                }}
              >
                Google
              </button>
            </div>
          </div>

          <p style={{
            textAlign: 'center',
            fontSize: '0.85rem',
            color: 'var(--on-surface-variant)',
            marginTop: '2rem',
            marginBottom: 0
          }}>
            Don't have an account?{' '}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onNavigateToSignUp();
              }}
              style={{ color: 'var(--primary-fixed-dim)', fontWeight: 600, textDecoration: 'none' }}
            >
              Sign up
            </a>
          </p>
        </motion.div>
      </div>

      {/* Footer copyright decoration */}
      <div style={{ position: 'absolute', bottom: '1.5rem', width: '100%', textAlign: 'center', pointerEvents: 'none' }}>
        <p style={{
          fontFamily: 'var(--font-technical)',
          fontSize: '0.65rem',
          color: 'var(--outline)',
          opacity: 0.5,
          margin: 0
        }}>
          © 2026 The Great Illuminary AI. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;
