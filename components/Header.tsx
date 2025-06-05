
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { APP_NAME, NAVIGATION_ITEMS } from '../constants';
import { NavItem } from '../types';
import DarkModeToggle from './DarkModeToggle';
import { Menu, X, ExternalLink as ExternalLinkIcon, BookOpenCheck } from 'lucide-react'; // Added BookOpenCheck
import { motion, AnimatePresence } from 'framer-motion';

const Header: React.FC = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        handleScroll(); // Set initial scroll state
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);


    const NavLinkContent: React.FC<{ item: NavItem; mobile?: boolean }> = ({ item, mobile }) => {
        const MainIconComponent = item.icon; // Main icon defined in constants
        return (
            // Ensure content within the span starts from the right (start in RTL)
            // The parent <a> (NavLink) handles overall alignment like text-right for mobile.
            <span className={`flex items-center justify-start ${mobile ? 'w-full' : ''}`}>
                {item.label} {/* Text first */}

                {/* Main functional/decorative icon, appears to the left of the text */}
                {MainIconComponent && !item.isButton && (
                    <MainIconComponent
                        size={mobile ? 22 : 18}
                        className={`opacity-70 group-hover:opacity-100 ${mobile ? 'ms-3' : 'ms-2'}`} // margin-start (to its right in RTL, creating space between text and icon)
                    />
                )}

                {/* ExternalLinkIcon, specifically for external links, appears furthest to the left */}
                {item.external && (
                    <ExternalLinkIcon
                        size={mobile ? 18 : 16}
                        className={`opacity-70 group-hover:opacity-100 ${MainIconComponent && !item.isButton ? 'ms-1.5' : 'ms-2'}`} // margin-start (to its right in RTL), adjust spacing based on MainIcon's presence
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

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out
                  ${isScrolled || isMobileMenuOpen ? 'bg-white/95 dark:bg-secondary-dark/95 backdrop-blur-md shadow-lg' : 'bg-transparent'}`}
        >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20 sm:h-24">
                    <Link to="/" className="flex items-center space-s-2 rtl:space-s-reverse focus:outline-none focus:ring-2 focus:ring-primary rounded-md p-1 -m-1 group">
                        <BookOpenCheck
                            size={32}
                            className="text-primary dark:text-primary-light transition-all duration-300 group-hover:text-primary-dark dark:group-hover:text-primary group-hover:scale-105"
                            strokeWidth={2}
                        />
                        <span className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white ms-2 group-hover:text-primary dark:group-hover:text-primary-light transition-colors duration-300">{APP_NAME}</span>
                    </Link>

                    <nav className="hidden lg:flex items-center space-s-1 rtl:space-s-reverse">
                        {NAVIGATION_ITEMS.map((item) => (
                            <div key={item.label} className="ms-3 rtl:me-3">
                                <NavLink item={item} />
                            </div>
                        ))}
                        <div className="ms-4 rtl:me-4">
                            <DarkModeToggle />
                        </div>
                    </nav>

                    <div className="lg:hidden flex items-center">
                        <DarkModeToggle />
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="ms-2 p-2.5 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                            aria-label={isMobileMenuOpen ? "סגור תפריט" : "פתח תפריט"}
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
                                <NavLink key={item.label} item={item} mobile />
                            ))}
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
};

export default Header;
