// Event names for Codex Chat webview IPC
// Keep strings stable; UI and extension must match.

export const IPC = {
	// UI -> Extension
	Echo: "codex.chat/echo",

	// Extension -> UI
	EchoResult: "codex.chat/echoResult",
} as const;

export type IpcOutbound = (typeof IPC)[keyof typeof IPC];
