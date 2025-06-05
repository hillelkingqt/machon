
import React from 'react';
import { Link } from 'react-router-dom'; // Import Link for direct navigation
import { ARTICLES_DATA } from '../../constants';
import { Article } from '../../types';
import AnimatedDiv from '../ui/AnimatedDiv';
import Button from '../ui/Button';
import { CalendarDays, UserCircle, Tag, ChevronLeft } from 'lucide-react';

interface ArticleCardProps {
  article: Article;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  const articleLink = `/article/${article.id}`; 

  return (
    <AnimatedDiv 
      // id attribute is no longer needed here as we navigate to a new page
      animation="fadeInUp" 
      className="group bg-white dark:bg-secondary-light rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col transform hover:-translate-y-1.5 h-full"
    >
      {article.imageUrl && (
         <Link to={articleLink} className="block w-full h-48 sm:h-56 overflow-hidden">
            <img 
                src={article.imageUrl} 
                alt={article.title} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
        </Link>
      )}
      <div className="p-5 sm:p-6 flex flex-col flex-grow">
        {article.category && (
          <div className="mb-2 text-xs font-medium text-primary dark:text-primary-light flex items-center">
            <Tag size={14} className="me-1.5" /> {article.category}
          </div>
        )}
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">
           {/* Ensure the button or link correctly aligns text to the right for RTL */}
           <Button 
             href={articleLink} 
             variant="ghost" 
             className="p-0 text-right h-auto leading-tight hover:text-primary dark:hover:text-primary-light shadow-none hover:shadow-none active:scale-100 transform-none w-full block"
           >
             {article.title}
           </Button>
        </h3>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 leading-relaxed flex-grow line-clamp-4 sm:line-clamp-5">
          {article.excerpt}
        </p>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-auto space-y-1.5">
          <div className="flex items-center">
            <CalendarDays size={14} className="me-1.5" /> {article.date}
          </div>
          {article.author && (
             <div className="flex items-center">
                <UserCircle size={14} className="me-1.5" /> {article.author}
             </div>
          )}
        </div>
        <div className="mt-4">
            <Button 
                href={articleLink} // Link to the full article page
                variant="outline" 
                size="sm" 
                className="w-full sm:w-auto"
                icon={<ChevronLeft size={16}/>}
                iconPosition="trailing"
            >
                קראו עוד
            </Button>
        </div>
      </div>
    </AnimatedDiv>
  );
};

interface ArticlesSectionProps {
  maxItems?: number; 
  showTitle?: boolean; 
}

const ArticlesSection: React.FC<ArticlesSectionProps> = ({ maxItems, showTitle = true }) => {
  const articlesToDisplay = maxItems ? ARTICLES_DATA.slice(0, maxItems) : ARTICLES_DATA;

  return (
    <section className="py-16 sm:py-20 md:py-24 bg-gray-50 dark:bg-secondary">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {showTitle && (
          <AnimatedDiv animation="fadeInUp" className="text-center mb-12 sm:mb-16">
            <h2 className="text-lg font-semibold text-primary tracking-wider uppercase">מאמרים וכתבות</h2>
            <p className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight">
              תובנות ומידע חשוב מהמומחים שלנו
            </p>
          </AnimatedDiv>
        )}

        <div className={`grid grid-cols-1 sm:grid-cols-2 ${maxItems === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2 xl:grid-cols-3'} gap-6 md:gap-8`}>
          {articlesToDisplay.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>

        {maxItems && ARTICLES_DATA.length > maxItems && (
            <AnimatedDiv animation="fadeInUp" delay={0.5} className="text-center mt-12 sm:mt-16">
                <Button href="/articles" variant="primary" size="lg">
                    לכל המאמרים
                </Button>
            </AnimatedDiv>
        )}
      </div>
    </section>
  );
};

export default ArticlesSection;