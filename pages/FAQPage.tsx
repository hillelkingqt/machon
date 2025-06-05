
import React from 'react';
import Accordion from '../components/ui/Accordion';
import AnimatedDiv from '../components/ui/AnimatedDiv';
import { FAQ_DATA } from '../constants';
import { Lightbulb } from 'lucide-react'; // Example icon

const FAQ_PAGE_IMAGE_URL = 'https://www.machon-aviv.co.il/wp-content/uploads/2021/03/team-about.jpg';


const FAQPage: React.FC = () => {
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-start">
          <div className="lg:col-span-2">
            <AnimatedDiv animation="fadeInUp" delay={0.2}>
              <Accordion categories={FAQ_DATA} allowMultipleOpen={false} defaultOpenFirstItem={true} />
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
