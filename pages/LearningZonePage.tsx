import React from 'react';
import { Link } from 'react-router-dom';
import AnimatedDiv from '../components/ui/AnimatedDiv'; // Assuming this component is suitable for page animations
import { BookOpenCheck, Construction, Calculator } from 'lucide-react'; // Icons for courses

const LearningZonePage: React.FC = () => {
  // Placeholder for other courses - can be expanded later
  const otherCourses = [
    { id: 'course-placeholder-1', title: 'קורס הכנה לכיתה א\' (בקרוב)', description: 'כל מה שצריך לדעת למעבר חלק לכיתה הראשונה.', icon: Construction },
    { id: 'course-placeholder-2', title: 'פיתוח חשיבה לוגית (בקרוב)', description: 'כלים וטכניקות לחיזוק החשיבה האנליטית.', icon: Construction },
    { id: 'course-placeholder-3', title: 'אנגלית למתחילים (בקרוב)', description: 'צעדים ראשונים בעולם השפה האנגלית.', icon: Construction },
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
      <AnimatedDiv animation="fadeInUp">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-center text-primary dark:text-primary-light mb-6">
          אזור לימוד
        </h1>
        <p className="text-lg sm:text-xl text-center text-gray-700 dark:text-gray-300 mb-12 sm:mb-16 max-w-3xl mx-auto">
          ברוכים הבאים לאזור הלימוד של מכון אביב! כאן תמצאו מגוון קורסים ותכנים שנועדו להעשיר, ללמד ולפתח כישורים.
        </p>
      </AnimatedDiv>

      {/* Gifted Children Course Card/Link */}
      <AnimatedDiv animation="fadeInUp" delay={0.2}>
        <div className="bg-white dark:bg-secondary-dark shadow-xl rounded-lg p-6 sm:p-8 mb-12 sm:mb-16 transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-1">
          <div className="flex flex-col sm:flex-row items-center">
            <div className="flex-shrink-0 mb-6 sm:mb-0 sm:me-8">
              <BookOpenCheck size={64} className="text-secondary dark:text-secondary-light bg-primary dark:bg-primary-light p-3 rounded-full" />
            </div>
            <div className="flex-grow text-center sm:text-right">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
                מדריך מקיף למבחן איתור מחוננים בכיתה ב'
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                כל החומר, ההסברים והדוגמאות להכנה מיטבית למבחן האיתור לתלמידי כיתה ב'.
              </p>
              <Link
                to="/learning-zone/gifted-children-prep"
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary-dark dark:hover:bg-primary-light dark:text-secondary-dark shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 transition-all duration-300"
              >
                התחל ללמוד
                <ChevronRight className="ms-2 h-5 w-5 rtl:hidden" />
                 <ChevronLeft className="me-2 h-5 w-5 ltr:hidden" /> {/* For RTL, arrow on the other side */}
              </Link>
            </div>
          </div>
        </div>
      </AnimatedDiv>

      {/* Word Problems Course Card/Link */}
      <AnimatedDiv animation="fadeInUp" delay={0.3}> {/* Adjusted delay if needed */}
        <div className="bg-white dark:bg-secondary-dark shadow-xl rounded-lg p-6 sm:p-8 mb-12 sm:mb-16 transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-1">
          <div className="flex flex-col sm:flex-row items-center">
            <div className="flex-shrink-0 mb-6 sm:mb-0 sm:me-8">
              <Calculator size={64} className="text-secondary dark:text-secondary-light bg-primary dark:bg-primary-light p-3 rounded-full" />
            </div>
            <div className="flex-grow text-center sm:text-right">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
                תרגול בעיות מילוליות במתמטיקה
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                מאגר מקיף של בעיות מילוליות במתמטיקה, כולל הסברים, דוגמאות ופתרונות, לשיפור ההבנה והחשיבה המתמטית.
              </p>
              <Link
                to="/learning-zone/word-problems" // Link to the new page
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary-dark dark:hover:bg-primary-light dark:text-secondary-dark shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 transition-all duration-300"
              >
                התחל ללמוד
                <ChevronRight className="ms-2 h-5 w-5 rtl:hidden" />
                <ChevronLeft className="me-2 h-5 w-5 ltr:hidden" /> {/* For RTL, arrow on the other side */}
              </Link>
            </div>
          </div>
        </div>
      </AnimatedDiv>

      {/* Placeholder for other courses title */}
      <AnimatedDiv animation="fadeInUp" delay={0.4}>
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-800 dark:text-gray-200 mb-10 sm:mb-12">
          קורסים נוספים (בקרוב)
        </h2>
      </AnimatedDiv>

      {/* Placeholder for other courses */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
        {otherCourses.map((course, index) => (
          <AnimatedDiv key={course.id} animation="fadeInUp" delay={0.5 + index * 0.15}>
            <div className="bg-white dark:bg-secondary-dark shadow-lg rounded-lg p-6 flex flex-col items-center text-center transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1 h-full">
              <div className="p-4 bg-gray-100 dark:bg-slate-700 rounded-full mb-5">
                <course.icon size={40} className="text-primary dark:text-primary-light" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{course.title}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm flex-grow">{course.description}</p>
              <button
                disabled
                className="mt-6 w-full px-5 py-2.5 rounded-lg text-white transition-all duration-300 ease-in-out
                bg-gray-300 dark:bg-gray-600 font-semibold text-base cursor-not-allowed"
              >
                בקרוב...
              </button>
            </div>
          </AnimatedDiv>
        ))}
      </div>
    </div>
  );
};

export default LearningZonePage;

// Helper icon for ChevronRight/Left based on text direction
// This is a simplified approach. A more robust solution might involve a context or utility for LTR/RTL.
const ChevronLeft: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m15 18-6-6 6-6"/></svg>
);
const ChevronRight: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m9 18 6-6-6-6"/></svg>
);
