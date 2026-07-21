import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import SajuApp from './SajuApp'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SajuApp />
  </StrictMode>,
)
