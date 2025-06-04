
import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer'; // Ensured this path is relative
import HomePage from './pages/HomePage';
import { DarkModeContext, DarkMode } from './contexts/DarkModeContext';

const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState<DarkMode>(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('darkMode');
      return savedMode === 'dark';
    }
    return false; // Default to light mode or handle SSR appropriately
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (darkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('darkMode', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('darkMode', 'light');
      }
    }
  }, [darkMode]);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prevMode => !prevMode);
  }, []);

  return (
    <DarkModeContext.Provider value={{ darkMode, toggleDarkMode }}>
      <HashRouter>
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-secondary transition-colors duration-300">
          <Header />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<HomePage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </HashRouter>
    </DarkModeContext.Provider>
  );
};

export default App;
