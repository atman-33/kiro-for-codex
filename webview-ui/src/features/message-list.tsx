
export type Msg = { role: 'user' | 'assistant'; text: string; ts: number; };

export function MessageList({ items }: { items: Msg[]; }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '90%' }}>
      {items.map((m, i) => (
        <div key={i} style={{
          alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
          background: m.role === 'user' ? 'var(--vscode-button-background)' : 'transparent',
          color: m.role === 'user' ? 'var(--vscode-button-foreground)' : 'inherit',
          border: m.role === 'assistant' ? '1px solid var(--vscode-editorWidget-border, #555)' : 'none',
          padding: '6px 10px',
          borderRadius: 8,
          maxWidth: '80%'
        }}>
          {m.text}
        </div>
      ))}
    </div>
  );
}

