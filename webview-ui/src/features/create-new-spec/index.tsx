import { ArrowUp, SquarePause } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import '../../app.css';
import { vscode } from '../../bridge/vscode';
import { IconButton } from '../../components/icon-button';
import { TextareaPanel } from '../../components/textarea-panel';

export function CreateNewSpecView() {
  const [text, setText] = useState('');
  const [running, setRunning] = useState(false);
  const taRef = useRef<HTMLTextAreaElement | null>(null);

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
        <TextareaPanel
          textareaRef={taRef}
          rows={4}
          value={text}
          onChange={(e) => { setText(e.target.value); }}
          onKeyDown={onKeyDown}
          placeholder="Outline goals, scope, constraints, and context. Enter to submit, Shift+Enter for newline."
          // Expand textarea to fill available height and allow scrolling
          textareaClassName="h-full max-h-full overflow-y-auto"
        >
          <div className='flex items-center justify-end px-2'>
            {running ? (
              <IconButton disabled aria-label="Running" className='cursor-not-allowed'>
                <SquarePause strokeWidth='1' size='18' />
              </IconButton>
            ) : (
              <IconButton onClick={submit} disabled={!text.trim()} aria-label="Run" className='disabled:opacity-60'>
                <ArrowUp strokeWidth='1' size='18' />
              </IconButton>
            )}
          </div>
        </TextareaPanel>
      </div>
    </div>
  );
}

// Note: mounted by src/index.tsx based on data-page
