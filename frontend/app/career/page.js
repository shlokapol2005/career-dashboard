'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Sparkles, UploadCloud, FileText, Loader2,
  AlertCircle, CheckCircle2, Target, Layers, Hammer,
  ChevronRight, Lightbulb, BookMarked, Rocket
} from 'lucide-react';

const LEVEL_CONFIG = {
  beginner: {
    label: 'Beginner',
    icon: <Layers size={16} />,
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.3)',
    glow: 'rgba(16, 185, 129, 0.15)',
  },
  intermediate: {
    label: 'Intermediate',
    icon: <Hammer size={16} />,
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.3)',
    glow: 'rgba(245, 158, 11, 0.15)',
  },
  advanced: {
    label: 'Advanced',
    icon: <Rocket size={16} />,
    color: '#ec4899',
    bg: 'rgba(236, 72, 153, 0.12)',
    border: 'rgba(236, 72, 153, 0.3)',
    glow: 'rgba(236, 72, 153, 0.15)',
  },
};

export default function CareerPage() {
  const [resumeFile, setResumeFile] = useState(null);
  const [desiredRole, setDesiredRole] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeLevel, setActiveLevel] = useState('beginner');

  const handleFileChange = (file) => {
    const valid = ['application/pdf', 'text/plain', 'text/markdown'];
    if (valid.includes(file.type) || file.name.endsWith('.pdf') || file.name.endsWith('.txt')) {
      setResumeFile(file);
      setError(null);
    } else {
      setError('Please upload a PDF or TXT resume file.');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileChange(file);
  };

  const handleAnalyze = async () => {
    if (!resumeFile || !desiredRole.trim()) {
      setError('Please upload a resume and enter your desired role.');
      return;
    }
    setIsProcessing(true);
    setError(null);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append('resume', resumeFile);
      formData.append('desired_role', desiredRole.trim());

      const response = await fetch('http://localhost:5001/api/career/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Analysis failed');
      setResults(data);
      setActiveLevel('beginner');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setResults(null);
    setResumeFile(null);
    setDesiredRole('');
    setError(null);
  };

  const projectsByLevel = results
    ? results.projects?.reduce((acc, p) => {
        if (!acc[p.level]) acc[p.level] = [];
        acc[p.level].push(p);
        return acc;
      }, {})
    : {};

  return (
    <main className="container animate-fade-in">
      {/* Navbar */}
      <nav className="career-nav">
        <Link href="/" className="back-link">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
      </nav>

      {/* Hero */}
      <header className="career-hero">
        <div className="badge">
          <Target size={16} className="text-gradient" />
          <span>Career Intelligence</span>
        </div>
        <h1 className="career-title">
          Analyze Your <span className="text-gradient">Career Path</span>
        </h1>
        <p className="career-subtitle">
          Upload your resume and tell us your dream role. Our AI will map your current skills,
          identify what you need to learn, and suggest real projects to build.
        </p>
      </header>

      {/* Upload & Form (shown when no results) */}
      {!results && (
        <section className="upload-section animate-fade-in delay-1">
          {/* Resume Upload Zone */}
          <div
            className={`upload-zone glass-panel ${isDragging ? 'dragging' : ''} ${resumeFile ? 'has-file' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="resume-upload"
              className="hidden-input"
              accept=".pdf,.txt"
              onChange={(e) => e.target.files[0] && handleFileChange(e.target.files[0])}
              disabled={isProcessing}
            />
            <label htmlFor="resume-upload" className="upload-label">
              {resumeFile ? (
                <div className="upload-content">
                  <FileText size={44} className="text-gradient" />
                  <span className="file-name">{resumeFile.name}</span>
                  <span className="file-size">{(resumeFile.size / 1024).toFixed(1)} KB · Click to change</span>
                </div>
              ) : (
                <div className="upload-content">
                  <div className="upload-icon-circle">
                    <UploadCloud size={36} className="text-gradient" />
                  </div>
                  <h3>Drop your resume here</h3>
                  <p>Supports PDF and TXT — drag & drop or click to browse</p>
                </div>
              )}
            </label>
          </div>

          {/* Desired Role Input */}
          <div className="role-input-wrapper glass-panel">
            <label htmlFor="desired-role" className="role-label">
              <Target size={18} className="text-gradient" />
              What role do you want to land?
            </label>
            <input
              id="desired-role"
              type="text"
              className="role-input"
              placeholder="e.g. Full Stack Developer, Data Scientist, DevOps Engineer..."
              value={desiredRole}
              onChange={(e) => setDesiredRole(e.target.value)}
              disabled={isProcessing}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="error-box glass-panel">
              <AlertCircle size={20} />
              <p>{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            className="btn-primary analyze-btn"
            onClick={handleAnalyze}
            disabled={isProcessing || !resumeFile || !desiredRole.trim()}
            id="analyze-career-btn"
          >
            {isProcessing ? (
              <>
                <Loader2 size={20} className="spinner" />
                Analyzing your career path...
              </>
            ) : (
              <>
                <Sparkles size={20} />
                Analyze My Career Path
              </>
            )}
          </button>
        </section>
      )}

      {/* Results */}
      {results && (
        <section className="results-section animate-fade-in">
          {/* Results Header */}
          <div className="results-hero glass-panel">
            <div className="results-hero-text">
              <CheckCircle2 size={28} style={{ color: '#10b981' }} />
              <div>
                <h2>Analysis Complete</h2>
                <p>Roadmap built for: <strong>{results.desiredRole}</strong></p>
              </div>
            </div>
            <button className="btn-outline" onClick={handleReset}>
              <ArrowLeft size={16} /> Analyze Another Resume
            </button>
          </div>

          {/* Skills Grid */}
          <div className="skills-grid">
            {/* Current Skills */}
            <div className="skills-card glass-panel">
              <div className="skills-card-header current">
                <CheckCircle2 size={22} />
                <h3>Current Skills</h3>
                <span className="count-badge current-badge">{results.currentSkills?.length || 0}</span>
              </div>
              <div className="skills-tags">
                {results.currentSkills?.map((skill, i) => (
                  <span key={i} className="skill-tag current-tag">{skill}</span>
                ))}
              </div>
            </div>

            {/* Skills to Learn */}
            <div className="skills-card glass-panel">
              <div className="skills-card-header learn">
                <BookMarked size={22} />
                <h3>Skills to Learn</h3>
                <span className="count-badge learn-badge">{results.skillsToLearn?.length || 0}</span>
              </div>
              <div className="skills-tags">
                {results.skillsToLearn?.map((skill, i) => (
                  <span key={i} className="skill-tag learn-tag">{skill}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Projects Section */}
          <div className="projects-section glass-panel">
            <div className="projects-header">
              <Lightbulb size={24} className="text-gradient" />
              <h2>Recommended Projects</h2>
              <p>Build these to close your skill gaps and supercharge your resume</p>
            </div>

            {/* Level Tabs */}
            <div className="level-tabs">
              {['beginner', 'intermediate', 'advanced'].map((level) => {
                const cfg = LEVEL_CONFIG[level];
                return (
                  <button
                    key={level}
                    className={`level-tab ${activeLevel === level ? 'active' : ''}`}
                    style={activeLevel === level ? { background: cfg.bg, borderColor: cfg.border, color: cfg.color } : {}}
                    onClick={() => setActiveLevel(level)}
                    id={`tab-${level}`}
                  >
                    {cfg.icon}
                    {cfg.label}
                    <span className="tab-count">{projectsByLevel[level]?.length || 0}</span>
                  </button>
                );
              })}
            </div>

            {/* Project Cards */}
            <div className="project-cards">
              {projectsByLevel[activeLevel]?.map((project, i) => {
                const cfg = LEVEL_CONFIG[activeLevel];
                return (
                  <div
                    key={i}
                    className="project-card"
                    style={{ '--card-glow': cfg.glow, '--card-border': cfg.border, '--card-color': cfg.color }}
                  >
                    <div className="project-level-badge" style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
                      {cfg.icon} {cfg.label}
                    </div>
                    <h4 className="project-title">{project.title}</h4>
                    <p className="project-desc">{project.description}</p>

                    {/* Skills Built */}
                    <div className="project-skills">
                      <span className="project-skills-label">Skills you'll build:</span>
                      <div className="project-skills-tags">
                        {project.skillsBuilt?.map((s, si) => (
                          <span key={si} className="project-skill-badge" style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* How to Build */}
                    <div className="how-to-build" style={{ borderColor: cfg.border, background: `rgba(255,255,255,0.03)` }}>
                      <div className="how-to-label" style={{ color: cfg.color }}>
                        <ChevronRight size={14} /> How to build it
                      </div>
                      <p>{project.howToBuild}</p>
                    </div>

                    {/* GitHub Reference */}
                    {project.githubRepo && (
                      <a
                        href={project.githubRepo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="github-link"
                        style={{ borderColor: cfg.border, color: cfg.color }}
                      >
                        <svg height="16" width="16" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                        </svg>
                        Reference on GitHub
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <style jsx>{`
        .career-nav {
          margin-bottom: 2.5rem;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--text-secondary);
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
        }

        .back-link:hover {
          color: var(--text-primary);
        }

        .career-hero {
          text-align: center;
          margin-bottom: 3rem;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.2);
          padding: 8px 16px;
          border-radius: 999px;
          font-weight: 600;
          font-size: 0.85rem;
          color: var(--accent-color);
          margin-bottom: 20px;
        }

        .career-title {
          font-size: 3.5rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin: 0 0 16px 0;
          line-height: 1.1;
        }

        .career-subtitle {
          font-size: 1.1rem;
          color: var(--text-secondary);
          max-width: 640px;
          margin: 0 auto;
          line-height: 1.6;
        }

        /* ── Upload Section ── */
        .upload-section {
          max-width: 640px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .upload-zone {
          cursor: pointer;
          transition: all 0.3s ease;
          padding: 0;
        }

        .upload-zone.dragging {
          border-color: var(--accent-color);
          box-shadow: 0 0 24px rgba(139, 92, 246, 0.3);
          transform: scale(1.01);
        }

        .upload-zone.has-file {
          border-color: rgba(16, 185, 129, 0.4);
        }

        .hidden-input { display: none; }

        .upload-label {
          display: block;
          padding: 3rem 2rem;
          border: 2px dashed rgba(255, 255, 255, 0.15);
          border-radius: 22px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .upload-label:hover {
          border-color: rgba(255, 255, 255, 0.3);
          background: rgba(255, 255, 255, 0.02);
        }

        .upload-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          text-align: center;
        }

        .upload-icon-circle {
          width: 80px;
          height: 80px;
          background: rgba(139, 92, 246, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
        }

        .upload-content h3 {
          font-size: 1.3rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .upload-content p {
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        .file-name {
          font-size: 1.1rem;
          font-weight: 600;
          color: #10b981;
        }

        .file-size {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        /* ── Role Input ── */
        .role-input-wrapper {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .role-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          font-size: 1rem;
          color: var(--text-primary);
        }

        .role-input {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-color);
          border-radius: 14px;
          padding: 14px 18px;
          font-size: 1rem;
          color: var(--text-primary);
          width: 100%;
          transition: border-color 0.3s;
          font-family: inherit;
        }

        .role-input::placeholder {
          color: var(--text-secondary);
        }

        .role-input:focus {
          outline: none;
          border-color: var(--accent-color);
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.15);
        }

        .role-input:disabled {
          opacity: 0.5;
        }

        /* ── Error ── */
        .error-box {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border-color: rgba(239, 68, 68, 0.4);
          background: rgba(239, 68, 68, 0.08);
          color: #ef4444;
          font-size: 0.95rem;
        }

        /* ── Analyze Button ── */
        .analyze-btn {
          width: 100%;
          padding: 16px 24px;
          font-size: 1.05rem;
          border-radius: 16px;
          justify-content: center;
        }

        .spinner {
          animation: spin 1.5s linear infinite;
        }

        @keyframes spin {
          100% { transform: rotate(360deg); }
        }

        /* ── Results ── */
        .results-section {
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        .results-hero {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 28px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .results-hero-text {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .results-hero-text h2 {
          margin: 0;
          font-size: 1.4rem;
          font-weight: 700;
        }

        .results-hero-text p {
          margin: 4px 0 0 0;
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .results-hero-text p strong {
          color: var(--accent-color);
        }

        /* ── Skills Grid ── */
        .skills-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        @media (max-width: 720px) {
          .skills-grid {
            grid-template-columns: 1fr;
          }
          .career-title { font-size: 2.4rem; }
        }

        .skills-card {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .skills-card-header {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 1.1rem;
          font-weight: 700;
        }

        .skills-card-header.current { color: #10b981; }
        .skills-card-header.learn { color: #f59e0b; }

        .skills-card-header h3 {
          margin: 0;
          flex: 1;
        }

        .count-badge {
          font-size: 0.75rem;
          font-weight: 700;
          padding: 2px 10px;
          border-radius: 999px;
        }

        .current-badge {
          background: rgba(16, 185, 129, 0.12);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .learn-badge {
          background: rgba(245, 158, 11, 0.12);
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .skills-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .skill-tag {
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 0.85rem;
          font-weight: 500;
          transition: transform 0.2s;
        }

        .skill-tag:hover { transform: translateY(-2px); }

        .current-tag {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.25);
        }

        .learn-tag {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.25);
        }

        /* ── Projects Section ── */
        .projects-section {
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .projects-header {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          flex-wrap: wrap;
        }

        .projects-header h2 {
          font-size: 1.6rem;
          font-weight: 800;
          margin: 0;
        }

        .projects-header p {
          color: var(--text-secondary);
          font-size: 0.9rem;
          margin: 4px 0 0 0;
          flex-basis: 100%;
          padding-left: 38px;
        }

        /* ── Level Tabs ── */
        .level-tabs {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .level-tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 12px;
          border: 1px solid var(--border-color);
          background: rgba(255, 255, 255, 0.03);
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 600;
          transition: all 0.25s ease;
          font-family: inherit;
        }

        .level-tab:hover {
          background: rgba(255, 255, 255, 0.06);
          color: var(--text-primary);
        }

        .tab-count {
          background: rgba(255, 255, 255, 0.08);
          padding: 1px 8px;
          border-radius: 999px;
          font-size: 0.75rem;
        }

        /* ── Project Cards ── */
        .project-cards {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }

        .project-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--card-border, var(--border-color));
          border-radius: 18px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          transition: all 0.3s ease;
        }

        .project-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 36px var(--card-glow, rgba(0,0,0,0.3));
          background: rgba(255, 255, 255, 0.04);
        }

        .project-level-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 999px;
          border: 1px solid;
          font-size: 0.75rem;
          font-weight: 700;
          width: fit-content;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .project-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
          line-height: 1.3;
        }

        .project-desc {
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.6;
          margin: 0;
        }

        .project-skills {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .project-skills-label {
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .project-skills-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .project-skill-badge {
          font-size: 0.8rem;
          font-weight: 500;
          padding: 3px 10px;
          border-radius: 999px;
          border: 1px solid;
        }

        .how-to-build {
          border: 1px solid;
          border-radius: 12px;
          padding: 14px;
          margin-top: 4px;
        }

        .how-to-label {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.78rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 8px;
        }

        .how-to-build p {
          font-size: 0.88rem;
          color: var(--text-secondary);
          line-height: 1.6;
          margin: 0;
        }

        .github-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 16px;
          border-radius: 10px;
          border: 1px solid;
          font-size: 0.85rem;
          font-weight: 600;
          text-decoration: none;
          background: rgba(255, 255, 255, 0.03);
          transition: all 0.25s ease;
          width: 100%;
          justify-content: center;
        }

        .github-link:hover {
          background: rgba(255, 255, 255, 0.08);
          transform: translateY(-2px);
        }
      `}</style>
    </main>
  );
}
