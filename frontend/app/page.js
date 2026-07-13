'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen, Target, Users,
  Zap, ArrowRight, ChevronRight, Sparkles
} from 'lucide-react';

const FEATURES = [
  {
    icon: <BookOpen size={28} />,
    gradient: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
    glow: 'rgba(6,182,212,0.35)',
    label: 'Neural Notes Engine',
    desc: 'Upload PDFs, PPTs, or raw notes. Our RAG engine extracts every concept and builds a premium study guide + AI chatbot.',
    tags: ['RAG Engine', 'AI Summarizer', 'Quiz Generator'],
    href: '/summarizer',
  },
  {
    icon: <Target size={28} />,
    gradient: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
    glow: 'rgba(236,72,153,0.35)',
    label: 'Career Matrix',
    desc: 'Upload your resume and target role. Get a readiness score, knowledge gap analysis, and a personalised project roadmap.',
    tags: ['Resume AI', 'Knowledge Gap', 'Project Roadmap'],
    href: '/career',
  },
  {
    icon: <Users size={28} />,
    gradient: 'linear-gradient(135deg, #10b981, #34d399)',
    glow: 'rgba(16,185,129,0.35)',
    label: 'Hackathon Matchmaker',
    desc: 'Building a hackathon team? Let AI scout teammates with the exact complementary skills you need.',
    tags: ['Hackathon', 'Team Builder', 'Skill Match'],
    href: '/peer-matching',
  },
];

