import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

// Ethereal and robust scroll reveal animation using IntersectionObserver
const ScrollReveal = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const currentRef = ref.current;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        if (currentRef) {
          observer.unobserve(currentRef);
        }
      }
    }, { threshold: 0.05 });

    if (currentRef) {
      observer.observe(currentRef);
    }
    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, []);

  return (
    <div 
      ref={ref}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(32px)',
        transition: 'opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1), transform 0.9s cubic-bezier(0.16, 1, 0.3, 1)',
        width: '100%'
      }}
    >
      {children}
    </div>
  );
};

const Hero = ({ onGetStarted, onNavigateToLogin, onShowHelp }) => {
  return (
    <div style={{
      background: 'var(--obsidian-base)',
      color: '#dce4e5',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'var(--font-body)',
      scrollBehavior: 'smooth'
    }}>
      {/* Header */}
      <header style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        height: '80px',
        backgroundColor: 'rgba(13, 21, 21, 0.4)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--glass-stroke)',
        zIndex: 50,
        boxShadow: '0 0 20px rgba(0, 240, 255, 0.1)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 2rem',
          height: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{
            fontFamily: 'var(--font-headline)',
            fontSize: '1.5rem',
            fontWeight: 700,
            color: 'var(--primary-fixed)',
            letterSpacing: '-0.02em'
          }}>
            Great Illuminary AI
          </div>
          <nav style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <a 
              href="#features-section" 
              style={{
                color: 'var(--on-surface-variant)',
                fontSize: '0.9rem',
                fontWeight: 600,
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.color = 'var(--primary-fixed)'}
              onMouseLeave={(e) => e.target.style.color = 'var(--on-surface-variant)'}
            >
              Features
            </a>
            <a 
              href="#integration-section" 
              style={{
                color: 'var(--on-surface-variant)',
                fontSize: '0.9rem',
                fontWeight: 600,
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.color = 'var(--primary-fixed)'}
              onMouseLeave={(e) => e.target.style.color = 'var(--on-surface-variant)'}
            >
              How it Works
            </a>
            <button 
              onClick={onNavigateToLogin}
              style={{
                background: 'linear-gradient(90deg, #00f0ff, #e9b3ff)',
                border: 'none',
                borderRadius: '8px',
                color: 'var(--obsidian-base)',
                padding: '8px 20px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: '0 0 15px rgba(0, 240, 255, 0.3)',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            >
              Login
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flexGrow: 1, paddingTop: '80px' }}>
        
        {/* Hero Banner Section */}
        <section style={{
          position: 'relative',
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          backgroundColor: '#000',
          padding: '4rem 1.5rem'
        }}>
          {/* Background Image - Brightness and exposure optimized */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'url(https://lh3.googleusercontent.com/aida-public/AB6AXuApJLgG1nSkEgQJOLu9VuhSs1t3Fh4ewKt6d9kl5DKt-zVlGjZnF7NVJV1AKJWnrsH3j31nByEq7siZ55kesNPvKeesIsotI8OT8BBnxvG5IhHpiJ4gvzBErbvGUR2Q7yMpoW6vB5tHT1c7W3iXzAOklEkDddTG_eMynOGZoY3HMXeeETgzUldUYHuH2LHY_OR9JfaK2-BRRgTXji9lHfR97T9GAy7y_ZcOhuYRlL3HnVoIAtEybBTgcRJisd8ovNVrhKjajWAVe4BY)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.8, // Increased opacity to clearly see the artwork
            zIndex: 0
          }} />
          <div style={{
            position: 'absolute',
            inset: 0,
            // Softened overlay to reveal card details while preserving legibility
            background: 'linear-gradient(to bottom, rgba(5, 7, 10, 0.15) 0%, rgba(5, 7, 10, 0.65) 100%)',
            zIndex: 1
          }} />

          {/* Hero Content */}
          <div style={{
            position: 'relative',
            zIndex: 10,
            textAlign: 'center',
            maxWidth: '850px',
            margin: '0 auto',
            padding: '2rem'
          }}>
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              style={{
                fontFamily: 'var(--font-headline)',
                fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
                fontWeight: 800,
                lineHeight: 1.1,
                color: 'transparent',
                background: 'linear-gradient(135deg, #00f0ff 0%, #ffffff 50%, #e9b3ff 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                marginBottom: '1.5rem',
                textShadow: '0 0 35px rgba(0, 0, 0, 0.9), 0 0 20px rgba(0, 240, 255, 0.25)'
              }}
            >
              Great Illuminary Lorcana AI
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'clamp(1.1rem, 2vw, 1.4rem)',
                color: 'white',
                maxWidth: '650px',
                margin: '0 auto 2.5rem auto',
                lineHeight: 1.6,
                textShadow: '0 2px 10px rgba(0,0,0,0.95)'
              }}
            >
              Enhance your gameplay, eliminate mechanical errors, and master the meta with advanced arcane match reviews.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              <button 
                onClick={onGetStarted}
                style={{
                  background: 'linear-gradient(90deg, #00f0ff, #e9b3ff)',
                  border: 'none',
                  borderRadius: '50px',
                  color: 'var(--obsidian-base)',
                  padding: '16px 48px',
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  fontFamily: 'var(--font-headline)',
                  cursor: 'pointer',
                  boxShadow: '0 0 30px rgba(0, 240, 255, 0.45)',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              >
                Connect Your Account
              </button>
            </motion.div>
          </div>
        </section>

        {/* Stats Banner Section with Scroll Entry Animation */}
        <ScrollReveal>
          <section style={{
            backgroundColor: 'var(--midnight-surface)',
            borderTop: '1px solid var(--glass-stroke)',
            borderBottom: '1px solid var(--glass-stroke)',
            padding: '2.5rem 0',
            position: 'relative',
            zIndex: 20
          }}>
            <div style={{
              maxWidth: '1200px',
              margin: '0 auto',
              padding: '0 2rem',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '4rem',
              textAlign: 'center'
            }}>
              <div>
                <div style={{ fontFamily: 'var(--font-technical)', fontSize: '0.75rem', color: 'var(--secondary)', letterSpacing: '1px', marginBottom: '0.25rem' }}>GAMES ANALYZED</div>
                <div style={{ fontFamily: 'var(--font-headline)', fontSize: '2rem', fontWeight: 800, color: 'var(--primary-fixed)' }}>10,000+</div>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-technical)', fontSize: '0.75rem', color: 'var(--secondary)', letterSpacing: '1px', marginBottom: '0.25rem' }}>WIN RATE INCREASE</div>
                <div style={{ fontFamily: 'var(--font-headline)', fontSize: '2rem', fontWeight: 800, color: 'var(--primary-fixed)' }}>24%</div>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-technical)', fontSize: '0.75rem', color: 'var(--secondary)', letterSpacing: '1px', marginBottom: '0.25rem' }}>ACTIVE ILLUMINEERS</div>
                <div style={{ fontFamily: 'var(--font-headline)', fontSize: '2rem', fontWeight: 800, color: 'var(--primary-fixed)' }}>5,200+</div>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* Features Section with Scroll Entry Animation */}
        <section id="features-section" style={{ padding: '7rem 1.5rem', position: 'relative', zIndex: 10 }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
            <ScrollReveal>
              <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
                <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: '2.25rem', fontWeight: 700, color: 'var(--primary-fixed)', marginBottom: '1rem' }}>Master Every Move</h2>
                <p style={{ color: 'var(--on-surface-variant)', maxWidth: '600px', margin: '0 auto', fontSize: '1.05rem', lineHeight: 1.5 }}>
                  Our AI provides multi-layered analysis to turn every match into a learning opportunity.
                </p>
              </div>
            </ScrollReveal>

            {/* Feature 1: Tactical Analysis */}
            <ScrollReveal>
              <div style={{
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '4rem',
                marginBottom: '8rem'
              }}>
                <div style={{ flex: '1 1 400px', display: 'flex', justifyContent: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      position: 'absolute',
                      inset: '-8px',
                      background: 'linear-gradient(to right, #00f0ff, #e9b3ff)',
                      borderRadius: '16px',
                      filter: 'blur(12px)',
                      opacity: 0.2
                    }} />
                    <img 
                      alt="Tactical Insight Analysis Card" 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuB-1ROqbZMZbGSR60sZuF5KHoO3AaVHfeqvwYYcNeImqsISJT0dgtPVOLR7YlrnBQqnQRXeWzC-1LviM0d40d54d1oN-q_MFAtY075taAkmVuo0Dk8vQMMbpAHHAuVnNIA4tYeyaAVsedvUuxdceIArJOeCbP2jHf65Ym7rMf7vamSO1EB2ZQZg1JtPwKzeZ09tw_cI8Vbk925p_jwsZlVn1xuspgympp0HdAI4HpbaOp6-rM7aHA_CdczpNUVAduXDvMUzNDjjm9mo"
                      style={{
                        position: 'relative',
                        borderRadius: '16px',
                        width: '100%',
                        maxWidth: '380px',
                        border: '2px solid rgba(0, 240, 255, 0.4)',
                        boxShadow: '0 0 20px rgba(0, 240, 255, 0.25)',
                        transition: 'transform 0.3s'
                      }}
                    />
                  </div>
                </div>
                <div style={{ flex: '1 1 400px' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 14px',
                    borderRadius: '50px',
                    background: 'rgba(0, 240, 255, 0.08)',
                    border: '1px solid rgba(0, 240, 255, 0.3)',
                    color: 'var(--primary-fixed)',
                    fontFamily: 'var(--font-technical)',
                    fontSize: '0.75rem',
                    marginBottom: '1.5rem',
                    textTransform: 'uppercase'
                  }}>Tactical Analysis</span>
                  <h3 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.85rem', fontWeight: 600, color: 'var(--primary-fixed)', marginBottom: '1.25rem' }}>Gain Powerful Insight</h3>
                  <p style={{ fontSize: '1.05rem', color: 'var(--on-surface-variant)', lineHeight: 1.6, marginBottom: '2rem' }}>
                    Isolate critical tactical errors and discover the exact plays that keep the pressure on. Our AI reads the board state with arcane precision, revealing hidden value lines.
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="material-symbols-outlined" style={{ color: 'var(--primary-fixed)', fontSize: '20px' }}>visibility</span>
                      <span>Complete board state evaluation</span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="material-symbols-outlined" style={{ color: 'var(--primary-fixed)', fontSize: '20px' }}>psychology</span>
                      <span>Ink management optimization</span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="material-symbols-outlined" style={{ color: 'var(--primary-fixed)', fontSize: '20px' }}>analytics</span>
                      <span>Threat detection algorithms</span>
                    </li>
                  </ul>
                </div>
              </div>
            </ScrollReveal>

            {/* Feature 2: Macro Strategy */}
            <ScrollReveal>
              <div style={{
                display: 'flex',
                flexDirection: 'row-reverse',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '4rem'
              }}>
                <div style={{ flex: '1 1 400px', display: 'flex', justifyContent: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      position: 'absolute',
                      inset: '-8px',
                      background: 'linear-gradient(to left, #e9b3ff, #FF2D55)',
                      borderRadius: '16px',
                      filter: 'blur(12px)',
                      opacity: 0.2
                    }} />
                    <img 
                      alt="Gameplay Macro Analysis Card" 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBghtV91GD6u4jsdGHbdaq-oTKh4FvBdF8jNhKA_TgGIApxdSxPyv-PIUfIxpvNb5oY2VP3qywxXfgAiHSFTPYWx-ujO_l4a3HeAummI_mGMJ2LHe4DjlzVfXAGYJ-glIrzaTBpv0Va1yI5n-K2Y2_O2YewqB9sgwh0Dq6LgEPDA4u7yXAsaYdjFE1V5LnC6l5GXUs5d-4rER1E83t_ZXOu5nPVAAKq5FJgAd-pRMozvF-tdpsBXlEk33ylzWA0Ea1og1F_H3PqWTTd"
                      style={{
                        position: 'relative',
                        borderRadius: '16px',
                        width: '100%',
                        maxWidth: '380px',
                        border: '2px solid rgba(233, 179, 255, 0.4)',
                        boxShadow: '0 0 20px rgba(233, 179, 255, 0.25)',
                        transition: 'transform 0.3s'
                      }}
                    />
                  </div>
                </div>
                <div style={{ flex: '1 1 400px' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 14px',
                    borderRadius: '50px',
                    background: 'rgba(125, 1, 177, 0.08)',
                    border: '1px solid rgba(125, 1, 177, 0.3)',
                    color: 'var(--secondary)',
                    fontFamily: 'var(--font-technical)',
                    fontSize: '0.75rem',
                    marginBottom: '1.5rem',
                    textTransform: 'uppercase'
                  }}>Macro Strategy</span>
                  <h3 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.85rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '1.25rem' }}>Gameplay Analysis</h3>
                  <p style={{ fontSize: '1.05rem', color: 'var(--on-surface-variant)', lineHeight: 1.6, marginBottom: '2rem' }}>
                    Review every ink placement, challenge, and quest with advanced AI precision. "The best players anticipate every move."
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="material-symbols-outlined" style={{ color: 'var(--secondary)', fontSize: '20px' }}>history</span>
                      <span>Post-match timeline review</span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="material-symbols-outlined" style={{ color: 'var(--secondary)', fontSize: '20px' }}>route</span>
                      <span>Optimal questing paths</span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="material-symbols-outlined" style={{ color: 'var(--secondary)', fontSize: '20px' }}>monitoring</span>
                      <span>Key turn identification</span>
                    </li>
                  </ul>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Integration Teaser Section with Scroll Entry Animation */}
        <section id="integration-section" style={{
          padding: '8rem 1.5rem',
          backgroundColor: 'rgba(13, 17, 23, 0.4)',
          borderTop: '1px solid var(--glass-stroke)',
          borderBottom: '1px solid var(--glass-stroke)',
          position: 'relative',
          zIndex: 10
        }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            <ScrollReveal>
              <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: '2.25rem', color: 'var(--primary-fixed)', marginBottom: '1.25rem' }}>Seamless Integration</h2>
              <p style={{ color: 'var(--on-surface-variant)', fontSize: '1.1rem', lineHeight: 1.6, maxWidth: '600px', margin: '0 auto 3.5rem auto' }}>
                Connect your duels.ink games instantly using a secure bearer token. No complex setups, just pure strategic power channeled directly to your dashboard.
              </p>
            </ScrollReveal>

            {/* Integration Teaser Card - Illustrative Premium Component */}
            <ScrollReveal>
              <motion.div 
                onClick={onGetStarted}
                whileHover={{ 
                  scale: 1.02,
                  y: -4,
                  boxShadow: '0 0 35px rgba(0, 240, 255, 0.3)',
                  borderColor: 'var(--primary-fixed-dim)'
                }}
                className="glass-panel"
                style={{
                  borderRadius: '16px',
                  padding: '2.5rem',
                  maxWidth: '560px',
                  margin: '0 auto',
                  textAlign: 'left',
                  border: '1px solid var(--glass-stroke)',
                  boxShadow: '0 0 30px rgba(0, 240, 255, 0.15)',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'border-color 0.3s, box-shadow 0.3s'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: 0, right: 0,
                  background: 'linear-gradient(to left, #00f0ff, #e9b3ff)',
                  color: 'var(--obsidian-base)',
                  fontSize: '0.65rem',
                  fontFamily: 'var(--font-technical)',
                  padding: '4px 12px',
                  borderRadius: '0 0 0 8px',
                  fontWeight: 700
                }}>
                  API.V2
                </div>
                
                <label style={{
                  display: 'block',
                  fontFamily: 'var(--font-technical)',
                  fontSize: '0.7rem',
                  color: 'var(--on-surface-variant)',
                  letterSpacing: '1.5px',
                  marginBottom: '1rem',
                  textTransform: 'uppercase'
                }}>Bearer Token Entry</label>

                <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem', flexWrap: 'wrap' }}>
                  <input 
                    disabled 
                    type="text" 
                    value="••••••••••••••••••••••••••••••••••••••••"
                    style={{
                      flexGrow: 1,
                      background: 'var(--obsidian-base)',
                      border: '1px solid var(--glass-stroke)',
                      borderRadius: '8px',
                      padding: '14px',
                      color: 'var(--primary-fixed-dim)',
                      fontFamily: 'var(--font-technical)',
                      fontSize: '0.85rem',
                      outline: 'none',
                      opacity: 0.65,
                      cursor: 'pointer',
                      filter: 'blur(1px)' // masked & blurred visual placeholder
                    }}
                  />
                  <button 
                    style={{
                      background: 'linear-gradient(90deg, #00f0ff, #e9b3ff)',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'var(--obsidian-base)',
                      padding: '12px 28px',
                      fontFamily: 'var(--font-headline)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 0 20px rgba(0, 240, 255, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      pointerEvents: 'none' // Clicking anywhere on the card triggers redirection
                    }}
                  >
                    Connect <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>login</span>
                  </button>
                </div>

                <button 
                  onClick={(e) => {
                    e.stopPropagation(); // Stop parent click handler
                    onShowHelp();
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary-fixed-dim)',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontFamily: 'var(--font-body)',
                    marginTop: '1.25rem',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>help</span>
                  <span style={{ borderBottom: '1px solid transparent' }}>Where do I find my token?</span>
                </button>
              </motion.div>
            </ScrollReveal>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{
        backgroundColor: 'var(--midnight-surface)',
        borderTop: '1px solid var(--glass-stroke)',
        padding: '4rem 2rem'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          gap: '3rem'
        }}>
          <div style={{ flex: '1 1 300px' }}>
            <div style={{ fontFamily: 'var(--font-technical)', color: 'var(--primary-fixed)', fontSize: '1.2rem', marginBottom: '1rem', fontWeight: 700 }}>
              Great Illuminary AI
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', lineHeight: 1.6, margin: 0 }}>
              © 2026 Great Illuminary AI. This project is a fan-made analytical companion and is not affiliated with Disney, Ravensburger or Duels.ink. All card art and characters are trademarks of their respective owners.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2rem' }}>
            <a href="#" style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>Legal Disclaimers</a>
            <a href="#" style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>Privacy Policy</a>
            <a href="#" style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Hero;
