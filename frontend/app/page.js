'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Target, Users, Award, LogOut, ChevronDown, ChevronRight, FolderTree, Bell, Check, X, Send } from 'lucide-react';

// 3D Interactive Card Component
function TiltCard({ children, href }) {
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -10; // Max 10 deg
    const rotateY = ((x - centerX) / centerX) * 10;
    
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    
    // Dynamic glow effect
    const glowX = (x / rect.width) * 100;
    const glowY = (y / rect.height) * 100;
    card.style.setProperty('--glow-x', `${glowX}%`);
    card.style.setProperty('--glow-y', `${glowY}%`);
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
  };

  const CardContent = (
    <div 
      ref={cardRef} 
      className="tilt-card glass-panel"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="glow-overlay"></div>
      <div className="tilt-content">
        {children}
      </div>
    </div>
  );

  return href ? <Link href={href} style={{ textDecoration: 'none' }}>{CardContent}</Link> : CardContent;
}


export default function MainDashboard() {
  const [skills, setSkills] = useState({});
  const [expandedTopics, setExpandedTopics] = useState({});
  const [incomingNotifs, setIncomingNotifs] = useState([]);
  const [outgoingNotifs, setOutgoingNotifs] = useState([]);
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const fetchDashboardData = () => {
    if (!user) return;
    
    // Fetch skills
    fetch(`http://localhost:5001/api/skills?username=${user.username}`)
      .then(res => res.json())
      .then(data => setSkills(data.skills || {}))
      .catch(err => console.error("Failed to fetch skills:", err));
      
    // Fetch notifications
    fetch(`http://localhost:5001/api/notifications?username=${user.username}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setIncomingNotifs(data.incoming || []);
          setOutgoingNotifs(data.outgoing || []);
        }
      })
      .catch(err => console.error("Failed to fetch notifications:", err));
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const markNotificationRead = async (id) => {
    try {
      await fetch('http://localhost:5001/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_id: id })
      });
      fetchDashboardData();
    } catch (err) { console.error(err); }
  };

  const handleRespond = async (id, action) => {
    try {
      await fetch(`http://localhost:5001/api/matchmaking/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_id: id, responder_username: user.username })
      });
      fetchDashboardData();
    } catch (err) { console.error(err); }
  };

  if (loading || !user) return null;

  const toggleTopic = (topic) => {
    setExpandedTopics(prev => ({ ...prev, [topic]: !prev[topic] }));
  };

  const unreadIncoming = incomingNotifs.filter(n => !n.is_read);

  return (
    <main className="container animate-fade-in dashboard-3d">
      <div className="bg-grid"></div>
      
      <header className="dashboard-header">
        <div className="header-text">
          <h1 className="title neon-text">NEXUS <span className="text-gradient">HQ</span></h1>
          <p className="subtitle">Welcome back, {user.username}. Ready to build something crazy?</p>
        </div>
        <button onClick={logout} className="logout-btn cyberpunk-btn">
          <LogOut size={16} /> DISCONNECT
        </button>
      </header>

      <div className="dashboard-content">
        <div className="main-column">
          <div className="modules-grid">
            
            <TiltCard href="/summarizer">
              <div className="icon-wrapper bg-cyan">
                <BookOpen size={36} />
              </div>
              <div className="module-content">
                <h3>Neural Notes Engine</h3>
                <p>Upload raw data. Our RAG engine extracts concepts and injects revision knowledge into your brain.</p>
                <span className="status-badge live">ONLINE</span>
              </div>
            </TiltCard>

            <TiltCard href="/career">
              <div className="icon-wrapper bg-pink">
                <Target size={36} />
              </div>
              <div className="module-content">
                <h3>Career Matrix</h3>
                <p>Target your dream role. Let the AI build a complete readiness score, gap analysis, and roadmap.</p>
                <span className="status-badge live">ONLINE</span>
              </div>
            </TiltCard>

            <TiltCard href="/peer-matching">
              <div className="icon-wrapper bg-neon-green">
                <Users size={36} />
              </div>
              <div className="module-content">
                <h3>AI Matchmaker</h3>
                <p>Scout the network. Find the perfect teammates with complementary skills for your next Hackathon.</p>
                <span className="status-badge live">ONLINE</span>
              </div>
            </TiltCard>
            
          </div>
        </div>

        <aside className="sidebar">
          
          {/* Notifications Panel */}
          <section className="notifications-section glass-panel">
            <div className="skills-header">
              <Bell size={22} className="text-gradient" />
              <h2>COMMS LINK</h2>
              {unreadIncoming.length > 0 && (
                <span className="pulse-badge">{unreadIncoming.length}</span>
              )}
            </div>
            
            <div className="notif-tabs">
              <div className="notif-list">
                <h4 className="list-title">INCOMING TRANSMISSIONS</h4>
                {incomingNotifs.length === 0 ? (
                  <p className="no-skills">Secure line quiet.</p>
                ) : (
                  incomingNotifs.map(n => (
                    <div key={n.id} className={`notif-card ${!n.is_read ? 'unread' : ''}`}>
                      <div className="notif-head">
                        <strong>@{n.sender_username}</strong>
                        <span>{new Date(n.created_at).toLocaleDateString()}</span>
                      </div>
                      <p>{n.message}</p>
                      
                      {n.type === 'match_request' && n.status === 'pending' ? (
                        <div className="action-buttons">
                          <button className="btn-accept" onClick={() => handleRespond(n.id, 'accept')}>
                            <Check size={14} /> ACCEPT
                          </button>
                          <button className="btn-decline" onClick={() => handleRespond(n.id, 'decline')}>
                            <X size={14} /> DENY
                          </button>
                        </div>
                      ) : n.status === 'accepted' ? (
                        <div className="status-text success">✓ Connected (Chat coming soon)</div>
                      ) : n.status === 'rejected' ? (
                        <div className="status-text error">✕ Request Denied</div>
                      ) : (
                        <button className="btn-dismiss" onClick={() => markNotificationRead(n.id)}>Acknowledge</button>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="notif-list mt-4">
                <h4 className="list-title">OUTGOING REQUESTS</h4>
                {outgoingNotifs.length === 0 ? (
                  <p className="no-skills">No active scouting requests.</p>
                ) : (
                  outgoingNotifs.map(n => (
                    <div key={n.id} className="notif-card outgoing">
                      <div className="notif-head">
                        <strong><Send size={12}/> To @{n.target_username}</strong>
                      </div>
                      <div className="status-indicator">
                        {n.status === 'pending' ? <span className="text-warning">⏳ Awaiting Response</span> : 
                         n.status === 'accepted' ? <span className="text-success">✓ Accepted!</span> : 
                         <span className="text-error">✕ Declined</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          <section className="skills-section glass-panel">
            <div className="skills-header">
              <Award size={24} className="text-gradient" />
              <h2>SKILL INVENTORY</h2>
            </div>
            {Object.keys(skills).length > 0 ? (
              <div className="skills-accordion">
                {Object.entries(skills).map(([topic, subtopics], idx) => (
                  <div key={idx} className="topic-group">
                    <button className="accordion-header" onClick={() => toggleTopic(topic)}>
                      <div className="topic-title">
                        <FolderTree size={16} className="text-gradient" />
                        <span>{topic.toUpperCase()}</span>
                      </div>
                      {expandedTopics[topic] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
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
              <p className="no-skills">Inventory empty. Upload data to extract skills.</p>
            )}
          </section>
        </aside>
      </div>

      <style jsx>{`
        /* 3D Global Dashboard Styles */
        .dashboard-3d {
          position: relative;
          z-index: 1;
        }

        .bg-grid {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background-image: 
            linear-gradient(rgba(139, 92, 246, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139, 92, 246, 0.05) 1px, transparent 1px);
          background-size: 40px 40px;
          z-index: -1;
          transform: perspective(500px) rotateX(60deg) translateY(-100px) translateZ(-200px);
          opacity: 0.4;
          animation: gridMove 20s linear infinite;
        }

        @keyframes gridMove {
          0% { background-position: 0 0; }
          100% { background-position: 0 40px; }
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 3rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .title {
          font-size: 4rem;
          font-weight: 900;
          letter-spacing: -0.05em;
          margin: 0;
          text-transform: uppercase;
        }

        .neon-text {
          color: #fff;
          text-shadow: 0 0 10px rgba(139, 92, 246, 0.8), 0 0 20px rgba(139, 92, 246, 0.5);
        }

        .subtitle {
          font-family: monospace;
          color: var(--text-secondary);
          margin-top: 8px;
          font-size: 1rem;
        }

        .cyberpunk-btn {
          background: transparent;
          border: 1px solid var(--accent-color);
          color: var(--accent-color);
          padding: 10px 20px;
          font-family: monospace;
          font-weight: bold;
          text-transform: uppercase;
          border-radius: 4px;
          box-shadow: 0 0 10px rgba(139, 92, 246, 0.2) inset;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .cyberpunk-btn:hover {
          background: var(--accent-color);
          color: #000;
          box-shadow: 0 0 20px rgba(139, 92, 246, 0.6);
        }

        .dashboard-content {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 40px;
        }

        /* 3D Tilt Card Component Styles */
        .modules-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 30px;
          perspective: 1000px; /* 3D Context */
        }

        .tilt-card {
          position: relative;
          height: 100%;
          border-radius: 20px;
          padding: 30px;
          background: rgba(17, 24, 39, 0.7);
          border: 1px solid rgba(255,255,255,0.05);
          transition: transform 0.1s ease-out;
          transform-style: preserve-3d;
          cursor: pointer;
          overflow: hidden;
        }

        .glow-overlay {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: radial-gradient(circle at var(--glow-x, 50%) var(--glow-y, 50%), rgba(255,255,255,0.1), transparent 50%);
          opacity: 0;
          transition: opacity 0.3s;
          pointer-events: none;
        }

        .tilt-card:hover .glow-overlay {
          opacity: 1;
        }

        .tilt-card:hover {
          border-color: rgba(139, 92, 246, 0.5);
          box-shadow: 0 15px 35px rgba(0,0,0,0.5), 0 0 20px rgba(139, 92, 246, 0.2);
        }

        .tilt-content {
          transform: translateZ(40px); /* Pops out in 3D */
          transform-style: preserve-3d;
        }

        .icon-wrapper {
          width: 70px;
          height: 70px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
          color: #fff;
          box-shadow: 0 10px 20px rgba(0,0,0,0.3);
        }

        .bg-cyan { background: linear-gradient(135deg, #06b6d4, #3b82f6); box-shadow: 0 0 20px rgba(6,182,212,0.4); }
        .bg-pink { background: linear-gradient(135deg, #ec4899, #8b5cf6); box-shadow: 0 0 20px rgba(236,72,153,0.4); }
        .bg-neon-green { background: linear-gradient(135deg, #10b981, #34d399); box-shadow: 0 0 20px rgba(16,185,129,0.4); }

        .module-content h3 { font-size: 1.5rem; font-weight: 800; margin-bottom: 12px; }
        .module-content p { color: var(--text-secondary); line-height: 1.6; margin-bottom: 20px; }

        .status-badge.live {
          background: rgba(16,185,129,0.15);
          color: #34d399;
          border: 1px solid rgba(16,185,129,0.3);
          box-shadow: 0 0 10px rgba(16,185,129,0.2);
          padding: 6px 12px;
          border-radius: 4px;
          font-family: monospace;
          font-weight: bold;
        }

        /* Sidebar */
        .sidebar { display: flex; flex-direction: column; gap: 30px; }
        .skills-section, .notifications-section {
          padding: 24px;
          border-radius: 20px;
          background: rgba(17, 24, 39, 0.8);
          border: 1px solid rgba(139, 92, 246, 0.2);
          box-shadow: inset 0 0 20px rgba(0,0,0,0.5);
        }

        .skills-header h2 { font-size: 1.2rem; font-weight: 800; letter-spacing: 0.05em; font-family: monospace; }
        .pulse-badge { background: #ef4444; color: #fff; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: bold; animation: pulse 2s infinite; margin-left: auto; }
        @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(239,68,68,0.7); } 70% { box-shadow: 0 0 0 10px rgba(239,68,68,0); } 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); } }

        .list-title { font-family: monospace; color: var(--text-secondary); font-size: 0.8rem; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 4px; }
        .mt-4 { margin-top: 24px; }
        
        .notif-card {
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.05);
          border-left: 3px solid #3b82f6;
          padding: 14px;
          border-radius: 8px;
          margin-bottom: 10px;
        }
        .notif-card.unread { border-left-color: var(--accent-color); background: rgba(139,92,246,0.05); }
        .notif-card.outgoing { border-left-color: #64748b; }
        
        .notif-head { display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 8px; color: var(--text-secondary); }
        .notif-head strong { color: var(--text-primary); }
        .notif-card p { font-size: 0.9rem; line-height: 1.4; margin-bottom: 12px; }

        .action-buttons { display: flex; gap: 8px; }
        .action-buttons button { flex: 1; padding: 8px; border-radius: 4px; font-weight: bold; font-family: monospace; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 4px; border: none; }
        .btn-accept { background: rgba(16,185,129,0.2); color: #10b981; border: 1px solid rgba(16,185,129,0.4) !important; }
        .btn-accept:hover { background: #10b981; color: #000; }
        .btn-decline { background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.3) !important; }
        .btn-decline:hover { background: #ef4444; color: #000; }
        .btn-dismiss { width: 100%; background: transparent; border: 1px solid rgba(255,255,255,0.1); color: var(--text-secondary); padding: 8px; border-radius: 4px; cursor: pointer; font-family: monospace; }
        .btn-dismiss:hover { background: rgba(255,255,255,0.05); color: #fff; }

        .status-text { font-family: monospace; font-size: 0.85rem; padding: 6px; border-radius: 4px; text-align: center; font-weight: bold; }
        .status-text.success { background: rgba(16,185,129,0.1); color: #10b981; }
        .status-text.error { background: rgba(239,68,68,0.1); color: #ef4444; }

        .status-indicator { font-family: monospace; font-size: 0.8rem; margin-top: 8px; }
        .text-warning { color: #f59e0b; }
        .text-success { color: #10b981; }
        .text-error { color: #ef4444; }

        .accordion-header {
          display: flex; justify-content: space-between; padding: 12px;
          background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.05);
          border-radius: 8px; color: #fff; cursor: pointer; font-family: monospace;
        }
        .topic-title { display: flex; align-items: center; gap: 8px; }
        .skills-list { display: flex; flex-wrap: wrap; gap: 8px; padding: 12px 4px; }
        .skill-badge {
          background: transparent; color: var(--accent-color);
          border: 1px solid var(--accent-color); box-shadow: inset 0 0 5px rgba(139,92,246,0.3);
          padding: 4px 10px; border-radius: 4px; font-family: monospace; font-size: 0.8rem;
        }

        @media (max-width: 1000px) {
          .dashboard-content { grid-template-columns: 1fr; }
        }
      `}</style>
    </main>
  );
}
