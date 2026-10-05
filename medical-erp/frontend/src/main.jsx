import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { UnitProvider } from './context/UnitContext';
import { ToastProvider } from './context/ToastContext';
import './i18n';
import './styles/index.scss';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <UnitProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </UnitProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
