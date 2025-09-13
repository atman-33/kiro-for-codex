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

export type InboundWebviewMessage = EchoMessage;
export type OutboundWebviewMessage = EchoResultMessage;
