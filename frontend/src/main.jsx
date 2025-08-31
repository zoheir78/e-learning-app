import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// Import main App and AuthProvider
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext';

// Import global styles
import "./styles/main.css";

// Find root element and render app
const root = createRoot(document.getElementById('root'));

root.render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);