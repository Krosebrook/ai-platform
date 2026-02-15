import React, { useState } from 'react';

const TONES = ['Professional', 'Casual', 'Technical', 'Creative', 'Formal', 'Friendly'];
const TEMPLATES = ['Blog Post', 'Email', 'Report', 'Documentation', 'Social Media', 'Cover Letter'];

export const WriterPanel: React.FC = () => {
  const [content, setContent] = useState('');
  const [tone, setTone] = useState('Professional');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [result, setResult] = useState('');

  return (
    <div className={`writer-panel ${isFullscreen ? 'fullscreen' : ''}`}>
      <div className="writer-toolbar">
        <h3>Writer</h3>
        <div className="writer-controls">
          <select value={tone} onChange={e => setTone(e.target.value)}>
            {TONES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button className="btn" onClick={() => setIsFullscreen(!isFullscreen)}>
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </button>
        </div>
      </div>

      <div className="writer-templates">
        {TEMPLATES.map(t => (
          <button key={t} className="template-chip">{t}</button>
        ))}
      </div>

      <textarea
        className="writer-editor"
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Start writing or paste text to edit..."
        rows={20}
      />

      <div className="writer-actions">
        <button className="btn">Proofread</button>
        <button className="btn">Rewrite</button>
        <button className="btn">Summarize</button>
        <button className="btn">Expand</button>
        <button className="btn">Export</button>
      </div>

      {result && (
        <div className="writer-result">
          <h4>AI Output</h4>
          <div className="result-content">{result}</div>
          <button className="btn" onClick={() => { setContent(result); setResult(''); }}>
            Use This
          </button>
        </div>
      )}
    </div>
  );
};