const STEPS = [
  { num: '01', title: 'Sign Up & Log In', desc: 'Create your free account in seconds.' },
  { num: '02', title: 'Upload Your Content', desc: 'Drop in your notes, resume, or choose a topic.' },
  { num: '03', title: 'Let AI Do the Work', desc: 'Our Gemini-powered engine analyses everything.' },
  { num: '04', title: 'Track Your Growth', desc: 'Earn skills, close gaps, build your dream career.' },
];

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.push('/dashboard');
  }, [user, loading, router]);

  if (loading) return null;
  if (user) return null; // redirect pending

  return (
    <div className="landing-root">
      {/* ── Animated background ── */}
      <div className="landing-bg">
        <div className="bg-blob blob-1" />
        <div className="bg-blob blob-2" />
        <div className="bg-blob blob-3" />
        <div className="bg-grid" />
      </div>

      {/* ── Navbar ── */}
      <header className="landing-nav">
        <div className="nav-brand">
          <div className="brand-icon"><Zap size={18} /></div>
          <span className="brand-name">NEXUS <span className="brand-accent">HQ</span></span>
        </div>
        <div className="nav-actions">
          <Link href="/login" className="nav-login-link">Log In</Link>
          <Link href="/login" className="nav-cta-btn">
            Get Started <ArrowRight size={15} />
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="hero-section">
        <div className="hero-badge">
          <Sparkles size={14} />
          <span>Powered by Gemini AI</span>
        </div>
        <h1 className="hero-title">
          Your AI-Powered
          <br />
          <span className="hero-gradient">Career Learning</span>
          <br />
          Operating System
        </h1>
        <p className="hero-subtitle">
          From raw notes to skill mastery. From resume gaps to dream roles.
          <br />
          NEXUS HQ is the all-in-one AI platform built for ambitious learners.
        </p>
        <div className="hero-actions">
          <Link href="/login" className="hero-primary-btn">
            Launch NEXUS HQ <ArrowRight size={18} />
          </Link>
          <Link href="/login?mode=signup" className="hero-secondary-btn">
            Create Free Account
          </Link>
        </div>
        <div className="hero-stats">
          <div className="stat"><span className="stat-num">4</span><span className="stat-label">AI Modules</span></div>
          <div className="stat-divider" />
          <div className="stat"><span className="stat-num">∞</span><span className="stat-label">Skills to Earn</span></div>
          <div className="stat-divider" />
          <div className="stat"><span className="stat-num">100%</span><span className="stat-label">AI Powered</span></div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="features-section">
        <div className="section-header">
          <div className="section-badge">Modules</div>
          <h2 className="section-title">Everything You Need to <span className="text-gradient">Level Up</span></h2>
          <p className="section-subtitle">Four powerful AI tools, one unified platform.</p>
        </div>
        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="feature-card" style={{ '--card-glow': f.glow }}>
              <div className="feature-icon" style={{ background: f.gradient, boxShadow: `0 0 20px ${f.glow}` }}>
                {f.icon}
              </div>
              <h3 className="feature-title">{f.label}</h3>
              <p className="feature-desc">{f.desc}</p>
              <div className="feature-tags">
                {f.tags.map((t, j) => <span key={j} className="feature-tag">{t}</span>)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="how-section">
        <div className="section-header">
          <div className="section-badge">Process</div>
          <h2 className="section-title">How It <span className="text-gradient">Works</span></h2>
        </div>
        <div className="steps-row">
          {STEPS.map((s, i) => (
            <div key={i} className="step-card">
              <div className="step-num">{s.num}</div>
              <h4 className="step-title">{s.title}</h4>
              <p className="step-desc">{s.desc}</p>
              {i < STEPS.length - 1 && <ChevronRight size={20} className="step-arrow" />}
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <div className="cta-card">
          <div className="cta-glow-1" />
          <div className="cta-glow-2" />
          <h2 className="cta-title">Ready to Start Your Journey?</h2>
          <p className="cta-sub">Join learners already using NEXUS HQ to close skill gaps and land dream roles.</p>
          <Link href="/login" className="hero-primary-btn">
            Get Started for Free <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <span className="brand-name" style={{fontSize:'0.9rem'}}>NEXUS HQ</span>
        <span className="footer-copy">Built with Gemini AI · 2025</span>
      </footer>

      <style jsx>{`
        .landing-root {
          min-height: 100vh;
          position: relative;
          overflow-x: hidden;
        }

        /* ── Background ── */
        .landing-bg { position: fixed; inset: 0; z-index: 0; pointer-events: none; }
        .bg-blob {
          position: absolute; border-radius: 50%;
          filter: blur(120px); opacity: 0.25;
          animation: blobFloat 12s ease-in-out infinite alternate;
        }
        .blob-1 { width: 600px; height: 600px; background: #8b5cf6; top: -200px; left: -150px; animation-delay: 0s; }
        .blob-2 { width: 500px; height: 500px; background: #ec4899; bottom: -150px; right: -100px; animation-delay: -4s; }
        .blob-3 { width: 400px; height: 400px; background: #06b6d4; top: 40%; left: 40%; animation-delay: -8s; }
        @keyframes blobFloat { from { transform: translate(0, 0) scale(1); } to { transform: translate(30px, 20px) scale(1.05); } }
        .bg-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(139,92,246,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139,92,246,0.04) 1px, transparent 1px);
          background-size: 48px 48px;
        }

        /* ── Nav ── */
        .landing-nav {
          position: relative; z-index: 10;
          display: flex; justify-content: space-between; align-items: center;
          padding: 20px 60px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          background: rgba(11,15,25,0.6);
          backdrop-filter: blur(20px);
        }
        .nav-brand { display: flex; align-items: center; gap: 10px; }
        .brand-icon {
          width: 34px; height: 34px; border-radius: 9px;
          background: var(--accent-gradient);
          display: flex; align-items: center; justify-content: center; color: #fff;
          box-shadow: 0 0 14px rgba(139,92,246,0.5);
        }
        .brand-name { font-size: 1.1rem; font-weight: 900; letter-spacing: 0.06em; color: #fff; text-transform: uppercase; }
        .brand-accent { background: var(--accent-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .nav-actions { display: flex; align-items: center; gap: 14px; }
        .nav-login-link { color: var(--text-secondary); text-decoration: none; font-size: 0.9rem; font-weight: 500; transition: color 0.2s; }
        .nav-login-link:hover { color: var(--text-primary); }
        .nav-cta-btn {
          display: inline-flex; align-items: center; gap: 6px;
          background: var(--accent-gradient); color: #fff; text-decoration: none;
          padding: 9px 20px; border-radius: 10px; font-weight: 600; font-size: 0.9rem;
          transition: all 0.25s; box-shadow: 0 4px 14px rgba(139,92,246,0.3);
        }
        .nav-cta-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(139,92,246,0.45); }

        /* ── Hero ── */
        .hero-section {
          position: relative; z-index: 1;
          display: flex; flex-direction: column; align-items: center; text-align: center;
          padding: 100px 24px 80px;
          max-width: 900px; margin: 0 auto;
        }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.25);
          color: var(--accent-color); padding: 7px 16px; border-radius: 999px;
          font-size: 0.8rem; font-weight: 600; margin-bottom: 32px;
          animation: fadeIn 0.6s ease forwards;
        }
        .hero-title {
          font-size: clamp(2.8rem, 6vw, 5rem);
          font-weight: 900; line-height: 1.08; letter-spacing: -0.03em;
          color: #fff; margin: 0 0 24px 0;
          animation: fadeIn 0.7s 0.1s ease both;
        }
        .hero-gradient {
          background: var(--accent-gradient);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .hero-subtitle {
          font-size: 1.15rem; color: var(--text-secondary); line-height: 1.65;
          max-width: 600px; margin: 0 0 40px 0;
          animation: fadeIn 0.7s 0.2s ease both;
        }
        .hero-actions { display: flex; gap: 14px; flex-wrap: wrap; justify-content: center; margin-bottom: 52px; animation: fadeIn 0.7s 0.3s ease both; }
        .hero-primary-btn {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--accent-gradient); color: #fff; text-decoration: none;
          padding: 15px 32px; border-radius: 14px; font-weight: 700; font-size: 1rem;
          transition: all 0.25s; box-shadow: 0 6px 20px rgba(139,92,246,0.4);
        }
        .hero-primary-btn:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(139,92,246,0.55); }
        .hero-secondary-btn {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
          color: var(--text-primary); text-decoration: none;
          padding: 15px 32px; border-radius: 14px; font-weight: 600; font-size: 1rem;
          transition: all 0.25s;
        }
        .hero-secondary-btn:hover { background: rgba(255,255,255,0.09); border-color: rgba(255,255,255,0.2); }
        .hero-stats { display: flex; align-items: center; gap: 0; animation: fadeIn 0.7s 0.4s ease both; }
        .stat { display: flex; flex-direction: column; align-items: center; padding: 0 28px; }
        .stat-num { font-size: 1.8rem; font-weight: 800; color: #fff; }
        .stat-label { font-size: 0.75rem; color: var(--text-secondary); font-weight: 500; margin-top: 2px; }
        .stat-divider { width: 1px; height: 40px; background: rgba(255,255,255,0.1); }

        /* ── Sections ── */
        .features-section, .how-section, .cta-section {
          position: relative; z-index: 1;
          max-width: 1160px; margin: 0 auto; padding: 80px 24px;
        }
        .section-header { text-align: center; margin-bottom: 56px; }
        .section-badge {
          display: inline-block;
          background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.25);
          color: var(--accent-color); padding: 5px 14px; border-radius: 999px;
          font-size: 0.75rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
          margin-bottom: 16px;
        }
        .section-title { font-size: clamp(1.8rem, 3.5vw, 2.8rem); font-weight: 800; color: #fff; margin: 0 0 12px 0; line-height: 1.15; }
        .section-subtitle { color: var(--text-secondary); font-size: 1rem; margin: 0; }
        .text-gradient { background: var(--accent-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }

        /* ── Feature Cards ── */
        .features-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 24px;
        }
        .feature-card {
          background: rgba(17,24,39,0.7); border: 1px solid rgba(255,255,255,0.06);
          border-radius: 20px; padding: 28px; transition: all 0.3s;
          position: relative; overflow: hidden;
        }
        .feature-card::before {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(circle at 0% 0%, var(--card-glow, rgba(139,92,246,0.15)), transparent 60%);
          opacity: 0; transition: opacity 0.4s;
        }
        .feature-card:hover { transform: translateY(-6px); border-color: rgba(255,255,255,0.12); box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
        .feature-card:hover::before { opacity: 1; }
        .feature-icon {
          width: 56px; height: 56px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          color: #fff; margin-bottom: 20px;
        }
        .feature-title { font-size: 1.1rem; font-weight: 700; color: #fff; margin: 0 0 10px 0; }
        .feature-desc { color: var(--text-secondary); font-size: 0.88rem; line-height: 1.6; margin: 0 0 18px 0; }
        .feature-tags { display: flex; flex-wrap: wrap; gap: 6px; }
        .feature-tag {
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
          color: var(--text-secondary); padding: 3px 10px; border-radius: 20px; font-size: 0.73rem; font-weight: 500;
        }

        /* ── Steps ── */
        .steps-row {
          display: flex; align-items: flex-start; justify-content: center;
          gap: 0; flex-wrap: wrap;
        }
        .step-card {
          position: relative; flex: 1; min-width: 180px; max-width: 240px;
          text-align: center; padding: 28px 20px;
          background: rgba(17,24,39,0.6); border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px; margin: 8px;
        }
        .step-num {
          font-size: 2.5rem; font-weight: 900; letter-spacing: -0.04em; margin-bottom: 12px;
          background: var(--accent-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .step-title { font-size: 1rem; font-weight: 700; color: #fff; margin: 0 0 8px 0; }
        .step-desc { font-size: 0.85rem; color: var(--text-secondary); margin: 0; line-height: 1.5; }
        .step-arrow { position: absolute; right: -16px; top: 50%; transform: translateY(-50%); color: rgba(255,255,255,0.2); display: none; }

        /* ── CTA ── */
        .cta-section { padding: 60px 24px 100px; }
        .cta-card {
          position: relative; overflow: hidden;
          background: rgba(17,24,39,0.8); border: 1px solid rgba(139,92,246,0.2);
          border-radius: 24px; padding: 72px 48px;
          text-align: center;
          box-shadow: 0 0 60px rgba(139,92,246,0.1);
        }
        .cta-glow-1, .cta-glow-2 {
          position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none;
        }
        .cta-glow-1 { width: 400px; height: 400px; background: rgba(139,92,246,0.2); top: -100px; left: -80px; }
        .cta-glow-2 { width: 300px; height: 300px; background: rgba(236,72,153,0.15); bottom: -60px; right: -60px; }
        .cta-title { font-size: clamp(1.8rem, 3.5vw, 2.8rem); font-weight: 800; color: #fff; margin: 0 0 14px 0; position: relative; z-index: 1; }
        .cta-sub { color: var(--text-secondary); font-size: 1rem; margin: 0 0 36px 0; position: relative; z-index: 1; }

        /* ── Footer ── */
        .landing-footer {
          position: relative; z-index: 1;
          display: flex; justify-content: space-between; align-items: center;
          padding: 20px 60px;
          border-top: 1px solid rgba(255,255,255,0.05);
        }
        .footer-copy { font-size: 0.8rem; color: var(--text-secondary); }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

        @media (max-width: 640px) {
          .landing-nav { padding: 16px 20px; }
          .landing-footer { padding: 16px 20px; }
          .hero-section { padding: 60px 20px 60px; }
          .cta-card { padding: 48px 24px; }
          .features-section, .how-section { padding: 60px 20px; }
        }
      `}</style>
    </div>
  );
}
