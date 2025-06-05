
import React, { useState } from 'react';
import { COURSES_DATA } from '../../constants';
import { Course } from '../../types';
import CourseCard from '../CourseCard';
import AnimatedDiv from '../ui/AnimatedDiv';
import CourseDetailModal from '../CourseDetailModal'; // Import the new modal component

const CoursesSection: React.FC = () => {
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

    const handleOpenModal = (course: Course) => {
        setSelectedCourse(course);
    };

    const handleCloseModal = () => {
        setSelectedCourse(null);
    };

    return (
        <>
            <section className="py-16 sm:py-20 md:py-24 bg-gray-100 dark:bg-secondary-light">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <AnimatedDiv animation="fadeInUp" className="text-center mb-12 sm:mb-16">
                        <h2 className="text-lg font-semibold text-primary tracking-wider uppercase">התוכניות שלנו</h2>
                        <p className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight">
                            השקעה בעתיד ילדיכם
                        </p>
                        <p className="mt-4 max-w-2xl mx-auto text-base sm:text-lg text-gray-600 dark:text-gray-400">
                            לחצו על כרטיס הקורס לקבלת מידע מפורט ולרכישה.
                        </p>
                    </AnimatedDiv>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 xl:gap-10">
                        {COURSES_DATA.map((course, index) => (
                            <AnimatedDiv key={course.id} animation="fadeInUp" delay={index * 0.15} className="h-full">
                                <CourseCard course={course} onOpenModal={handleOpenModal} />
                            </AnimatedDiv>
                        ))}
                    </div>
                </div>
            </section>

            {selectedCourse && (
                <CourseDetailModal
                    course={selectedCourse}
                    onClose={handleCloseModal}
                />
            )}
        </>
    );
};

export default CoursesSection;
