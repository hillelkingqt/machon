import React from 'react'; // Removed useEffect, useState
import Accordion from '../components/ui/Accordion';
import AnimatedDiv from '../components/ui/AnimatedDiv';
// FAQ_DATA is no longer needed here as DataContext handles it
// import { FAQ_DATA } from '../constants';
import { FAQCategory } from '../types'; // FAQItem might not be directly used here if categories contain items
// supabase client is no longer needed here
// import { supabase } from '../utils/supabaseClient';
import { Lightbulb, AlertTriangle } from 'lucide-react';
import { useData } from '../contexts/DataContext'; // Import useData

const FAQ_PAGE_IMAGE_URL = 'https://www.machon-aviv.co.il/wp-content/uploads/2021/03/team-about.jpg';

const FAQPage: React.FC = () => {
  const { faqCategories, loading, error } = useData(); // Use DataContext

  // Removed useState for allFaqData and error
  // Removed useEffect for fetchFaqData

  if (loading) {
    return (
      <section className="py-12 sm:py-16 bg-slate-50 dark:bg-slate-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xl text-slate-600 dark:text-slate-300">טוען שאלות ותשובות...</p>
        </div>
      </section>
    );
  }

  // The existing error display can be used, it will reflect global errors if FAQ part of data fetch failed.
  // The Accordion component will now receive faqCategories from the context.

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

        {/* Use error from useData() */}
        {error && (
          <AnimatedDiv animation="fadeInUp" delay={0.1} className="mb-8 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 p-4 rounded-lg flex items-center text-red-700 dark:text-red-300">
            <AlertTriangle size={20} className="me-3 flex-shrink-0" />
            <p>{error}</p> {/* Display global error */}
          </AnimatedDiv>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-start">
          <div className="lg:col-span-2">
            <AnimatedDiv animation="fadeInUp" delay={0.2}>
              {/* Use faqCategories from useData() */}
              {faqCategories.length > 0 ? (
                <Accordion categories={faqCategories} allowMultipleOpen={false} defaultOpenFirstItem={true} />
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
