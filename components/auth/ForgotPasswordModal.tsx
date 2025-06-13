import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import AuthModalWrapper from './AuthModalWrapper';
import Button from '../ui/Button';
import { Mail, Send, LogIn, LoaderCircle, AlertCircle, CheckCircle2 } from 'lucide-react'; // Added LoaderCircle, AlertCircle, CheckCircle2
import { supabase } from '../../utils/supabaseClient'; // Adjusted path

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose
}) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; content: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://machon.onrender.com/update-password', // Or your production URL + /update-password
    });

    setLoading(false);

    if (error) {
      // This might catch issues like network errors, or specific Supabase errors if they decide to return one for certain cases.
      setMessage({ type: 'error', content: t('auth.forgotPassword.errorSendingLink', `שגיאה בשליחת קישור לאיפוס סיסמה: ${error.message}`, { error: error.message }) });
    } else {
      // Generic success message to prevent account enumeration
      setMessage({
        type: 'success',
        content: t('auth.forgotPassword.successLinkSent', "אם קיים חשבון עם אימייל זה, נשלח אליך קישור לאיפוס סיסמה.")
      });
      setEmail(''); // Clear the email field
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <AuthModalWrapper isOpen={isOpen} onClose={onClose} title={t('auth.forgotPassword.title', "איפוס סיסמה")}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Feedback Message */}
          {message && (
            <div className={`p-3 rounded-md text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200' : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200'}`}>
              {message.type === 'success' && <CheckCircle2 size={18} />}
              {message.type === 'error' && <AlertCircle size={18} />}
              {message.content}
            </div>
          )}

          {!message || message.type === 'error' ? ( // Only show form if no success message or if there's an error
            <>
              <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                {t('auth.forgotPassword.instructions', "הזן את כתובת האימייל שלך ונשלח לך קישור לאיפוס הסיסמה.")}
              </p>

              <div>
                <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('auth.forgotPassword.emailLabel', 'כתובת אימייל')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="reset-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-light sm:text-sm bg-gray-50 dark:bg-secondary-dark text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder={t('auth.forgotPassword.emailPlaceholder', "you@example.com")}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                icon={loading ? <LoaderCircle size={18} className="animate-spin" /> : <Send size={18} />}
                iconPosition="leading"
                disabled={loading}
              >
                {loading ? t('auth.forgotPassword.loadingButton', 'שולח קישור...') : t('auth.forgotPassword.submitButton', 'שלח קישור איפוס')}
              </Button>
            </>
          ) : null}

          <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
            {message && message.type === 'success' ? t('auth.forgotPassword.promptTryLoginAgain', 'רוצה לנסות להתחבר שוב?') : t('auth.forgotPassword.promptRememberedPassword', 'נזכרת בסיסמה?')}
            {' '}
            <Button
              as="button"
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="font-medium !p-0 !shadow-none !text-primary dark:!text-primary-light hover:!underline"
              icon={<LogIn size={16} />}
              iconPosition="leading"
              disabled={loading && message?.type !== 'success'} // Allow closing after success
            >
              {t('auth.forgotPassword.backToLoginLink', "חזור להתחברות")}
            </Button>
          </p>
        </form>
      </motion.div>
    </AuthModalWrapper>
  );
};

export default ForgotPasswordModal;
