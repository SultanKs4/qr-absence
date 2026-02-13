import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'  // Tambahan ini
import { SettingProvider } from './context/SettingContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <SettingProvider>
        <App />
      </SettingProvider>
    </BrowserRouter>
  </React.StrictMode>,
)