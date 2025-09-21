import { Pen, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import '../../app.css';
import { vscode } from '../../bridge/vscode';
import { PillButton } from '../../components/pill-button';
import { TextareaPanel } from '../../components/textarea-panel';

export function CreateNewSpecView() {
  type Mode = 'standard' | 'agents';

  const rootEl = document.getElementById('root');
  const initialMode: Mode = rootEl?.getAttribute('data-mode') === 'agents' ? 'agents' : 'standard';

  const [mode, setMode] = useState<Mode>(initialMode);
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
      } else if (data.type === 'spec.create/setMode') {
        const nextMode: Mode = data.mode === 'agents' ? 'agents' : 'standard';
        setMode(nextMode);
        setRunning(false);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const header = mode === 'agents' ? 'Create New Spec (Agents)' : 'Create New Spec';
  const placeholder = mode === 'agents'
    ? 'Use specialized agents to draft requirements, design, and tasks. Describe the feature you want to build.'
    : 'Type your idea to generate requirement, design, and task specs. Press Create to submit.';
  const buttonLabel = mode === 'agents' ? 'Create with Agents' : 'Create';
  const ButtonIcon = mode === 'agents' ? Sparkles : Pen;

  return (
    <div className="flex flex-col px-3 py-2 gap-2 h-full w-full">
      <div className="border-b flex items-center justify-between" style={{ borderColor: 'var(--vscode-editorWidget-border, #555)' }}>
        <strong className="font-semibold">{header}</strong>
      </div>
      <div className="flex-1 min-h-0">
        <TextareaPanel
          textareaRef={taRef}
          rows={4}
          value={text}
          onChange={(e) => { setText(e.target.value); }}
          placeholder={placeholder}
          // Expand textarea to fill available height and allow scrolling
          textareaClassName="h-full max-h-full overflow-y-auto"
        >
          <div className='flex items-center justify-end px-2'>
            <PillButton onClick={submit} disabled={!text.trim() || running} aria-label="Create new spec">
              <ButtonIcon size='14' />
              <span>
                {buttonLabel}
              </span>
            </PillButton>
          </div>
        </TextareaPanel>
      </div>
    </div>
  );
}

// Note: mounted by src/index.tsx based on data-page
