
import React from 'react';
import { Course } from '../types';
import { ExternalLink, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface CourseCardProps {
    course: Course;
}

const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
    const IconComponent = course.icon;

    return (
        <motion.div
            className={`group h-full flex flex-col rounded-xl shadow-2xl overflow-hidden transform transition-all duration-300 hover:scale-[1.02] hover:shadow-primary/30 dark:hover:shadow-primary-light/20 ${course.color || 'bg-white dark:bg-secondary'}`}
            whileHover={{ y: -6 }}
            style={{ display: 'flex', flexDirection: 'column' }} // Ensures flex works for height
        >
            <div className="p-5 sm:p-6 md:p-8 flex-grow flex flex-col text-white dark:text-gray-100">
                <div className="flex items-start mb-5 sm:mb-6">
                    <div
                        className="flex-shrink-0 me-4 sm:me-5 bg-white/20 dark:bg-black/20 p-3 sm:p-3.5 rounded-xl shadow-md group-hover:bg-white/30 dark:group-hover:bg-black/30 transition-colors duration-300"
                    >
                        <IconComponent
                            size={32} // Increased icon size
                            className="text-white opacity-90 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[3deg]"
                            strokeWidth={2}
                        />
                    </div>
                    <h3 className="text-xl sm:text-2xl md:text-[1.6rem] font-bold leading-tight flex-1 mt-1 sm:mt-1.5 group-hover:text-yellow-300 dark:group-hover:text-yellow-300 transition-colors duration-200">{course.title}</h3>
                </div>
                <p className="text-sm sm:text-base opacity-90 mb-5 flex-grow leading-relaxed">{course.description}</p>

                {course.links && course.links.length > 0 && (
                    <div className="mt-auto space-y-2 sm:space-y-2.5">
                        {course.links.map((link, index) => (
                            <a
                                key={index}
                                href={link.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between text-xs sm:text-sm font-medium py-2.5 px-3.5 sm:py-3 sm:px-4 bg-white/20 dark:bg-black/20 hover:bg-white/30 dark:hover:bg-black/30 rounded-lg transition-all duration-300 group/link hover:shadow-inner"
                            >
                                <span>{link.label}</span>
                                <ExternalLink size={18} className="opacity-70 group-hover/link:opacity-100 transition-opacity transform group-hover/link:scale-110" />
                            </a>
                        ))}
                    </div>
                )}
            </div>
            {(course.links && course.links.length > 0) && (
                <div className={`p-3 sm:p-4 ${course.color ? '' : 'bg-black/10 dark:bg-white/10'} text-center border-t border-white/20 dark:border-black/20`}>
                    <a
                        href={course.links[0].href} // Default to first link for "more details"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs sm:text-sm font-semibold text-white dark:text-gray-100 hover:underline inline-flex items-center group/details"
                    >
                        לפרטים נוספים
                        <ChevronLeft size={18} className="ms-1 transition-transform duration-300 group-hover/details:translate-x-[-4px] rtl:group-hover/details:translate-x-[4px]" />
                    </a>
                </div>
            )}
        </motion.div>
    );
};

export default CourseCard;
