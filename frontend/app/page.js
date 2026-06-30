"use client";

import Link from 'next/link';
import { BookOpen, Target, LayoutDashboard, BrainCircuit, Users } from 'lucide-react';

export default function MainDashboard() {
  return (
    <main className="container animate-fade-in">
      <header className="dashboard-header">
        <h1 className="title">Career <span className="text-gradient">Dashboard</span></h1>
        <p className="subtitle">Welcome back! Here is your AI-powered learning hub.</p>
      </header>

      <div className="modules-grid">
        {/* Available Feature */}
        <Link href="/summarizer" className="module-card glass-panel available">
          <div className="icon-wrapper bg-teal">
            <BookOpen size={32} />
          </div>
          <div className="module-content">
            <h3>AI Notes Summarizer</h3>
            <p>Upload your notes, PDFs, or PPTs. Our RAG engine extracts concepts and builds revision notes.</p>
            <span className="status-badge live">Live Now</span>
          </div>
        </Link>

        {/* Coming Soon Features */}
        <div className="module-card glass-panel locked">
          <div className="icon-wrapper bg-gray">
            <Target size={32} />
          </div>
          <div className="module-content">
            <h3>Career Intelligence</h3>
            <p>Analyze your readiness for your dream role and get a custom learning timeline.</p>
            <span className="status-badge upcoming">Coming Soon</span>
          </div>
        </div>

        <div className="module-card glass-panel locked">
          <div className="icon-wrapper bg-gray">
            <LayoutDashboard size={32} />
          </div>
          <div className="module-content">
            <h3>Concept Graph</h3>
            <p>Visualize your knowledge dependencies and find the root cause of weak topics.</p>
            <span className="status-badge upcoming">Phase 3</span>
          </div>
        </div>

        <div className="module-card glass-panel locked">
          <div className="icon-wrapper bg-gray">
            <Users size={32} />
          </div>
          <div className="module-content">
            <h3>AI Peer Matching</h3>
            <p>Find teammates for hackathons or projects based on your skills and goals.</p>
            <span className="status-badge upcoming">Phase 7</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .dashboard-header {
          margin-bottom: 3rem;
          text-align: left;
        }
        .title {
          font-size: 3rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
        }
        .subtitle {
          font-size: 1.1rem;
          color: var(--text-secondary);
        }
        
        .modules-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
        }

        .module-card {
          display: flex;
          flex-direction: column;
          padding: 24px;
          text-decoration: none;
          color: inherit;
          position: relative;
          overflow: hidden;
        }
        
        .module-card.available:hover {
          transform: translateY(-4px);
          border-color: var(--accent-color);
        }

        .module-card.locked {
          opacity: 0.7;
          cursor: not-allowed;
          filter: grayscale(80%);
        }

        .icon-wrapper {
          width: 60px;
          height: 60px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          color: white;
        }
        
        .bg-teal { background: var(--accent-gradient); }
        .bg-gray { background: #94a3b8; }

        .module-content h3 {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .module-content p {
          color: var(--text-secondary);
          font-size: 0.95rem;
          line-height: 1.5;
          margin-bottom: 16px;
        }

        .status-badge {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .status-badge.live {
          background: rgba(15, 118, 110, 0.1);
          color: var(--accent-color);
          border: 1px solid rgba(15, 118, 110, 0.2);
        }

        .status-badge.upcoming {
          background: rgba(100, 116, 139, 0.1);
          color: #64748b;
          border: 1px solid rgba(100, 116, 139, 0.2);
        }
      `}</style>
    </main>
  );
}
