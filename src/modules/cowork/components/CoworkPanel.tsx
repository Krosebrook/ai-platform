import React, { useState } from 'react';
import type { CoworkTask } from '../types';

export const CoworkPanel: React.FC = () => {
  const [workDir, setWorkDir] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [tasks, setTasks] = useState<CoworkTask[]>([]);

  const handlePickDir = async () => {
    if (window.electron) {
      const dir = await window.electron.pickDirectory();
      if (dir) setWorkDir(dir);
    }
  };

  const handleAssign = () => {
    if (!workDir || !taskDesc.trim()) return;
    // Would call cowork.assign_task
    console.log('Assign task:', taskDesc, 'in', workDir);
  };

  return (
    <div className="cowork-panel">
      <h3>Cowork Agent</h3>
      <p className="module-desc">Autonomous file agent for reading, editing, and organizing files.</p>

      <div className="cowork-form">
        <div className="form-group">
          <label>Working Directory</label>
          <div className="input-row">
            <input
              type="text"
              value={workDir}
              onChange={e => setWorkDir(e.target.value)}
              placeholder="Select a folder..."
              readOnly
            />
            <button onClick={handlePickDir} className="btn">Browse</button>
          </div>
        </div>

        <div className="form-group">
          <label>Task Description</label>
          <textarea
            value={taskDesc}
            onChange={e => setTaskDesc(e.target.value)}
            placeholder="Describe what you want the agent to do..."
            rows={3}
          />
        </div>

        <button onClick={handleAssign} className="btn btn-primary" disabled={!workDir || !taskDesc.trim()}>
          Assign Task
        </button>
      </div>

      {tasks.length > 0 && (
        <div className="cowork-tasks">
          <h4>Tasks</h4>
          {tasks.map(task => (
            <div key={task.id} className={`task-card task-${task.status}`}>
              <div className="task-header">
                <span className="task-status">{task.status}</span>
                <span className="task-dir">{task.workingDirectory}</span>
              </div>
              <p>{task.description}</p>
              {task.steps.length > 0 && (
                <div className="task-steps">
                  {task.steps.map(step => (
                    <div key={step.id} className={`step step-${step.status}`}>
                      <span className="step-type">{step.type}</span>
                      <span>{step.description}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
