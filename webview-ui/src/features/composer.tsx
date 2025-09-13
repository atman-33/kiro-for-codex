import { useState } from 'react';
import { vscode } from '../bridge/vscode';

export function Composer({ onSend }: { onSend?: (text: string) => void; }) {
  const [text, setText] = useState('');

  const send = () => {
    const payload = text.trim();
    if (!payload) return;
    const id = Math.random().toString(36).slice(2);
    // Send to extension as runOnce
    vscode.postMessage({ type: 'codex.chat/runOnce', id, text: payload });
    onSend?.(payload);
    setText('');
  };

  return (
    <div style={{ display: 'flex', gap: 8, width: '90%' }}>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
        placeholder="Type a message and press Enter"
        style={{ flex: 1, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--vscode-editorWidget-border, #555)' }}
      />
      <button onClick={send} style={{ padding: '8px 12px', borderRadius: 6 }}>Send</button>
    </div>
  );
}
