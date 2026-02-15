import React, { useState } from 'react';

export const VoicePanel: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [ttsText, setTtsText] = useState('');
  const [ttsRate, setTtsRate] = useState(1);

  const toggleRecording = () => setIsRecording(!isRecording);

  const handleSpeak = () => {
    if (!ttsText.trim() || !('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(ttsText);
    utterance.rate = ttsRate;
    speechSynthesis.speak(utterance);
  };

  return (
    <div className="voice-panel">
      <h3>Voice</h3>

      <div className="voice-record-section">
        <h4>Voice Input</h4>
        <button
          className={`btn voice-btn ${isRecording ? 'recording' : ''}`}
          onClick={toggleRecording}
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
        {transcription && (
          <div className="transcription">
            <h5>Transcription</h5>
            <p>{transcription}</p>
          </div>
        )}
      </div>

      <div className="voice-tts-section">
        <h4>Text-to-Speech</h4>
        <textarea
          value={ttsText}
          onChange={e => setTtsText(e.target.value)}
          placeholder="Enter text to read aloud..."
          rows={4}
        />
        <div className="tts-controls">
          <label>
            Speed: {ttsRate.toFixed(1)}x
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={ttsRate}
              onChange={e => setTtsRate(Number(e.target.value))}
            />
          </label>
          <button onClick={handleSpeak} className="btn btn-primary">Speak</button>
        </div>
      </div>
    </div>
  );
};
