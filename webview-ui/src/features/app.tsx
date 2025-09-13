import React from 'react';
import { useEffect, useMemo, useReducer } from 'react';
import { Composer } from './composer';
import { MessageList, type Msg } from './message-list';

type State = { messages: Msg[] };
type Action = { type: 'push'; message: Msg };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'push':
      return { messages: [...state.messages, action.message] };
    default:
      return state;
  }
}

export function App() {
  const [state, dispatch] = useReducer(reducer, { messages: [] });

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;
      if (data.type === 'codex.chat/echoResult') {
        dispatch({ type: 'push', message: { role: 'assistant', text: data.text, ts: data.ts } });
      } else if (data.type === 'codex.chat/complete') {
        dispatch({ type: 'push', message: { role: 'assistant', text: data.text, ts: data.ts } });
      } else if (data.type === 'codex.chat/error') {
        dispatch({ type: 'push', message: { role: 'assistant', text: `Error: ${data.error}`, ts: data.ts } });
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
        <Composer onSend={(text) => dispatch({ type: 'push', message: { role: 'user', text, ts: Date.now() } })} />
      </div>
    </div>
  );
}
