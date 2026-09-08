import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router"; // Assure-toi que c'est react-router-dom
import App from './App.jsx'
import './index.css'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './hooks/useAuth.js'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { background: '#0f172a', color: '#fff', borderRadius: '16px', fontWeight: 600 },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
        }}
      />
    </AuthProvider>
  </BrowserRouter>,
)
