import React, { useState } from 'react';

export const CodePanel: React.FC = () => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('typescript');
  const [action, setAction] = useState<'generate' | 'review' | 'explain'>('generate');
  const [result, setResult] = useState('');
  const [projectPath, setProjectPath] = useState('');
  const [gitStatus, setGitStatus] = useState('');

  const handleGitStatus = async () => {
    if (!window.electron || !projectPath) return;
    const res = await window.electron.shellExec('git status --short', projectPath);
    if (res.success) setGitStatus(res.stdout || 'Clean');
  };

  const handlePickProject = async () => {
    if (!window.electron) return;
    const dir = await window.electron.pickDirectory();
    if (dir) {
      setProjectPath(dir);
    }
  };

  return (
    <div className="code-panel">
      <h3>Code Assistant</h3>

      <div className="code-tabs">
        {(['generate', 'review', 'explain'] as const).map(a => (
          <button
            key={a}
            className={`tab ${action === a ? 'active' : ''}`}
            onClick={() => setAction(a)}
          >
            {a.charAt(0).toUpperCase() + a.slice(1)}
          </button>
        ))}
      </div>

      <div className="code-editor">
        <div className="editor-header">
          <select value={language} onChange={e => setLanguage(e.target.value)}>
            {['typescript', 'javascript', 'python', 'rust', 'go', 'java', 'c++', 'html', 'css'].map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
        <textarea
          value={code}
          onChange={e => setCode(e.target.value)}
          placeholder={
            action === 'generate'
              ? 'Describe what code you want to generate...'
              : 'Paste code here...'
          }
          className="code-textarea"
          rows={12}
        />
        <button className="btn btn-primary">
          {action === 'generate' ? 'Generate' : action === 'review' ? 'Review' : 'Explain'}
        </button>
      </div>

      {result && (
        <div className="code-result">
          <h4>Result</h4>
          <pre><code>{result}</code></pre>
        </div>
      )}

      {window.electron && (
        <div className="git-section">
          <h4>Git Integration</h4>
          <div className="input-row">
            <input
              type="text"
              value={projectPath}
              readOnly
              placeholder="Select project..."
            />
            <button onClick={handlePickProject} className="btn">Browse</button>
            <button onClick={handleGitStatus} className="btn" disabled={!projectPath}>Status</button>
          </div>
          {gitStatus && <pre className="git-output">{gitStatus}</pre>}
        </div>
      )}
    </div>
  );
};
