"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Target, LayoutDashboard, BrainCircuit, Users, Award, LogOut, ChevronDown, ChevronRight, FolderTree } from 'lucide-react';

export default function MainDashboard() {
  const [skills, setSkills] = useState({});
  const [expandedTopics, setExpandedTopics] = useState({});
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetch(`http://localhost:5001/api/skills?username=${user.username}`)
        .then(res => res.json())
        .then(data => setSkills(data.skills || {}))
        .catch(err => console.error("Failed to fetch skills:", err));
    }
  }, [user]);

  if (loading || !user) return null;

  const toggleTopic = (topic) => {
    setExpandedTopics(prev => ({ ...prev, [topic]: !prev[topic] }));
  };

  return (
    <main className="container animate-fade-in">
      <header className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="title">Career <span className="text-gradient">Dashboard</span></h1>
          <p className="subtitle">Welcome back, {user.username}! Here is your AI-powered learning hub.</p>
        </div>
        <button onClick={logout} className="logout-btn">
          <LogOut size={18} /> Logout
        </button>
      </header>

      <div className="dashboard-content">
        <div className="main-column">
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

            {/* Career Intelligence - Now Live */}
            <Link href="/career" className="module-card glass-panel available">
              <div className="icon-wrapper bg-orange">
                <Target size={32} />
              </div>
              <div className="module-content">
                <h3>Career Intelligence</h3>
                <p>Upload your resume and get a personalized skill gap analysis with projects to build for your dream role.</p>
                <span className="status-badge live">Live Now</span>
              </div>
            </Link>

            {/* Knowledge Gap Analysis */}
            <Link href="/knowledge-gap" className="module-card glass-panel available">
              <div className="icon-wrapper" style={{ background: 'linear-gradient(135deg, #10b981, #3b82f6)' }}>
                <BrainCircuit size={32} />
              </div>
              <div className="module-content">
                <h3>Knowledge Gap Analysis</h3>
                <p>Measure your career readiness. Extract skills automatically and map them against your target role to generate a learning roadmap.</p>
                <span className="status-badge live">Live Now</span>
              </div>
            </Link>

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
        </div>

        <aside className="sidebar">
          <section className="skills-section animate-fade-in glass-panel">
            <div className="skills-header">
              <Award size={28} className="text-gradient" />
              <h2>Your Skills</h2>
            </div>
            {Object.keys(skills).length > 0 ? (
              <div className="skills-accordion">
                {Object.entries(skills).map(([topic, subtopics], idx) => (
                  <div key={idx} className="topic-group">
                    <button 
                      className="accordion-header" 
                      onClick={() => toggleTopic(topic)}
                    >
                      <div className="topic-title">
                        <FolderTree size={18} className="text-gradient" />
                        <span>{topic}</span>
                      </div>
                      {expandedTopics[topic] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>
                    {expandedTopics[topic] && (
                      <div className="skills-list">
                        {subtopics.map((skill, i) => (
                          <span key={i} className="skill-badge">{skill}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-skills">You haven't earned any skills yet. Take a quiz to get started!</p>
            )}
          </section>
        </aside>
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
        
        .dashboard-content {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 32px;
          align-items: start;
        }

        @media (max-width: 900px) {
          .dashboard-content {
            grid-template-columns: 1fr;
          }
        }
        
        .skills-section {
          padding: 24px;
        }
        
        .skills-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }
        
        .skills-header h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
        }

        .skills-accordion {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .topic-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .accordion-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-color);
          padding: 12px 16px;
          border-radius: 12px;
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.2s;
        }

        .accordion-header:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: var(--accent-color);
        }

        .topic-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
        }
        
        .skills-list {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          padding: 8px 4px;
        }
        
        .skill-badge {
          background: rgba(139, 92, 246, 0.15);
          color: var(--accent-color);
          border: 1px solid rgba(139, 92, 246, 0.3);
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 0.95rem;
          font-weight: 600;
          transition: all 0.2s;
        }
        
        .skill-badge:hover {
          transform: translateY(-2px);
          background: rgba(139, 92, 246, 0.25);
        }
        
        .no-skills {
          color: var(--text-secondary);
          font-size: 0.95rem;
          line-height: 1.5;
        }
        
        .logout-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .logout-btn:hover {
          color: #ef4444;
          border-color: rgba(239, 68, 68, 0.5);
          background: rgba(239, 68, 68, 0.1);
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
        .bg-orange { background: linear-gradient(135deg, #f59e0b, #f97316); }
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
