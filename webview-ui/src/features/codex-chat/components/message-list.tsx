
export type Msg = { role: 'user' | 'assistant'; text: string; ts: number };

export function MessageList({ items }: { items: Msg[] }) {
  return (
    <div className="flex flex-col gap-1.5 w-full box-border">
      {items.map((m, i) => (
        <div
          key={i}
          className={
            m.role === 'user'
              ? 'self-end max-w-[80%] break-words whitespace-pre-wrap rounded-lg px-3 py-2'
              : 'self-start max-w-[80%] break-words whitespace-pre-wrap rounded-lg px-3 py-2 border'
          }
          style={
            m.role === 'user'
              ? { background: 'var(--vscode-button-background)', color: 'var(--vscode-button-foreground)' }
              : { borderColor: 'var(--vscode-editorWidget-border, #555)' }
          }
        >
          {m.text}
        </div>
      ))}
    </div>
  );
}
