import './app.css';

import { createRoot } from 'react-dom/client';
import { CodexChatView } from './features/codex-chat';

document.body.style.setProperty('padding-left', '0px', 'important');
document.body.style.setProperty('padding-right', '0px', 'important');
document.body.style.margin = '0';

const container = document.getElementById('root')!;
const root = createRoot(container);
root.render(<CodexChatView />);
