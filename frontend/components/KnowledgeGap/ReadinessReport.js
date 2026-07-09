'use client';

import { useState } from 'react';
import {
  CheckCircle2, AlertTriangle, BookOpen, Award, Map,
  ChevronRight, TrendingUp, Brain, GraduationCap, Zap, Star, ExternalLink
} from 'lucide-react';

// ─── Animated SVG Score Ring ──────────────────────────────────────────────────
function ScoreRing({ score }) {
  const R = 70;
  const SW = 10;
  const r = R - SW / 2;
  const C = 2 * Math.PI * r;
  const offset = C - (score / 100) * C;

  const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good'
    : score >= 40 ? 'Moderate' : score >= 20 ? 'Developing' : 'Beginner';

  return (
    <div className="ring-wrap">
      <svg width={R * 2 + SW} height={R * 2 + SW}>
        {/* track */}
        <circle cx={R + SW / 2} cy={R + SW / 2} r={r}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={SW} />
        {/* progress */}
        <circle cx={R + SW / 2} cy={R + SW / 2} r={r}
          fill="none" stroke={color} strokeWidth={SW}
          strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={offset}
          style={{
            transform: 'rotate(-90deg)', transformOrigin: '50% 50%',
            transition: 'stroke-dashoffset 1.2s cubic-bezier(.16,1,.3,1)',
            filter: `drop-shadow(0 0 8px ${color}80)`,
          }} />
        {/* score number */}
        <text x="50%" y="45%" textAnchor="middle" dominantBaseline="central"
          fill={color} fontSize="26" fontWeight="800" fontFamily="Inter,sans-serif">
          {score}
        </text>
        {/* /100 */}
        <text x="50%" y="62%" textAnchor="middle" dominantBaseline="central"
          fill="rgba(255,255,255,0.35)" fontSize="10" fontFamily="Inter,sans-serif">
          / 100
        </text>
      </svg>
      <span className="ring-label" style={{ color }}>{label}</span>

      <style jsx>{`
        .ring-wrap { display:flex; flex-direction:column; align-items:center; gap:8px; }
        .ring-label { font-size:.9rem; font-weight:700; text-transform:uppercase; letter-spacing:.05em; }
      `}</style>
    </div>
  );
}

// ─── Reusable section header ──────────────────────────────────────────────────
function SectionHead({ icon, title, subtitle, count }) {
  return (
    <div className="sec-head">
      <div className="sec-head-left">
        {icon}
        <div>
          <h3 className="sec-title">{title}</h3>
          {subtitle && <p className="sec-sub">{subtitle}</p>}
        </div>
      </div>
      {count !== undefined && <span className="sec-badge">{count}</span>}
      <style jsx>{`
        .sec-head { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:18px; }
        .sec-head-left { display:flex; align-items:flex-start; gap:12px; }
        .sec-title { font-size:1.15rem; font-weight:700; margin:0 0 3px; color:var(--text-primary); }
        .sec-sub   { font-size:.83rem; color:var(--text-secondary); margin:0; line-height:1.4; }
        .sec-badge {
          background:rgba(99,102,241,.15); color:#818cf8;
          border:1px solid rgba(99,102,241,.28);
          padding:3px 12px; border-radius:999px;
          font-size:.78rem; font-weight:700; white-space:nowrap;
        }
      `}</style>
    </div>
  );
}

