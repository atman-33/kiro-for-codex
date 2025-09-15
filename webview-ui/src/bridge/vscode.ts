// Minimal wrapper around acquireVsCodeApi with a dev-friendly fallback

type VsCodeApi = {
  postMessage: (message: any) => void;
  getState: () => any;
  setState: (state: any) => void;
};

declare global {
  interface Window {
    acquireVsCodeApi?: () => VsCodeApi;
  }
}

let vscodeApi: VsCodeApi;
if (typeof window !== 'undefined' && typeof window.acquireVsCodeApi === 'function') {
  vscodeApi = window.acquireVsCodeApi!();
} else {
  // Local preview fallback (no-op postMessage)
  vscodeApi = {
    postMessage: (msg: any) => {
      // eslint-disable-next-line no-console
      console.debug('[webview][dev] postMessage', msg);
      // Simulate echo in dev: bounce back the same message shape
      window.setTimeout(() => {
        window.dispatchEvent(new MessageEvent('message', { data: { type: 'codex.chat/echoResult', id: msg.id, text: msg.text, ts: Date.now() } }));
      }, 50);
    },
    getState: () => ({}),
    setState: () => {}
  };
}

export const vscode = vscodeApi;

