import React, { useEffect, useState } from 'react';
import AnimatedDiv from '../components/ui/AnimatedDiv';
import { formatArticleContentToHtml } from '../utils/contentParser';

const WordProblemsPage: React.FC = () => {
  const [htmlContent, setHtmlContent] = useState<string>('');

  useEffect(() => {
    const fetchAndParseContent = async () => {
      try {
        const response = await fetch('/word_problems_hebrew.md');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const markdownContent = await response.text();
        const parsedHtml = formatArticleContentToHtml(markdownContent);
        setHtmlContent(parsedHtml);
      } catch (error) {
        console.error("Error fetching or parsing word problems content:", error);
        setHtmlContent("<p class='text-center text-red-500'>שגיאה בטעינת התוכן. אנא נסה שוב מאוחר יותר.</p>");
      }
    };

    fetchAndParseContent();
  }, []);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
      <AnimatedDiv animation="fadeInUp">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-center text-primary dark:text-primary-light mb-10 sm:mb-12">
          בעיות מילוליות במתמטיקה
        </h1>
        <div
          className="prose dark:prose-invert max-w-none mx-auto"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </AnimatedDiv>
    </div>
  );
};

export default WordProblemsPage;
