
import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom'; // Changed Switch to Routes
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import CoursesPage from './pages/CoursesPage';
import ArticlesPage from './pages/ArticlesPage';
import ShopPage from './pages/ShopPage';
import ContactPage from './pages/ContactPage';
import FullArticlePage from './pages/FullArticlePage'; // Import FullArticlePage
import FAQPage from './pages/FAQPage'; // Import FAQPage
import { DarkModeContext, DarkMode } from './contexts/DarkModeContext';

// Utility component to scroll to top on route change
const ScrollToTop: React.FC = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
};

const App: React.FC = () => {
    const [darkMode, setDarkMode] = useState<DarkMode>(() => {
        if (typeof window !== 'undefined') {
            const savedMode = localStorage.getItem('darkMode');
            if (savedMode === 'dark') return true;
            if (savedMode === 'light') return false;
            return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return false;
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
                <ScrollToTop />
                <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
                    <Header />
                    <main className="flex-grow pt-20 sm:pt-24"> {/* Padding top for fixed header */}
                        <Routes> {/* Changed Switch to Routes */}
                            <Route path="/" element={<HomePage />} /> {/* Changed component to element, removed exact */}
                            <Route path="/about" element={<AboutPage />} /> {/* Changed component to element */}
                            <Route path="/courses" element={<CoursesPage />} /> {/* Changed component to element */}
                            <Route path="/articles" element={<ArticlesPage />} /> {/* Changed component to element */}
                            <Route path="/article/:articleId" element={<FullArticlePage />} /> {/* Changed component to element */}
                            <Route path="/shop" element={<ShopPage />} /> {/* Changed component to element */}
                            <Route path="/contact" element={<ContactPage />} /> {/* Changed component to element */}
                            <Route path="/faq" element={<FAQPage />} /> {/* Changed component to element */}
                            {/* Add a fallback route for 404 if needed */}
                            {/* <Route path="*" element={<NotFoundPage />} /> */}
                        </Routes> {/* Changed Switch to Routes */}
                    </main>
                    <Footer />
                </div>
            </HashRouter>
        </DarkModeContext.Provider>
    );
};

export default App;