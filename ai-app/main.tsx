import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../src/index.css'
import AiApp from '../src/AiApp.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AiApp />
  </StrictMode>,
)
