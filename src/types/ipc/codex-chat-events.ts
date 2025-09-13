// Event names for Codex Chat webview IPC
// Keep strings stable; UI and extension must match.

export const IPC = {
	// UI -> Extension
	Echo: "codex.chat/echo",
	RunOnce: "codex.chat/runOnce",

	// Extension -> UI
	EchoResult: "codex.chat/echoResult",
	Complete: "codex.chat/complete",
	Error: "codex.chat/error",
} as const;

export type IpcOutbound = (typeof IPC)[keyof typeof IPC];
