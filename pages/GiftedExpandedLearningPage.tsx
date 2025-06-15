import React, { useMemo } from 'react';
import { GIFTED_CHILDREN_EXPANDED_LEARNING_MATERIALS } from '../constants'; // Import the new constant
import { formatCourseDetailedContentToHtml, ProcessedContentItem } from '../utils/courseContentParser';
import AnimatedDiv from '../components/ui/AnimatedDiv';
import QuizSection from '../components/ui/QuizSection';
import { QuizSectionProps } from '../components/ui/QuizSection';

const GiftedExpandedLearningPage: React.FC = () => {
  const processedContent: ProcessedContentItem[] = useMemo(() => {
    return formatCourseDetailedContentToHtml(GIFTED_CHILDREN_EXPANDED_LEARNING_MATERIALS) as ProcessedContentItem[];
  }, []);

  return (
    <div className="bg-white dark:bg-secondary-dark min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
        <AnimatedDiv animation="fadeInUp">
          {/* Optional: Add a breadcrumb or a link back here if desired */}
          <h1 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 dark:text-white mb-10 sm:mb-12">
            חומרי לימוד מורחבים ותרגול למחוננים
          </h1>
        </AnimatedDiv>

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
              <div key={`quiz-${index}`} className="max-w-4xl mx-auto mb-8">
                <QuizSection {...(item.content as QuizSectionProps)} />
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
};

export default GiftedExpandedLearningPage;
