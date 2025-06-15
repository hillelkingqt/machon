import React from 'react';

const LearningSpacePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl font-extrabold text-primary dark:text-sky-400 sm:text-5xl lg:text-6xl mb-6">
          ברוכים הבאים למקום הלימוד!
        </h1>
        <p className="text-xl text-slate-700 dark:text-slate-300 leading-relaxed">
          תוכן מרגש יגיע לכאן בקרוב. אנו עובדים במרץ כדי להביא לכם חווית למידה ייחודית ואיכותית.
        </p>
        <p className="mt-4 text-md text-slate-600 dark:text-slate-400">
          בנתיים, אתם מוזמנים לחקור את שאר האתר שלנו.
        </p>
      </div>
    </div>
  );
};

export default LearningSpacePage;
