import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { X, UserCircle, Mail, LogOut, Save, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
// Assuming Button and AuthModalWrapper exist. If not, these would need to be created or replaced.
// For now, let's assume AuthModalWrapper provides a structure like:
// <AuthModalWrapper isOpen={isOpen} onClose={onClose} title="Some Title"> ...modal content... </AuthModalWrapper>
// And Button is a styled button component.
import Button from '../ui/Button';
import AuthModalWrapper from '../auth/AuthModalWrapper'; // Assuming this path and component

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { t, i18n } = useTranslation(); // Added i18n instance
  const { user, profile, logout: authLogout, session } = useAuth(); // Renamed logout to authLogout

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; content: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (profile) {
        setFirstName(profile.firstName || '');
        setLastName(profile.lastName || '');
      } else {
        // Reset if modal is opened but profile is somehow null/undefined
        setFirstName('');
        setLastName('');
      }
      setMessage(null); // Clear message when modal opens
    }
  }, [profile, isOpen]);

  const handleClose = () => {
    setMessage(null);
    onClose();
  };

  const handleLogout = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      await authLogout();
      handleClose(); // Close modal on successful logout
    } catch (error: any) {
      setMessage({ type: 'error', content: error.message || t('profileModal.errorLogoutFailed', 'התנתקות נכשלה. נסה שנית.') });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!user) {
      setMessage({ type: 'error', content: t('profileModal.errorNotAuthenticated', 'משתמש לא מאומת. לא ניתן לשמור שינויים.') });
      return;
    }
    if (!firstName.trim() || !lastName.trim()) {
      setMessage({ type: 'error', content: t('profileModal.errorNameRequired', 'שם פרטי ושם משפחה נדרשים.') });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    const updatedUserData = {
      data: { // Supabase user_metadata is under 'data'
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
      }
    };

    const { error } = await supabase.auth.updateUser(updatedUserData);

    setIsLoading(false);

    if (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', content: t('profileModal.errorUpdateFailed', `שגיאה בעדכון פרופיל: ${error.message}`, { message: error.message }) });
    } else {
      setMessage({ type: 'success', content: t('profileModal.successProfileUpdated', 'פרופיל עודכן בהצלחה!') });
      // AuthContext should pick up onUserChanged event and update profile.
      // Optionally, close after a delay:
      // setTimeout(() => handleClose(), 2000);
    }
  };

  if (!isOpen) {
    return null;
  }

  // Fallback basic modal structure if AuthModalWrapper is not available or does not work as expected.
  // This is a simplified version. A real AuthModalWrapper would be more robust.
  const FallbackModalWrapper: React.FC<{ title: string; children: React.ReactNode; onCloseProp: () => void }> = ({ title, children, onCloseProp }) => (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex justify-center items-center p-4"
          onClick={onCloseProp} // Close on overlay click
          dir="rtl"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2, ease: "circOut" }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6 sm:p-8 relative"
            onClick={(e) => e.stopPropagation()} // Prevent close when clicking inside modal
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl sm:text-2xl font-semibold text-primary dark:text-sky-400">{title}</h3>
              <button
                onClick={onCloseProp}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-300 dark:hover:text-slate-100 transition-colors p-1 rounded-full"
                aria-label={t('profileModal.fallbackCloseAriaLabel', "Close modal")}
              >
                <X size={24} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Determine which wrapper to use. Prioritize AuthModalWrapper if it's meant to exist.
  // For development, assuming AuthModalWrapper might not be ready, so providing a fallback.
  const EffectiveModalWrapper = AuthModalWrapper || FallbackModalWrapper;


  return (
    <EffectiveModalWrapper title={t('profileModal.title', "פרופיל משתמש")} isOpen={isOpen} onClose={handleClose}>
      <div className="space-y-6 text-slate-700 dark:text-slate-300">
        {/* Display Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3 rounded-md text-sm flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700'
                : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700'
            }`}
          >
            {message.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
            <span>{message.content}</span>
          </motion.div>
        )}

        {/* User Information Section */}
        <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
          <div className="flex items-center gap-3">
            <UserCircle size={22} className="text-primary dark:text-sky-400" />
            <span className="font-medium">{profile?.fullName || t('profileModal.loadingName', 'טוען שם...')}</span>
          </div>
          <div className="flex items-center gap-3">
            <Mail size={20} className="text-slate-500 dark:text-slate-400" />
            <span className="text-sm text-slate-600 dark:text-slate-300">{user?.email || t('profileModal.loadingEmail', 'טוען אימייל...')}</span>
          </div>
        </div>

        {/* Editable Fields Section */}
        <div className="space-y-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              {t('profileModal.firstNameLabel', 'שם פרטי')}
            </label>
            <input
              type="text"
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary dark:focus:ring-sky-500 dark:bg-slate-700 dark:text-white shadow-sm text-sm sm:text-base transition-colors"
              placeholder={t('profileModal.firstNamePlaceholder', 'הקלד שם פרטי')}
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              {t('profileModal.lastNameLabel', 'שם משפחה')}
            </label>
            <input
              type="text"
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary dark:focus:ring-sky-500 dark:bg-slate-700 dark:text-white shadow-sm text-sm sm:text-base transition-colors"
              placeholder={t('profileModal.lastNamePlaceholder', 'הקלד שם משפחה')}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Action Buttons Section */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-700 space-y-3">
          <div className="sm:flex sm:flex-row-reverse sm:justify-between sm:items-center">
            <Button
              onClick={handleSaveChanges}
              disabled={isLoading || !firstName.trim() || !lastName.trim()}
              className="w-full sm:w-auto !bg-primary hover:!bg-primary-dark dark:!bg-sky-500 dark:hover:!bg-sky-600 text-white mb-3 sm:mb-0"
            >
              {isLoading && <Loader2 size={18} className="animate-spin ml-2" />}
              {isLoading ? t('profileModal.savingButton', 'שומר...') : t('profileModal.saveChangesButton', 'שמור שינויים')}
              {!isLoading && <Save size={18} className="ml-2" />}
            </Button>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => { /* Language switch functionality to be added */ }}
                variant="outline"
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                {t(i18n.language === 'en' ? 'profileModal.switchToHebrew' : 'profileModal.switchToEnglish')}
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                disabled={isLoading}
                className="w-full sm:w-auto !border-red-500 !text-red-500 hover:!bg-red-50 dark:hover:!bg-red-900/30 dark:!border-red-600 dark:!text-red-400"
              >
                {isLoading && session ? <Loader2 size={18} className="animate-spin ml-2" /> : <LogOut size={18} className="ml-2" /> }
                {t('profileModal.logoutButton', 'התנתקות')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </EffectiveModalWrapper>
  );
};

export default ProfileModal;
