export interface EchoMessage {
	type: "codex.chat/echo";
	id: string;
	text: string;
}

export interface EchoResultMessage {
	type: "codex.chat/echoResult";
	id: string;
	text: string;
	ts: number;
}

export interface RunOnceMessage {
	type: "codex.chat/runOnce";
	id: string;
	text: string;
}

export interface CompleteMessage {
	type: "codex.chat/complete";
	id: string;
	text: string; // full output
	ts: number;
}

export interface ErrorMessage {
	type: "codex.chat/error";
	id: string;
	error: string;
	ts: number;
}

export type InboundWebviewMessage = EchoMessage | RunOnceMessage;
export type OutboundWebviewMessage =
	| EchoResultMessage
	| CompleteMessage
	| ErrorMessage;
