import React, { useState } from 'react';
import axios from 'axios';
import mammoth from 'mammoth';

function App() {
  const [sourceText, setSourceText] = useState('');
  const [suspectText, setSuspectText] = useState('');
  const [windowSize, setWindowSize] = useState(5);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = (e, setTargetText) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop().toLowerCase();

    if (fileExtension !== "txt" && fileExtension !== "docx") {
      alert("❌ Invalid file format! Tanging .txt at .docx files lamang ang tinatanggap ng system, base sa Scope and Limitations ng research.");
      e.target.value = "";
      return;
    }

    if (fileExtension === "txt") {
      const reader = new FileReader();
      reader.onload = (event) => setTargetText(event.target.result);
      reader.readAsText(file);
    } else if (fileExtension === "docx") {
      const reader = new FileReader();
      reader.onload = (event) => {
        const arrayBuffer = event.target.result;
        mammoth.extractRawText({ arrayBuffer: arrayBuffer })
          .then((result) => setTargetText(result.value))
          .catch((err) => {
            console.error(err);
            alert("❌ May error sa pagbasa ng DOCX file.");
          });
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleAnalyze = async () => {
    if (!sourceText || !suspectText) {
      alert("Please enter both Source and Suspect documents.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/analyze', {
        source_text: sourceText,
        suspect_text: suspectText,
        window_size: parseInt(windowSize)
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
    let highlightedText = text;
    
    if (matches && matches.length > 0) {
      matches.forEach(match => {
        const escapedMatch = match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedMatch})`, 'gi');
        highlightedText = highlightedText.replace(
          regex, 
          `<mark style="background-color: #ffeb3b; padding: 2px 4px; border-radius: 3px; font-weight: bold; box-shadow: 0 1px 2px rgba(0,0,0,0.2); color: black;">$1</mark>`
        );
      });
    }
    
    return { __html: highlightedText };
  };

  const getScoreColor = (score) => {
    if (score <= 15) return '#4caf50'; // Green
    if (score <= 40) return '#ff9800'; // Orange
    return '#f44336'; // Red
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', fontFamily: 'Arial, sans-serif', padding: '20px', color: '#333' }}>
      
      {/* INTERNAL CSS PARA SA RESPONSIVENESS AT SCROLLBARS */}
      <style>
        {`
          .responsive-flex {
            display: flex;
            gap: 20px;
          }
          .scrollable-box {
            max-height: 400px;
            overflow-y: auto;
            padding: 15px;
            background-color: #f9f9f9;
            border: 1px solid #ddd;
            border-radius: 6px;
            line-height: 1.6;
            color: #444;
            white-space: pre-wrap; /* Keeps paragraphs intact */
            word-wrap: break-word; /* Prevents text from overflowing sideways */
          }
          /* Custom Scrollbar for better UI */
          .scrollable-box::-webkit-scrollbar {
            width: 8px;
          }
          .scrollable-box::-webkit-scrollbar-track {
            background: #f1f1f1; 
          }
          .scrollable-box::-webkit-scrollbar-thumb {
            background: #bdc3c7; 
            border-radius: 4px;
          }
          .scrollable-box::-webkit-scrollbar-thumb:hover {
            background: #95a5a6; 
          }
          @media (max-width: 800px) {
            .responsive-flex {
              flex-direction: column;
            }
          }
        `}
      </style>

      {/* HEADER */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: '0 0 10px 0', color: '#2c3e50', fontSize: 'clamp(24px, 4vw, 32px)' }}>Rabin-Karp Cross-Lingual Plagiarism Detector</h1>
        <p style={{ margin: 0, color: '#7f8c8d', fontSize: 'clamp(14px, 2vw, 16px)' }}>Enhanced with Dictionary-Based Normalization for Tagalog-English Text</p>
      </div>

      {/* INPUT SECTION */}
      <div className="responsive-flex" style={{ marginBottom: '20px' }}>
        <div style={{ flex: 1, backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #e9ecef' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ margin: 0, color: '#2980b9' }}>Source Document (English)</h3>
            <input type="file" accept=".txt,.docx" onChange={(e) => handleFileUpload(e, setSourceText)} style={{ fontSize: '12px', maxWidth: '100%' }} />
          </div>
          <textarea
            style={{ width: '100%', height: '250px', padding: '10px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px', resize: 'vertical' }}
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="Paste original English text here or upload a .txt/.docx file..."
          />
        </div>

        <div style={{ flex: 1, backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #e9ecef' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ margin: 0, color: '#c0392b' }}>Suspect Document (Taglish)</h3>
            <input type="file" accept=".txt,.docx" onChange={(e) => handleFileUpload(e, setSuspectText)} style={{ fontSize: '12px', maxWidth: '100%' }} />
          </div>
          <textarea
            style={{ width: '100%', height: '250px', padding: '10px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px', resize: 'vertical' }}
            value={suspectText}
            onChange={(e) => setSuspectText(e.target.value)}
            placeholder="Paste suspect Taglish text here or upload a .txt/.docx file..."
          />
        </div>
      </div>

      {/* CONTROLS */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '30px', padding: '15px', backgroundColor: '#ecf0f1', borderRadius: '8px' }}>
        <label style={{ fontWeight: 'bold' }}>N-Gram Window Size: </label>
        <input 
          type="number" 
          value={windowSize}
          onChange={(e) => setWindowSize(e.target.value)}
          style={{ width: '60px', padding: '8px', textAlign: 'center', borderRadius: '4px', border: '1px solid #bdc3c7' }}
          min="1"
        />
        <button 
          onClick={handleAnalyze} 
          disabled={loading} 
          style={{ 
            padding: '10px 25px', 
            cursor: loading ? 'not-allowed' : 'pointer', 
            fontWeight: 'bold', 
            backgroundColor: loading ? '#95a5a6' : '#27ae60', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            fontSize: '16px',
            width: '100%',
            maxWidth: '300px'
          }}
        >
          {loading ? "Analyzing..." : "Run Cross-Lingual Scan"}
        </button>
      </div>

      {/* RESULTS DISPLAY */}
      {results && (
        <div style={{ border: '2px solid #bdc3c7', borderRadius: '8px', overflow: 'hidden' }}>
          
          {/* SCORE HEADER */}
          <div style={{ backgroundColor: '#ecf0f1', padding: '20px', borderBottom: '2px solid #bdc3c7', textAlign: 'center' }}>
            <h2 style={{ margin: '0 0 15px 0' }}>Analysis Report</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '500px', margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '5px', fontSize: 'clamp(16px, 3vw, 20px)', fontWeight: 'bold' }}>
                <span>Similarity Score:</span>
                <span style={{ color: getScoreColor(parseFloat(results.similarity_percent)) }}>
                  {results.similarity_percent}%
                </span>
              </div>
              <div style={{ width: '100%', backgroundColor: '#dfe6e9', borderRadius: '10px', height: '15px', overflow: 'hidden' }}>
                <div style={{ 
                  width: `${results.similarity_percent}%`, 
                  backgroundColor: getScoreColor(parseFloat(results.similarity_percent)), 
                  height: '100%', 
                  transition: 'width 0.5s ease-in-out' 
                }}></div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px', marginTop: '15px', fontSize: '14px', color: '#555' }}>
                <span><strong>Matched Sentences:</strong> {results.matched_count} / {results.total_sentences}</span>
                <span><strong>Spurious Matches (Collisions):</strong> {results.spurious_count}</span>
              </div>
            </div>
          </div>

          {/* SIDE-BY-SIDE HIGHLIGHTING VIEW */}
          <div className="responsive-flex" style={{ padding: '20px', backgroundColor: '#fff', gap: '20px' }}>
            
            {/* SOURCE VIEW */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ marginTop: 0, color: '#2980b9' }}>Source Document</h3>
              <div className="scrollable-box">
                {sourceText}
              </div>
            </div>

            {/* SUSPECT VIEW (HIGHLIGHTED) */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ marginTop: 0, color: '#c0392b' }}>Suspect Document (Detected)</h3>
              <p style={{ fontSize: '12px', color: '#7f8c8d', margin: '-10px 0 10px 0' }}>
                * Sentences highlighted in yellow are translated matches detected by Rabin-Karp.
              </p>
              <div 
                className="scrollable-box"
                dangerouslySetInnerHTML={getHighlightedHTML(suspectText, results.matched_sentences)}
              />
            </div>

          </div>

          {/* BACKEND NORMALIZATION LOGS */}
          <div style={{ padding: '15px 20px', backgroundColor: '#2d3436', color: '#dfe6e9', fontSize: '12px', maxHeight: '200px', overflowY: 'auto' }}>
            <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#74b9ff' }}>[System Logs] Normalized Tokens (Pre-Hashing Phase):</p>
            <p style={{ margin: '0 0 5px 0', wordWrap: 'break-word' }}><strong>Source:</strong> {results.normalized_source}</p>
            <p style={{ margin: 0, wordWrap: 'break-word', color: '#ff7675' }}><strong>Suspect:</strong> {results.normalized_suspect}</p>
          </div>

        </div>
      )}
    </div>
  );
}

export default App;