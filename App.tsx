import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ChatWidget from './components/ChatWidget';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import CoursesPage from './pages/CoursesPage';
import ArticlesPage from './pages/ArticlesPage';
import ShopPage from './pages/ShopPage';
import ContactPage from './pages/ContactPage';
import FullArticlePage from './pages/FullArticlePage';
import FAQPage from './pages/FAQPage';
import AdminPage from './pages/AdminPage';
import { DarkModeContext, DarkMode } from './contexts/DarkModeContext';
import { AuthProvider } from './contexts/AuthContext'; // Import AuthProvider

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
            <AuthProvider> {/* Wrap HashRouter with AuthProvider */}
                <HashRouter>
                    <ScrollToTop />
                    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
                        <Header />
                        <main className="flex-grow pt-20 sm:pt-24"> {/* Padding top for fixed header */}
                            <Routes>
                                <Route path="/" element={<HomePage />} />
                                <Route path="/about" element={<AboutPage />} />
                                <Route path="/courses" element={<CoursesPage />} />
                                <Route path="/articles" element={<ArticlesPage />} />
                                <Route path="/article/:articleId" element={<FullArticlePage />} />
                                <Route path="/shop" element={<ShopPage />} />
                                <Route path="/contact" element={<ContactPage />} />
                                <Route path="/faq" element={<FAQPage />} />
                                <Route path="/admin" element={<AdminPage />} />
                                {/* <Route path="*" element={<NotFoundPage />} /> */}
                            </Routes>
                        </main>
                        <Footer />
                        <ChatWidget />
                    </div>
                </HashRouter>
            </AuthProvider>
        </DarkModeContext.Provider>
    );
};

export default App;