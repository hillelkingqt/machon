
import React from 'react';
import { COURSES_DATA } from '../../constants';
import CourseCard from '../CourseCard';
import AnimatedDiv from '../ui/AnimatedDiv';

const CoursesSection: React.FC = () => {
  return (
    <section id="courses" className="py-16 sm:py-24 bg-gray-100 dark:bg-secondary-light">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedDiv animation="fadeInUp" className="text-center mb-12">
          <h2 className="text-base font-semibold text-primary tracking-wide uppercase">הקורסים שלנו</h2>
          <p className="mt-2 text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight">
            השקעה בעתיד ילדיכם
          </p>
        </AnimatedDiv>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 xl:gap-10">
          {COURSES_DATA.map((course, index) => (
            <AnimatedDiv key={course.id} animation="fadeInUp" delay={index * 0.15}>
              <CourseCard course={course} />
            </AnimatedDiv>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CoursesSection;
