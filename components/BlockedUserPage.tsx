import React from 'react';
import { ShieldAlert } from 'lucide-react'; // Or any other appropriate icon

const BlockedUserPage: React.FC = () => {
  return (
    <div dir="ltr" className="flex flex-col items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-4">
      <ShieldAlert size={64} className="text-red-500 mb-6" />
      <h1 className="text-3xl font-bold text-red-600 mb-3">Access Denied</h1>
      <p className="text-lg text-center mb-2">You have been blocked from accessing this site.</p>
      <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
        If you believe this is a mistake, please contact the site administrator.
      </p>
    </div>
  );
};

export default BlockedUserPage;
