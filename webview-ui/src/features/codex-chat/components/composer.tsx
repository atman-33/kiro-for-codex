import { ArrowUp, SquarePause } from 'lucide-react';
import { useRef, useState } from 'react';
import { vscode } from '../../../bridge/vscode';

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

  const MAX_HEIGHT = 320; // px
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
    <div className="flex flex-col gap-2 w-full h-full box-border rounded-2xl pt-4 pb-2 min-w-0 bg-[var(--vscode-dropdown-background)] border"
      style={{
        borderColor: 'color-mix(in srgb, var(--vscode-foreground) 10%, transparent)'
      }}>
      <div className="flex-1 h-full min-w-0">
        <textarea
          ref={taRef}
          rows={1}
          value={text}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder={isRunning ? 'Running…' : 'Type a message. Enter to send, Shift+Enter for newline'}
          disabled={!!isRunning}
          className="w-full min-h-16 max-h-40 px-3 resize-none overflow-x-hidden outline-none ring-0 bg-transparent text-[color:var(--vscode-foreground)] placeholder:text-[color:var(--vscode-input-placeholderForeground,#888)]"
        />
      </div>
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
    </div>
  );
}
