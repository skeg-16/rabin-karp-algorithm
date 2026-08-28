import React, { useState, useEffect } from 'react';
import axios from 'axios';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import './App.css';

// Configure PDF.js Worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

// SVG Icons
const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
);

const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
);

const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
    <path d="M12 12v9"></path>
    <path d="m8 16 4-4 4 4"></path>
  </svg>
);

const ZapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
);

const TerminalIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/></svg>
);

const InfoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
);

const LoaderIcon = () => (
  <svg className="spinner" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
);

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18"></path>
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
  </svg>
);

const MaximizeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3H5a2 2 0 0 0-2 2v3"></path>
    <path d="M21 8V5a2 2 0 0 0-2-2h-3"></path>
    <path d="M3 16v3a2 2 0 0 0 2 2h3"></path>
    <path d="M16 21h3a2 2 0 0 0 2-2v-3"></path>
  </svg>
);

// Heuristic text formatting for Formatted View
const renderFormattedText = (text, type) => {
  if (!text) return <div className="placeholder-text">No document loaded. Upload a file or switch to <strong>Raw Text</strong> to paste manually.</div>;
  
  const blocks = text.split(/\n\s*\n/);
  return (
    <div className="formatted-content">
      {blocks.map((block, index) => {
        const cleanBlock = block.trim();
        if (!cleanBlock) return null;
        
        // Detect headers (short line, uppercase or title case, no ending punctuation)
        if (cleanBlock.length < 80 && cleanBlock.split('\n').length === 1 && !cleanBlock.match(/[.!?]$/)) {
          return <h3 key={index}>{cleanBlock}</h3>;
        }
        
        // Detect lists
        if (cleanBlock.match(/^[•\-*]|\d+\./m)) {
          const items = cleanBlock.split('\n');
          return (
            <ul key={index}>
              {items.map((item, i) => {
                const cleanItem = item.trim();
                if (!cleanItem) return null;
                return <li key={i}>{cleanItem.replace(/^[•\-*]|\d+\.\s*/, '').trim()}</li>;
              })}
            </ul>
          );
        }
        
        // Paragraph
        return <p key={index}>{cleanBlock}</p>;
      })}
    </div>
  );
};

