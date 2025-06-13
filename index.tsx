
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // Assuming you have a global CSS file
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n'; // Your i18n configuration
import { DataProvider } from './contexts/DataContext'; // Assuming this is your DataProvider
import { AuthProvider } from './contexts/AuthContext'; // Assuming this is your AuthProvider
import { DarkModeProvider } from './contexts/DarkModeContext'; // Assuming this is your DarkModeProvider

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <DarkModeProvider>
        <AuthProvider>
          <DataProvider>
            <App />
          </DataProvider>
        </AuthProvider>
      </DarkModeProvider>
    </I18nextProvider>
  </React.StrictMode>
);
