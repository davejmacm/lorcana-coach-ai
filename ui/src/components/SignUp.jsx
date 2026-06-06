import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SignUp = ({ onRegister, onNavigateToLogin, onShowHelp, loading, error, setError }) => {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
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

  const handleNext = (e) => {
    e.preventDefault();
    if (!username || !email || !password) {
      setError('Please complete all account fields before proceeding.');
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    if (!token || !token.trim()) {
      setError('Duels.ink Bearer Token is required to sync your account.');
      return;
    }
    setError(null);
    onRegister(username, email, password, token);
  };

  // Stepped animation variants
  const variants = {
    enter: (direction) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0
    })
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
        {/* Sign Up Card */}
        <div
          className="glass-panel"
          style={{
            borderRadius: '24px',
            padding: '2.5rem',
            boxShadow: '0 25px 60px rgba(0, 240, 255, 0.1)',
            border: '1px solid var(--glass-stroke)',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <span className="material-symbols-outlined" style={{
              fontVariationSettings: '"FILL" 1',
              color: 'var(--primary-fixed-dim)',
              fontSize: '48px',
              display: 'inline-block',
              marginBottom: '0.75rem',
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
              Initiate Account
            </h2>
            <p style={{
              color: 'var(--on-surface-variant)',
              fontSize: '0.85rem',
              marginTop: '0.4rem',
              fontFamily: 'var(--font-body)'
            }}>
              {step === 1 ? 'Step 1: Set Account Credentials' : 'Step 2: Connect Duels.ink Token'}
            </p>
          </div>

          {/* Stepped Progress Bar */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
            <div style={{
              flex: 1,
              height: '4px',
              borderRadius: '2px',
              background: 'var(--primary-fixed-dim)',
              boxShadow: '0 0 10px rgba(0, 240, 255, 0.4)',
              transition: 'all 0.3s'
            }} />
            <div style={{
              flex: 1,
              height: '4px',
              borderRadius: '2px',
              background: step === 2 ? 'var(--primary-fixed-dim)' : 'var(--outline-variant)',
              boxShadow: step === 2 ? '0 0 10px rgba(0, 240, 255, 0.4)' : 'none',
              transition: 'all 0.3s'
            }} />
          </div>

          {error && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(255, 45, 85, 0.15)',
              border: '1px solid rgba(255, 45, 85, 0.3)',
              color: '#ff8a9f',
              fontSize: '0.85rem',
              marginBottom: '1.25rem'
            }}>
              {error}
            </div>
          )}

          {/* Animations of sliding components */}
          <div style={{ position: 'relative', minHeight: '260px' }}>
            <AnimatePresence initial={false} mode="wait" custom={step}>
              {step === 1 ? (
                <motion.form
                  key="step1"
                  custom={step}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  onSubmit={handleNext}
                  style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
                >
                  <div>
                    <label style={{
                      display: 'block',
                      fontFamily: 'var(--font-technical)',
                      fontSize: '0.65rem',
                      color: 'var(--on-surface-variant)',
                      letterSpacing: '1px',
                      marginBottom: '0.4rem'
                    }}>USER NAME</label>
                    <input
                      type="text"
                      placeholder="e.g. Merlin"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'var(--obsidian-base)',
                        border: '1px solid var(--glass-stroke)',
                        borderRadius: '8px',
                        color: 'white',
                        padding: '10px 14px',
                        fontSize: '0.9rem',
                        fontFamily: 'var(--font-body)',
                        outline: 'none',
                        transition: 'all 0.3s'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontFamily: 'var(--font-technical)',
                      fontSize: '0.65rem',
                      color: 'var(--on-surface-variant)',
                      letterSpacing: '1px',
                      marginBottom: '0.4rem'
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
                        padding: '10px 14px',
                        fontSize: '0.9rem',
                        fontFamily: 'var(--font-body)',
                        outline: 'none',
                        transition: 'all 0.3s'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontFamily: 'var(--font-technical)',
                      fontSize: '0.65rem',
                      color: 'var(--on-surface-variant)',
                      letterSpacing: '1px',
                      marginBottom: '0.4rem'
                    }}>PASSWORD</label>
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
                        padding: '10px 14px',
                        fontSize: '0.9rem',
                        outline: 'none',
                        transition: 'all 0.3s'
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
                      color: 'var(--obsidian-base)',
                      borderRadius: '50px',
                      border: 'none',
                      padding: '12px',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      fontFamily: 'var(--font-headline)',
                      cursor: 'pointer',
                      marginTop: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 0 15px rgba(0, 240, 255, 0.2)'
                    }}
                  >
                    Next: Connect Duels.ink
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
                  </motion.button>
                </motion.form>
              ) : (
                <motion.form
                  key="step2"
                  custom={step}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  onSubmit={handleRegisterSubmit}
                  style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
                >
                  <div style={{ marginBottom: '0.5rem' }}>
                    <label style={{
                      display: 'block',
                      fontFamily: 'var(--font-technical)',
                      fontSize: '0.65rem',
                      color: 'var(--on-surface-variant)',
                      letterSpacing: '1px',
                      marginBottom: '0.4rem'
                    }}>DUELS.INK BEARER TOKEN</label>
                    <input
                      type="text"
                      placeholder="Paste Bearer Token Here..."
                      value={token}
                      disabled={loading}
                      onChange={(e) => setToken(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'var(--obsidian-base)',
                        border: '1px solid var(--glass-stroke)',
                        borderRadius: '8px',
                        color: 'white',
                        padding: '12px 14px',
                        fontSize: '0.9rem',
                        fontFamily: 'var(--font-technical)',
                        outline: 'none',
                        transition: 'all 0.3s',
                        opacity: loading ? 0.6 : 1
                      }}
                    />
                    <button
                      type="button"
                      onClick={onShowHelp}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary-fixed-dim)',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontFamily: 'var(--font-body)',
                        marginTop: '0.5rem',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>help</span>
                      Where do I find my token?
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                    <button
                      type="button"
                      onClick={() => { setError(null); setStep(1); }}
                      disabled={loading}
                      style={{
                        flex: 1,
                        background: 'none',
                        border: '1px solid var(--glass-stroke)',
                        borderRadius: '50px',
                        color: 'white',
                        padding: '12px',
                        fontWeight: 600,
                        cursor: loading ? 'not-allowed' : 'pointer'
                      }}
                    >
                      Back
                    </button>
                    <motion.button
                      whileHover={loading ? {} : { scale: 1.02 }}
                      whileTap={loading ? {} : { scale: 0.98 }}
                      type="submit"
                      disabled={loading}
                      style={{
                        flex: 2,
                        background: 'linear-gradient(90deg, var(--primary-fixed-dim), var(--ink-magenta))',
                        color: 'var(--obsidian-base)',
                        borderRadius: '50px',
                        border: 'none',
                        padding: '12px',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        fontFamily: 'var(--font-headline)',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 0 15px rgba(0, 240, 255, 0.2)',
                        opacity: loading ? 0.7 : 1
                      }}
                    >
                      {loading ? (
                        <>
                          <span className="spinner" style={{
                            width: '16px',
                            height: '16px',
                            border: '2px solid rgba(0,0,0,0.3)',
                            borderTopColor: '#000',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                          }} />
                          Syncing...
                        </>
                      ) : (
                        <>
                          Connect & Sync
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>sync</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          <p style={{
            textAlign: 'center',
            fontSize: '0.85rem',
            color: 'var(--on-surface-variant)',
            marginTop: '2rem',
            marginBottom: 0
          }}>
            Already have an account?{' '}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onNavigateToLogin();
              }}
              style={{ color: 'var(--primary-fixed-dim)', fontWeight: 600, textDecoration: 'none' }}
            >
              Login
            </a>
          </p>
        </div>
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

export default SignUp;
