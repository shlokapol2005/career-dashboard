'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import {
  Sparkles, UploadCloud, FileText, Loader2,
  AlertCircle, CheckCircle2, Target, Layers, Hammer,
  ChevronRight, Lightbulb, Rocket, Building2,
  TrendingUp, Brain, BookOpen, Award, Map, AlertTriangle,
  GraduationCap, Star, ExternalLink, RotateCcw
} from 'lucide-react';


// ── Level config for Projects tab ─────────────────────────────────────────────
const LEVEL_CONFIG = {
  beginner: {
    label: 'Beginner', icon: <Layers size={16} />,
    color: '#10b981', bg: 'rgba(16,185,129,0.12)',
    border: 'rgba(16,185,129,0.3)', glow: 'rgba(16,185,129,0.15)',
  },
  intermediate: {
    label: 'Intermediate', icon: <Hammer size={16} />,
    color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.3)', glow: 'rgba(245,158,11,0.15)',
  },
  advanced: {
    label: 'Advanced', icon: <Rocket size={16} />,
    color: '#ec4899', bg: 'rgba(236,72,153,0.12)',
    border: 'rgba(236,72,153,0.3)', glow: 'rgba(236,72,153,0.15)',
  },
};

const TARGET_COMPANIES = ['Google', 'Microsoft', 'Amazon', 'Meta', 'Netflix', 'Apple'];
const ROLE_SUGGESTIONS = ['ML Engineer', 'Data Engineer', 'AI Engineer', 'SDE', 'Data Scientist', 'DevOps Engineer'];

