import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AuthModalWrapper from './AuthModalWrapper';
import Button from '../ui/Button';
import { LockKeyhole, Mail, LogIn, LoaderCircle, AlertCircle, CheckCircle2 } from 'lucide-react'; // Added CheckCircle2
import { supabase } from '../../utils/supabaseClient';

// A simple Google icon SVG component (remains unchanged)
const GoogleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56,12.25C22.56,11.47 22.49,10.72 22.36,10H12V14.25H17.91C17.64,15.75 16.83,17.04 15.56,17.91V20.62H19.19C21.36,18.75 22.56,15.75 22.56,12.25Z" fill="#4285F4"/>
        <path d="M12,23C14.97,23 17.47,22 19.19,20.62L15.56,17.91C14.56,18.59 13.38,19 12,19C9.25,19 6.88,17.09 6,14.62H2.25V17.41C3.97,20.78 7.75,23 12,23Z" fill="#34A853"/>
        <path d="M6,14.62C5.75,13.88 5.63,13.09 5.63,12.25C5.63,11.41 5.75,10.62 6,9.88V7.12H2.25C1.5,8.62 1,10.38 1,12.25C1,14.12 1.5,15.88 2.25,17.41L6,14.62Z" fill="#FBBC05"/>
        <path d="M12,5.5C13.75,5.5 15.13,6.12 15.94,6.88L19.25,3.62C17.47,1.91 14.97,1 12,1C7.75,1 3.97,3.22 2.25,6.62L6,9.38C6.88,6.91 9.25,5.5 12,5.5Z" fill="#EA4335"/>
    </svg>
);

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignup: () => void;
  onSwitchToForgotPassword: () => void;
  prefillEmail?: string;
  prefillPassword?: string;
}

const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSwitchToSignup,
  onSwitchToForgotPassword,
  prefillEmail,
  prefillPassword
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadingEmailPass, setLoadingEmailPass] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; content: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (prefillEmail) setEmail(prefillEmail);
      if (prefillPassword) setPassword(prefillPassword);
    }
  }, [isOpen, prefillEmail, prefillPassword]);

  const anyLoading = loadingEmailPass || loadingGoogle;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingEmailPass(true);
    setMessage(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    setLoadingEmailPass(false);

    if (error) {
      setMessage({ type: 'error', content: "אימייל או סיסמה שגויים. נסה שנית." });
    } else if (data.user) {
      setMessage({ type: 'success', content: "התחברת בהצלחה!" });
      setEmail('');
      setPassword('');
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      setMessage({ type: 'error', content: "אירעה שגיאה לא צפויה. נסה שנית." });
    }
  };

  const handleGoogleLogin = async () => {
    setLoadingGoogle(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      }
    });

    if (error) {
      setMessage({ type: 'error', content: `שגיאה בהתחברות עם גוגל: ${error.message}` });
      setLoadingGoogle(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <AuthModalWrapper isOpen={isOpen} onClose={onClose} title="התחברות">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {message && (
            <div className={`p-3 rounded-md text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200' : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200'}`}>
              {message.type === 'success' && <CheckCircle2 size={18} />}
              {message.type === 'error' && <AlertCircle size={18} />}
              {message.content}
            </div>
          )}

          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              כתובת אימייל
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                id="login-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-light sm:text-sm bg-gray-50 dark:bg-secondary-dark text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="you@example.com"
                required
                disabled={anyLoading}
              />
            </div>
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              סיסמה
            </label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockKeyhole className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="password"
                    id="login-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-light sm:text-sm bg-gray-50 dark:bg-secondary-dark text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="••••••••"
                    required
                    disabled={anyLoading}
                />
            </div>
          </div>

          <div className="text-sm text-right">
            <Button
              as="button"
              type="button"
              variant="ghost"
              size="sm"
              onClick={onSwitchToForgotPassword}
              className="font-medium !p-0 !shadow-none !text-primary dark:!text-primary-light hover:!underline"
              disabled={anyLoading}
            >
              שכחת סיסמה?
            </Button>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            icon={loadingEmailPass ? <LoaderCircle size={18} className="animate-spin" /> : <LogIn size={18}/>}
            iconPosition="leading"
            disabled={anyLoading}
          >
            {loadingEmailPass ? 'מתחבר...' : 'התחבר'}
          </Button>

          <div className="relative flex py-3 items-center">
            <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
            <span className="flex-shrink mx-4 text-gray-400 dark:text-gray-500 text-sm">או המשך עם</span>
            <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
          </div>

          <Button
            type="button"
            variant="light"
            size="lg"
            onClick={handleGoogleLogin}
            className="w-full"
            icon={loadingGoogle ? <LoaderCircle size={18} className="animate-spin" /> : <GoogleIcon className="w-5 h-5" />}
            iconPosition="leading"
            disabled={anyLoading}
          >
            {loadingGoogle ? 'מתחבר עם גוגל...' : 'התחבר עם גוגל'}
          </Button>

          <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
            אין לך חשבון?{' '}
            <Button
              as="button"
              type="button"
              variant="ghost"
              size="sm"
              onClick={onSwitchToSignup}
              className="font-medium !p-0 !shadow-none !text-primary dark:!text-primary-light hover:!underline"
              disabled={anyLoading}
            >
              צור חשבון
            </Button>
          </p>
        </form>
      </motion.div>
    </AuthModalWrapper>
  );
};

export default LoginModal;
