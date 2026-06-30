'use client';
import { useState, useCallback } from 'react';
import { UploadCloud, FileText, Loader2, AlertCircle, X } from 'lucide-react';

export default function UploadZone({ onUploadSuccess, isProcessing, error }) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [localError, setLocalError] = useState(null);

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
    const files = Array.from(e.dataTransfer.files);
    validateAndAddFiles(files);
  }, [selectedFiles]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    validateAndAddFiles(files);
  };

  const validateAndAddFiles = (newFiles) => {
    setLocalError(null);
    const validTypes = [
      'application/pdf', 
      'text/plain', 
      'text/markdown', 
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    
    let validFiles = [];
    for (const file of newFiles) {
      if (validTypes.includes(file.type) || file.name.endsWith('.md') || file.name.endsWith('.pptx')) {
        validFiles.push(file);
      }
    }

    if (validFiles.length !== newFiles.length) {
      setLocalError('Some files were rejected. Please upload only PDF, PPTX, TXT, or MD.');
    }

    const combinedFiles = [...selectedFiles, ...validFiles];
    
    if (combinedFiles.length > 2) {
      setLocalError('Maximum of 2 files allowed.');
      setSelectedFiles(combinedFiles.slice(0, 2));
    } else {
      setSelectedFiles(combinedFiles);
    }
  };

  const removeFile = (indexToRemove) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== indexToRemove));
    setLocalError(null);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    onUploadSuccess(selectedFiles);
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
          multiple
          onChange={handleFileChange}
          disabled={isProcessing}
        />
        
        <div className="upload-content-wrapper">
          {isProcessing ? (
            <div className="upload-content processing">
              <Loader2 className="icon-large spinner" />
              <h3>Analyzing Document(s)...</h3>
              <p>Our RAG engine is extracting context and building your notes.</p>
            </div>
          ) : selectedFiles.length > 0 ? (
            <div className="upload-content selected-state">
              <h3>Selected Files ({selectedFiles.length}/2)</h3>
              <div className="file-list">
                {selectedFiles.map((f, i) => (
                  <div key={i} className="file-item">
                    <FileText className="text-gradient" size={24} />
                    <div className="file-info">
                      <span className="file-name">{f.name}</span>
                      <span className="file-size">{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                    <button className="remove-btn" onClick={() => removeFile(i)}>
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="action-buttons">
                {selectedFiles.length < 2 && (
                  <label htmlFor="file-upload" className="btn-outline add-more">
                    + Add another file
                  </label>
                )}
                <button type="button" className="btn-primary" onClick={(e) => { e.preventDefault(); handleUpload(); }}>
                  Generate Notes
                </button>
              </div>
            </div>
          ) : (
            <label htmlFor="file-upload" className="upload-label">
              <div className="upload-content">
                <div className="icon-circle">
                  <UploadCloud className="icon-large text-gradient" />
                </div>
                <h3>Drag & drop your notes</h3>
                <p>Supports PDF, PPTX, TXT, and MD (Max 2 files)</p>
                <span className="btn-primary" style={{marginTop: '16px'}}>Browse Files</span>
              </div>
            </label>
          )}
        </div>
      </div>

      {(error || localError) && (
        <div className="error-message glass-panel">
          <AlertCircle className="error-icon" />
          <p>{error || localError}</p>
        </div>
      )}

      <style jsx>{`
        .upload-container {
          width: 100%;
          max-width: 650px;
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
          box-shadow: 0 0 20px rgba(15, 118, 110, 0.4);
        }
        .hidden-input {
          display: none;
        }
        .upload-content-wrapper {
          min-height: 350px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .upload-label {
          display: flex;
          width: 100%;
          height: 100%;
          min-height: 350px;
          align-items: center;
          justify-content: center;
          border: 2px dashed rgba(15, 118, 110, 0.2);
          border-radius: 18px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .upload-label:hover {
          background: rgba(15, 118, 110, 0.02);
          border-color: rgba(15, 118, 110, 0.4);
        }
        .upload-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 12px;
          padding: 2rem;
        }
        .selected-state {
          width: 100%;
          align-items: stretch;
          text-align: left;
        }
        .selected-state h3 {
          text-align: center;
          margin-bottom: 24px;
        }
        .icon-circle {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: rgba(15, 118, 110, 0.1);
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
          font-weight: 700;
          margin: 0;
        }
        p {
          color: var(--text-secondary);
          margin: 0;
        }
        .file-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 32px;
        }
        .file-item {
          display: flex;
          align-items: center;
          gap: 16px;
          background: rgba(255, 255, 255, 0.5);
          border: 1px solid var(--border-color);
          padding: 16px;
          border-radius: 12px;
        }
        .file-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .file-name {
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .file-size {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }
        .remove-btn {
          background: transparent;
          border: none;
          color: #ef4444;
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }
        .remove-btn:hover {
          background: rgba(239, 68, 68, 0.1);
        }
        .action-buttons {
          display: flex;
          gap: 16px;
          justify-content: center;
        }
        .add-more {
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .error-message {
          margin-top: 24px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-color: rgba(239, 68, 68, 0.3);
          background: rgba(239, 68, 68, 0.05);
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
