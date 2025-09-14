import { Eraser } from 'lucide-react';

type Props = {
  running: boolean;
  onClear: () => void;
};

export function ChatHeader({ running, onClear }: Props) {
  return (
    <div
      className="border-b flex items-center justify-between leading-tight"
      style={{ borderColor: 'var(--vscode-editorWidget-border, #555)' }}
    >
      <div className="flex items-center gap-2">
        <strong className="font-semibold">Codex Chat</strong>
      </div>
      <div className="flex items-center gap-2">
        <button
          className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border-[1px] select-none transition-colors 
             hover:bg-[color:var(--vscode-button-background,#7c3aed)]/10 
             focus-visible:outline-none focus-visible:ring-1 cursor-pointer"
          style={{
            borderColor: 'color-mix(in srgb, var(--vscode-foreground) 10%, transparent)',
            color: 'var(--vscode-textLink-foreground)'
          }}
          onClick={onClear}
          aria-label="Clear conversation"
        >
          <Eraser size='14' />
          <span>Clear</span>
        </button>
      </div>
    </div>
  );
}