// ── Score Ring ─────────────────────────────────────────────────────────────────
function ScoreRing({ score }) {
  const R = 72, SW = 10, r = R - SW / 2, C = 2 * Math.PI * r;
  const offset = C - (score / 100) * C;
  const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Moderate' : 'Developing';
  return (
    <div className="ring-wrap">
      <svg width={R * 2 + SW} height={R * 2 + SW}>
        <circle cx={R + SW / 2} cy={R + SW / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={SW} />
        <circle cx={R + SW / 2} cy={R + SW / 2} r={r} fill="none" stroke={color} strokeWidth={SW}
          strokeLinecap="round" strokeDasharray={C} strokeDashoffset={offset}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%',
            transition: 'stroke-dashoffset 1.4s cubic-bezier(.16,1,.3,1)',
            filter: `drop-shadow(0 0 10px ${color}80)` }} />
        <text x="50%" y="44%" textAnchor="middle" dominantBaseline="central"
          fill={color} fontSize="28" fontWeight="800" fontFamily="Inter,sans-serif">{score}</text>
        <text x="50%" y="62%" textAnchor="middle" dominantBaseline="central"
          fill="rgba(255,255,255,0.35)" fontSize="10" fontFamily="Inter,sans-serif">/ 100</text>
      </svg>
      <span style={{ color, fontSize: '.88rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</span>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function CareerPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [resumeFile, setResumeFile] = useState(null);
  const [desiredRole, setDesiredRole] = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [activeLevel, setActiveLevel] = useState('beginner');

  // Auth guard
  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  if (loading || !user) return null;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleFileChange = (file) => {
    if (!file) return;
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!['.pdf', '.txt'].includes(ext)) {
      setError('Please upload a PDF or TXT resume file.');
      return;
    }
    setResumeFile(file);
    setError(null);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setIsDragging(false);
    handleFileChange(e.dataTransfer.files[0]);
  };

  const handleAnalyze = async () => {
    if (!resumeFile || !desiredRole.trim()) {
      setError('Please upload a resume and enter your desired role.');
      return;
    }
    setIsProcessing(true); setError(null); setResults(null);
    try {
      const fd = new FormData();
      fd.append('resume', resumeFile);
      fd.append('desired_role', desiredRole.trim());
      fd.append('target_company', targetCompany.trim());
      fd.append('username', user?.username || '');

      const res = await fetch('http://localhost:5001/api/career/full-analysis', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Analysis failed');
      setResults(data);
      setActiveTab('overview');
      setActiveLevel('beginner');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setResults(null); setResumeFile(null);
    setDesiredRole(''); setTargetCompany(''); setError(null);
  };

  const projectsByLevel = results
    ? (results.projects || []).reduce((acc, p) => {
        if (!acc[p.level]) acc[p.level] = [];
        acc[p.level].push(p);
        return acc;
      }, {})
    : {};

  const TABS = [
    { id: 'overview',  label: 'Overview',       icon: <Brain size={15} /> },
    { id: 'skills',    label: 'Skills Gap',      icon: <TrendingUp size={15} /> },
    { id: 'projects',  label: 'Projects',        icon: <Lightbulb size={15} /> },
    { id: 'courses',   label: 'Courses & Certs', icon: <BookOpen size={15} /> },
    { id: 'roadmap',   label: 'Roadmap',         icon: <Map size={15} /> },
  ];

  return (
    <div className="page-wrapper">

      <main className="container animate-fade-in">

      {/* Hero */}
      <header className="career-hero">
        <div className="badge">
          <Target size={16} className="text-gradient" />
          <span>Career Intelligence</span>
        </div>
        <h1 className="career-title">
          Your Complete <span className="text-gradient">Career Roadmap</span>
        </h1>
        <p className="career-subtitle">
          Upload your resume, set your dream role and target company. Get a readiness score,
          skill gap analysis, project recommendations, curated courses, and a personalised roadmap — all in one shot.
        </p>
      </header>

      {/* ── Upload Form ────────────────────────────────────────────────────── */}
      {!results && (
        <section className="upload-section animate-fade-in delay-1">
          {/* Resume Drop Zone */}
          <div
            className={`upload-zone glass-panel ${isDragging ? 'dragging' : ''} ${resumeFile ? 'has-file' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <input type="file" id="resume-upload" className="hidden-input"
              accept=".pdf,.txt"
              onChange={(e) => e.target.files[0] && handleFileChange(e.target.files[0])}
              disabled={isProcessing} />
            <label htmlFor="resume-upload" className="upload-label">
              {resumeFile ? (
                <div className="upload-content">
                  <FileText size={44} className="text-gradient" />
                  <span className="file-name">{resumeFile.name}</span>
                  <span className="file-size">{(resumeFile.size / 1024).toFixed(1)} KB · Click to change</span>
                </div>
              ) : (
                <div className="upload-content">
                  <div className="upload-icon-circle"><UploadCloud size={36} className="text-gradient" /></div>
                  <h3>Drop your resume here</h3>
                  <p>PDF or TXT — drag & drop or click to browse</p>
                </div>
              )}
            </label>
          </div>

          {/* Role + Company Inputs */}
          <div className="inputs-row">
            {/* Desired Role */}
            <div className="input-panel glass-panel">
              <label htmlFor="desired-role" className="input-label">
                <Target size={17} className="text-gradient" /> Your Dream Role <span className="req">*</span>
              </label>
              <div className="chips-row">
                {ROLE_SUGGESTIONS.map(r => (
                  <button key={r}
                    className={`chip ${desiredRole === r ? 'chip-on' : ''}`}
                    onClick={() => setDesiredRole(prev => prev === r ? '' : r)}>
                    {r}
                  </button>
                ))}
              </div>
              <input id="desired-role" type="text" className="text-input"
                placeholder="Or type a custom role…"
                value={desiredRole}
                onChange={(e) => setDesiredRole(e.target.value)}
                disabled={isProcessing}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()} />
            </div>

            {/* Target Company */}
            <div className="input-panel glass-panel">
              <label className="input-label">
                <Building2 size={17} className="text-gradient" /> Dream Company <em className="optional">(optional)</em>
              </label>
              <div className="chips-row">
                {TARGET_COMPANIES.map(c => (
                  <button key={c}
                    className={`chip ${targetCompany === c ? 'chip-on' : ''}`}
                    onClick={() => setTargetCompany(prev => prev === c ? '' : c)}>
                    {c}
                  </button>
                ))}
              </div>
              <input id="target-company" type="text" className="text-input"
                placeholder="Or type a company name…"
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
                disabled={isProcessing} />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="error-box glass-panel">
              <AlertCircle size={20} />
              <p>{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button className="btn-primary analyze-btn" id="analyze-career-btn"
            onClick={handleAnalyze}
            disabled={isProcessing || !resumeFile || !desiredRole.trim()}>
            {isProcessing ? (
              <><Loader2 size={20} className="spinner" /> Analysing your career path…</>
            ) : (
              <><Sparkles size={20} /> Analyse My Career Path</>
            )}
          </button>
        </section>
      )}

      {/* ── Results ───────────────────────────────────────────────────────── */}
      {results && (
        <section className="results-section animate-fade-in">

          {/* ── Sticky Summary Bar ─────────────────────────────────────────── */}
          <div className="summary-bar glass-panel">
            <div className="summary-bar-left">
              <div className="summary-status-dot" />
              <div>
                <div className="summary-title">Analysis Complete</div>
                <div className="summary-meta">
                  <span className="summary-role">{results.desiredRole}</span>
                  {results.targetCompany && <><span className="summary-sep">·</span><span>{results.targetCompany}</span></>}
                </div>
              </div>
            </div>
            <div className="summary-bar-stats">
              {[
                { num: results.readiness_score, label: 'Score', col: results.readiness_score >= 70 ? '#10b981' : results.readiness_score >= 40 ? '#f59e0b' : '#ef4444' },
                { num: results.strong_skills?.length || 0, label: 'Strong', col: '#10b981' },
                { num: results.missing_skills?.length || 0, label: 'Missing', col: '#ef4444' },
                { num: results.projects?.length || 0, label: 'Projects', col: '#f59e0b' },
              ].map(({ num, label, col }, i) => (
                <div key={i} className="summary-stat">
                  <span className="summary-stat-num" style={{ color: col }}>{num}</span>
                  <span className="summary-stat-label">{label}</span>
                </div>
              ))}
            </div>
            <button className="btn-outline reset-btn" onClick={handleReset} id="career-reset-btn">
              <RotateCcw size={14} /> New Analysis
            </button>
          </div>

          {/* ── SECTION 1: Readiness Overview ──────────────────────────────── */}
          <div className="section-block">
            <div className="section-header">
              <div className="section-header-left">
                <div className="section-num">01</div>
                <div>
                  <h2 className="section-title">Readiness Overview</h2>
                  <p className="section-desc">Your career readiness score and key stats at a glance</p>
                </div>
              </div>
            </div>
            <div className="overview-cards">
              {/* Score Card */}
              <div className="glass-panel score-main-card">
                <div className="score-ring-wrap">
                  <ScoreRing score={results.readiness_score} />
                </div>
                <div className="score-main-details">
                  <div className="score-main-label">Career Readiness</div>
                  <p className="score-expl">{results.score_explanation}</p>
                </div>
              </div>
              {/* Stat Cards Row */}
              <div className="mini-stats-row">
                {[
                  { icon: <CheckCircle2 size={18} />, num: results.strong_skills?.length || 0, label: 'Strong Skills', col: '#10b981', bg: 'rgba(16,185,129,.08)', border: 'rgba(16,185,129,.2)' },
                  { icon: <AlertTriangle size={18} />, num: results.missing_skills?.length || 0, label: 'Gaps to Close', col: '#ef4444', bg: 'rgba(239,68,68,.08)', border: 'rgba(239,68,68,.2)' },
                  { icon: <Lightbulb size={18} />, num: results.projects?.length || 0, label: 'Projects', col: '#f59e0b', bg: 'rgba(245,158,11,.08)', border: 'rgba(245,158,11,.2)' },
                  { icon: <GraduationCap size={18} />, num: results.recommended_courses?.length || 0, label: 'Courses', col: '#818cf8', bg: 'rgba(99,102,241,.08)', border: 'rgba(99,102,241,.2)' },
                ].map(({ icon, num, label, col, bg, border }, i) => (
                  <div key={i} className="mini-stat-card" style={{ '--sc': col, '--sb': bg, '--sbr': border }}>
                    <div className="mini-stat-icon">{icon}</div>
                    <div className="mini-stat-num">{num}</div>
                    <div className="mini-stat-label">{label}</div>
                  </div>
                ))}
              </div>
              {/* Skill Preview */}
              {(results.strong_skills?.length > 0 || results.missing_skills?.length > 0) && (
                <div className="quick-preview-row">
                  {results.strong_skills?.length > 0 && (
                    <div className="glass-panel quick-panel">
                      <div className="quick-hdr" style={{ color: '#10b981' }}>
                        <CheckCircle2 size={13} /> You have
                      </div>
                      <div className="chip-group">
                        {results.strong_skills.map((s, i) => <span key={i} className="skill-chip skill-strong">{s}</span>)}
                      </div>
                    </div>
                  )}
                  {results.missing_skills?.length > 0 && (
                    <div className="glass-panel quick-panel">
                      <div className="quick-hdr" style={{ color: '#ef4444' }}>
                        <AlertTriangle size={13} /> You need
                      </div>
                      <div className="chip-group">
                        {results.missing_skills.map((s, i) => <span key={i} className="skill-chip skill-missing">{s}</span>)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── SECTION 2: Recommended Projects ────────────────────────────── */}
          <div className="section-block">
            <div className="section-header">
              <div className="section-header-left">
                <div className="section-num">02</div>
                <div>
                  <h2 className="section-title">Recommended Projects</h2>
                  <p className="section-desc">Hands-on projects to close your skill gaps and strengthen your resume</p>
                </div>
              </div>
              <div className="level-tabs">
                {['beginner', 'intermediate', 'advanced'].map((level) => {
                  const cfg = LEVEL_CONFIG[level];
                  return (
                    <button key={level} id={`tab-${level}`}
                      className={`level-tab ${activeLevel === level ? 'level-tab-on' : ''}`}
                      style={activeLevel === level ? { background: cfg.bg, borderColor: cfg.border, color: cfg.color } : {}}
                      onClick={() => setActiveLevel(level)}>
                      {cfg.icon} {cfg.label}
                      <span className="tab-count">{projectsByLevel[level]?.length || 0}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="project-cards">
              {(projectsByLevel[activeLevel] || []).map((project, i) => {
                const cfg = LEVEL_CONFIG[activeLevel];
                return (
                  <div key={i} className="project-card"
                    style={{ '--card-glow': cfg.glow, '--card-border': cfg.border, '--card-color': cfg.color }}>
                    <div className="project-level-badge" style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
                      {cfg.icon} {cfg.label}
                    </div>
                    <h4 className="project-title">{project.title}</h4>
                    <p className="project-desc">{project.description}</p>
                    <div className="project-skills">
                      <span className="project-skills-label">Skills you'll build:</span>
                      <div className="project-skills-tags">
                        {project.skillsBuilt?.map((s, si) => (
                          <span key={si} className="project-skill-badge" style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>{s}</span>
                        ))}
                      </div>
                    </div>
                    <div className="how-to-build" style={{ borderColor: cfg.border, background: 'rgba(255,255,255,0.02)' }}>
                      <div className="how-to-label" style={{ color: cfg.color }}>
                        <ChevronRight size={13} /> How to build it
                      </div>
                      <p>{project.howToBuild}</p>
                    </div>
                    {project.githubRepo && (
                      <a href={project.githubRepo} target="_blank" rel="noopener noreferrer"
                        className="github-link" style={{ borderColor: cfg.border, color: cfg.color }}>
                        <svg height="15" width="15" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                        </svg>
                        Reference on GitHub
                      </a>
                    )}
                  </div>
                );
              })}
              {(projectsByLevel[activeLevel] || []).length === 0 && (
                <div className="empty-state">
                  <Lightbulb size={40} style={{ opacity: 0.3 }} />
                  <p>No {activeLevel} projects generated.</p>
                </div>
              )}
            </div>
          </div>

          {/* ── SECTION 3: Courses & Certifications ────────────────────────── */}
          <div className="section-block">
            <div className="section-header">
              <div className="section-header-left">
                <div className="section-num">03</div>
                <div>
                  <h2 className="section-title">Courses & Certifications</h2>
                  <p className="section-desc">Curated resources to accelerate your learning path</p>
                </div>
              </div>
            </div>
            <div className="two-col">
              <div className="glass-panel pad-panel">
                <div className="sec-hdr">
                  <BookOpen size={20} className="text-gradient" />
                  <div>
                    <h3 className="sec-title">Recommended Courses</h3>
                    <p className="sec-sub">Curated to fill your exact skill gaps</p>
                  </div>
                  <span className="sec-badge indigo-badge">{results.recommended_courses?.length || 0}</span>
                </div>
                <div className="resource-list">
                  {(results.recommended_courses || []).map((c, i) => {
                    const name = typeof c === 'string' ? c : c.name;
                    const url  = typeof c === 'string' ? null : c.url;
                    const [title, ...rest] = name.split(' — ');
                    return (
                      <a key={i} href={url || '#'} target="_blank" rel="noopener noreferrer"
                        className={`resource-row ${!url || url === '#' ? 'no-link' : ''}`}
                        style={{ animationDelay: `${i * 0.07}s` }}>
                        <div className="res-num">{i + 1}</div>
                        <div className="res-body">
                          <span className="res-name">{title}</span>
                          {rest.length > 0 && <span className="res-platform">{rest.join(' — ')}</span>}
                        </div>
                        {url && url !== '#' && <ExternalLink size={14} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />}
                      </a>
                    );
                  })}
                </div>
              </div>
              <div className="glass-panel pad-panel">
                <div className="sec-hdr">
                  <Award size={20} style={{ color: '#f59e0b' }} />
                  <div>
                    <h3 className="sec-title">Certifications</h3>
                    <p className="sec-sub">Industry credentials that validate your skills</p>
                  </div>
                  <span className="sec-badge yellow-badge">{results.recommended_certifications?.length || 0}</span>
                </div>
                <div className="cert-list">
                  {(results.recommended_certifications || []).map((c, i) => {
                    const name = typeof c === 'string' ? c : c.name;
                    const url  = typeof c === 'string' ? null : c.url;
                    return (
                      <a key={i} href={url || '#'} target="_blank" rel="noopener noreferrer"
                        className={`cert-row ${!url || url === '#' ? 'no-link' : ''}`}
                        style={{ animationDelay: `${i * 0.09}s` }}>
                        <Star size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />
                        <span className="cert-name">{name}</span>
                        {url && url !== '#' && <ExternalLink size={13} style={{ color: '#f59e0b', flexShrink: 0, marginLeft: 'auto' }} />}
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ── SECTION 4: Learning Roadmap ─────────────────────────────────── */}
          <div className="section-block">
            <div className="section-header">
              <div className="section-header-left">
                <div className="section-num">04</div>
                <div>
                  <h2 className="section-title">Learning Roadmap</h2>
                  <p className="section-desc">A step-by-step guide to close your knowledge gaps for {results.desiredRole}</p>
                </div>
              </div>
            </div>
            <div className="glass-panel pad-panel">
              <div className="roadmap">
                {(results.learning_roadmap || []).map((step, i) => {
                  const clean = step.replace(/^\d+\.\s*/, '');
                  return (
                    <div key={i} className="rm-item">
                      <div className="rm-connector">
                        <div className="rm-dot"><span>{i + 1}</span></div>
                        {i < (results.learning_roadmap?.length || 0) - 1 && <div className="rm-line" />}
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

        </section>
      )}

      {/* ─── Styles ───────────────────────────────────────────────────────── */}
      <style jsx>{`
        /* ── Glass Panel (light theme card) ── */
        .glass-panel {
          background: #ffffff;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
        }

        /* Hero */
        .career-hero { text-align: center; margin-bottom: 3rem; }
        .badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--accent-light); border: 1px solid rgba(139,92,246,.25);
          padding: 8px 18px; border-radius: 999px;
          font-weight: 600; font-size: .85rem; color: var(--accent-color);
          margin-bottom: 20px;
        }
        .career-title {
          font-size: clamp(2rem,5vw,3.2rem); font-weight: 800;
          letter-spacing: -.02em; margin: 0 0 16px; line-height: 1.15;
          color: var(--text-primary);
        }
        .career-subtitle {
          font-size: 1rem; color: var(--text-secondary);
          max-width: 620px; margin: 0 auto; line-height: 1.65;
        }

        /* Upload Section */
        .upload-section {
          max-width: 760px; margin: 0 auto;
          display: flex; flex-direction: column; gap: 20px;
        }
        .upload-zone { cursor: pointer; transition: all .3s; padding: 0; }
        .upload-zone.dragging { border-color: var(--accent-color) !important; box-shadow: 0 0 0 3px rgba(139,92,246,.15); transform: scale(1.01); }
        .upload-zone.has-file { border-color: rgba(16,185,129,.5) !important; }
        .hidden-input { display: none; }
        .upload-label {
          display: block; padding: 2.5rem 2rem;
          border: 2px dashed var(--border-color); border-radius: 18px;
          cursor: pointer; transition: all .3s;
        }
        .upload-label:hover { border-color: var(--accent-color); background: var(--accent-light); }
        .upload-content { display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; }
        .upload-icon-circle {
          width: 72px; height: 72px; border-radius: 50%;
          background: var(--accent-light);
          display: flex; align-items: center; justify-content: center; margin-bottom: 6px;
        }
        .upload-content h3 { font-size: 1.2rem; font-weight: 700; margin: 0; color: var(--text-primary); }
        .upload-content p  { color: var(--text-secondary); font-size: .88rem; margin: 0; }
        .file-name { font-size: 1rem; font-weight: 600; color: var(--success-color); }
        .file-size { font-size: .82rem; color: var(--text-secondary); }

        /* Inputs Row */
        .inputs-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 680px) { .inputs-row { grid-template-columns: 1fr; } }
        .input-panel { padding: 22px; display: flex; flex-direction: column; gap: 12px; }
        .input-label {
          display: flex; align-items: center; gap: 8px;
          font-weight: 600; font-size: .93rem; color: var(--text-primary);
        }
        .req { color: var(--error-color); }
        .optional { font-weight: 400; color: var(--text-secondary); font-style: normal; margin-left: 4px; font-size: .82rem; }

        /* Chips */
        .chips-row { display: flex; flex-wrap: wrap; gap: 8px; }
        .chip {
          padding: 6px 14px; border-radius: 999px;
          border: 1px solid var(--border-color);
          background: var(--bg-hover);
          color: var(--text-secondary); font-size: .82rem; font-weight: 500;
          cursor: pointer; transition: all .2s; font-family: inherit;
        }
        .chip:hover { border-color: var(--accent-color); color: var(--accent-color); background: var(--accent-light); }
        .chip-on { background: var(--accent-light); border-color: var(--accent-color); color: var(--accent-color); font-weight: 700; }

        /* Text inputs */
        .text-input {
          background: var(--bg-hover); border: 1px solid var(--border-color);
          border-radius: 10px; padding: 11px 14px; font-size: .9rem;
          color: var(--text-primary); width: 100%; font-family: inherit; transition: border-color .25s, box-shadow .25s;
        }
        .text-input::placeholder { color: var(--text-muted); }
        .text-input:focus { outline: none; border-color: var(--accent-color); box-shadow: 0 0 0 3px rgba(139,92,246,.1); background: #fff; }
        .text-input:disabled { opacity: .5; }

        /* Error */
        .error-box {
          display: flex; align-items: center; gap: 12px; padding: 14px 16px;
          border-color: rgba(239,68,68,.3); background: var(--error-light); color: var(--error-color);
          border-radius: var(--radius-md);
        }
        .error-box p { margin: 0; font-size: .9rem; }

        /* Analyze button */
        .analyze-btn { width: 100%; padding: 14px 24px; font-size: 1rem; border-radius: 14px; justify-content: center; }
        .spinner { animation: spin 1.5s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }

        /* ── Results Section ── */
        .results-section { display: flex; flex-direction: column; gap: 0; }

        /* Summary Bar */
        .summary-bar {
          display: flex; align-items: center; gap: 20px; padding: 16px 24px;
          border-radius: 16px; margin-bottom: 36px; flex-wrap: wrap;
          position: sticky; top: 12px; z-index: 10;
          background: #fff;
          border: 1px solid var(--border-color);
          box-shadow: 0 4px 20px rgba(0,0,0,.08);
        }
        .summary-bar-left { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
        .summary-status-dot {
          width: 9px; height: 9px; border-radius: 50%;
          background: var(--success-color); flex-shrink: 0;
          box-shadow: 0 0 0 3px rgba(16,185,129,.2);
          animation: pulse-dot 2s infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { box-shadow: 0 0 0 3px rgba(16,185,129,.2); }
          50% { box-shadow: 0 0 0 5px rgba(16,185,129,.15); }
        }
        .summary-title { font-size: .9rem; font-weight: 700; color: var(--text-primary); }
        .summary-meta { display: flex; align-items: center; gap: 5px; font-size: .78rem; color: var(--text-secondary); margin-top: 1px; flex-wrap: wrap; }
        .summary-role { color: var(--accent-color); font-weight: 600; }
        .summary-sep { opacity: .5; }
        .summary-bar-stats { display: flex; gap: 20px; }
        .summary-stat { display: flex; flex-direction: column; align-items: center; gap: 1px; }
        .summary-stat-num { font-size: 1.2rem; font-weight: 800; line-height: 1; }
        .summary-stat-label { font-size: .63rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: .07em; }
        .reset-btn { display: flex; align-items: center; gap: 6px; padding: 8px 16px; font-size: .82rem; white-space: nowrap; border-radius: 10px; }

        /* Section Blocks */
        .section-block {
          padding-bottom: 44px;
          margin-bottom: 44px;
          border-bottom: 1px solid var(--border-color);
        }
        .section-block:last-child { border-bottom: none; padding-bottom: 0; margin-bottom: 0; }

        /* Section Header */
        .section-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 16px; margin-bottom: 20px; flex-wrap: wrap;
        }
        .section-header-left { display: flex; align-items: flex-start; gap: 14px; }
        .section-num {
          font-size: .65rem; font-weight: 800; color: var(--accent-color);
          letter-spacing: .1em; font-family: 'Inter', monospace;
          background: var(--accent-light); border: 1px solid rgba(139,92,246,.2);
          padding: 4px 9px; border-radius: 7px; white-space: nowrap; margin-top: 3px;
        }
        .section-title {
          font-size: 1.25rem; font-weight: 800; margin: 0 0 3px;
          letter-spacing: -.01em; color: var(--text-primary);
        }
        .section-desc { font-size: .82rem; color: var(--text-secondary); margin: 0; line-height: 1.5; }

        /* Overview Cards */
        .overview-cards { display: flex; flex-direction: column; gap: 14px; }
        .score-main-card {
          display: flex; align-items: center; gap: 28px; padding: 24px 28px;
          border-radius: 16px;
        }
        @media(max-width:640px){ .score-main-card { flex-direction: column; gap: 20px; padding: 20px; } }
        .score-ring-wrap { flex-shrink: 0; }
        .score-main-details { flex: 1; }
        .score-main-label { font-size: 1rem; font-weight: 700; margin-bottom: 8px; color: var(--text-primary); }
        .score-expl { font-size: .82rem; color: var(--text-secondary); line-height: 1.65; margin: 0; }
        .ring-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; }

        /* Mini Stats Row */
        .mini-stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        @media(max-width:640px){ .mini-stats-row { grid-template-columns: repeat(2,1fr); } }
        .mini-stat-card {
          background: var(--sb, var(--bg-hover));
          border: 1px solid var(--sbr, var(--border-color));
          border-radius: 14px; padding: 18px 14px;
          display: flex; flex-direction: column; align-items: center; gap: 6px;
          transition: transform .2s, box-shadow .2s;
        }
        .mini-stat-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
        .mini-stat-icon { color: var(--sc, var(--text-secondary)); display: flex; }
        .mini-stat-num  { font-size: 1.8rem; font-weight: 800; color: var(--sc, var(--text-primary)); line-height: 1; }
        .mini-stat-label { font-size: .7rem; color: var(--text-secondary); font-weight: 600; text-align: center; }

        /* Quick Preview Row */
        .quick-preview-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media(max-width:600px){ .quick-preview-row { grid-template-columns: 1fr; } }
        .quick-panel { padding: 16px; display: flex; flex-direction: column; gap: 10px; border-radius: 14px; }
        .quick-hdr { display: flex; align-items: center; gap: 5px; font-weight: 700; font-size: .72rem; text-transform: uppercase; letter-spacing: .06em; }

        /* Skills */
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media(max-width:680px){ .two-col { grid-template-columns: 1fr; } }
        .pad-panel { padding: 22px; display: flex; flex-direction: column; gap: 14px; border-radius: 16px; }
        .sec-hdr { display: flex; align-items: flex-start; gap: 10px; }
        .sec-hdr > div { flex: 1; }
        .sec-title { font-size: .97rem; font-weight: 700; margin: 0 0 2px; color: var(--text-primary); }
        .sec-sub   { font-size: .76rem; color: var(--text-secondary); margin: 0; }
        .sec-badge {
          padding: 3px 10px; border-radius: 999px; font-size: .71rem; font-weight: 700;
          white-space: nowrap; border: 1px solid; flex-shrink: 0; margin-top: 1px;
        }
        .green-badge  { background: var(--success-light); color: #059669; border-color: rgba(16,185,129,.3); }
        .yellow-badge { background: var(--warning-light); color: #d97706; border-color: rgba(245,158,11,.3); }
        .red-badge    { background: var(--error-light);   color: #dc2626; border-color: rgba(239,68,68,.3); }
        .indigo-badge { background: var(--accent-light);  color: var(--accent-color); border-color: rgba(139,92,246,.3); }

        /* Skill Chips */
        .chip-group { display: flex; flex-wrap: wrap; gap: 7px; }
        .skill-chip {
          padding: 4px 11px; border-radius: 7px; font-size: .79rem;
          font-weight: 500; border: 1px solid; transition: transform .15s, box-shadow .15s;
        }
        .skill-chip:hover { transform: translateY(-1px); box-shadow: var(--shadow-sm); }
        .skill-strong  { background: var(--success-light);  color: #059669; border-color: rgba(16,185,129,.3); }
        .skill-missing { background: var(--error-light);    color: #dc2626; border-color: rgba(239,68,68,.3); }
        .empty-note { color: var(--text-muted); font-size: .86rem; margin: 0; font-style: italic; }

        /* Projects */
        .level-tabs { display: flex; gap: 7px; flex-wrap: wrap; }
        .level-tab {
          display: flex; align-items: center; gap: 6px; padding: 7px 14px;
          border-radius: 9px; border: 1px solid var(--border-color);
          background: var(--bg-hover); color: var(--text-secondary);
          cursor: pointer; font-size: .82rem; font-weight: 600; transition: all .2s; font-family: inherit;
        }
        .level-tab:hover { border-color: #cbd5e1; color: var(--text-primary); background: #fff; }
        .tab-count {
          background: var(--border-color); padding: 1px 7px;
          border-radius: 999px; font-size: .7rem; color: var(--text-secondary);
        }
        .project-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 16px; }
        .project-card {
          background: #fff; border: 1px solid var(--card-border, var(--border-color));
          border-radius: 14px; padding: 20px; display: flex; flex-direction: column; gap: 12px;
          transition: all .25s;
        }
        .project-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,.08); }
        .project-level-badge {
          display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px;
          border-radius: 6px; border: 1px solid; font-size: .67rem; font-weight: 700;
          width: fit-content; text-transform: uppercase; letter-spacing: .06em;
        }
        .project-title { font-size: .97rem; font-weight: 700; color: var(--text-primary); margin: 0; line-height: 1.35; }
        .project-desc  { font-size: .84rem; color: var(--text-secondary); line-height: 1.65; margin: 0; }
        .project-skills { display: flex; flex-direction: column; gap: 6px; }
        .project-skills-label { font-size: .7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: .06em; }
        .project-skills-tags { display: flex; flex-wrap: wrap; gap: 5px; }
        .project-skill-badge { font-size: .74rem; font-weight: 500; padding: 3px 9px; border-radius: 6px; border: 1px solid; }
        .how-to-build { border: 1px solid var(--border-color); border-radius: 10px; padding: 12px; background: var(--bg-hover); }
        .how-to-label { display: flex; align-items: center; gap: 4px; font-size: .7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; margin-bottom: 7px; }
        .how-to-build p { font-size: .83rem; color: var(--text-secondary); line-height: 1.6; margin: 0; }
        .github-link {
          display: inline-flex; align-items: center; gap: 7px; padding: 8px 14px;
          border-radius: 9px; border: 1px solid var(--border-color); font-size: .81rem; font-weight: 600;
          text-decoration: none; background: var(--bg-hover); color: var(--text-primary);
          transition: all .2s; width: 100%; justify-content: center;
        }
        .github-link:hover { background: #fff; border-color: #cbd5e1; transform: translateY(-1px); box-shadow: var(--shadow-sm); }
        .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px; gap: 12px; color: var(--text-muted); grid-column: 1/-1; }

        /* Courses & Certs */
        .resource-list { display: flex; flex-direction: column; gap: 7px; }
        .resource-row {
          display: flex; align-items: center; gap: 12px; padding: 12px 14px;
          background: var(--bg-hover); border: 1px solid var(--border-color);
          border-radius: 10px; transition: all .2s; animation: fadeUp .35s ease both;
          text-decoration: none; color: inherit;
        }
        .resource-row:not(.no-link):hover { background: #fff; border-color: rgba(139,92,246,.3); transform: translateX(3px); box-shadow: var(--shadow-sm); }
        .no-link { cursor: default; }
        .res-num {
          width: 26px; height: 26px; border-radius: 7px; flex-shrink: 0;
          background: linear-gradient(135deg,#6366f1,#8b5cf6);
          display: flex; align-items: center; justify-content: center;
          font-size: .7rem; font-weight: 800; color: #fff;
        }
        .res-body { flex: 1; display: flex; flex-direction: column; gap: 1px; }
        .res-name     { font-size: .86rem; font-weight: 600; color: var(--text-primary); }
        .res-platform { font-size: .73rem; color: var(--text-secondary); }
        .cert-list { display: flex; flex-direction: column; gap: 7px; }
        .cert-row {
          display: flex; align-items: center; gap: 11px; padding: 12px 14px;
          background: var(--warning-light); border: 1px solid rgba(245,158,11,.25);
          border-radius: 10px; transition: all .2s; animation: fadeUp .35s ease both;
          text-decoration: none; color: inherit;
        }
        .cert-row:not(.no-link):hover { background: #fef9c3; border-color: rgba(245,158,11,.5); transform: translateX(3px); }
        .cert-name { font-size: .86rem; font-weight: 600; color: var(--text-primary); flex: 1; }

        /* Roadmap */
        .roadmap { display: flex; flex-direction: column; }
        .rm-item { display: flex; gap: 14px; align-items: flex-start; }
        .rm-connector { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; padding-top: 3px; }
        .rm-dot {
          box-shadow: 0 0 12px rgba(99,102,241,.35); flex-shrink: 0;
        }
        .rm-line { width: 2px; flex: 1; min-height: 16px; background: linear-gradient(to bottom,rgba(99,102,241,.4),rgba(99,102,241,.08)); margin: 4px 0; }
        .rm-card { flex: 1; padding: 12px 16px; margin-bottom: 8px; border-radius: 12px; }
        .rm-text { font-size: .88rem; color: var(--text-primary); margin: 0; line-height: 1.55; font-weight: 500; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @media(max-width:640px) {
          .career-title { font-size: 2rem; }
          .summary-bar { position: static; }
          .summary-bar-stats { display: none; }
          .section-header { flex-direction: column; }
        }
      `}</style>
      </main>
    </div>
  );
}