// ─── Main Report Component ────────────────────────────────────────────────────
export default function ReadinessReport({ data }) {
  const [tab, setTab] = useState('overview');

  if (!data) return null;

  const {
    readiness_score = 0,
    score_explanation = '',
    strong_skills = [],
    missing_skills = [],
    recommended_courses = [],
    recommended_certifications = [],
    learning_roadmap = [],
  } = data;

  const TABS = [
    { id: 'overview', label: 'Overview', icon: <Brain size={15} /> },
    { id: 'skills', label: 'Skills Gap', icon: <TrendingUp size={15} /> },
    { id: 'courses', label: 'Courses', icon: <BookOpen size={15} /> },
    { id: 'certs', label: 'Certifications', icon: <Award size={15} /> },
    { id: 'roadmap', label: 'Roadmap', icon: <Map size={15} /> },
  ];

  return (
    <div className="report">

      {/* Tab bar */}
      <div className="tab-bar glass-panel">
        {TABS.map(t => (
          <button key={t.id} id={`kg-tab-${t.id}`}
            className={`tab-btn ${tab === t.id ? 'tab-on' : ''}`}
            onClick={() => setTab(t.id)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview ──────────────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="pane animate-fade-in">
          <div className="overview-grid">

            {/* Score card */}
            <div className="glass-panel score-card">
              <div className="score-card-hdr">
                <TrendingUp size={19} className="text-gradient" />
                <h3>Readiness Score</h3>
              </div>
              <ScoreRing score={readiness_score} />
              <p className="score-expl">{score_explanation}</p>
            </div>

            {/* Stat cards */}
            <div className="stats-grid">
              {[
                {
                  icon: <CheckCircle2 size={20} />, num: strong_skills.length,
                  label: 'Strong Skills', col: '#10b981', bg: 'rgba(16,185,129,.1)'
                },
                {
                  icon: <AlertTriangle size={20} />, num: missing_skills.length,
                  label: 'Missing Skills', col: '#ef4444', bg: 'rgba(239,68,68,.1)'
                },
                {
                  icon: <GraduationCap size={20} />, num: recommended_courses.length,
                  label: 'Courses', col: '#818cf8', bg: 'rgba(99,102,241,.1)'
                },
                {
                  icon: <Zap size={20} />, num: learning_roadmap.length,
                  label: 'Roadmap Steps', col: '#f59e0b', bg: 'rgba(245,158,11,.1)'
                },
              ].map(({ icon, num, label, col, bg }, i) => (
                <div key={i} className="stat-card glass-panel">
                  <div className="stat-icon" style={{ background: bg, color: col }}>{icon}</div>
                  <div>
                    <div className="stat-num" style={{ color: col }}>{num}</div>
                    <div className="stat-lbl">{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick preview */}
          {(strong_skills.length > 0 || missing_skills.length > 0) && (
            <div className="preview-row">
              {strong_skills.length > 0 && (
                <div className="glass-panel preview-panel">
                  <div className="preview-hdr" style={{ color: '#10b981' }}>
                    <CheckCircle2 size={15} /> You have
                  </div>
                  <div className="chip-group">
                    {strong_skills.slice(0, 7).map((s, i) => (
                      <span key={i} className="skill-chip strong">{s}</span>
                    ))}
                    {strong_skills.length > 7 && <span className="chip-more">+{strong_skills.length - 7}</span>}
                  </div>
                </div>
              )}
              {missing_skills.length > 0 && (
                <div className="glass-panel preview-panel">
                  <div className="preview-hdr" style={{ color: '#ef4444' }}>
                    <AlertTriangle size={15} /> You need
                  </div>
                  <div className="chip-group">
                    {missing_skills.slice(0, 7).map((s, i) => (
                      <span key={i} className="skill-chip missing">{s}</span>
                    ))}
                    {missing_skills.length > 7 && <span className="chip-more">+{missing_skills.length - 7}</span>}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Skills Gap ────────────────────────────────────────────────────── */}
      {tab === 'skills' && (
        <div className="pane animate-fade-in">
          <div className="two-col">
            <div className="glass-panel pad-panel">
              <SectionHead
                icon={<CheckCircle2 size={21} style={{ color: '#10b981', flexShrink: 0 }} />}
                title="Strong Skills" subtitle="You already have these." count={strong_skills.length}
              />
              <div className="chip-group">
                {strong_skills.length > 0
                  ? strong_skills.map((s, i) => <span key={i} className="skill-chip strong">{s}</span>)
                  : <p className="empty-note">No matching skills found for this role.</p>}
              </div>
            </div>
            <div className="glass-panel pad-panel">
              <SectionHead
                icon={<AlertTriangle size={21} style={{ color: '#ef4444', flexShrink: 0 }} />}
                title="Missing Skills" subtitle="Learn these to reach your goal." count={missing_skills.length}
              />
              <div className="chip-group">
                {missing_skills.length > 0
                  ? missing_skills.map((s, i) => <span key={i} className="skill-chip missing">{s}</span>)
                  : <p className="empty-note">You have all required skills! 🎉</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Courses ───────────────────────────────────────────────────────── */}
      {tab === 'courses' && (
        <div className="pane animate-fade-in">
          <div className="glass-panel pad-panel">
            <SectionHead
              icon={<BookOpen size={21} className="text-gradient" />}
              title="Recommended Courses" subtitle="Fill your knowledge gaps with these." count={recommended_courses.length}
            />
            <div className="resource-list">
              {recommended_courses.map((c, i) => {
                const name = typeof c === 'string' ? c : c.name;
                const url  = typeof c === 'string' ? null : c.url;
                const [courseName, ...rest] = name.split(' — ');
                return (
                  <a key={i}
                    href={url || '#'} target="_blank" rel="noopener noreferrer"
                    className={`resource-row ${!url || url === '#' ? 'no-link' : ''}`}
                    style={{ animationDelay: `${i * 0.06}s` }}>
                    <div className="res-num">{i + 1}</div>
                    <div className="res-body">
                      <span className="res-name">{courseName}</span>
                      {rest.length > 0 && <span className="res-platform">{rest.join(' — ')}</span>}
                    </div>
                    {url && url !== '#' && <ExternalLink size={15} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />}
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Certifications ────────────────────────────────────────────────── */}
      {tab === 'certs' && (
        <div className="pane animate-fade-in">
          <div className="glass-panel pad-panel">
            <SectionHead
              icon={<Award size={21} style={{ color: '#f59e0b', flexShrink: 0 }} />}
              title="Recommended Certifications" subtitle="Industry credentials that validate your skills."
              count={recommended_certifications.length}
            />
            <div className="cert-list">
              {recommended_certifications.map((c, i) => {
                const name = typeof c === 'string' ? c : c.name;
                const url  = typeof c === 'string' ? null : c.url;
                return (
                  <a key={i}
                    href={url || '#'} target="_blank" rel="noopener noreferrer"
                    className={`cert-row ${!url || url === '#' ? 'no-link' : ''}`}
                    style={{ animationDelay: `${i * 0.08}s` }}>
                    <Star size={17} style={{ color: '#f59e0b', flexShrink: 0 }} />
                    <span className="cert-name">{name}</span>
                    {url && url !== '#' && <ExternalLink size={14} style={{ color: '#f59e0b', flexShrink: 0, marginLeft: 'auto' }} />}
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Roadmap ───────────────────────────────────────────────────────── */}
      {tab === 'roadmap' && (
        <div className="pane animate-fade-in">
          <div className="glass-panel pad-panel">
            <SectionHead
              icon={<Map size={21} className="text-gradient" />}
              title="Learning Roadmap" subtitle="Follow these steps in order to close your knowledge gaps."
            />
            <div className="roadmap">
              {learning_roadmap.map((step, i) => {
                const clean = step.replace(/^\d+\.\s*/, '');
                return (
                  <div key={i} className="rm-item">
                    <div className="rm-connector">
                      <div className="rm-dot"><span>{i + 1}</span></div>
                      {i < learning_roadmap.length - 1 && <div className="rm-line" />}
                    </div>
                    <div className="rm-card glass-panel">
                      <p className="rm-text">{clean}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── Styles ─────────────────────────────────────────────────────────── */}
      <style jsx>{`
        .report { display:flex; flex-direction:column; gap:18px; }

        /* Tab bar */
        .tab-bar { display:flex; gap:4px; padding:7px; border-radius:20px; flex-wrap:wrap; }
        .tab-btn {
          background:transparent; border:none; color:var(--text-secondary);
          padding:9px 18px; border-radius:13px; font-size:.86rem; font-weight:600;
          cursor:pointer; display:flex; align-items:center; gap:6px;
          transition:all .25s; font-family:inherit; flex:1;
          justify-content:center; white-space:nowrap;
        }
        .tab-btn:hover { color:var(--text-primary); background:rgba(255,255,255,.04); }
        .tab-on { color:#fff; background:linear-gradient(135deg,#6366f1,#8b5cf6); box-shadow:0 4px 14px rgba(99,102,241,.3); }

        .pane { display:flex; flex-direction:column; gap:18px; }

        /* Overview */
        .overview-grid { display:grid; grid-template-columns:auto 1fr; gap:18px; align-items:start; }
        @media(max-width:720px){ .overview-grid { grid-template-columns:1fr; } }

        .score-card { padding:26px; display:flex; flex-direction:column; align-items:center; gap:18px; min-width:200px; }
        .score-card-hdr { display:flex; align-items:center; gap:9px; font-size:.95rem; font-weight:700; align-self:flex-start; }
        .score-card-hdr h3 { margin:0; }
        .score-expl { font-size:.78rem; color:var(--text-secondary); line-height:1.5; text-align:center; margin:0; }

        .stats-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
        .stat-card  { padding:16px 18px; display:flex; align-items:center; gap:12px; border-radius:16px; }
        .stat-icon  { width:42px; height:42px; border-radius:11px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .stat-num   { font-size:1.5rem; font-weight:800; line-height:1; }
        .stat-lbl   { font-size:.75rem; color:var(--text-secondary); font-weight:500; }

        .preview-row { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
        @media(max-width:600px){ .preview-row { grid-template-columns:1fr; } }
        .preview-panel { padding:18px; display:flex; flex-direction:column; gap:10px; }
        .preview-hdr   { display:flex; align-items:center; gap:6px; font-weight:700; font-size:.82rem; text-transform:uppercase; letter-spacing:.04em; }

        /* Skills */
        .two-col { display:grid; grid-template-columns:1fr 1fr; gap:18px; }
        @media(max-width:680px){ .two-col { grid-template-columns:1fr; } }

        .pad-panel { padding:24px; }
        .empty-note { color:var(--text-secondary); font-size:.88rem; margin:0; font-style:italic; }

        /* Chips */
        .chip-group { display:flex; flex-wrap:wrap; gap:8px; }
        .skill-chip {
          padding:5px 13px; border-radius:999px; font-size:.82rem; font-weight:500;
          border:1px solid; transition:transform .2s;
        }
        .skill-chip:hover { transform:translateY(-2px); }
        .strong  { background:rgba(16,185,129,.1);  color:#10b981; border-color:rgba(16,185,129,.25); }
        .missing { background:rgba(239,68,68,.1);   color:#ef4444; border-color:rgba(239,68,68,.25); }
        .chip-more {
          padding:5px 12px; border-radius:999px; font-size:.76rem; font-weight:600;
          color:var(--text-secondary); border:1px solid var(--border-color);
          background:rgba(255,255,255,.03);
        }

        /* Courses */
        .resource-list { display:flex; flex-direction:column; gap:9px; }
        .resource-row {
          display:flex; align-items:center; gap:14px; padding:14px 18px;
          background:rgba(255,255,255,.02); border:1px solid var(--border-color);
          border-radius:13px; transition:all .25s; animation:fadeUp .4s ease both;
          text-decoration:none; color:inherit;
        }
        .resource-row:not(.no-link):hover { background:rgba(255,255,255,.05); border-color:#818cf8; transform:translateX(4px); }
        .no-link { cursor:default; }
        .res-num {
          width:30px; height:30px; border-radius:50%; flex-shrink:0;
          background:linear-gradient(135deg,#6366f1,#8b5cf6);
          display:flex; align-items:center; justify-content:center;
          font-size:.78rem; font-weight:800; color:#fff;
        }
        .res-body { flex:1; display:flex; flex-direction:column; gap:2px; }
        .res-name     { font-size:.9rem; font-weight:600; color:var(--text-primary); }
        .res-platform { font-size:.78rem; color:var(--text-secondary); }

        /* Certs */
        .cert-list { display:flex; flex-direction:column; gap:10px; }
        .cert-row {
          display:flex; align-items:center; gap:12px; padding:16px 20px;
          background:rgba(245,158,11,.04); border:1px solid rgba(245,158,11,.2);
          border-radius:13px; transition:all .25s; animation:fadeUp .4s ease both;
          text-decoration:none; color:inherit;
        }
        .cert-row:not(.no-link):hover { background:rgba(245,158,11,.09); border-color:rgba(245,158,11,.4); transform:translateX(4px); }
        .cert-name { font-size:.9rem; font-weight:600; color:var(--text-primary); }

        /* Roadmap */
        .roadmap    { display:flex; flex-direction:column; }
        .rm-item    { display:flex; gap:14px; align-items:flex-start; }
        .rm-connector { display:flex; flex-direction:column; align-items:center; flex-shrink:0; padding-top:3px; }
        .rm-dot {
          width:34px; height:34px; border-radius:50%;
          background:linear-gradient(135deg,#6366f1,#8b5cf6);
          display:flex; align-items:center; justify-content:center;
          font-size:.78rem; font-weight:800; color:#fff;
          box-shadow:0 0 10px rgba(99,102,241,.4); flex-shrink:0;
        }
        .rm-line { width:2px; flex:1; min-height:20px; background:linear-gradient(to bottom,rgba(99,102,241,.5),rgba(99,102,241,.1)); margin:5px 0; }
        .rm-card  { flex:1; padding:13px 16px; margin-bottom:10px; border-radius:13px; }
        .rm-text  { font-size:.9rem; color:var(--text-primary); margin:0; line-height:1.5; font-weight:500; }

        @keyframes fadeUp {
          from { opacity:0; transform:translateY(8px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>
    </div>
  );
}
