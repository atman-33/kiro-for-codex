// VSCode configuration namespace for this extension
export const VSC_CONFIG_NAMESPACE = 'kfc';

// File names
export const CONFIG_FILE_NAME = 'kfc-settings.json';

// Default configuration
export const DEFAULT_CONFIG = {
    paths: {
        specs: '.claude/specs',
        steering: '.claude/steering',
        settings: '.claude/settings'
    },
    views: {
        specs: true,
        steering: true,
        mcp: true,
        hooks: true,
        settings: false
    },
    codex: {
        path: 'codex',
        defaultApprovalMode: 'interactive',
        defaultModel: 'gpt-5',
        timeout: 30000,
        terminalDelay: 1000
    },
    migration: {
        preserveClaudeSettings: true,
        backupOriginalFiles: true,
        migrationCompleted: false
    }
} as const;

// Legacy exports for backward compatibility (can be removed after updating all references)
export const DEFAULT_PATHS = DEFAULT_CONFIG.paths;
export const DEFAULT_VIEW_VISIBILITY = DEFAULT_CONFIG.views;