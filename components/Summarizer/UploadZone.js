'use client';
import { useState, useCallback } from 'react';
import { UploadCloud, FileText, Loader2, AlertCircle } from 'lucide-react';

export default function UploadZone({ onUploadSuccess, isProcessing, error }) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndSetFile(files[0]);
    }
  }, []);

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };

  const validateAndSetFile = (file) => {
    const validTypes = [
      'application/pdf', 
      'text/plain', 
      'text/markdown', 
      'application/vnd.openxmlformats-officedocument.presentationml.presentation' // PPTX
    ];
    
    if (validTypes.includes(file.type) || file.name.endsWith('.md') || file.name.endsWith('.pptx')) {
      setSelectedFile(file);
    } else {
      alert('Please upload a PDF, TXT, MD, or PPTX file.');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    onUploadSuccess(selectedFile);
  };

  return (
    <div className="upload-container animate-fade-in delay-1">
      <div 
        className={`glass-panel upload-box ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          id="file-upload" 
          className="hidden-input" 
          accept=".pdf,.txt,.md,.pptx"
          onChange={handleFileChange}
          disabled={isProcessing}
        />
        
        <label htmlFor="file-upload" className="upload-label">
          {isProcessing ? (
            <div className="upload-content processing">
              <Loader2 className="icon-large spinner" />
              <h3>Analyzing Document...</h3>
              <p>Our AI is extracting key concepts and generating notes.</p>
            </div>
          ) : selectedFile ? (
            <div className="upload-content selected">
              <FileText className="icon-large text-gradient" />
              <h3>{selectedFile.name}</h3>
              <p>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              <div className="action-buttons">
                <button type="button" className="btn-outline" onClick={(e) => { e.preventDefault(); setSelectedFile(null); }}>
                  Cancel
                </button>
                <button type="button" className="btn-primary" onClick={(e) => { e.preventDefault(); handleUpload(); }}>
                  Generate Notes
                </button>
              </div>
            </div>
          ) : (
            <div className="upload-content">
              <div className="icon-circle">
                <UploadCloud className="icon-large text-gradient" />
              </div>
              <h3>Drag & drop your notes</h3>
              <p>Supports PDF, PPTX, TXT, and Markdown files</p>
              <span className="btn-primary" style={{marginTop: '16px'}}>Browse Files</span>
            </div>
          )}
        </label>
      </div>

      {error && (
        <div className="error-message glass-panel">
          <AlertCircle className="error-icon" />
          <p>{error}</p>
        </div>
      )}

      <style jsx>{`
        .upload-container {
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
        }
        .upload-box {
          padding: 2px;
          transition: all 0.3s ease;
          position: relative;
        }
        .upload-box.dragging {
          transform: scale(1.02);
          border-color: var(--accent-color);
          box-shadow: 0 0 20px rgba(139, 92, 246, 0.4);
        }
        .hidden-input {
          display: none;
        }
        .upload-label {
          display: block;
          padding: 4rem 2rem;
          border: 2px dashed rgba(255, 255, 255, 0.2);
          border-radius: 18px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .upload-label:hover {
          background: rgba(255, 255, 255, 0.02);
          border-color: rgba(255, 255, 255, 0.3);
        }
        .upload-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 12px;
        }
        .icon-circle {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: rgba(139, 92, 246, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }
        .icon-large {
          width: 40px;
          height: 40px;
        }
        .spinner {
          animation: spin 2s linear infinite;
          color: var(--accent-color);
        }
        h3 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0;
        }
        p {
          color: var(--text-secondary);
          margin: 0;
        }
        .action-buttons {
          display: flex;
          gap: 16px;
          margin-top: 24px;
        }
        .error-message {
          margin-top: 24px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-color: rgba(239, 68, 68, 0.3);
          background: rgba(239, 68, 68, 0.1);
        }
        .error-icon {
          color: #ef4444;
        }
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
