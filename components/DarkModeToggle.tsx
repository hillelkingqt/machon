
import React from 'react';
import { useDarkMode } from '../hooks/useDarkMode';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

const DarkModeToggle: React.FC = () => {
  const { darkMode, toggleDarkMode } = useDarkMode();

  return (
    <motion.button
      onClick={toggleDarkMode}
      className="p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary transition-colors duration-300"
      aria-label={darkMode ? 'הפעל מצב אור' : 'הפעל מצב חושך'}
      whileHover={{ scale: 1.1, rotate: darkMode ? -15 : 15 }}
      whileTap={{ scale: 0.9 }}
    >
      {darkMode ? <Sun size={24} /> : <Moon size={24} />}
    </motion.button>
  );
};

export default DarkModeToggle;
