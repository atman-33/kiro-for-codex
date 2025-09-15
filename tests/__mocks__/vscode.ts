import { vi } from 'vitest';

// Mock for VSCode API
export enum FileType {
  Unknown = 0,
  File = 1,
  Directory = 2,
  SymbolicLink = 64
}

export enum ProgressLocation {
  Notification = 15,
  Window = 10,
  SourceControl = 1
}

export class Uri {
  static file(path: string) {
    return {
      fsPath: path,
      path: path,
      scheme: 'file'
    };
  }

  static parse(value: string) {
    return {
      fsPath: value,
      path: value,
      scheme: value.split(':')[0]
    };
  }
}

export const window = {
  showInformationMessage: vi.fn(),
  showErrorMessage: vi.fn(),
  showWarningMessage: vi.fn(),
  showInputBox: vi.fn(),
  showQuickPick: vi.fn(),
  showTextDocument: vi.fn(),
  createOutputChannel: vi.fn(() => ({
    appendLine: vi.fn(),
    append: vi.fn(),
    clear: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
    dispose: vi.fn()
  })),
  createTerminal: vi.fn(),
  setStatusBarMessage: vi.fn(),
  onDidEndTerminalShellExecution: vi.fn(),
  terminals: [],
  withProgress: vi.fn((options, task) => {
    // Simply execute the task immediately
    return task();
  })
};

export const workspace = {
  fs: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    stat: vi.fn(),
    readDirectory: vi.fn(),
    createDirectory: vi.fn(),
    delete: vi.fn()
  },
  workspaceFolders: [{
    uri: Uri.file('/mock/workspace'),
    name: 'mock-workspace',
    index: 0
  }],
  openTextDocument: vi.fn(),
  createFileSystemWatcher: vi.fn(),
  textDocuments: [],
  getConfiguration: vi.fn(() => ({
    get: vi.fn((key: string, defaultValue: any) => defaultValue),
    update: vi.fn(),
    has: vi.fn(() => true),
    inspect: vi.fn()
  })),
  onDidChangeConfiguration: vi.fn(() => ({
    dispose: vi.fn()
  }))
};

export class RelativePattern {
  constructor(public folder: any, public pattern: string) { }
}

export enum ViewColumn {
  Active = -1,
  Beside = -2,
  One = 1,
  Two = 2,
  Three = 3,
  Four = 4,
  Five = 5,
  Six = 6,
  Seven = 7,
  Eight = 8,
  Nine = 9
}

// Export other commonly used APIs
export const commands = {
  registerCommand: vi.fn(),
  executeCommand: vi.fn().mockResolvedValue({})
};

export const extensions = {
  getExtension: vi.fn()
};

export const env = {
  clipboard: {
    writeText: vi.fn(),
  },
  openExternal: vi.fn(),
};

// Mock EventEmitter
export class EventEmitter<T> {
  private listeners: Array<(e: T) => any> = [];

  event = (listener: (e: T) => any) => {
    this.listeners.push(listener);
    // Return disposable
    return {
      dispose: () => {
        const index = this.listeners.indexOf(listener);
        if (index > -1) {
          this.listeners.splice(index, 1);
        }
      }
    };
  };

  fire(data: T): void {
    this.listeners.forEach(listener => listener(data));
  }

  dispose(): void {
    this.listeners = [];
  }
}

// Mock TreeItem
export class TreeItem {
  constructor(
    public label: string,
    public collapsibleState?: any
  ) { }

  contextValue?: string;
  tooltip?: string;
  command?: any;
  iconPath?: any;
  description?: string;
}

// Mock TreeItemCollapsibleState
export enum TreeItemCollapsibleState {
  None = 0,
  Collapsed = 1,
  Expanded = 2
}

// Mock ThemeIcon
export class ThemeIcon {
  constructor(public id: string) { }
}

// Mock Terminal
export interface Terminal {
  name: string;
  processId: Thenable<number | undefined>;
  creationOptions: any;
  exitStatus: any;
  sendText(text: string, addNewLine?: boolean): void;
  show(preserveFocus?: boolean): void;
  hide(): void;
  dispose(): void;
}

// Mock Webview
export interface Webview {
  html: string;
  onDidReceiveMessage: EventEmitter<any>['event'];
  postMessage(message: any): Thenable<boolean>;
  asWebviewUri(localResource: Uri): Uri;
  cspSource: string;
}

// Mock WebviewPanel
export interface WebviewPanel {
  viewType: string;
  title: string;
  webview: Webview;
  visible: boolean;
  viewColumn?: ViewColumn;
  active: boolean;
  iconPath?: Uri;
  onDidDispose: EventEmitter<void>['event'];
  onDidChangeViewState: EventEmitter<any>['event'];
  reveal(viewColumn?: ViewColumn, preserveFocus?: boolean): void;
  dispose(): void;
}
