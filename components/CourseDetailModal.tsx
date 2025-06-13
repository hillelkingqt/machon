
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Info } from 'lucide-react';
import { Course } from '../types';
import Button from './ui/Button';
import { formatCourseDetailedContentToHtml } from '../utils/courseContentParser';
// import { GENERAL_COURSE_INTRODUCTION, GENERAL_COURSE_CONCLUSION } from '../constants'; // Removed

interface CourseDetailModalProps {
  course: Course;
  onClose: () => void;
}

const CourseDetailModal: React.FC<CourseDetailModalProps> = ({ course, onClose }) => {
  const { t } = useTranslation();
  useEffect(() => {
    // Prevent background scroll when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const purchaseLink = course.links && course.links.length > 0 ? course.links[0].href : '#';
  
  const contentHtml = formatCourseDetailedContentToHtml(course.detailedContent || '');


  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 dark:bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="course-detail-title"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="bg-white dark:bg-slate-800 w-full max-w-3xl h-[90vh] max-h-[800px] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-slate-300 dark:border-slate-700"
          onClick={(e) => e.stopPropagation()} // Prevent closing modal when clicking inside
        >
          {/* Header */}
          <header className={`flex items-center justify-between p-5 sm:p-6 border-b border-slate-200 dark:border-slate-700/70 sticky top-0 z-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md`}>
            <div className="flex items-center">
                {course.icon && <course.icon className="h-7 w-7 me-3 text-primary dark:text-primary-light" />}
                <h2 id="course-detail-title" className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">
                    {course.title}
                </h2>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="p-2 rounded-full text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 !shadow-none"
              aria-label={t('courseDetailModal.closeButtonAriaLabel', "סגור חלון")}
            >
              <X size={24} />
            </Button>
          </header>

          {/* Content Body */}
          <div className="flex-grow overflow-y-auto p-5 sm:p-6 md:p-8 prose-sm sm:prose-base dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
            style={{ direction: 'rtl' }} // Ensure RTL for the content
          >
            {/* Content is injected by dangerouslySetInnerHTML */}
          </div>
          
          {/* Footer with Purchase Button */}
          <footer className="p-5 sm:p-6 border-t border-slate-200 dark:border-slate-700/70 bg-slate-50 dark:bg-slate-800/50 sticky bottom-0 z-10 backdrop-blur-md">
            <Button
              href={purchaseLink}
              external
              variant="primary"
              size="lg"
              className="w-full text-lg font-semibold shadow-lg hover:shadow-xl"
              icon={<ShoppingCart size={22} className="me-2.5"/>}
            >
              {t('courseDetailModal.securePurchaseButton', 'לרכישה מאובטחת')}
            </Button>
          </footer>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CourseDetailModal;
