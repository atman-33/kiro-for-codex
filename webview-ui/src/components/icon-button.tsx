import type React from 'react';

export type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Extra Tailwind classes to append */
  className?: string;
  /** Inline style override/merge */
  style?: React.CSSProperties;
  /** Accessible label for screen readers */
  'aria-label'?: string;
  children: React.ReactNode;
};

/**
 * Small circular icon button with VS Code themed colors.
 * Defaults match existing chat composer buttons.
 */
export function IconButton({ className, style, type, children, ...rest }: IconButtonProps) {
  return (
    <button
      type={type ?? 'button'}
      className={`flex items-center justify-center cursor-pointer rounded-full w-6 h-6 ${className ?? ''}`}
      style={{
        backgroundColor: 'color-mix(in srgb, var(--vscode-foreground) 50%, transparent)',
        color: 'var(--vscode-sideBar-background)',
        ...(style ?? {}),
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

