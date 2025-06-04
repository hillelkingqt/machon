
import React, { useState, useEffect } from 'react';
import { LOGO_URL, APP_NAME, NAVIGATION_ITEMS } from '../constants';
import { NavItem } from '../types';
import DarkModeToggle from './DarkModeToggle';
import { Menu, X, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const section = document.getElementById(id.substring(1));
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  const NavLink: React.FC<{ item: NavItem; mobile?: boolean }> = ({ item, mobile }) => (
    <a
      href={item.href}
      onClick={(e) => {
        if (!item.external && item.href.startsWith('#')) {
          e.preventDefault();
          scrollToSection(item.href);
        }
        if (mobile) setIsMobileMenuOpen(false);
      }}
      target={item.external ? '_blank' : '_self'}
      rel={item.external ? 'noopener noreferrer' : ''}
      className={`
        ${item.isButton 
          ? `px-5 py-2.5 rounded-lg text-white transition-all duration-300 ease-in-out
             bg-primary hover:bg-primary-dark shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95
             dark:bg-primary dark:hover:bg-primary-light dark:text-secondary-dark font-semibold text-base`
          : `text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light 
             transition-colors duration-300 text-lg font-medium relative group
             ${mobile ? 'block py-3.5 px-4 text-xl w-full text-right' : 'px-3 py-2'}`} 
      `} // Added px-3 for non-button desktop links
    >
      <span className="flex items-center ${mobile ? 'justify-end' : ''}">
        {item.label}
        {item.external && <ExternalLink size={16} className="ms-2 opacity-70" />}
      </span>
      {!item.isButton && !mobile && (
        <span className="absolute bottom-0 right-0 w-0 h-0.5 bg-primary dark:bg-primary-light transition-all duration-300 group-hover:w-full"></span>
      )}
    </a>
  );

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out
                  ${isScrolled ? 'bg-white/90 dark:bg-secondary-dark/90 backdrop-blur-lg shadow-xl' : 'bg-transparent'}`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 sm:h-24">
          {/* Logo */}
          <a href="#hero" onClick={(e) => { e.preventDefault(); scrollToSection('#hero'); }} className="flex items-center space-s-3 rtl:space-s-reverse focus:outline-none focus:ring-2 focus:ring-primary rounded-md">
            <motion.img 
              src={LOGO_URL} 
              alt={APP_NAME} 
              className="h-10 sm:h-12 w-auto"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
            />
            <span className="hidden sm:block text-xl font-bold text-gray-800 dark:text-white animate-fade-in">{APP_NAME}</span>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center">
            {NAVIGATION_ITEMS.map((item, index) => (
              // Using explicit margin for robust spacing, ms-6 = 1.5rem, ms-8 = 2rem
              <div key={item.label} className={index > 0 || (index === 0 && NAVIGATION_ITEMS.length > 1 && !item.isButton) ? 'ms-6 rtl:me-6' : ''}>
                <NavLink item={item} />
              </div>
            ))}
            <div className="ms-6 rtl:me-6">
              <DarkModeToggle />
            </div>
          </nav>

          {/* Mobile Menu Button & Dark Mode Toggle */}
          <div className="lg:hidden flex items-center">
            <DarkModeToggle />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="ms-3 p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="פתח תפריט"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="lg:hidden bg-white dark:bg-secondary-dark shadow-2xl absolute top-full left-0 right-0 overflow-hidden border-t border-gray-200 dark:border-gray-700"
          >
            <nav className="flex flex-col px-4 pt-3 pb-4 space-y-2">
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
