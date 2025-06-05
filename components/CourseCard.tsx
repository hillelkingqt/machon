
import React from 'react';
import { Course } from '../types';
import { ExternalLink, Info } from 'lucide-react'; // Changed ChevronLeft to Info for better context if needed
import { motion } from 'framer-motion';
import Button from './ui/Button'; // Assuming Button component is appropriately set up for this usage

interface CourseCardProps {
    course: Course;
    onOpenModal: (course: Course) => void; // Callback to open the modal
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onOpenModal }) => {
    const IconComponent = course.icon;

    const handleCardClick = () => {
        onOpenModal(course);
    };

    return (
        <motion.div
            className={`group h-full flex flex-col rounded-xl shadow-2xl overflow-hidden transform transition-all duration-300 hover:scale-[1.02] hover:shadow-primary/30 dark:hover:shadow-primary-light/20 ${course.color || 'bg-white dark:bg-secondary'}`}
            whileHover={{ y: -6 }}
            style={{ display: 'flex', flexDirection: 'column' }} // Ensures flex works for height
        // onClick={handleCardClick} // Optional: make the whole card clickable to open modal
        // role="button"
        // tabIndex={0}
        // onKeyDown={(e) => e.key === 'Enter' && handleCardClick()}
        >
            <div className="p-5 sm:p-6 md:p-8 flex-grow flex flex-col text-white dark:text-gray-100">
                <div className="flex items-start mb-5 sm:mb-6">
                    <div
                        className="flex-shrink-0 me-4 sm:me-5 bg-white/20 dark:bg-black/20 p-3 sm:p-3.5 rounded-xl shadow-md group-hover:bg-white/30 dark:group-hover:bg-black/30 transition-colors duration-300"
                    >
                        <IconComponent
                            size={32}
                            className="text-white opacity-90 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[3deg]"
                            strokeWidth={2}
                        />
                    </div>
                    <h3 className="text-xl sm:text-2xl md:text-[1.6rem] font-bold leading-tight flex-1 mt-1 sm:mt-1.5 group-hover:text-yellow-300 dark:group-hover:text-yellow-300 transition-colors duration-200">{course.title}</h3>
                </div>
                <p className="text-sm sm:text-base opacity-90 mb-5 flex-grow leading-relaxed line-clamp-3 sm:line-clamp-4">{course.description}</p>

                {/* Button to open modal */}
                <div className="mt-auto">
                    <Button
                        onClick={handleCardClick}
                        variant="light" // Using a light variant for contrast on colored cards
                        size="md"
                        className="w-full font-semibold text-lg py-3 !text-slate-800 dark:!text-slate-100 bg-white/80 hover:bg-white/100 dark:bg-black/50 dark:hover:bg-black/70 shadow-md hover:shadow-lg"
                        icon={<Info size={20} className="me-2 rtl:ms-2" />}
                        iconPosition="leading"
                    >
                        {course.links && course.links.length > 0 ? course.links[0].label : "לפרטים נוספים"}
                    </Button>
                </div>
            </div>

            {/* Optional: Price display if it's not part of the modal or for quick view */}
            {/* {course.price && (
        <div className={`p-3 sm:p-4 ${course.color ? '' : 'bg-black/10 dark:bg-white/10'} text-center border-t border-white/20 dark:border-black/20`}>
          <span className="text-lg sm:text-xl font-bold text-white dark:text-gray-100">{course.price}</span>
        </div>
      )} */}
        </motion.div>
    );
};

export default CourseCard;
