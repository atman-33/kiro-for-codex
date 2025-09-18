// VSCode configuration namespace for this extension
export const VSC_CONFIG_NAMESPACE = "kiroCodex";

// File names
export const CONFIG_FILE_NAME = "kiroCodex-settings.json";

// Default configuration
export const DEFAULT_CONFIG = {
	paths: {
		specs: ".codex/specs",
		steering: ".codex/steering",
	},
	views: {
		specs: true,
		steering: true,
		// Temporarily hide MCP view until CLI commands are available
		mcp: false,
		// Temporarily hide Hooks view until CLI feature is available
		hooks: false,
		// Prompts view is enabled by default
		prompts: true,
		settings: false,
	},
	codex: {
		path: "codex",
		defaultApprovalMode: "interactive",
		defaultModel: "gpt-5",
		timeout: 30000,
		terminalDelay: 1000,
		windowsShellPath: "",
	},
	migration: {
		backupOriginalFiles: true,
		migrationCompleted: false,
	},
} as const;

// Legacy exports for backward compatibility (can be removed after updating all references)
export const DEFAULT_PATHS = DEFAULT_CONFIG.paths;
export const DEFAULT_VIEW_VISIBILITY = DEFAULT_CONFIG.views;

// Settings directory is fixed and not user configurable
export const SETTINGS_DIR = ".codex/settings" as const;

// Prompts directory is fixed and not user configurable
export const PROMPTS_DIR = ".codex/prompts" as const;

// Feature flag to fully disable MCP UI and background loading
export const ENABLE_MCP_UI = false as const;

// Feature flag to fully disable Hooks UI and background loading
export const ENABLE_HOOKS_UI = false as const;

// Feature flag to fully disable Agents UI and background loading
export const ENABLE_AGENTS_UI = false as const;

// Feature flag to disable "New Spec with Agents" flow
export const ENABLE_SPEC_AGENTS = false as const;

// Minimum supported Codex CLI version (hardcoded requirement)
export const MIN_CODEX_CLI_VERSION = "0.28.0" as const;
