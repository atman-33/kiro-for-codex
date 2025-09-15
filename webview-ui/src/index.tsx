import { createRoot } from 'react-dom/client';
import './app.css';
import { CodexChatView } from './features/codex-chat';
import { CreateNewSpecView } from './features/create-new-spec';

document.body.style.setProperty('padding-left', '0px', 'important');
document.body.style.setProperty('padding-right', '0px', 'important');
document.body.style.margin = '0';

const container = document.getElementById('root')!;
const root = createRoot(container);

const page = container.dataset.page || 'codex-chat';

// Set initial background color per page (align with VS Code theme tokens)
switch (page) {
  case 'codex-chat':
    document.body.style.setProperty(
      'background-color',
      'var(--vscode-sideBar-background)',
      'important',
    );
    break;
  case 'create-new-spec':
    document.body.style.setProperty(
      'background-color',
      'var(--vscode-editor-background)',
      'important',
    );
    break;
  default:
    // Leave default background
    break;
}
switch (page) {
  case 'codex-chat':
    root.render(<CodexChatView />);
    break;
  case 'create-new-spec':
    root.render(<CreateNewSpecView />);
    break;
  default:
    root.render(<div style={{ padding: 12 }}>Unknown page: {page}</div>);
}
