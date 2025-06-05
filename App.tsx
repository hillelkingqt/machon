
import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Switch, Route, useLocation } from 'react-router-dom'; // Changed Routes to Switch
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
                        <Switch> {/* Changed Routes to Switch */}
                            <Route exact path="/" component={HomePage} /> {/* Changed element to component, added exact */}
                            <Route path="/about" component={AboutPage} /> {/* Changed element to component */}
                            <Route path="/courses" component={CoursesPage} /> {/* Changed element to component */}
                            <Route path="/articles" component={ArticlesPage} /> {/* Changed element to component */}
                            <Route path="/article/:articleId" component={FullArticlePage} /> {/* Changed element to component */}
                            <Route path="/shop" component={ShopPage} /> {/* Changed element to component */}
                            <Route path="/contact" component={ContactPage} /> {/* Changed element to component */}
                            <Route path="/faq" component={FAQPage} /> {/* Changed element to component */}
                            {/* Add a fallback route for 404 if needed */}
                            {/* <Route path="*" component={NotFoundPage />} /> */}
                        </Switch> {/* Changed Routes to Switch */}
                    </main>
                    <Footer />
                </div>
            </HashRouter>
        </DarkModeContext.Provider>
    );
};

export default App;
