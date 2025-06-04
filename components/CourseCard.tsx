
import React from 'react';
import { Course } from '../types';
import { ExternalLink, ChevronLeft, ArrowRight } from 'lucide-react'; // ChevronLeft for RTL "arrow right"
import { motion } from 'framer-motion';

interface CourseCardProps {
  course: Course;
}

const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  return (
    <motion.div 
      className={`group h-full flex flex-col rounded-xl shadow-2xl overflow-hidden transform transition-all duration-300 hover:scale-[1.02] hover:shadow-primary/30 dark:hover:shadow-primary-light/20 ${course.color || 'bg-white dark:bg-secondary'}`}
      whileHover={{ y: -6 }}
    >
      <div className="p-6 sm:p-8 flex-grow flex flex-col text-white dark:text-gray-100">
        <div className="flex items-start mb-5">
          <div className="flex-shrink-0 me-4 rtl:ms-4 rtl:me-0 bg-white/25 dark:bg-black/25 p-3 rounded-lg shadow-md">
            <img 
              src={course.iconUrl} 
              alt={`${course.title} icon`} 
              className="w-12 h-12 sm:w-14 sm:h-14 object-contain transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[3deg]"
            />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold leading-tight flex-1 mt-1">{course.title}</h3>
        </div>
        <p className="text-sm sm:text-base opacity-95 mb-5 flex-grow leading-relaxed">{course.description}</p>
        
        {course.links && course.links.length > 0 && (
          <div className="mt-auto space-y-2.5">
            {course.links.map((link, index) => (
              <a
                key={index}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between text-sm sm:text-base font-medium py-2.5 px-4 bg-white/20 dark:bg-black/20 hover:bg-white/30 dark:hover:bg-black/30 rounded-lg transition-all duration-300 group/link hover:shadow-inner"
              >
                <span>{link.label}</span>
                <ExternalLink size={18} className="opacity-70 group-hover/link:opacity-100 transition-opacity transform group-hover/link:scale-110" />
              </a>
            ))}
          </div>
        )}
      </div>
      <div className={`p-4 ${course.color || 'bg-black/10 dark:bg-white/10'} text-center border-t border-white/20 dark:border-black/20`}>
         <a 
            href={(course.links && course.links.length > 0 ? course.links[0].href : '#')}
            target={(course.links && course.links.length > 0 ? '_blank' : '_self')}
            rel="noopener noreferrer"
            className="text-sm sm:text-base font-semibold text-white dark:text-gray-100 hover:underline inline-flex items-center group/details"
        >
            לפרטים נוספים 
            <ChevronLeft size={20} className="ms-1.5 transition-transform duration-300 group-hover/details:translate-x-[-5px] rtl:group-hover/details:translate-x-[5px]" />
        </a>
      </div>
    </motion.div>
  );
};

export default CourseCard;
