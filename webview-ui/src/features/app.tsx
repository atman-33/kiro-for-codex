import React from 'react';
import { useEffect, useMemo, useReducer, useState } from 'react';
import { Composer } from './composer';
import { vscode } from '../bridge/vscode';
import { MessageList, type Msg } from './message-list';

type State = { messages: Msg[] };
type Action =
  | { type: 'push'; message: Msg }
  | { type: 'append'; chunk: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'push':
      return { messages: [...state.messages, action.message] };
    case 'append': {
      const msgs = [...state.messages];
      const last = msgs[msgs.length - 1];
      if (last && last.role === 'assistant') {
        msgs[msgs.length - 1] = { ...last, text: last.text + action.chunk };
        return { messages: msgs };
      }
      // if no assistant message yet, create one
      msgs.push({ role: 'assistant', text: action.chunk, ts: Date.now() });
      return { messages: msgs };
    }
    default:
      return state;
  }
}

export function App() {
  const [state, dispatch] = useReducer(reducer, { messages: [] });
  const [running, setRunning] = useState(false);
  const [runId, setRunId] = useState<string | null>(null);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;
      if (data.type === 'codex.chat/echoResult') {
        dispatch({ type: 'push', message: { role: 'assistant', text: data.text, ts: data.ts } });
      } else if (data.type === 'codex.chat/chunk') {
        dispatch({ type: 'append', chunk: data.text });
      } else if (data.type === 'codex.chat/complete') {
        // Only append if provider sent a final text (non-streaming fallback)
        if (data.text && data.text.length > 0) {
          dispatch({ type: 'push', message: { role: 'assistant', text: data.text, ts: data.ts } });
        }
        setRunning(false);
      } else if (data.type === 'codex.chat/error') {
        dispatch({ type: 'push', message: { role: 'assistant', text: `Error: ${data.error}`, ts: data.ts } });
        setRunning(false);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const header = useMemo(() => (
    <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--vscode-editorWidget-border, #555)' }}>
      <strong>Codex Chat (Preview)</strong>
    </div>
  ), []);

  return (
    <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr auto', height: '100vh', width: '100vw' }}>
      {header}
      <div style={{ padding: 12, overflow: 'auto' }}>
        <MessageList items={state.messages} />
      </div>
      <div style={{ padding: 12, borderTop: '1px solid var(--vscode-editorWidget-border, #555)' }}>
        <Composer
          isRunning={running}
          onStop={() => {
            vscode.postMessage({ type: 'codex.chat/stop', id: runId ?? 'current' });
            setRunning(false);
            setRunId(null);
          }}
          onSend={(text, id) => {
            dispatch({ type: 'push', message: { role: 'user', text, ts: Date.now() } });
            setRunning(true);
            setRunId(id);
          }}
        />
      </div>
    </div>
  );
}
