// VSCode configuration namespace for this extension
export const VSC_CONFIG_NAMESPACE = 'kfc';

// File names
export const CONFIG_FILE_NAME = 'kfc-settings.json';

// Default configuration
export const DEFAULT_CONFIG = {
    paths: {
        specs: '.codex/specs',
        steering: '.codex/steering',
        settings: '.codex/settings'
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

// Minimum supported Codex CLI version (hardcoded requirement)
export const MIN_CODEX_CLI_VERSION = '0.28.0' as const;
