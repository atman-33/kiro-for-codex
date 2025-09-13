import { createRoot } from 'react-dom/client';
import { App } from './features/app';

const container = document.getElementById('root')!;
const root = createRoot(container);
root.render(<App />);
