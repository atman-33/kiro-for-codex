import './app.css';
import { createRoot } from 'react-dom/client';
import { CodexChatView } from './features/codex-chat';
import { CreateNewSpecView } from './features/create-new-spec';

document.body.style.setProperty('padding-left', '0px', 'important');
document.body.style.setProperty('padding-right', '0px', 'important');
document.body.style.margin = '0';

const container = document.getElementById('root')!;
const root = createRoot(container);

const page = container.dataset.page || 'codex-chat';
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
