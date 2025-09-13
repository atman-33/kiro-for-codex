import { createRoot } from 'react-dom/client';
import { CodexChatPage } from './pages/codex-chat/page';

const container = document.getElementById('root')!;
const root = createRoot(container);
root.render(<CodexChatPage />);
