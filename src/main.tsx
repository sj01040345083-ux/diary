import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { backgroundUrl, defaultBackground } from './config/backgrounds'

// 앱을 열 때 기본 배경을 먼저 지정 (로그인 전 화면에도 배경이 보이도록).
// 로그인 후 저장된 설정으로 덮어씁니다.
document.documentElement.style.setProperty(
  '--app-bg',
  `url("${backgroundUrl(defaultBackground)}")`,
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