// API Base URL Configuration (Hardcoded for local testing stability)
const API_BASE_URL = '';
function App() {
  const [sourceText, setSourceText] = useState('');
  const [suspectText, setSuspectText] = useState('');
  const [windowSize, setWindowSize] = useState('5');
  
  // Expanded document view state ('source', 'suspect', or null)
  const [expandedDoc, setExpandedDoc] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [notification, setNotification] = useState(null);
  
  // Tab states
  const [sourceTab, setSourceTab] = useState('formatted');
  const [suspectTab, setSuspectTab] = useState('formatted');

  // Drag & Processing states
  const [dragActiveSource, setDragActiveSource] = useState(false);
  const [dragActiveSuspect, setDragActiveSuspect] = useState(false);
  const [isSourceProcessing, setIsSourceProcessing] = useState(false);
  const [isSuspectProcessing, setIsSuspectProcessing] = useState(false);
  const [sourceProgress, setSourceProgress] = useState(0);
  const [suspectProgress, setSuspectProgress] = useState(0);
  
  // Cancellation refs
  const cancelRefs = React.useRef({ source: false, suspect: false });

  // Word Limit Modal State
  const [limitModal, setLimitModal] = useState({
    show: false,
    text: '',
    type: '',
    wordCount: 0
  });

  // Clear Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    type: ''
  });

  // N-Gram Recommendation Modal State
  const [recommendModal, setRecommendModal] = useState({
    show: false,
    suggestedN: 5,
    reason: '',
    minWordsFailed: false
  });

  // Ref for auto-scroll
  const resultsRef = React.useRef(null);

  // Auto-hide notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    if (results && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [results]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const processFile = async (file, type) => {
    if (!file) return;

    const setTargetText = type === 'source' ? setSourceText : setSuspectText;
    const setIsLoading = type === 'source' ? setIsSourceProcessing : setIsSuspectProcessing;
    const setProgress = type === 'source' ? setSourceProgress : setSuspectProgress;

    const fileExtension = file.name.split('.').pop().toLowerCase();

    if (fileExtension !== "txt" && fileExtension !== "docx" && fileExtension !== "pdf") {
      alert("❌ Invalid file format! Only .txt, .docx, and .pdf files are accepted by the system.");
      return;
    }

    setIsLoading(true);
    setProgress(0);
    cancelRefs.current[type] = false;

    const handleTextExtracted = (extractedText) => {
      const count = getWordCount(extractedText);
      if (count > WORD_LIMIT) {
        setLimitModal({
          show: true,
          text: extractedText,
          type: type,
          wordCount: count
        });
      } else {
        setTargetText(extractedText);
      }
    };

    try {
      if (fileExtension === "txt") {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (cancelRefs.current[type]) return;
          setProgress(100);
          handleTextExtracted(event.target.result);
          setNotification({ type: 'success', message: `Successfully loaded ${file.name}` });
          setIsLoading(false);
        };
        reader.readAsText(file);
      } else if (fileExtension === "docx") {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (cancelRefs.current[type]) return;
          const arrayBuffer = event.target.result;
          setProgress(50);
          mammoth.extractRawText({ arrayBuffer: arrayBuffer })
            .then((result) => {
              if (cancelRefs.current[type]) return;
              setProgress(100);
              handleTextExtracted(result.value);
              setNotification({ type: 'success', message: `Successfully parsed DOCX: ${file.name}` });
              setIsLoading(false);
            })
            .catch((err) => {
              if (cancelRefs.current[type]) return;
              console.error(err);
              setNotification({ type: 'error', message: "Failed to parse DOCX file." });
              setIsLoading(false);
            });
        };
        reader.readAsArrayBuffer(file);
      } else if (fileExtension === "pdf") {
        try {
          const formData = new FormData();
          formData.append('file', file);
          
          const response = await axios.post(`${API_BASE_URL}/api/extract-pdf`, formData, {
            onUploadProgress: (progressEvent) => {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setProgress(progress);
            }
          });
          
          if (cancelRefs.current[type]) return;
          
          handleTextExtracted(response.data.text);
          setNotification({ type: 'success', message: `Successfully extracted text from PDF (High-Speed): ${file.name}` });
          setIsLoading(false);
          setProgress(100);
        } catch (err) {
          if (!cancelRefs.current[type]) {
            console.error(err);
            setNotification({ type: 'error', message: "High-speed extraction failed. Check if backend is running." });
            setIsLoading(false);
          }
        }
      }
    } catch (err) {
      if (!cancelRefs.current[type]) {
        console.error(err);
        setIsLoading(false);
      }
    }
  };

  const handleCancelProcessing = (type) => {
    cancelRefs.current[type] = true;
    if (type === 'source') {
      setIsSourceProcessing(false);
      setSourceProgress(0);
    } else {
      setIsSuspectProcessing(false);
      setSuspectProgress(0);
    }
    setNotification({ type: 'info', message: "Processing cancelled." });
  };

  const handleFileUpload = (e, type) => {
    const file = e.target.files[0];
    processFile(file, type);
    e.target.value = ""; // Reset
  };

  const handleDrag = (e, setDragActive) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e, type, setDragActive) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0], type);
    }
  };

  const handleModalAction = (action) => {
    const { text, type } = limitModal;
    const setTargetText = type === 'source' ? setSourceText : setSuspectText;

    if (action === 'truncate') {
      const truncated = text.trim().split(/\s+/).slice(0, WORD_LIMIT).join(' ');
      setTargetText(truncated);
      setNotification({ type: 'success', message: "Document truncated to 2,500 words." });
    } else if (action === 'keep') {
      setTargetText(text);
      setNotification({ type: 'info', message: "Document loaded. Please delete words to reach the limit." });
    }
    
    setLimitModal({ show: false, text: '', type: '', wordCount: 0 });
  };

  const handleClear = (type) => {
    const text = type === 'source' ? sourceText : suspectText;
    const setText = type === 'source' ? setSourceText : setSuspectText;

    if (text.trim().length === 0) {
      setText('');
      return;
    }

    setConfirmModal({ show: true, type });
  };

  const confirmClear = () => {
    if (confirmModal.type === 'source') setSourceText('');
    else setSuspectText('');
    setConfirmModal({ show: false, type: '' });
    setNotification({ type: 'success', message: "Document cleared successfully." });
  };

  const handleAnalyze = async (nToUse) => {
    if (!sourceText || !suspectText) {
      setNotification({ type: 'error', message: "Please provide both Source and Suspect documents." });
      return;
    }

    if (getWordCount(sourceText) > WORD_LIMIT || getWordCount(suspectText) > WORD_LIMIT) {
      setNotification({ type: 'error', message: `Documents exceed the ${WORD_LIMIT} word limit!` });
      return;
    }

    // If nToUse is provided, use it, otherwise use the current windowSize state
    const finalN = nToUse || parseInt(windowSize) || 5;
    
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/analyze`, {
        source_text: sourceText,
        suspect_text: suspectText,
        window_size: finalN
      });
      setResults(response.data);
    } catch (error) {
      console.error("Connection Error:", error);
      alert("Failed to connect to the backend. Is your Python server running?");
    }
    setLoading(false);
  };

  const checkAccuracyAndAnalyze = () => {
    if (!sourceText || !suspectText) {
      setNotification({ type: 'error', message: "Please provide both Source and Suspect documents." });
      return;
    }

    const sourceWords = getWordCount(sourceText);
    const suspectWords = getWordCount(suspectText);
    const currentN = parseInt(windowSize);

    // Logic for Minimum Words (Panel protection)
    if (sourceWords < 5 || suspectWords < 5) {
      setRecommendModal({
        show: true,
        suggestedN: 2,
        reason: "The input is too short. For accurate detection of single words or short phrases, a very low N-Gram (1-2) is required, but results may still be inaccurate due to lack of context.",
        minWordsFailed: true
      });
      return;
    }

    // N-Gram Recommendation Logic
    let suggestedN = 5;
    let reason = "";
    let showModal = false;

    // Check if current N is risky for the document type
    if (suspectWords <= 20 && currentN > 3) {
      suggestedN = 2;
      reason = "You are analyzing a single sentence. A high N-Gram window might miss matches. We suggest using N-Gram 2 for better sensitivity.";
      showModal = true;
    } else if (suspectWords > 20 && suspectWords <= 100 && (currentN < 2 || currentN > 5)) {
      suggestedN = 4;
      reason = "For short paragraphs, an N-Gram of 4 or 5 is the most balanced for accuracy.";
      showModal = true;
    } else if (suspectWords > 100 && currentN < 5) {
      suggestedN = 7;
      reason = "For full documents, a higher N-Gram (7-10) is recommended to focus on structural plagiarism and avoid common academic phrases.";
      showModal = true;
    }

    if (showModal) {
      setRecommendModal({ show: true, suggestedN, reason, minWordsFailed: false });
    } else {
      handleAnalyze(currentN);
    }
  };

  const getHighlightedHTML = (text, matches) => {
    if (!text) return { __html: "" };
    
    let cleanDisplayText = text.replace(/\s+/g, ' ').trim();
    
    if (matches && matches.length > 0) {
      const sortedMatches = [...matches].sort((a, b) => b.length - a.length);
      
      sortedMatches.forEach(match => {
        const escapedMatch = match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedMatch})`, 'gi');
        cleanDisplayText = cleanDisplayText.replace(
          regex, 
          `<span class="highlighted-sentence">$1</span>`
        );
      });
    }
    
    return { __html: cleanDisplayText };
  };

  const getWordCount = (text) => {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  const WORD_LIMIT = 2500;

  const SIMILARITY_SCALE = [
    {
      range: [0, 15],
      label: "Acceptable / Baseline Overlap",
      color: "var(--success)",
      interpretation: "This is a normal occurrence. It captures common academic 'boilerplate' language (e.g., 'results of the study,' 'conceptual framework') and standard translated terms that naturally overlap. This is not considered plagiarism."
    },
    {
      range: [16, 25],
      label: "Marginal / Needs Manual Review",
      color: "var(--warning)",
      interpretation: "This indicates potential fragmented matching. The system detected sentences that may have been partially paraphrased or code-switched while maintaining the original core structure. Manual review is recommended."
    },
    {
      range: [26, 50],
      label: "Moderate Plagiarism",
      color: "var(--danger)",
      interpretation: "Clear evidence of translation-based intellectual theft. Since stop-words are already filtered out, matches in this range suggest that core arguments are direct translations of the source."
    },
    {
      range: [51, 100],
      label: "Severe / Blatant Plagiarism",
      color: "#991b1b",
      interpretation: "Massive copy-pasting or wholesale translation of entire paragraphs or chapters. The student made zero effort to synthesize or originalize the information."
    }
  ];

  const getScoreColor = (score) => {
    if (score <= 15) return 'var(--success)';
    if (score <= 40) return 'var(--warning)';
    return 'var(--danger)';
  };

  return (
    <div className="app-container">
      {notification && (
        <div className={`notification-banner ${notification.type}`}>
          {notification.type === 'success' ? '✅' : notification.type === 'error' ? '❌' : 'ℹ️'}
          {notification.message}
          <button className="close-notif" onClick={() => setNotification(null)}>&times;</button>
        </div>
      )}

      {/* HEADER */}
      <header className="app-header">
        <div className="brand-section">
          <div className="logo-container">
            <img src="/logo.png" alt="OtterLens Logo" className="logo-img" />
          </div>
          <div className="brand-text">
            <h1>OtterLens</h1>
            <p>Cross-Lingual Plagiarism Detection by Otter Software System</p>
          </div>
        </div>
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === 'light' ? <MoonIcon /> : <SunIcon />}
          {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        </button>
      </header>

      {/* INPUT SECTION */}
      <div className="section-grid">
        {/* SOURCE */}
        <div className="card">
          <div className="card-header">
            <div className="box-header-flex">
              <h2 className="box-title source">Source Document (English)</h2>
              <div className="header-actions">
                <div className="doc-tabs">
                  <button className={`tab-btn ${sourceTab === 'formatted' ? 'active' : ''}`} onClick={() => setSourceTab('formatted')}>Formatted View</button>
                  <button className={`tab-btn ${sourceTab === 'raw' ? 'active' : ''}`} onClick={() => setSourceTab('raw')}>Raw Text</button>
                </div>

                <button className="icon-btn clear-action" onClick={() => handleClear('source')} data-tooltip="Clear Document">
                  <TrashIcon />
                </button>
                <div className="file-input-wrapper">
                  <label className="file-input-label">
                    <UploadIcon /> Upload File
                  </label>
                  <input type="file" accept=".txt,.docx,.pdf" onChange={(e) => handleFileUpload(e, 'source')} />
                </div>
              </div>
            </div>
          </div>
          
          <div 
            className={`drop-zone ${dragActiveSource ? 'dragging' : ''} ${isSourceProcessing ? 'processing' : ''}`}
            onDragEnter={(e) => handleDrag(e, setDragActiveSource)}
            onDragOver={(e) => handleDrag(e, setDragActiveSource)}
            onDragLeave={(e) => handleDrag(e, setDragActiveSource)}
            onDrop={(e) => handleDrop(e, 'source', setDragActiveSource)}
          >
            {(dragActiveSource || isSourceProcessing) && (
              <div className="drop-overlay">
                {isSourceProcessing ? (
                  <>
                    <LoaderIcon />
                    <div className="processing-info">
                      <span className="processing-text">Extracting: {sourceProgress}%</span>
                      <button className="cancel-btn" onClick={() => handleCancelProcessing('source')}>
                        <XIcon /> Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <UploadIcon />
                    <span>Drop Source File Here</span>
                  </>
                )}
              </div>
            )}
            {sourceTab === 'formatted' ? (
              <div className="formatted-view-container modern-textarea">
                {renderFormattedText(sourceText, 'source')}
              </div>
            ) : (
              <textarea
                className="modern-textarea"
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                placeholder="Paste original English text or drag a file here..."
              />
            )}
            <div className="bottom-right-actions">
              <button className="icon-btn expand-btn" onClick={() => setExpandedDoc('source')} data-tooltip="Expand View">
                <MaximizeIcon />
              </button>
              <div className={`word-counter ${getWordCount(sourceText) > WORD_LIMIT ? 'limit-exceeded' : ''}`}>
                {getWordCount(sourceText).toLocaleString()} / {WORD_LIMIT.toLocaleString()} words
              </div>
            </div>
          </div>
        </div>

        {/* SUSPECT */}
        <div className="card">
          <div className="card-header">
            <div className="box-header-flex">
              <h2 className="box-title suspect">Suspect Document (Taglish)</h2>
              <div className="header-actions">
                <div className="doc-tabs">
                  <button className={`tab-btn ${suspectTab === 'formatted' ? 'active' : ''}`} onClick={() => setSuspectTab('formatted')}>Formatted View</button>
                  <button className={`tab-btn ${suspectTab === 'raw' ? 'active' : ''}`} onClick={() => setSuspectTab('raw')}>Raw Text</button>
                </div>

                <button className="icon-btn clear-action" onClick={() => handleClear('suspect')} data-tooltip="Clear Document">
                  <TrashIcon />
                </button>
                <div className="file-input-wrapper">
                  <label className="file-input-label">
                    <UploadIcon /> Upload File
                  </label>
                  <input type="file" accept=".txt,.docx,.pdf" onChange={(e) => handleFileUpload(e, 'suspect')} />
                </div>
              </div>
            </div>
          </div>

          <div 
            className={`drop-zone ${dragActiveSuspect ? 'dragging' : ''} ${isSuspectProcessing ? 'processing' : ''}`}
            onDragEnter={(e) => handleDrag(e, setDragActiveSuspect)}
            onDragOver={(e) => handleDrag(e, setDragActiveSuspect)}
            onDragLeave={(e) => handleDrag(e, setDragActiveSuspect)}
            onDrop={(e) => handleDrop(e, 'suspect', setDragActiveSuspect)}
          >
            {(dragActiveSuspect || isSuspectProcessing) && (
              <div className="drop-overlay">
                {isSuspectProcessing ? (
                  <>
                    <LoaderIcon />
                    <div className="processing-info">
                      <span className="processing-text">Extracting: {suspectProgress}%</span>
                      <button className="cancel-btn" onClick={() => handleCancelProcessing('suspect')}>
                        <XIcon /> Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <UploadIcon />
                    <span>Drop Suspect File Here</span>
                  </>
                )}
              </div>
            )}
            {suspectTab === 'formatted' ? (
              <div className="formatted-view-container modern-textarea">
                {renderFormattedText(suspectText, 'suspect')}
              </div>
            ) : (
              <textarea
                className="modern-textarea"
                value={suspectText}
                onChange={(e) => setSuspectText(e.target.value)}
                placeholder="Paste suspect Taglish text or drag a file here..."
              />
            )}
            <div className="bottom-right-actions">
              <button className="icon-btn expand-btn" onClick={() => setExpandedDoc('suspect')} data-tooltip="Expand View">
                <MaximizeIcon />
              </button>
              <div className={`word-counter ${getWordCount(suspectText) > WORD_LIMIT ? 'limit-exceeded' : ''}`}>
                {getWordCount(suspectText).toLocaleString()} / {WORD_LIMIT.toLocaleString()} words
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FULLSCREEN MODAL */}
      {expandedDoc && (
        <div className="fullscreen-overlay" onClick={() => setExpandedDoc(null)}>
          <div className="fullscreen-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fullscreen-header">
              <h2>{expandedDoc === 'source' ? 'Source Document (English)' : 'Suspect Document (Taglish)'}</h2>
              <button className="close-modal-btn" onClick={() => setExpandedDoc(null)}>
                <XIcon />
              </button>
            </div>
            <div className="fullscreen-content formatted-view-container modern-textarea">
              {expandedDoc === 'source' ? renderFormattedText(sourceText, 'source') : renderFormattedText(suspectText, 'suspect')}
            </div>
          </div>
        </div>
      )}

      {/* CONTROLS */}
      <div className="controls-bar">
        <div className="input-group">
          <label>N-Gram Window Size (1-10)</label>
          <input 
            type="text" 
            inputMode="numeric"
            className="number-input"
            value={windowSize}
            onChange={(e) => {
              const val = e.target.value;
              // Remove anything that is not a digit
              const numericValue = val.replace(/[^0-9]/g, '');
              
              if (numericValue === '') {
                setWindowSize('');
                return;
              }

              let num = parseInt(numericValue, 10);
              
              // Strictly clamp between 1 and 10
              if (num > 10) num = 10;
              if (num < 1 && numericValue !== '') num = 1;
              
              setWindowSize(num.toString());
            }}
            onBlur={() => {
              // Ensure it's at least 1 if not empty when focus is lost
              if (windowSize === '' || parseInt(windowSize) < 1) {
                setWindowSize('5');
              }
            }}
            placeholder="5"
          />
        </div>
        <button 
          className="analyze-button"
          onClick={checkAccuracyAndAnalyze} 
          disabled={loading}
        >
          {loading ? "Analyzing..." : <><ZapIcon /> Run Analysis</>}
        </button>
      </div>

      {/* RESULTS DISPLAY */}
      {results && (
        <div className="results-card" ref={resultsRef}>
          <div className="results-header">
            <h2>Detailed Analysis Report</h2>
            
            <div className="score-display">
              <div className="score-info">
                <span className="score-label">Similarity Score</span>
                <span className="score-value" style={{ color: getScoreColor(parseFloat(results.similarity_percent)) }}>
                  {results.similarity_percent}%
                </span>
              </div>
              <div className="progress-container">
                <div 
                  className="progress-bar" 
                  style={{ 
                    width: `${results.similarity_percent}%`, 
                    backgroundColor: getScoreColor(parseFloat(results.similarity_percent))
                  }}
                />
              </div>
              
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">Matched Sentences</span>
                  <span className="stat-value">{results.matched_count} / {results.total_sentences}</span>
                  <span className="stat-desc">Exact or highly similar sentence pairs found between documents.</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Spurious Matches</span>
                  <span className="stat-value">{results.spurious_count}</span>
                  <span className="stat-desc">False positive hash collisions that were safely filtered out.</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Algorithm</span>
                  <span className="stat-value">Rabin-Karp</span>
                  <span className="stat-desc">Rolling hash algorithm used for fast and exact string matching.</span>
                </div>
              </div>
            </div>
          </div>

          {/* SIMILARITY SCALE TABLE */}
          <div className="scale-section">
            <h3 className="scale-title">The Enhanced Rabin-Karp Similarity Scale</h3>
            <div className="scale-table-wrapper">
              <table className="scale-table">
                <thead>
                  <tr>
                    <th>Similarity Score</th>
                    <th>Classification</th>
                    <th>Interpretation & System Context</th>
                  </tr>
                </thead>
                <tbody>
                  {SIMILARITY_SCALE.map((item, index) => {
                    const isCurrent = parseFloat(results.similarity_percent) >= item.range[0] && 
                                     parseFloat(results.similarity_percent) <= item.range[1];
                    return (
                      <tr key={index} className={isCurrent ? 'active-row' : ''}>
                        <td className="score-range" style={{ color: item.color }}>
                          {item.range[0]}% - {item.range[1]}%
                        </td>
                        <td className="classification">
                          <span className="badge" style={{ backgroundColor: item.color + '20', color: item.color }}>
                            {item.label}
                          </span>
                        </td>
                        <td className="interpretation">
                          {item.interpretation}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* SIDE-BY-SIDE HIGHLIGHTING VIEW */}
          <div className="comparison-grid">
            <div className="comparison-box">
              <h3 className="card-title source-title" style={{ marginBottom: '1rem' }}>Source Reference</h3>
              <div className="scroll-box">
                {sourceText.replace(/\s+/g, ' ').trim()}
              </div>
            </div>

            <div className="comparison-box">
              <div className="box-header-flex">
                <h3 className="card-title suspect-title">Detected Plagiarism</h3>
                <div className="highlight-legend">
                  <span className="legend-dot"></span>
                  ≥30% Similarity
                </div>
              </div>
              <div 
                className="scroll-box"
                dangerouslySetInnerHTML={getHighlightedHTML(suspectText, results.matched_sentences)}
              />
            </div>
          </div>

          {/* HIGHLIGHT EXPLANATION SECTION */}
          <div className="info-section">
            <div className="info-header">
              <InfoIcon />
              <span>How to Interpret the Highlights?</span>
            </div>
            <div className="info-content">
              <p>
                The <strong>highlighted backgrounds</strong> indicate sentences where the system detected a significant amount of text reuse. 
                Unlike basic word-for-word algorithms, this system uses <strong>Flexible N-gram Matching</strong> which is designed for cross-lingual scenarios:
              </p>
              <ul>
                <li><strong>Bilingual Detection:</strong> It recognizes matches even if English words were translated to Tagalog (e.g., "Student" overlapping with "Mag-aaral" structure).</li>
                <li><strong>30% Threshold:</strong> A sentence is flagged if at least <strong>30%</strong> of its unique structural fragments (N-grams) match the source document. This ensures that even "heavily paraphrased" sentences are caught if the core structure remains identical.</li>
                <li><strong>Noise Reduction:</strong> Common linking words and particles (ang, mga, the, is) are ignored to focus entirely on the actual content and logic.</li>
              </ul>
            </div>
          </div>

          {/* SYSTEM LOGS */}
          <div className="system-logs">
            <div className="log-header">
              <TerminalIcon />
              <span>Normalization Logs (Pre-Hashing Phase)</span>
            </div>
            <div className="log-description">
              <p>This section shows how the system "cleans" your text before running the core algorithm. It converts everything to lowercase, removes punctuation, and standardizes spacing. This ensures that a student cannot trick the system simply by changing capitalization or adding extra commas.</p>
            </div>
            <div className="log-entry">
              <strong>SOURCE (Normalized):</strong> 
              <span className="log-text">{results.normalized_source}</span>
            </div>
            <div className="log-entry suspect">
              <strong>SUSPECT (Normalized):</strong>
              <div className="log-description subtle">This is the cleaned version of the Taglish document being investigated for plagiarism.</div>
              <span className="log-text">{results.normalized_suspect}</span>
            </div>
          </div>
        </div>
      )}

      {/* WORD LIMIT MODAL */}
      {limitModal.show && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <div className="warning-icon">⚠️</div>
              <h3>Document Limit Exceeded</h3>
            </div>
            <div className="modal-body">
              <p>The uploaded document contains <strong>{limitModal.wordCount.toLocaleString()} words</strong>, which exceeds our <strong>{WORD_LIMIT.toLocaleString()} word limit</strong>.</p>
              <p>How would you like to proceed?</p>
            </div>
            <div className="modal-footer">
              <button className="modal-btn secondary" onClick={() => handleModalAction('keep')}>
                Keep All (Manual Edit)
              </button>
              <button className="modal-btn primary" onClick={() => handleModalAction('truncate')}>
                Auto-Truncate (Top 2,500)
              </button>
            </div>
            <button className="modal-close-btn" onClick={() => setLimitModal({ show: false, text: '', type: '', wordCount: 0 })}><XIcon /></button>
          </div>
        </div>
      )}

      {/* CLEAR CONFIRMATION MODAL */}
      {confirmModal.show && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <div className="warning-icon danger">🗑️</div>
              <h3>Clear Document?</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to clear this document? This action cannot be undone and all current progress will be lost.</p>
            </div>
            <div className="modal-footer">
              <button className="modal-btn secondary" onClick={() => setConfirmModal({ show: false, type: '' })}>
                Cancel
              </button>
              <button className="modal-btn primary danger" onClick={confirmClear}>
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ACCURACY RECOMMENDATION MODAL */}
      {recommendModal.show && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <div className={`warning-icon ${recommendModal.minWordsFailed ? 'danger' : ''}`}>
                {recommendModal.minWordsFailed ? '🚫' : '💡'}
              </div>
              <h3>{recommendModal.minWordsFailed ? 'Input Too Short' : 'Accuracy Tip'}</h3>
            </div>
            <div className="modal-body">
              <p>{recommendModal.reason}</p>
              {!recommendModal.minWordsFailed && (
                <p>Would you like to auto-adjust to <strong>N-Gram {recommendModal.suggestedN}</strong> for better results?</p>
              )}
            </div>
            <div className="modal-footer">
              {!recommendModal.minWordsFailed ? (
                <>
                  <button className="modal-btn secondary" onClick={() => {
                    setRecommendModal({ ...recommendModal, show: false });
                    handleAnalyze();
                  }}>
                    Continue with current ({windowSize})
                  </button>
                  <button className="modal-btn primary" onClick={() => {
                    const suggested = recommendModal.suggestedN;
                    setWindowSize(suggested.toString());
                    setRecommendModal({ ...recommendModal, show: false });
                    // Explicitly pass the suggested N to skip state delay
                    handleAnalyze(suggested);
                  }}>
                    Use Suggested ({recommendModal.suggestedN})
                  </button>
                </>
              ) : (
                <button className="modal-btn primary danger" onClick={() => setRecommendModal({ ...recommendModal, show: false })}>
                  I will add more text
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;