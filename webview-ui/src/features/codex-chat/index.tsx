import { useEffect, useReducer, useRef, useState } from 'react';
import { vscode } from '../../bridge/vscode';
import { Composer } from './components/composer';
import { ChatHeader } from './components/header';
import { MessageList, type Msg } from './components/message-list';

type State = { messages: Msg[]; };
type Action =
  | { type: 'push'; message: Msg; }
  | { type: 'append'; chunk: string; }
  | { type: 'clear'; };

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
    case 'clear':
      return { messages: [] };
    default:
      return state;
  }
}

export function CodexChatView() {
  const [state, dispatch] = useReducer(reducer, { messages: [] });
  const [running, setRunning] = useState(false);
  const [runId, setRunId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [atBottom, setAtBottom] = useState(true);

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

  // Auto-scroll behavior
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    if (atBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }, [state.messages.length, atBottom]);

  const onScroll = () => {
    const el = listRef.current;
    if (!el) return;
    const threshold = 24; // px
    const isBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
    setAtBottom(isBottom);
  };

  return (
    <div
      className="flex gap-x-3 gap-y-2 px-3 pt-0.5 pb-2 flex-col h-full w-full min-w-0 min-h-0 shrink-0">
      <div>
        <ChatHeader running={running} onClear={() => dispatch({ type: 'clear' })} />
      </div>
      <div
        ref={listRef}
        onScroll={onScroll}
        className="relative flex-1 min-h-0 overflow-auto overflow-x-hidden"
      >
        <MessageList items={state.messages} />
        {!atBottom && (
          <button
            className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs px-2 py-1 rounded-full border bg-[color:var(--vscode-editor-background)] hover:opacity-90"
            style={{ borderColor: 'var(--vscode-editorWidget-border, #555)' }}
            onClick={() => {
              const el = listRef.current; if (el) el.scrollTop = el.scrollHeight; setAtBottom(true);
            }}
          >
            Jump to latest
          </button>
        )}
      </div>
      <div
        className="overflow-hidden border-t shrink-0"
        style={{ borderColor: 'var(--vscode-editorWidget-border, #555)' }}
      >
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
