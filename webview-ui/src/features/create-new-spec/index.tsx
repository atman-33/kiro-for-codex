import { ArrowUp, SquarePause } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import '../../app.css';
import { vscode } from '../../bridge/vscode';

export function CreateNewSpecView() {
  const [text, setText] = useState('');
  const [running, setRunning] = useState(false);
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  // const autoGrow = () => {
  //   const el = taRef.current; if (!el) return;
  //   el.style.height = 'auto';
  //   el.style.overflowY = 'hidden';
  //   el.style.height = el.scrollHeight + 'px';
  // };

  const submit = () => {
    const payload = text.trim();
    if (!payload || running) return;
    const id = Math.random().toString(36).slice(2);
    setRunning(true);
    vscode.postMessage({ type: 'spec.create/submit', id, text: payload });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (running) return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;
      if (data.type === 'spec.create/ack') {
        setRunning(false);
      } else if (data.type === 'spec.create/error') {
        setRunning(false);
        alert(`Error: ${data.error}`);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return (
    <div className="flex flex-col h-full w-full" style={{ backgroundColor: 'var(--vscode-editor-background)' }}>
      <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--vscode-editorWidget-border, #555)' }}>
        <strong className="font-semibold">Create New Spec</strong>
      </div>
      <div className="flex-1 min-h-0 p-3">
        <div className="flex w-full h-full box-border min-w-0 items-end relative">
          <div className="flex-1 h-full min-w-0">
            <textarea
              ref={taRef}
              rows={4}
              value={text}
              onChange={(e) => { setText(e.target.value); }}
              onKeyDown={onKeyDown}
              placeholder="Outline goals, scope, constraints, and context. Enter to submit, Shift+Enter for newline."
              className="w-full resize-none h-full overflow-x-hidden overflow-y-auto px-3 pt-2 pb-9 rounded-2xl border outline-none ring-0 bg-transparent text-[color:var(--vscode-foreground)] placeholder:text-[color:var(--vscode-input-placeholderForeground,#888)] focus:border-[color:var(--vscode-focusBorder,#4c9aff)]"
              style={{
                backgroundColor: 'var(--vscode-dropdown-background)',
                borderColor: 'color-mix(in srgb, var(--vscode-foreground) 10%, transparent)'
              }}
            />
          </div>
          <div className='absolute right-2.5 bottom-3'>
            {running ? (
              <button
                disabled
                className='flex items-center justify-center cursor-not-allowed rounded-full w-6 h-6'
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--vscode-foreground) 50%, transparent)',
                  color: 'var(--vscode-sideBar-background)'
                }}
                aria-label="Running"
              >
                <SquarePause strokeWidth='1' size='18' />
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={!text.trim()}
                className='flex items-center justify-center cursor-pointer rounded-full w-6 h-6 disabled:opacity-60'
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--vscode-foreground) 50%, transparent)',
                  color: 'var(--vscode-sideBar-background)'
                }}
                aria-label="Run"
              >
                <ArrowUp strokeWidth='1' size='18' />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Note: mounted by src/index.tsx based on data-page
