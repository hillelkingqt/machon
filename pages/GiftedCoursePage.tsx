import React, { useMemo } from 'react';
import { GIFTED_CHILDREN_COURSE_CONTENT } from '../constants';
import { formatCourseDetailedContentToHtml, ProcessedContentItem } from '../utils/courseContentParser';
import AnimatedDiv from '../components/ui/AnimatedDiv';
import QuizSection from '../components/ui/QuizSection';
import { QuizSectionProps } from '../components/ui/QuizSection'; // Explicit import for casting

const GiftedCoursePage: React.FC = () => {
  const processedContent: ProcessedContentItem[] = useMemo(() => {
    // Type assertion for clarity, though TypeScript should infer it from formatCourseDetailedContentToHtml's new return type
    return formatCourseDetailedContentToHtml(GIFTED_CHILDREN_COURSE_CONTENT) as ProcessedContentItem[];
  }, []); // Dependency array is empty as GIFTED_CHILDREN_COURSE_CONTENT is a constant

  return (
    <div className="bg-white dark:bg-secondary-dark min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
        <AnimatedDiv animation="fadeInUp">
          {/* Optional: Add a breadcrumb or a link back to Learning Zone here if desired */}
        </AnimatedDiv>

        {/* Iterate over processed content */}
        {processedContent.map((item, index) => {
          if (item.type === 'html') {
            return (
              <article
                key={`html-${index}`}
                className="prose prose-lg sm:prose-xl dark:prose-invert max-w-none mx-auto bg-white dark:bg-slate-800 p-6 sm:p-8 md:p-10 rounded-xl shadow-lg mb-8"
                dangerouslySetInnerHTML={{ __html: item.content as string }}
              />
            );
          } else if (item.type === 'quiz') {
            return (
              <div key={`quiz-${index}`} className="max-w-4xl mx-auto mb-8"> {/* Centering and spacing for quiz */}
                <QuizSection {...(item.content as QuizSectionProps)} />
              </div>
            );
          }
          return null; // Should not happen with current types
        })}
      </div>
    </div>
  );
};

export default GiftedCoursePage;
