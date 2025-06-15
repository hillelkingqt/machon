import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { supabase } from './utils/supabaseClient'; // Import Supabase client
// import { useAuth } from './contexts/AuthContext'; // useAuth not directly used in App.tsx for block check
import BlockedUserPage from './components/BlockedUserPage'; // Import BlockedUserPage
import { Loader2, XCircle } from 'lucide-react'; // For loading indicator and error icon
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
const AdminPage = lazy(() => import('./pages/AdminPage'));
import { DarkModeContext, DarkMode } from './contexts/DarkModeContext';
import { fetchIpWithFallback } from './utils/ipUtils'; // Import the new IP fetching function
import { AuthProvider } from './contexts/AuthContext'; // Import AuthProvider
import { DataProvider } from './contexts/DataContext'; // Import DataProvider

// Utility component to scroll to top on route change
const ScrollToTop: React.FC = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
};

const App: React.FC = () => {
    const [isUserBlocked, setIsUserBlocked] = useState<boolean>(false);
    const [isLoadingBlockStatus, setIsLoadingBlockStatus] = useState<boolean>(true);
    const [blockCheckErrorOccurred, setBlockCheckErrorOccurred] = useState<boolean>(false); // New state for error handling

    // Dark mode state and effects
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

    useEffect(() => {
        const logAppLoad = async () => {
            try {
                const { error } = await supabase.functions.invoke('record-activity', {
                    body: { event: 'APP_LOADED' },
                });
                if (error) {
                    console.error('Error logging app load:', error);
                }
            } catch (error) {
                console.error('Error invoking record-activity function for app load:', error);
            }
        };

        logAppLoad();
    }, []); // Empty dependency array ensures this runs only once on mount

    const checkBlockStatus = useCallback(async () => {
            setIsLoadingBlockStatus(true);
            setBlockCheckErrorOccurred(false); // Reset error state at the beginning of a check
            try {
                // 1. Fetch IP using the new fallback mechanism
                let fetchedIp: string | null = null;
                try {
                    fetchedIp = await fetchIpWithFallback();
                    if (!fetchedIp) {
                        console.warn('App.tsx: IP address could not be fetched even with fallback.');
                        // Continue without IP, email check might still proceed
                    }
                } catch (e) {
                    // This catch is for unforeseen errors in fetchIpWithFallback itself, though it's designed to return null on failure.
                    console.error('App.tsx: Exception calling fetchIpWithFallback:', e);
                }

                // 2. Get Email (if user is logged in)
                // This effect runs outside of AuthContext's direct children that use useAuth(),
                // so we get session directly.
                const { data: { session } } = await supabase.auth.getSession();
                const currentUserEmail = session?.user?.email || null;

                if (!fetchedIp && !currentUserEmail) {
                    // Cannot determine identity for block check, assume not blocked for now
                    // Or, could be a stricter policy if IP is vital
                    setIsUserBlocked(false);
                    return;
                }

                // 3. Query blocked_items
                let query = supabase.from('blocked_items').select('id,type,value');
                const conditions: string[] = [];

                if (fetchedIp) {
                    conditions.push(`and(type.eq.IP,value.eq.${fetchedIp})`);
                }
                if (currentUserEmail) {
                    conditions.push(`and(type.eq.EMAIL,value.eq.${currentUserEmail})`);
                }

                if(conditions.length === 0) {
                    setIsUserBlocked(false); // No criteria to check against
                    return;
                }

                query = query.or(conditions.join(','));

                const { data: blockedData, error: blockError } = await query;

                if (blockError) {
                    console.error('Error checking block status:', blockError);
                    setBlockCheckErrorOccurred(true);
                    setIsUserBlocked(false); // Ensure user is not considered blocked on error
                    return;
                }

                if (blockedData && blockedData.length > 0) {
                    setIsUserBlocked(true);
                } else {
                    setIsUserBlocked(false);
                }

            } catch (error) {
                console.error('General error in checkBlockStatus:', error);
                setBlockCheckErrorOccurred(true);
                setIsUserBlocked(false); // Ensure user is not considered blocked on error
            } finally {
                setIsLoadingBlockStatus(false);
            }
    }, []); // Supabase client is stable, not needed in deps. fetchIpWithFallback is also stable.

    useEffect(() => {
        checkBlockStatus();
        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
            checkBlockStatus();
        });
        return () => subscription.unsubscribe();
    }, [checkBlockStatus]);

    if (isLoadingBlockStatus) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 p-4">
                <Loader2 size={48} className="text-primary dark:text-sky-400 animate-spin mb-4" />
                <p className="text-xl">Checking your status...</p>
            </div>
        );
    }

    // Render error page if block check failed
    if (blockCheckErrorOccurred) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 text-red-500 p-4 text-center">
                <XCircle size={48} className="mb-4" />
                <h1 className="text-2xl font-bold mb-2">Access Error</h1>
                <p className="text-lg">We encountered an issue determining your access status. Please try again later.</p>
            </div>
        );
    }

    if (isUserBlocked) {
        return <BlockedUserPage />;
    }

    return (
        <DarkModeContext.Provider value={{ darkMode, toggleDarkMode }}>
            <AuthProvider>
                <DataProvider> {/* Wrap HashRouter (and thus all routes) with DataProvider */}
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
                                    <Route
                                        path="/admin"
                                        element={
                                            <Suspense fallback={<div>Loading Admin...</div>}>
                                                <AdminPage />
                                            </Suspense>
                                        }
                                    />
                                    {/* <Route path="*" element={<NotFoundPage />} /> */}
                                </Routes>
                            </main>
                            <Footer />
                            <ChatWidget />
                        </div>
                    </HashRouter>
                </DataProvider>
            </AuthProvider>
        </DarkModeContext.Provider>
    );
};

export default App;
