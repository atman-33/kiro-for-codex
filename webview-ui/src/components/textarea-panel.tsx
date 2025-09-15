import type React from 'react';

type TextareaPanelProps = {
  value: string;
  onChange: React.ChangeEventHandler<HTMLTextAreaElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLTextAreaElement>;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
  textareaRef?: React.Ref<HTMLTextAreaElement>;
  /** Additional classes for the textarea element */
  textareaClassName?: string;
  /** Additional classes for the container */
  containerClassName?: string;
  /** Optional inline style for container */
  containerStyle?: React.CSSProperties;
  children?: React.ReactNode;
};

/**
 * Reusable panel with VS Code themed container and a textarea on top.
 * Bottom content (e.g., action buttons) is provided via `children`.
 */
export function TextareaPanel({
  value,
  onChange,
  onKeyDown,
  placeholder,
  disabled,
  rows = 1,
  textareaRef,
  textareaClassName,
  containerClassName,
  containerStyle,
  children,
}: TextareaPanelProps) {
  return (
    <div
      className={
        `flex flex-col gap-2 w-full h-full box-border rounded-2xl pt-4 pb-2 min-w-0 bg-[var(--vscode-dropdown-background)] border ` +
        (containerClassName ?? '')
      }
      style={{
        borderColor: 'color-mix(in srgb, var(--vscode-foreground) 10%, transparent)',
        ...(containerStyle ?? {}),
      }}
    >
      <div className="flex-1 h-full min-w-0">
        <textarea
          ref={textareaRef}
          rows={rows}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={!!disabled}
          className={
            `w-full px-3 resize-none overflow-x-hidden outline-none ring-0 bg-transparent text-[color:var(--vscode-foreground)] placeholder:text-[color:var(--vscode-input-placeholderForeground,#888)] ` +
            (textareaClassName ?? '')
          }
        />
      </div>
      {children}
    </div>
  );
}

