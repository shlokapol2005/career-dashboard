'use client';
import { useState } from 'react';
import UploadZone from '@/components/Summarizer/UploadZone';
import ResultsDisplay from '@/components/Summarizer/ResultsDisplay';
import { Sparkles } from 'lucide-react';

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleUploadSuccess = async (file) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/summarize', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze document');
      }
      
      setResults(data);
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
  };

  return (
    <main className="container">
      <header className="hero animate-fade-in">
        <div className="badge">
          <Sparkles size={16} className="text-gradient" />
          <span>AI Powered Learning</span>
        </div>
        <h1 className="title">
          Smart Notes <span className="text-gradient">Summarizer</span>
        </h1>
        <p className="subtitle">
          Upload your PDF, PPT, or text notes. Our AI will automatically extract core concepts, generate an executive summary, and create rapid revision points.
        </p>
      </header>

      <section className="main-content">
        {!results ? (
          <UploadZone 
            onUploadSuccess={handleUploadSuccess} 
            isProcessing={isProcessing}
            error={error}
          />
        ) : (
          <ResultsDisplay 
            data={results} 
            onReset={handleReset}
          />
        )}
      </section>

      <style jsx>{`
        .hero {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: 4rem;
        }
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.2);
          padding: 8px 16px;
          border-radius: 999px;
          font-weight: 500;
          font-size: 0.9rem;
          color: var(--text-primary);
          margin-bottom: 24px;
        }
        .title {
          font-size: 4rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin: 0 0 16px 0;
          line-height: 1.1;
        }
        .subtitle {
          font-size: 1.2rem;
          color: var(--text-secondary);
          max-width: 600px;
          line-height: 1.6;
          margin: 0;
        }
        .main-content {
          width: 100%;
          display: flex;
          justify-content: center;
        }
      `}</style>
    </main>
  );
}
