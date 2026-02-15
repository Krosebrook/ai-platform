import React, { useState } from 'react';

interface Source {
  url: string;
  title: string;
  snippet: string;
}

export const ResearchPanel: React.FC = () => {
  const [query, setQuery] = useState('');
  const [sources, setSources] = useState<Source[]>([]);
  const [report, setReport] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = () => {
    if (!query.trim()) return;
    setIsSearching(true);
    // Would trigger research.search tool
    setTimeout(() => setIsSearching(false), 1000);
  };

  return (
    <div className="research-panel">
      <h3>Research</h3>
      <p className="module-desc">Multi-source research with citations.</p>

      <div className="research-search">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="What do you want to research?"
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch} className="btn btn-primary" disabled={isSearching}>
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </div>

      {sources.length > 0 && (
        <div className="source-list">
          <h4>Sources ({sources.length})</h4>
          {sources.map((s, i) => (
            <div key={i} className="source-card">
              <a href={s.url} target="_blank" rel="noopener">{s.title}</a>
              <p>{s.snippet}</p>
            </div>
          ))}
          <button className="btn">Synthesize Report</button>
        </div>
      )}

      {report && (
        <div className="research-report">
          <h4>Research Report</h4>
          <div className="report-content">{report}</div>
          <button className="btn">Save to Notes</button>
        </div>
      )}
    </div>
  );
};
