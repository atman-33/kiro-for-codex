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
  showInformationMessage: jest.fn(),
  showErrorMessage: jest.fn(),
  showWarningMessage: jest.fn(),
  showInputBox: jest.fn(),
  showQuickPick: jest.fn(),
  showTextDocument: jest.fn(),
  createOutputChannel: jest.fn(() => ({
    appendLine: jest.fn(),
    append: jest.fn(),
    clear: jest.fn(),
    show: jest.fn(),
    hide: jest.fn(),
    dispose: jest.fn()
  })),
  terminals: [],
  withProgress: jest.fn((options, task) => {
    // Simply execute the task immediately
    return task();
  })
};

export const workspace = {
  fs: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    stat: jest.fn(),
    readDirectory: jest.fn(),
    createDirectory: jest.fn(),
    delete: jest.fn()
  },
  workspaceFolders: [{
    uri: Uri.file('/mock/workspace'),
    name: 'mock-workspace',
    index: 0
  }],
  openTextDocument: jest.fn(),
  createFileSystemWatcher: jest.fn(),
  textDocuments: []
};

export class RelativePattern {
  constructor(public folder: any, public pattern: string) {}
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
  registerCommand: jest.fn(),
  executeCommand: jest.fn()
};

export const extensions = {
  getExtension: jest.fn()
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
  ) {}
  
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