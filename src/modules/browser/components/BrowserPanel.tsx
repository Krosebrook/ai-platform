import React, { useState } from 'react';

export const BrowserPanel: React.FC = () => {
  const [url, setUrl] = useState('');
  const [tabs, setTabs] = useState<Array<{ id: string; title: string; url: string }>>([]);
  const [screenshot, setScreenshot] = useState<string | null>(null);

  const handleNavigate = () => {
    if (!url.trim()) return;
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    // Would call browser.navigate tool
    console.log('Navigate to:', fullUrl);
  };

  return (
    <div className="browser-panel">
      <h3>Browser Control</h3>

      <div className="browser-url-bar">
        <input
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="Enter URL..."
          onKeyDown={e => e.key === 'Enter' && handleNavigate()}
        />
        <button onClick={handleNavigate} className="btn">Go</button>
      </div>

      <div className="browser-actions">
        <button className="btn">Screenshot</button>
        <button className="btn">Read Page</button>
        <button className="btn">List Tabs</button>
        <button className="btn">Record GIF</button>
      </div>

      {tabs.length > 0 && (
        <div className="browser-tabs">
          <h4>Open Tabs</h4>
          {tabs.map(tab => (
            <div key={tab.id} className="browser-tab-item">
              <span>{tab.title}</span>
              <span className="tab-url">{tab.url}</span>
            </div>
          ))}
        </div>
      )}

      {screenshot && (
        <div className="browser-screenshot">
          <img src={screenshot} alt="Screenshot" />
        </div>
      )}
    </div>
  );
};
