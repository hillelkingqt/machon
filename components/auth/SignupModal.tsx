import React, { useState } from 'react';
import { motion } from 'framer-motion';
import AuthModalWrapper from './AuthModalWrapper';
import Button from '../ui/Button';
import { User, Mail, LockKeyhole, UserPlus, LogIn, LoaderCircle, AlertCircle, CheckCircle2 } from 'lucide-react'; // Added AlertCircle, CheckCircle2
import { supabase } from '../../utils/supabaseClient';

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

const SignupModal: React.FC<SignupModalProps> = ({
  isOpen,
  onClose,
  onSwitchToLogin
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; content: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`.trim(),
        }
      }
    });

    setLoading(false);

    if (error) {
      setMessage({ type: 'error', content: `שגיאה ביצירת החשבון: ${error.message}` });
    } else if (data.user) {
      if (data.user.identities?.length === 0 || !data.session) {
         setMessage({ type: 'success', content: "חשבון נוצר בהצלחה! נשלח אליך מייל לאימות החשבון." });
      } else {
        setMessage({ type: 'success', content: "חשבון נוצר והתחברת בהצלחה!" });
      }
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
    } else {
      setMessage({ type: 'error', content: "אירעה שגיאה לא צפויה. נסה שנית." });
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <AuthModalWrapper isOpen={isOpen} onClose={onClose} title="יצירת חשבון">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {message && (
            <div className={`p-3 rounded-md text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200' : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200'}`}>
              {message.type === 'success' && <CheckCircle2 size={18} />}
              {message.type === 'error' && <AlertCircle size={18} />}
              {message.content}
            </div>
          )}

          <div>
            <label htmlFor="signup-firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              שם פרטי
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="signup-firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-light sm:text-sm bg-gray-50 dark:bg-secondary-dark text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="לדוגמה: משה"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label htmlFor="signup-lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              שם משפחה
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="signup-lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-light sm:text-sm bg-gray-50 dark:bg-secondary-dark text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="לדוגמה: כהן"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              כתובת אימייל
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                id="signup-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-light sm:text-sm bg-gray-50 dark:bg-secondary-dark text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="you@example.com"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              סיסמה
            </label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockKeyhole className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="password"
                    id="signup-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-light sm:text-sm bg-gray-50 dark:bg-secondary-dark text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="לפחות 8 תווים"
                    required
                    minLength={8}
                    disabled={loading}
                />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-2"
            icon={loading ? <LoaderCircle size={18} className="animate-spin" /> : <UserPlus size={18} />}
            iconPosition="leading"
            disabled={loading}
          >
            {loading ? 'יוצר חשבון...' : 'צור חשבון'}
          </Button>

          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            כבר יש לך חשבון?{' '}
            <Button
              as="button"
              type="button"
              variant="ghost"
              size="sm"
              onClick={onSwitchToLogin}
              className="font-medium !p-0 !shadow-none !text-primary dark:!text-primary-light hover:!underline"
              icon={<LogIn size={16} />}
              iconPosition="leading"
              disabled={loading}
            >
              התחבר
            </Button>
          </p>
        </form>
      </motion.div>
    </AuthModalWrapper>
  );
};

export default SignupModal;
