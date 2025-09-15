import { Pen } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import '../../app.css';
import { vscode } from '../../bridge/vscode';
import { PillButton } from '../../components/pill-button';
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

  // Enter inserts newline; submission only via the Create button.

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
    <div className="flex flex-col px-3 py-2 gap-2 h-full w-full" style={{ backgroundColor: 'var(--vscode-editor-background)' }}>
      <div className="border-b flex items-center justify-between" style={{ borderColor: 'var(--vscode-editorWidget-border, #555)' }}>
        <strong className="font-semibold">Create New Spec</strong>
      </div>
      <div className="flex-1 min-h-0">
        <TextareaPanel
          textareaRef={taRef}
          rows={4}
          value={text}
          onChange={(e) => { setText(e.target.value); }}
          placeholder={
            'Type your idea to generate requirement, design, and task specs. Press Create to submit.'
          }
          // Expand textarea to fill available height and allow scrolling
          textareaClassName="h-full max-h-full overflow-y-auto"
        >
          <div className='flex items-center justify-end px-2'>
            <PillButton onClick={submit} disabled={!text.trim() || running} aria-label="Create new spec">
              <Pen size='14' />
              <span>
                Create
              </span>
            </PillButton>
          </div>
        </TextareaPanel>
      </div>
    </div>
  );
}

// Note: mounted by src/index.tsx based on data-page
