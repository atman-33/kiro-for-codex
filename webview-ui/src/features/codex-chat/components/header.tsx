import { Eraser } from 'lucide-react';
import { PillButton } from '../../../components/pill-button';

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
        <PillButton onClick={onClear} aria-label="Clear conversation">
          <Eraser size='14' />
          <span>Clear</span>
        </PillButton>
      </div>
    </div>
  );
}
