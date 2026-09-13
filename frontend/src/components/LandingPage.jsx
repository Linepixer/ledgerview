import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BarChart2, TrendingUp, PieChart, Lock, DollarSign, Activity, ChevronRight } from 'lucide-react';
import AccountMenu from './AccountMenu';
import './LandingPage.css';

export default function LandingPage({ isAuthenticated, user, onLogout }) {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      {/* Navbar */}
      <nav className="landing-navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => window.scrollTo(0, 0)}>
          <img src="/logo.png" alt="LedgerView Logo" style={{ height: '32px' }} />
          <span style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.05em' }}>LedgerView</span>
        </div>
        <div className="landing-nav-links">
          {isAuthenticated ? (
            <>
              <button className="btn-landing-primary" onClick={() => navigate('/portfolio')}>Ir al portafolio</button>
              <AccountMenu user={user} onLogout={onLogout} />
            </>
          ) : (
            <>
              <button className="btn-landing-ghost" onClick={() => navigate('/login')}>Iniciar sesión</button>
              <button className="btn-landing-primary" onClick={() => navigate('/signup')}>
                Crear cuenta
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="hero-section">
        <div className="hero-bg-glow"></div>
        <div className="hero-content">
          <div className="hero-badge animate-landing" style={{ animationDelay: '0.1s' }}>100% Open Source</div>
          <h1 className="hero-title animate-landing" style={{ animationDelay: '0.2s' }}>El control absoluto de tu patrimonio.</h1>
          <p className="hero-subtitle animate-landing" style={{ animationDelay: '0.3s' }}>
            Olvidate de los excels infinitos. Sincronizá tus activos, medí tu rendimiento real (XIRR) y proyectá tu futuro financiero con precisión milimétrica en una sola plataforma.
          </p>
          <div className="hero-actions animate-landing" style={{ animationDelay: '0.4s' }}>
            <button className="btn-landing-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.15rem' }} onClick={() => navigate(isAuthenticated ? '/portfolio' : '/signup')}>
              Empezar ahora <ArrowRight size={20} />
            </button>
            <button className="btn-landing-ghost" style={{ padding: '1rem 2.5rem', fontSize: '1.15rem' }} onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}>
              Ver cómo funciona
            </button>
          </div>
        </div>
        
        {/* Mockup Dashboard flotante */}
        <div className="hero-mockup-container animate-landing" style={{ animationDelay: '0.6s' }}>
          <div className="hero-mockup-glow"></div>
          <div className="hero-mockup">
            <img src="/dashboard-pc.png?v=2" alt="LedgerView Dashboard en Computadora" className="mockup-img-pc" />
            <img src="/dashboard-mobile.png?v=2" alt="LedgerView Dashboard en Celular" className="mockup-img-mobile" />
          </div>
        </div>
      </section>

      {/* Bento Grid Features */}
      <section id="features" className="bento-section">
        <div className="bento-header">
          <h2>Todo lo que necesitás, sin el ruido.</h2>
          <p style={{ color: '#a1a1aa', fontSize: '1.15rem', maxWidth: '600px', margin: '0 auto' }}>
            Diseñado meticulosamente para inversores que quieren métricas claras y decisiones basadas en datos reales.
          </p>
        </div>

        <div className="bento-grid">
          {/* Card Large */}
          <div className="bento-card large animate-landing" style={{ animationDelay: '0.2s' }}>
            <div className="bento-icon-wrapper">
              <BarChart2 size={28} />
            </div>
            <h3>Multidivisa Inteligente</h3>
            <p>
              Cambiá toda la visualización de tu portafolio entre Pesos (ARS) y Dólares (USD) con un solo clic. LedgerView toma las cotizaciones de Dólar Cripto, MEP y Blue en tiempo real para darte el valor exacto de tus activos.
            </p>
            <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(0,0,0,0.4)', borderRadius: '12px', display: 'flex', gap: '1rem', alignItems: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', fontWeight: 600, color: '#a1a1aa' }}>ARS $45.2M</div>
              <ChevronRight size={16} color="#71717a" />
              <div style={{ padding: '0.5rem 1rem', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: '#fff', borderRadius: '6px', fontWeight: 600, boxShadow: '0 4px 12px rgba(16,185,129,0.2)' }}>USD $32.5K</div>
            </div>
          </div>

          {/* Card Medium */}
          <div className="bento-card medium animate-landing" style={{ animationDelay: '0.4s' }}>
            <div className="bento-icon-wrapper">
              <Activity size={28} />
            </div>
            <h3>Cálculo XIRR</h3>
            <p>
              Obtené tu tasa interna de retorno calculada automáticamente. Sabé exactamente cuánto están rindiendo tus inversiones, sin fórmulas.
            </p>
            <div style={{ marginTop: 'auto', fontSize: '3rem', fontWeight: 800, color: '#10B981', letterSpacing: '-1px' }}>+18.4%</div>
          </div>

          {/* Card Small */}
          <div className="bento-card animate-landing" style={{ animationDelay: '0.6s' }}>
            <div className="bento-icon-wrapper">
              <TrendingUp size={28} />
            </div>
            <h3>Ritmo de Inversión</h3>
            <p>Analizá cuánto estás ahorrando e invirtiendo mensualmente en promedio.</p>
          </div>

          {/* Card Small */}
          <div className="bento-card animate-landing" style={{ animationDelay: '0.7s' }}>
            <div className="bento-icon-wrapper">
              <PieChart size={28} />
            </div>
            <h3>Diversificación</h3>
            <p>Visualizá tu exposición por categorías y mantené balanceado tu portafolio.</p>
          </div>

          {/* Card Small */}
          <div className="bento-card animate-landing" style={{ animationDelay: '0.8s' }}>
            <div className="bento-icon-wrapper">
              <DollarSign size={28} />
            </div>
            <h3>Interés Compuesto</h3>
            <p>Proyectá el valor de tu capital a 5, 10 y 20 años basado en tu rendimiento.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <h2>{isAuthenticated ? 'Tu portafolio te espera' : 'Empezá a medir tu riqueza en serio'}</h2>
        <p style={{ color: '#a1a1aa', fontSize: '1.15rem', maxWidth: '600px', margin: '0 auto 3rem auto' }}>
          {isAuthenticated 
            ? 'Entrá para seguir controlando tus activos, agregar transacciones y analizar tu rendimiento en tiempo real.'
            : 'Unite hoy y tomá el control total de tus finanzas. Sin publicidades, sin ruido, solo tus números claros y precisos.'}
        </p>
        <button className="btn-landing-primary" style={{ padding: '1.2rem 3.5rem', fontSize: '1.25rem' }} onClick={() => navigate(isAuthenticated ? '/portfolio' : '/signup')}>
          {isAuthenticated ? 'Ir al portafolio' : 'Crear cuenta gratis'}
        </button>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#fff' }}>
            <img src="/logo.png" alt="Logo" style={{ height: '20px' }} />
            <span style={{ fontWeight: 600 }}>LedgerView</span>
          </div>
          <p>&copy; 2026 LedgerView. Todos los derechos reservados.</p>
        </div>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <a href="#" style={{ color: '#71717a', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color='#fff'} onMouseOut={(e) => e.target.style.color='#71717a'}>Términos</a>
          <a href="#" style={{ color: '#71717a', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color='#fff'} onMouseOut={(e) => e.target.style.color='#71717a'}>Privacidad</a>
          <a href="mailto:diazmatias@linepixer.com" style={{ color: '#71717a', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color='#fff'} onMouseOut={(e) => e.target.style.color='#71717a'}>Contacto</a>
        </div>
      </footer>
    </div>
  );
}
