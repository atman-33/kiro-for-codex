import { useState } from 'react';
import { vscode } from '../../../bridge/vscode';

export function Composer({ onSend, isRunning, onStop }: { onSend?: (text: string, id: string) => void; isRunning?: boolean; onStop?: () => void; }) {
  const [text, setText] = useState('');

  const send = () => {
    const payload = text.trim();
    if (!payload) return;
    const id = Math.random().toString(36).slice(2);
    // Stream execution
    vscode.postMessage({ type: 'codex.chat/runStream', id, text: payload });
    onSend?.(payload, id);
    setText('');
  };

  return (
    <div style={{ display: 'flex', gap: 8, width: '90%' }}>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (!isRunning && e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
        placeholder={isRunning ? 'Running...' : 'Type a message and press Enter'}
        disabled={!!isRunning}
        style={{ flex: 1, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--vscode-editorWidget-border, #555)' }}
      />
      {isRunning ? (
        <button onClick={onStop} style={{ padding: '8px 12px', borderRadius: 6 }}>Stop</button>
      ) : (
        <button onClick={send} style={{ padding: '8px 12px', borderRadius: 6 }}>Send</button>
      )}
    </div>
  );
}
