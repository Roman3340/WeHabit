import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { initTelegramWebApp } from './utils/telegram'
import './styles/index.css'

// Инициализация Telegram Web App
initTelegramWebApp()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
