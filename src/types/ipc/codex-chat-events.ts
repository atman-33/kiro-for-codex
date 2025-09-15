// Event names for Codex Chat webview IPC
// Keep strings stable; UI and extension must match.

export const IPC = {
	// UI -> Extension
	Echo: "codex.chat/echo",
	RunOnce: "codex.chat/runOnce",
	RunStream: "codex.chat/runStream",
	Stop: "codex.chat/stop",

	// Extension -> UI
	EchoResult: "codex.chat/echoResult",
	Chunk: "codex.chat/chunk",
	Complete: "codex.chat/complete",
	Error: "codex.chat/error",
} as const;

export type IpcOutbound = (typeof IPC)[keyof typeof IPC];
