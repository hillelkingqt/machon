import React, { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react'; // Using lucide-react for the close icon

interface AuthModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title: string;
}

// Refined modal variants for a smoother scale and opacity animation
const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

// Backdrop variants remain for a simple fade
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

// Custom transition for a more polished feel
const modalTransition = {
  duration: 0.3, // Slightly faster can also feel more responsive
  ease: [0.22, 1, 0.36, 1] // A common "quint" easing out function
};

const backdropTransition = {
  duration: 0.25 // Slightly faster backdrop fade
};

const AuthModalWrapper: React.FC<AuthModalWrapperProps> = ({ isOpen, onClose, children, title }) => {
  const { t } = useTranslation();
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="backdrop" // Added key for AnimatePresence
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[999] p-4" // Increased backdrop opacity
          onClick={onClose}
          transition={backdropTransition}
        >
          <motion.div
            key="modal" // Added key for AnimatePresence
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-white dark:bg-secondary-dark rounded-xl shadow-2xl w-full max-w-md relative"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
            transition={modalTransition} // Using refined transition
          >
            <div className="p-6 sm:p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{title}</h2> {/* Added dark mode text color */}
                <button
                  onClick={onClose}
                  className="p-1 rounded-full text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label={t('auth.closeModalAriaLabel', 'Close modal')}
                >
                  <X size={24} />
                </button>
              </div>
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthModalWrapper;
