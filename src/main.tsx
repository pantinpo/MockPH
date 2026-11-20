import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import AiApp from './AiApp.tsx'

const root = createRoot(document.getElementById('root')!)
const routedAiPath = new URLSearchParams(window.location.search).get('ai-route')
const aiPath = routedAiPath || window.location.pathname
const isAiRoute = aiPath === '/ai' || aiPath.startsWith('/ai/')

root.render(
  <StrictMode>
    {isAiRoute ? <AiApp /> : <App />}
  </StrictMode>,
)
