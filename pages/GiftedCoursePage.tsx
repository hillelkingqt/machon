import React, { useMemo } from 'react';
import { GIFTED_CHILDREN_COURSE_CONTENT } from '../constants';
import { formatCourseDetailedContentToHtml } from '../utils/courseContentParser';
import AnimatedDiv from '../components/ui/AnimatedDiv'; // Assuming this component is suitable

const GiftedCoursePage: React.FC = () => {
  const processedContent = useMemo(() => {
    return formatCourseDetailedContentToHtml(GIFTED_CHILDREN_COURSE_CONTENT);
  }, []); // Dependency array is empty as GIFTED_CHILDREN_COURSE_CONTENT is a constant

  return (
    <div className="bg-white dark:bg-secondary-dark min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
        <AnimatedDiv animation="fadeInUp">
          {/* The main title is already part of the content (H1 from markdown) */}
          {/* Optional: Add a breadcrumb or a link back to Learning Zone here if desired */}
        </AnimatedDiv>

        <AnimatedDiv animation="fadeInUp" delay={0.15}>
          <article
            className="prose prose-lg sm:prose-xl dark:prose-invert max-w-none mx-auto bg-white dark:bg-slate-800 p-6 sm:p-8 md:p-10 rounded-xl shadow-lg"
            dangerouslySetInnerHTML={{ __html: processedContent }}
          />
        </AnimatedDiv>
      </div>
    </div>
  );
};

export default GiftedCoursePage;
