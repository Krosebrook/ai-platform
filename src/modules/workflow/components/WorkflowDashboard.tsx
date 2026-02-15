import React, { useState } from 'react';

interface Workflow {
  id: string;
  name: string;
  webhookUrl: string;
  description: string;
  lastRun?: string;
}

export const WorkflowDashboard: React.FC = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const addWorkflow = () => {
    if (!newName.trim() || !newUrl.trim()) return;
    setWorkflows([...workflows, {
      id: Date.now().toString(),
      name: newName,
      webhookUrl: newUrl,
      description: newDesc,
    }]);
    setNewName(''); setNewUrl(''); setNewDesc(''); setShowAdd(false);
  };

  const triggerWorkflow = async (wf: Workflow) => {
    try {
      await fetch(wf.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triggered: true, timestamp: new Date().toISOString() }),
      });
      wf.lastRun = new Date().toISOString();
      setWorkflows([...workflows]);
    } catch (err) {
      console.error('Workflow trigger failed:', err);
    }
  };

  return (
    <div className="workflow-dashboard">
      <div className="panel-header">
        <h3>Workflows</h3>
        <button onClick={() => setShowAdd(!showAdd)} className="btn">+ Add</button>
      </div>

      {showAdd && (
        <div className="workflow-form">
          <input placeholder="Workflow name" value={newName} onChange={e => setNewName(e.target.value)} />
          <input placeholder="Webhook URL" value={newUrl} onChange={e => setNewUrl(e.target.value)} />
          <input placeholder="Description (optional)" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
          <button onClick={addWorkflow} className="btn btn-primary">Save</button>
        </div>
      )}

      <div className="workflow-list">
        {workflows.map(wf => (
          <div key={wf.id} className="workflow-card">
            <div className="wf-info">
              <strong>{wf.name}</strong>
              <p>{wf.description}</p>
              {wf.lastRun && <span className="wf-lastrun">Last run: {new Date(wf.lastRun).toLocaleString()}</span>}
            </div>
            <button onClick={() => triggerWorkflow(wf)} className="btn">Trigger</button>
          </div>
        ))}
        {workflows.length === 0 && <p className="empty-text">No workflows configured. Add one above.</p>}
      </div>
    </div>
  );
};
