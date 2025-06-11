import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ARTICLES_DATA } from '../../constants';
import { Article } from '../../types'; // Ensure Article type is imported
import AnimatedDiv from '../ui/AnimatedDiv';
import Button from '../ui/Button';
import { CalendarDays, UserCircle, Tag, ChevronLeft } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient'; // Import supabase client

interface ArticleCardProps {
    article: Article;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
    const articleLink = `/article/${article.id}`;

    return (
        <AnimatedDiv
            animation="fadeInUp"
            className="group bg-white dark:bg-slate-800 rounded-2xl shadow-xl hover:shadow-slate-400/50 dark:hover:shadow-black/50 border border-slate-200/80 dark:border-slate-700/80 transition-all duration-300 overflow-hidden flex flex-col transform hover:-translate-y-2 h-full"
        >
            {article.imageUrl && (
                <Link to={articleLink} className="block w-full h-52 sm:h-60 overflow-hidden">
                    <img
                        src={article.imageUrl}
                        alt={article.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                </Link>
            )}
            <div className="p-6 sm:p-7 flex flex-col flex-grow">
                {article.category && (
                    <div className="mb-2.5 text-xs font-semibold text-primary dark:text-primary-light flex items-center uppercase tracking-wider">
                        <Tag size={14} className="me-1.5" /> {article.category}
                    </div>
                )}
                <h3 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 mb-3 leading-snug">
                    <Button
                        href={articleLink}
                        variant="ghost"
                        className="p-0 text-right h-auto leading-snug hover:text-primary dark:hover:text-primary-light shadow-none hover:shadow-none active:scale-100 transform-none w-full block text-slate-800 dark:text-slate-100"
                    >
                        {article.title}
                    </Button>
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-5 leading-relaxed flex-grow line-clamp-3 sm:line-clamp-4">
                    {article.excerpt}
                </p>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-auto space-y-2 pt-3 border-t border-slate-200 dark:border-slate-700/50">
                    <div className="flex items-center">
                        <CalendarDays size={14} className="me-1.5" /> <span className="font-medium">{article.date}</span>
                    </div>
                    {article.author && (
                        <div className="flex items-center">
                            <UserCircle size={14} className="me-1.5" /> <span className="font-medium">{article.author}</span>
                        </div>
                    )}
                </div>
                <div className="mt-4">
                    <Button
                        href={articleLink}
                        variant="primary"
                        size="sm"
                        className="w-full sm:w-auto mt-5 rounded-lg font-semibold"
                        icon={<ChevronLeft size={18} />}
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
    const [allArticles, setAllArticles] = useState<Article[]>(ARTICLES_DATA);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchArticles = async () => {
            try {
                // Assuming 'articles' is your table name in Supabase
                // and columns match the Article type.
                // Ensure Supabase returns `id` as string or cast it.
                // Ensure date format is consistent or parse/format it.
                const { data: supabaseArticles, error: supabaseError } = await supabase
                    .from('articles') // Make sure this table name is correct
                    .select('*'); // Select all columns, adjust if needed

                if (supabaseError) {
                    console.error('Error fetching articles from Supabase:', supabaseError);
                    setError('Failed to load articles from database. Error: ' + supabaseError.message);
                    // Keep existing articles if fetch fails
                    setAllArticles(ARTICLES_DATA);
                    return;
                }

                if (supabaseArticles) {
                    // Type assertion for Supabase articles if necessary, or data transformation
                    const fetchedArticles: Article[] = supabaseArticles.map(article => ({
                        ...article,
                        // Ensure date is a string. Supabase might return it as Date object or ISO string.
                        date: article.date ? new Date(article.date).toLocaleDateString('he-IL') : 'N/A',
                        // Ensure id is a string
                        id: String(article.id)
                    }));

                    // Combine and remove duplicates (preferring Supabase articles if IDs clash)
                    const combinedArticles = [
                        ...fetchedArticles,
                        ...ARTICLES_DATA.filter(localArticle =>
                            !fetchedArticles.find(fetched => String(fetched.id) === String(localArticle.id))
                        )
                    ];
                    setAllArticles(combinedArticles);
                } else {
                    // No articles from Supabase, just use local ones
                    setAllArticles(ARTICLES_DATA);
                }
            } catch (err) {
                console.error('Error in fetchArticles:', err);
                setError('An unexpected error occurred while fetching articles.');
                setAllArticles(ARTICLES_DATA); // Fallback to local data
            }
        };

        fetchArticles();
    }, []);

    const articlesToDisplay = maxItems ? allArticles.slice(0, maxItems) : allArticles;

    return (
        <section className="py-16 sm:py-20 md:py-24 bg-slate-100 dark:bg-slate-900">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                {showTitle && (
                    <AnimatedDiv animation="fadeInUp" className="text-center mb-12 sm:mb-16">
                        <h2 className="font-semibold text-primary dark:text-primary-light tracking-widest uppercase">מאמרים וכתבות</h2>
                        <p className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-800 dark:text-slate-100 leading-tight">
                            תובנות ומידע חשוב מהמומחים שלנו
                        </p>
                    </AnimatedDiv>
                )}

                {error && (
                    <AnimatedDiv animation="fadeInUp" className="text-center mb-8">
                        <p className="text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-900/30 p-4 rounded-md">{error}</p>
                    </AnimatedDiv>
                )}

                {articlesToDisplay.length === 0 && !error && (
                     <AnimatedDiv animation="fadeInUp" className="text-center mb-8">
                        <p className="text-slate-600 dark:text-slate-400">לא נמצאו מאמרים כרגע.</p>
                    </AnimatedDiv>
                )}

                <div className={`grid grid-cols-1 sm:grid-cols-2 ${maxItems === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2 xl:grid-cols-3'} gap-6 md:gap-8`}>
                    {articlesToDisplay.map((article) => (
                        <ArticleCard key={article.id} article={article} />
                    ))}
                </div>

                {maxItems && allArticles.length > maxItems && (
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