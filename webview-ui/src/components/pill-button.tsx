import type React from 'react';

export type PillButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

/**
 * Reusable pill-shaped action button used in headers and toolbars.
 * Consumers provide the inner content (icon/label) via `children`.
 */
export function PillButton({ className, style, type, children, ...rest }: PillButtonProps) {
  return (
    <button
      type={type ?? 'button'}
      className={
        [
          'inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border-[1px] select-none transition-colors',
          'hover:bg-[color:var(--vscode-button-background,#7c3aed)]/10',
          'focus-visible:outline-none focus-visible:ring-1 cursor-pointer',
          className ?? '',
        ].join(' ')
      }
      style={{
        borderColor: 'color-mix(in srgb, var(--vscode-foreground) 10%, transparent)',
        color: 'var(--vscode-textLink-foreground)',
        ...(style ?? {}),
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

