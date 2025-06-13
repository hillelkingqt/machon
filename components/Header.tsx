import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { APP_NAME, NAVIGATION_ITEMS } from '../constants';
import { NavItem } from '../types';
import DarkModeToggle from './DarkModeToggle';
// LogOutIcon removed, UserCircle is used
import { Menu, X, ExternalLink as ExternalLinkIcon, BookOpenCheck, LogIn as LogInIcon, UserCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './ui/Button';
import LoginModal from './auth/LoginModal';
import SignupModal from './auth/SignupModal';
import ForgotPasswordModal from './auth/ForgotPasswordModal';
import { useAuth } from '../contexts/AuthContext';
import { ProfileModal } from './profile'; // Step 1: Import ProfileModal

const Header: React.FC = () => {
    const { t } = useTranslation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false); // Step 2: Add state for modal visibility
    const [isScrolled, setIsScrolled] = useState(false);
    const location = useLocation();
    const { user, profile, logout, loadingInitial } = useAuth(); // Consume AuthContext

    const [activeModal, setActiveModal] = useState<'login' | 'signup' | 'forgotPassword' | null>(null);
    const [loginPrefill, setLoginPrefill] = useState<{email?: string; password?: string} | null>(null);

    const openLoginModal = (email?: string, password?: string) => {
        if (email || password) {
            setLoginPrefill({ email, password });
        } else {
            setLoginPrefill(null);
        }
        setActiveModal('login');
    };
    const openSignupModal = () => setActiveModal('signup');
    const openForgotPasswordModal = () => setActiveModal('forgotPassword');
    const closeAuthModal = () => {
        setActiveModal(null);
        setLoginPrefill(null);
    };

    // Step 2: Helper functions for ProfileModal
    const openProfileModal = () => setIsProfileModalOpen(true);
    const closeProfileModal = () => setIsProfileModalOpen(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setIsMobileMenuOpen(false);
        // If user logs in or logs out, and a modal was open, close it.
        if (user && (activeModal === 'login' || activeModal === 'signup')) {
            closeAuthModal();
        }
        if (!user && activeModal !== null) {
            // If user logs out and a modal is open (e.g. forgot password), it might be desired to keep it or close it.
            // For now, let's close any auth modal on logout for simplicity.
            // closeAuthModal(); // This might be too aggressive if they opened forgot password then logged out elsewhere.
        }
    }, [location.pathname, user]); // Added user to dependency array

    // const handleLogout = async () => { // Removed as logout is now in ProfileModal
    //     await logout();
    //     closeAuthModal();
    // };

    // Removed commented out handleLogout function for cleaner diff
    const NavLinkContent: React.FC<{ item: NavItem; mobile?: boolean }> = ({ item, mobile }) => {
        const MainIconComponent = item.icon;
        return (
            <span className={`flex items-center justify-start ${mobile ? 'w-full' : ''}`}>
                {t(item.labelKey, item.defaultLabel)} {/* Use labelKey and defaultLabel */}
                {MainIconComponent && !item.isButton && (
                    <MainIconComponent
                        size={mobile ? 22 : 18}
                        className={`opacity-70 group-hover:opacity-100 ${mobile ? 'ms-3' : 'ms-2'}`}
                    />
                )}
                {item.external && (
                    <ExternalLinkIcon
                        size={mobile ? 18 : 16}
                        className={`opacity-70 group-hover:opacity-100 ${MainIconComponent && !item.isButton ? 'ms-1.5' : 'ms-2'}`}
                    />
                )}
            </span>
        );
    };

    const NavLink: React.FC<{ item: NavItem; mobile?: boolean }> = ({ item, mobile }) => {
        const commonClasses = `
      transition-colors duration-300 font-medium group
      ${mobile ? 'block py-3.5 px-4 text-xl w-full text-right' : 'px-3 py-2 text-base lg:text-lg'}
    `;
        const buttonClasses = `
      px-5 py-2.5 rounded-lg text-white transition-all duration-300 ease-in-out
      bg-primary hover:bg-primary-dark shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95
      dark:bg-primary dark:hover:bg-primary-light dark:text-secondary-dark font-semibold text-base
    `;
        const textLinkClasses = `
      text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light relative
      ${mobile ? '' : 'after:content-[""] after:absolute after:bottom-0 after:right-0 after:w-0 after:h-0.5 after:bg-primary dark:after:bg-primary-light after:transition-all after:duration-300 group-hover:after:w-full'}
    `;

        if (item.external || item.href.startsWith('http')) {
            return (
                <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${commonClasses} ${item.isButton ? buttonClasses : textLinkClasses}`}
                >
                    <NavLinkContent item={item} mobile={mobile} />
                </a>
            );
        }

        return (
            <Link
                to={item.href}
                className={`${commonClasses} ${item.isButton ? buttonClasses : textLinkClasses}`}
            >
                <NavLinkContent item={item} mobile={mobile} />
            </Link>
        );
    };

    const AuthButtonDesktop: React.FC = () => {
        if (loadingInitial) {
            return <Button variant="outline" size="md" disabled icon={<Loader2 size={18} className="animate-spin" />}>{t('header.loading', 'טוען...')}</Button>;
        }
        if (user) {
            return (
                <div className="flex items-center gap-2">
                    {profile?.firstName && <span className="text-sm text-gray-700 dark:text-gray-300 hidden sm:inline">{t('header.greeting', 'שלום, {{name}}', { name: profile.firstName })}</span>}
                    <Button onClick={openProfileModal} variant="outline" size="md" icon={<UserCircle size={18} />}>
                        {t('header.profile', 'פרופיל')}
                    </Button>
                </div>
            );
        }
        return (
            <Button onClick={() => openLoginModal()} variant="outline" size="md" icon={<LogInIcon size={18} />}>
                {t('header.login', 'התחברות')}
            </Button>
        );
    };

    const AuthButtonMobile: React.FC = () => {
        if (loadingInitial) {
            return <Button variant="ghost" size="sm" className="!px-2 !py-1.5 me-1" disabled icon={<Loader2 size={22} className="animate-spin" />}><span className="sr-only">{t('header.loading', 'טוען')}</span></Button>;
        }
        if (user) {
            return (
                <Button onClick={openProfileModal} variant="ghost" size="sm" className="!px-2 !py-1.5 me-1" icon={<UserCircle size={22} />}>
                    <span className="sr-only">{t('header.profile', 'פרופיל')}</span>
                </Button>
            );
        }
        return (
            <Button onClick={() => openLoginModal()} variant="ghost" size="sm" className="!px-2 !py-1.5 me-1" icon={<LogInIcon size={22} />}>
                <span className="sr-only">{t('header.login', 'התחברות')}</span>
            </Button>
        );
    };


    return (
        <>
            <header
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out
                      ${isScrolled || isMobileMenuOpen ? 'bg-white/95 dark:bg-secondary-dark/95 backdrop-blur-md shadow-lg' : 'bg-transparent'}`}
            >
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20 sm:h-24">
                        <div className="flex items-center">
                            <Link to="/" className="flex items-center space-s-2 rtl:space-s-reverse focus:outline-none focus:ring-2 focus:ring-primary rounded-md p-1 -m-1 group">
                                <BookOpenCheck
                                    size={32}
                                    className="text-primary dark:text-primary-light transition-all duration-300 group-hover:text-primary-dark dark:group-hover:text-primary group-hover:scale-105"
                                    strokeWidth={2}
                                />
                                <span className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white ms-2 group-hover:text-primary dark:group-hover:text-primary-light transition-colors duration-300">{t('appName', APP_NAME)}</span>
                            </Link>
                            <div className="hidden lg:flex ms-6">
                                <AuthButtonDesktop />
                            </div>
                        </div>

                        <nav className="hidden lg:flex items-center space-s-1 rtl:space-s-reverse">
                            {NAVIGATION_ITEMS.map((item) => (
                                <div key={item.labelKey} className="ms-3 rtl:me-3"> {/* Changed key to item.labelKey */}
                                    <NavLink item={item} />
                                </div>
                            ))}
                            <div className="ms-4 rtl:me-4">
                                <DarkModeToggle />
                            </div>
                        </nav>

                        <div className="lg:hidden flex items-center">
                            <AuthButtonMobile />
                            <DarkModeToggle />
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="ms-2 p-2.5 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                                aria-label={isMobileMenuOpen ? t('header.closeMenu', "סגור תפריט") : t('header.openMenu', "פתח תפריט")}
                                aria-expanded={isMobileMenuOpen}
                                aria-controls="mobile-menu"
                            >
                                {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                            </button>
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            id="mobile-menu"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="lg:hidden bg-white dark:bg-secondary-dark shadow-2xl absolute top-full left-0 right-0 overflow-y-auto max-h-[calc(100vh-5rem)] border-t border-gray-200 dark:border-gray-700"
                        >
                            <nav className="flex flex-col px-2 pt-3 pb-5 space-y-1.5">
                                {NAVIGATION_ITEMS.map((item) => (
                                    <NavLink key={item.labelKey} item={item} mobile /> {/* Changed key to item.labelKey */}
                                ))}
                                {/* Example of adding auth button to mobile menu if not in toolbar
                                <div className="px-2 pt-2 border-t border-gray-200 dark:border-gray-700 mt-2">
                                    {user ? (
                                        <Button onClick={handleLogout} variant="danger" size="lg" className="w-full" icon={<LogOutIcon />}> {/* handleLogout would need t() if text is dynamic */}
                                            {t('header.logout', 'התנתק')} ({profile?.firstName || user.email})
                                        </Button>
                                    ) : (
                                        <Button onClick={openLoginModal} variant="primary" size="lg" className="w-full" icon={<LogInIcon />}>
                                            {t('header.loginSignup', 'התחברות / הרשמה')}
                                        </Button>
                                    )}
                                </div>
                                */}
                            </nav>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            <LoginModal
                isOpen={activeModal === 'login'}
                onClose={closeAuthModal}
                onSwitchToSignup={openSignupModal}
                onSwitchToForgotPassword={openForgotPasswordModal}
                prefillEmail={loginPrefill?.email}
                prefillPassword={loginPrefill?.password}
            />
            <SignupModal
                isOpen={activeModal === 'signup'}
                onClose={closeAuthModal}
                onSwitchToLogin={openLoginModal}
            />
            <ForgotPasswordModal
                isOpen={activeModal === 'forgotPassword'}
                onClose={closeAuthModal}
            />

            <ProfileModal
                isOpen={isProfileModalOpen}
                onClose={closeProfileModal}
            />
        </>
    );
};

export default Header;
