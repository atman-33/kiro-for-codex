import { ArrowUp, SquarePause } from 'lucide-react';
import { useRef, useState } from 'react';
import { vscode } from '../../../bridge/vscode';
import { TextareaPanel } from '../../../components/textarea-panel';

export function Composer({ onSend, isRunning, onStop }: { onSend?: (text: string, id: string) => void; isRunning?: boolean; onStop?: () => void; }) {
  const [text, setText] = useState('');
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  const send = () => {
    const payload = text.trim();
    if (!payload) return;
    const id = Math.random().toString(36).slice(2);
    vscode.postMessage({ type: 'codex.chat/runStream', id, text: payload });
    onSend?.(payload, id);
    setText('');
    if (taRef.current) {
      taRef.current.style.height = 'auto';
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isRunning) return;
    // Enter to send, Shift+Enter for newline
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const MAX_HEIGHT = 160; // px
  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    // Auto-grow textarea height
    const el = taRef.current;
    if (el) {
      el.style.height = 'auto';
      const fullHeight = el.scrollHeight;
      if (fullHeight > MAX_HEIGHT) {
        el.style.height = MAX_HEIGHT + "px";
        el.style.overflowY = "auto";
      } else {
        el.style.height = fullHeight + "px";
        el.style.overflowY = "hidden";
      }
      el.style.height = el.scrollHeight + 'px';
    }
  };

  return (
    <TextareaPanel
      textareaRef={taRef}
      rows={1}
      value={text}
      onChange={onChange}
      onKeyDown={onKeyDown}
      placeholder={isRunning ? 'Running…' : 'Type a message. Enter to send, Shift+Enter for newline'}
      disabled={!!isRunning}
      textareaClassName='min-h-16 max-h-40'
    >
      <div className='flex items-center justify-end px-2'>
        {isRunning ? (
          <button
            onClick={onStop}
            className='flex items-center justify-center cursor-pointer rounded-full w-6 h-6'
            disabled={!onStop}
            style={{
              backgroundColor: 'color-mix(in srgb, var(--vscode-foreground) 50%, transparent)',
              color: 'var(--vscode-sideBar-background)'
            }}
          >
            <SquarePause strokeWidth='1' size='18' style={{
            }} />
          </button>
        ) : (
          <button
            onClick={send}
            disabled={!!isRunning}
            className='flex items-center justify-center cursor-pointer rounded-full w-6 h-6'
            style={{
              backgroundColor: 'color-mix(in srgb, var(--vscode-foreground) 50%, transparent)',
              color: 'var(--vscode-sideBar-background)'
            }}
          >
            <ArrowUp strokeWidth='1' size='18' />
          </button>
        )}
      </div>
    </TextareaPanel>
  );
}
