
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom'; // Import Link for direct navigation
import HeroSection from '../components/sections/HeroSection';
import AnimatedDiv from '../components/ui/AnimatedDiv';
import Button from '../components/ui/Button';
import { PREVIEW_SECTIONS, ARTICLES_DATA } from '../constants';
import { Article } from '../types';
import { CalendarDays, ChevronRight } from 'lucide-react';

const PreviewArticleCard: React.FC<{ article: Article }> = ({ article }) => (
  <AnimatedDiv 
    animation="fadeInUp"
    className="bg-white dark:bg-secondary-light rounded-lg shadow-lg overflow-hidden flex flex-col h-full transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1"
  >
    {article.imageUrl && (
      <Link to={`/article/${article.id}`} className="block h-40 overflow-hidden group">
        <img 
          src={article.imageUrl} 
          alt={article.title} 
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
        />
      </Link>
    )}
    <div className="p-4 sm:p-5 flex flex-col flex-grow">
      <h3 className="text-md sm:text-lg font-semibold text-gray-800 dark:text-white mb-2 leading-tight">
        <Link to={`/article/${article.id}`} className="hover:text-primary dark:hover:text-primary-light transition-colors">
          {article.title}
        </Link>
      </h3>
      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3 flex-grow">
        {article.excerpt}
      </p>
      <div className="text-xs text-gray-500 dark:text-gray-500 mt-auto">
        <div className="flex items-center">
          <CalendarDays size={13} className="me-1.5" /> {article.date}
        </div>
      </div>
    </div>
  </AnimatedDiv>
);


const HomePage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <>
      <HeroSection />

      {/* Preview Sections */}
      {PREVIEW_SECTIONS.map((section, index) => {
        const sectionIdKey = section.id.replace(/-/g, ''); // e.g., coursespreview, articlespreview, aboutpreview
        return (
          <section
            key={section.id}
            className={`py-12 sm:py-16 ${index % 2 === 0 ? 'bg-white dark:bg-secondary' : 'bg-gray-50 dark:bg-secondary-light'}`}
          >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <AnimatedDiv animation="fadeInUp" className="text-center mb-10 sm:mb-12">
                {section.icon && <section.icon className="h-12 w-12 text-primary dark:text-primary-light mx-auto mb-3" strokeWidth={1.5}/>}
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">{t(`homePage.preview.${sectionIdKey}.subtitle`, section.subtitle)}</h2>
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto mb-6">{t(`homePage.preview.${sectionIdKey}.description`, section.description)}</p>
                <Button
                  href={section.link}
                  variant="primary"
                  size="md"
                  className="font-medium"
                  icon={<ChevronRight size={20}/>}
                  iconPosition="trailing"
                >
                  {t(`homePage.preview.${sectionIdKey}.linkLabel`, section.linkLabel)}
                </Button>
              </AnimatedDiv>

            {/* Specific content for articles preview */}
            {section.id === 'articles-preview' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {ARTICLES_DATA.slice(0, 3).map(article => (
                  <PreviewArticleCard key={article.id} article={article} />
                ))}
              </div>
            )}
             {/* Placeholder for courses preview if desired */}
            {/* {section.id === 'courses-preview' && (
              <div className="text-center text-gray-500 dark:text-gray-400">
                Course previews could go here.
              </div>
            )} */}

          </div>
        </section>
      ))}
    </>
  );
};

export default HomePage;