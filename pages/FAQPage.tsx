import React, { useEffect, useState } from 'react';
import Accordion from '../components/ui/Accordion';
import AnimatedDiv from '../components/ui/AnimatedDiv';
import { FAQ_DATA } from '../constants';
import { FAQCategory, FAQItem } from '../types'; // Import types
import { supabase } from '../utils/supabaseClient'; // Import supabase client
import { Lightbulb, AlertTriangle } from 'lucide-react'; // Example icon + error icon

const FAQ_PAGE_IMAGE_URL = 'https://www.machon-aviv.co.il/wp-content/uploads/2021/03/team-about.jpg';

const FAQPage: React.FC = () => {
  const [allFaqData, setAllFaqData] = useState<FAQCategory[]>(FAQ_DATA);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFaqData = async () => {
      try {
        // Assuming 'faq_items' table with 'id', 'question', 'answer', 'category_title', 'category_id_for_ordering'
        // 'category_id_for_ordering' can be a simple string like "general", "technical" for grouping
        // and 'category_icon' (optional, string name of a Lucide icon)
        const { data: supabaseFaqItems, error: supabaseError } = await supabase
          .from('qa') // Make sure this table name is correct
          .select('id, question_text, answer_text'); // Adjust columns as needed

        if (supabaseError) {
          console.error('Error fetching FAQ data from Supabase:', supabaseError);
          setError('Failed to load some Q&A from the database. Error: ' + supabaseError.message);
          setAllFaqData(FAQ_DATA); // Fallback to local data
          return;
        }

        if (supabaseFaqItems && supabaseFaqItems.length > 0) {
          const supabaseCategories: { [key: string]: FAQCategory } = {};
          const defaultCategoryId = 'supabase_qa';
          const defaultCategoryTitle = 'שאלות מהמאגר';

          supabaseFaqItems.forEach(item => {
            // All items from 'qa' table will go into a single default category
            if (!supabaseCategories[defaultCategoryId]) {
              supabaseCategories[defaultCategoryId] = {
                id: defaultCategoryId,
                title: defaultCategoryTitle,
                // icon: HelpCircle, // You can assign a default icon if you have one
                questions: [],
              };
            }
            supabaseCategories[defaultCategoryId].questions.push({
              id: String(item.id),
              question: item.question_text, // Map from question_text
              answer: item.answer_text || '', // Map from answer_text, provide fallback for null
            });
          });

          const fetchedCategoriesArray = Object.values(supabaseCategories);

          // Combine with local data:
          // Strategy: Merge questions if category titles match, otherwise add as new categories.
          // Give precedence to Supabase questions if question ID matches within a merged category (not implemented here for simplicity, just concatenating questions)

          let combinedData = [...FAQ_DATA];

          fetchedCategoriesArray.forEach(supaCategory => {
            const existingCategoryIndex = combinedData.findIndex(
              localCat => localCat.title.trim().toLowerCase() === supaCategory.title.trim().toLowerCase()
            );

            if (existingCategoryIndex > -1) {
              // Category exists, merge questions (avoiding duplicates by question ID)
              const existingQuestions = combinedData[existingCategoryIndex].questions;
              supaCategory.questions.forEach(supaQuestion => {
                if (!existingQuestions.find(q => q.id === supaQuestion.id)) {
                  existingQuestions.push(supaQuestion);
                }
              });
              combinedData[existingCategoryIndex].questions = [...existingQuestions]; // Ensure re-render
            } else {
              // New category, add it
              combinedData.push(supaCategory);
            }
          });

          setAllFaqData(combinedData);

        } else {
          // No new FAQ items from Supabase, local data is already set
          setAllFaqData(FAQ_DATA);
        }
      } catch (err) {
        console.error('Error in fetchFaqData:', err);
        setError('An unexpected error occurred while fetching Q&A.');
        setAllFaqData(FAQ_DATA); // Fallback to local data
      }
    };

    fetchFaqData();
  }, []);

  return (
    <section className="py-12 sm:py-16 bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedDiv animation="fadeInUp" className="text-center mb-10 sm:mb-16">
          <Lightbulb className="h-16 w-16 text-primary dark:text-primary-light mx-auto mb-4" strokeWidth={1.5} />
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-3">
            יש לכם שאלות?
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            אנחנו כאן כדי לעזור. ריכזנו עבורכם את השאלות הנפוצות ביותר במקום אחד, ברור ונוח.
          </p>
        </AnimatedDiv>

        {error && (
          <AnimatedDiv animation="fadeInUp" delay={0.1} className="mb-8 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 p-4 rounded-lg flex items-center text-red-700 dark:text-red-300">
            <AlertTriangle size={20} className="me-3 flex-shrink-0" />
            <p>{error}</p>
          </AnimatedDiv>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-start">
          <div className="lg:col-span-2">
            <AnimatedDiv animation="fadeInUp" delay={0.2}>
              {allFaqData.length > 0 ? (
                <Accordion categories={allFaqData} allowMultipleOpen={false} defaultOpenFirstItem={true} />
              ) : (
                !error && <p className="text-center text-gray-500 dark:text-gray-400">לא נמצאו שאלות ותשובות כרגע.</p>
              )}
            </AnimatedDiv>
          </div>
          <div className="lg:col-span-1">
            <AnimatedDiv animation="fadeInUp" delay={0.4} className="sticky top-28">
              <img 
                src={FAQ_PAGE_IMAGE_URL} 
                alt="צוות מכון אביב" 
                className="rounded-xl shadow-xl w-full h-auto object-cover aspect-[4/3] border-4 border-white dark:border-slate-700/60"
              />
               <p className="text-sm text-center mt-3 text-gray-500 dark:text-gray-400 italic">
                צוות מכון אביב, תמיד לשירותכם.
              </p>
            </AnimatedDiv>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQPage;
