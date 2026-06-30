'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Contrast, MessageSquare, X } from 'lucide-react';
import UploadZone from '@/components/Summarizer/UploadZone';
import ResultsDisplay from '@/components/Summarizer/ResultsDisplay';
import Chatbot from '@/components/Summarizer/Chatbot';

export default function SummarizerPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  
  // Theme state: 'default' (colorful dark) or 'mono' (black and white)
  const [theme, setTheme] = useState('default');
  
  // Chatbot drawer visibility
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // Recommendations toast popup visibility
  const [showToast, setShowToast] = useState(false);

  // Initialize theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('summarizer-theme') || 'default';
    setTheme(savedTheme);
    if (savedTheme === 'mono') {
      document.body.classList.add('theme-mono');
    } else {
      document.body.classList.remove('theme-mono');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'default' ? 'mono' : 'default';
    setTheme(nextTheme);
    localStorage.setItem('summarizer-theme', nextTheme);
    if (nextTheme === 'mono') {
      document.body.classList.add('theme-mono');
    } else {
      document.body.classList.remove('theme-mono');
    }
  };

  const handleUploadSuccess = async (files) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      
      const response = await fetch('http://localhost:5000/api/summarize', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || data.error || 'Failed to analyze document(s)');
      }
      
      setResults(data);
      // Trigger the study assistant recommendation popup!
      setShowToast(true);
      
      // Auto-hide toast after 8 seconds
      setTimeout(() => {
        setShowToast(false);
      }, 8000);
      
    } catch (err) {
      console.error('Upload Error:', err);
      setError(err.message || 'Something went wrong during analysis.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setResults(null);
    setError(null);
    setIsChatOpen(false);
    setShowToast(false);
  };

  return (
    <main className="container">
      {/* Top Navbar */}
      <nav className="navbar animate-fade-in">
        <Link href="/" className="back-link">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        
        {/* Theme Toggle & Float Control */}
        <button className="theme-toggle-btn glass-panel" onClick={toggleTheme} title="Toggle Black & White Mode">
          <Contrast size={18} />
          <span>{theme === 'default' ? 'Monochrome Mode' : 'Colorful Mode'}</span>
        </button>
      </nav>

      {/* Hero Header */}
      <header className="hero animate-fade-in delay-1">
        <div className="badge">
          <Sparkles size={16} className="text-gradient" />
          <span>AI Powered Learning</span>
        </div>
        <h1 className="title">
          Smart Notes <span className="text-gradient">Summarizer</span>
        </h1>
        <p className="subtitle">
          Upload your notes, PDFs, or PPTs. We'll extract the full content, generate a premium summary study guide, and index it for your AI study assistant.
        </p>
      </header>

      {/* Main Content Workspace */}
      <section className="main-content">
        {!results ? (
          <div className="upload-wrapper animate-fade-in delay-2">
            <UploadZone 
              onUploadSuccess={handleUploadSuccess} 
              isProcessing={isProcessing}
              error={error}
            />
          </div>
        ) : (
          <div className="results-wrapper animate-fade-in delay-2">
            <ResultsDisplay 
              data={results} 
              onReset={handleReset}
            />
          </div>
        )}
      </section>

      {/* Chatbot Slide-out Drawer */}
      <Chatbot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

      {/* Floating Chat Button (Appears when results are available) */}
      {results && (
        <button 
          className="floating-chat-btn animate-fade-in"
          onClick={() => setIsChatOpen(true)}
          title="Open Study Assistant"
        >
          <MessageSquare size={24} />
          <span className="pulse-ring"></span>
        </button>
      )}

      {/* Recommendation Toast Notification */}
      <div className={`recommendation-toast ${showToast ? 'show' : ''}`}>
        <div className="toast-content">
          <div className="toast-icon">
            <Sparkles size={20} className="text-gradient" />
          </div>
          <div className="toast-text">
            <h4>Summary is Ready!</h4>
            <p>Would you like to ask your AI Study Assistant questions about these notes?</p>
          </div>
          <button className="toast-close" onClick={() => setShowToast(false)}>
            <X size={16} />
          </button>
        </div>
        <div className="toast-actions">
          <button 
            className="toast-btn-primary" 
            onClick={() => {
              setIsChatOpen(true);
              setShowToast(false);
            }}
          >
            Open Assistant
          </button>
          <button className="toast-btn-secondary" onClick={() => setShowToast(false)}>
            Maybe Later
          </button>
        </div>
      </div>

      <style jsx>{`
        .navbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          margin-bottom: 2.5rem;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--text-secondary);
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s ease;
        }

        .back-link:hover {
          color: var(--text-primary);
        }

        .theme-toggle-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: var(--transition-smooth);
        }

        .theme-toggle-btn:hover {
          background: var(--bg-hover);
          transform: translateY(-1px);
        }

        .hero {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: 3.5rem;
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

        .theme-mono .badge {
          color: white;
          background: transparent;
          border: 1px solid white;
        }

        .title {
          font-size: 3.5rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin: 0 0 16px 0;
          line-height: 1.1;
        }

        .subtitle {
          font-size: 1.15rem;
          color: var(--text-secondary);
          max-width: 680px;
          line-height: 1.6;
          margin: 0;
        }

        .main-content {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
        }

        /* Floating Chat Button */
        .floating-chat-btn {
          position: fixed;
          bottom: 32px;
          right: 32px;
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: var(--accent-gradient);
          border: none;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4);
          transition: var(--transition-smooth);
          z-index: 99;
        }

        .theme-mono .floating-chat-btn {
          background: white;
          color: black;
          box-shadow: none;
          border: 2px solid white;
        }

        .floating-chat-btn:hover {
          transform: scale(1.08) translateY(-4px);
          box-shadow: 0 12px 28px rgba(139, 92, 246, 0.5);
        }

        .theme-mono .floating-chat-btn:hover {
          background: black;
          color: white;
          box-shadow: none;
        }

        .pulse-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 2px solid var(--accent-color);
          animation: pulse 2s infinite;
          opacity: 0;
        }

        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.4); opacity: 0; }
        }

        /* Recommendation Toast */
        .recommendation-toast {
          position: fixed;
          bottom: 32px;
          left: 32px;
          width: 380px;
          background: var(--bg-card);
          backdrop-filter: var(--glass-blur);
          -webkit-backdrop-filter: var(--glass-blur);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-lg);
          border-radius: 20px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          transform: translateY(150px);
          opacity: 0;
          pointer-events: none;
          transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 100;
        }

        .recommendation-toast.show {
          transform: translateY(0);
          opacity: 1;
          pointer-events: auto;
        }

        .toast-content {
          display: flex;
          gap: 12px;
          position: relative;
        }

        .toast-icon {
          background: rgba(139, 92, 246, 0.1);
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .toast-text {
          flex: 1;
          padding-right: 20px;
        }

        .toast-text h4 {
          margin: 0 0 4px 0;
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .toast-text p {
          margin: 0;
          font-size: 0.85rem;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .toast-close {
          position: absolute;
          top: 0;
          right: 0;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          border-radius: 50%;
          padding: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .toast-close:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.05);
        }

        .toast-actions {
          display: flex;
          gap: 12px;
        }

        .toast-btn-primary {
          flex: 1;
          background: var(--accent-gradient);
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition-smooth);
        }

        .theme-mono .toast-btn-primary {
          background: white;
          color: black;
          border: 1px solid white;
        }

        .toast-btn-primary:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .toast-btn-secondary {
          flex: 1;
          background: transparent;
          color: var(--text-secondary);
          border: 1px solid var(--border-color);
          padding: 10px 16px;
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: var(--transition-smooth);
        }

        .toast-btn-secondary:hover {
          color: var(--text-primary);
          background: var(--bg-hover);
        }
      `}</style>
    </main>
  );
}
