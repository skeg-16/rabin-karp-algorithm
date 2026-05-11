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
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
);

const ZapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
);

const TerminalIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/></svg>
);

function App() {
  const [sourceText, setSourceText] = useState('');
  const [suspectText, setSuspectText] = useState('');
  const [windowSize, setWindowSize] = useState('5');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [notification, setNotification] = useState(null);
  
  // Drag states
  const [dragActiveSource, setDragActiveSource] = useState(false);
  const [dragActiveSuspect, setDragActiveSuspect] = useState(false);

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

  const processFile = async (file, setTargetText) => {
    if (!file) return;

    const fileExtension = file.name.split('.').pop().toLowerCase();

    if (fileExtension !== "txt" && fileExtension !== "docx" && fileExtension !== "pdf") {
      alert("❌ Invalid file format! Only .txt, .docx, and .pdf files are accepted by the system.");
      return;
    }

    if (fileExtension === "txt") {
      const reader = new FileReader();
      reader.onload = (event) => {
        setTargetText(event.target.result);
        setNotification({ type: 'success', message: `Successfully loaded ${file.name}` });
      };
      reader.readAsText(file);
    } else if (fileExtension === "docx") {
      const reader = new FileReader();
      reader.onload = (event) => {
        const arrayBuffer = event.target.result;
        mammoth.extractRawText({ arrayBuffer: arrayBuffer })
          .then((result) => {
            setTargetText(result.value);
            setNotification({ type: 'success', message: `Successfully parsed DOCX: ${file.name}` });
          })
          .catch((err) => {
            console.error(err);
            setNotification({ type: 'error', message: "Failed to parse DOCX file." });
          });
      };
      reader.readAsArrayBuffer(file);
    } else if (fileExtension === "pdf") {
      setNotification({ type: 'info', message: "Processing PDF... This might take a second." });
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target.result;
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          let fullText = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const strings = content.items.map(item => item.str);
            fullText += strings.join(" ") + "\n";
          }
          setTargetText(fullText.trim());
          setNotification({ type: 'success', message: `Successfully extracted text from PDF: ${file.name}` });
        } catch (err) {
          console.error(err);
          setNotification({ type: 'error', message: "Failed to process PDF file." });
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleFileUpload = (e, setTargetText) => {
    const file = e.target.files[0];
    processFile(file, setTargetText);
    e.target.value = ""; // Reset
  };

  const handleDrop = (e, setTargetText, setDragActive) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0], setTargetText);
    }
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

  const handleAnalyze = async () => {
    if (!sourceText || !suspectText) {
      setNotification({ type: 'error', message: "Please provide both Source and Suspect documents." });
      return;
    }

    if (getWordCount(sourceText) > WORD_LIMIT || getWordCount(suspectText) > WORD_LIMIT) {
      setNotification({ type: 'error', message: `Documents exceed the ${WORD_LIMIT} word limit!` });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/analyze', {
        source_text: sourceText,
        suspect_text: suspectText,
        window_size: parseInt(windowSize) || 5
      });
      setResults(response.data);
    } catch (error) {
      console.error("Error connecting to backend:", error);
      alert("Failed to connect to the backend. Is your Python server running?");
    }
    setLoading(false);
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
          <h1>Rabin-Karp Detector <span className="pdf-badge">PDF Supported</span></h1>
          <p>Cross-Lingual Plagiarism Detection • Tagalog-English Normalization</p>
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
            <div>
              <h3 className="card-title source-title">Source Document (English)</h3>
              <div className="drag-hint"><UploadIcon /> Drag & Drop or Upload (.txt, .docx, .pdf)</div>
            </div>
            <div className="file-input-wrapper">
              <label className="file-input-label">
                <UploadIcon /> Upload File
              </label>
              <input type="file" accept=".txt,.docx,.pdf" onChange={(e) => handleFileUpload(e, setSourceText)} />
            </div>
          </div>
          
          <div 
            className={`drop-zone ${dragActiveSource ? 'dragging' : ''}`}
            onDragEnter={(e) => handleDrag(e, setDragActiveSource)}
            onDragOver={(e) => handleDrag(e, setDragActiveSource)}
            onDragLeave={(e) => handleDrag(e, setDragActiveSource)}
            onDrop={(e) => handleDrop(e, setSourceText, setDragActiveSource)}
          >
            {dragActiveSource && (
              <div className="drop-overlay">
                <UploadIcon />
                <span>Drop Source File Here</span>
              </div>
            )}
            <textarea
              className="modern-textarea"
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Paste original English text or drag a file here..."
            />
            <div className={`word-counter ${getWordCount(sourceText) > WORD_LIMIT ? 'limit-exceeded' : ''}`}>
              {getWordCount(sourceText).toLocaleString()} / {WORD_LIMIT.toLocaleString()} words
            </div>
          </div>
        </div>

        {/* SUSPECT */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title suspect-title">Suspect Document (Taglish)</h3>
              <div className="drag-hint"><UploadIcon /> Drag & Drop or Upload (.txt, .docx, .pdf)</div>
            </div>
            <div className="file-input-wrapper">
              <label className="file-input-label">
                <UploadIcon /> Upload File
              </label>
              <input type="file" accept=".txt,.docx,.pdf" onChange={(e) => handleFileUpload(e, setSuspectText)} />
            </div>
          </div>

          <div 
            className={`drop-zone ${dragActiveSuspect ? 'dragging' : ''}`}
            onDragEnter={(e) => handleDrag(e, setDragActiveSuspect)}
            onDragOver={(e) => handleDrag(e, setDragActiveSuspect)}
            onDragLeave={(e) => handleDrag(e, setDragActiveSuspect)}
            onDrop={(e) => handleDrop(e, setSuspectText, setDragActiveSuspect)}
          >
            {dragActiveSuspect && (
              <div className="drop-overlay">
                <UploadIcon />
                <span>Drop Suspect File Here</span>
              </div>
            )}
            <textarea
              className="modern-textarea"
              value={suspectText}
              onChange={(e) => setSuspectText(e.target.value)}
              placeholder="Paste suspect Taglish text or drag a file here..."
            />
            <div className={`word-counter ${getWordCount(suspectText) > WORD_LIMIT ? 'limit-exceeded' : ''}`}>
              {getWordCount(suspectText).toLocaleString()} / {WORD_LIMIT.toLocaleString()} words
            </div>
          </div>
        </div>
      </div>

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
          onClick={handleAnalyze} 
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
                </div>
                <div className="stat-item">
                  <span className="stat-label">Spurious Matches</span>
                  <span className="stat-value">{results.spurious_count}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Algorithm</span>
                  <span className="stat-value">Rabin-Karp</span>
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
              <h3 className="card-title suspect-title" style={{ marginBottom: '1rem' }}>Detected Plagiarism</h3>
              <div 
                className="scroll-box"
                dangerouslySetInnerHTML={getHighlightedHTML(suspectText, results.matched_sentences)}
              />
            </div>
          </div>

          {/* SYSTEM LOGS */}
          <div className="system-logs">
            <div className="log-header">
              <TerminalIcon />
              <span>Normalization Logs (Pre-Hashing Phase)</span>
            </div>
            <div className="log-entry">
              <strong>SOURCE:</strong> {results.normalized_source}
            </div>
            <div className="log-entry suspect">
              <strong>SUSPECT:</strong> {results.normalized_suspect}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;