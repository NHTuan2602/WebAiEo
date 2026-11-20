import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './anti-ai-reset.css'
import App from './App.jsx'
import AppErrorBoundary from './components/common/AppErrorBoundary.jsx'

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw-offline.js').catch(() => {});
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
)
