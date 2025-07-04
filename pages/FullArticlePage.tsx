import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
// ARTICLES_DATA is no longer needed here as DataContext handles it.
// import { APP_NAME, ARTICLES_DATA } from '../constants';
import { APP_NAME } from '../constants';
import AnimatedDiv from '../components/ui/AnimatedDiv';
import Button from '../components/ui/Button';
import { CalendarDays, UserCircle, Tag, ArrowLeft, Edit3, Share2, ChevronsLeft, Award, SearchX } from 'lucide-react';
// supabase client is no longer needed here
// import { supabase } from '../utils/supabaseClient';
import { Article } from '../types';
import { formatArticleContentToHtml } from '../utils/contentParser';
import { useData } from '../contexts/DataContext'; // Import useData

const FullArticlePage: React.FC = () => {
    const { articleId } = useParams<{ articleId: string }>();
    const navigate = useNavigate();
    const { articles, loading: dataLoading, error: dataError } = useData(); // Get global state

    const [currentArticle, setCurrentArticle] = useState<Article | null | undefined>(undefined); // undefined: loading/searching, null: not found
    const [localError, setLocalError] = useState<string | null>(null);

    useEffect(() => {
        if (!articleId) {
            setLocalError("מזהה המאמר חסר.");
            setCurrentArticle(null);
            return;
        }

        if (articles && articles.length > 0) {
            // Try finding by artag or id. Prioritize artag if available.
            const foundArticle = articles.find(a => a.artag === articleId) || articles.find(a => String(a.id) === articleId);

            if (foundArticle) {
                setCurrentArticle(foundArticle);
                setLocalError(null);
            } else {
                setCurrentArticle(null);
                setLocalError("המאמר לא נמצא במערכת.");
            }
        } else if (!dataLoading) {
            // Articles loaded from context, but empty or articleId not found
            setCurrentArticle(null);
            if (!dataError) { // Only set local error if no global error explains absence of data
                 setLocalError("המאמר לא נמצא או שעדיין אין מאמרים טעונים.");
            }
        }
    }, [articleId, articles, dataLoading, dataError]);

    // Overall loading state: true if context is loading, or if context is done but we haven't found/not-found the article yet
    const isLoading = dataLoading || currentArticle === undefined;

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
                <p className="text-2xl text-slate-600 dark:text-slate-300">טוען מאמר...</p>
            </div>
        );
    }

    // Error display: prioritize global error, then local "not found" error
    const displayError = dataError || localError;
    if (displayError && !currentArticle) { // Added !currentArticle to ensure it only shows if article is not found
         return (
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
                <SearchX size={72} className="text-primary dark:text-primary-light mx-auto mb-8" strokeWidth={1.5} />
                <h1 className="text-5xl font-extrabold text-slate-700 dark:text-slate-200 mb-6">שגיאה בטעינת המאמר</h1>
                <p className="text-xl text-slate-500 dark:text-slate-400 mb-12 leading-relaxed">{displayError}</p>
                <Button onClick={() => navigate('/articles')} variant="primary" size="xl" icon={<ChevronsLeft size={24} />} iconPosition="leading">חזרה למאמרים</Button>
            </div>
        );
    }

    if (!currentArticle) { // Should be covered by displayError logic if not found, but as a fallback
        return (
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
                <AnimatedDiv animation="fadeInUp">
                    <SearchX size={72} className="text-primary dark:text-primary-light mx-auto mb-8" strokeWidth={1.5} />
                    <h1 className="text-5xl font-extrabold text-slate-700 dark:text-slate-200 mb-6">מאמר לא נמצא</h1>
                    <p className="text-xl text-slate-500 dark:text-slate-400 mb-12 leading-relaxed">
                        מצטערים, לא הצלחנו למצוא את המאמר שחיפשת.
                    </p>
                    <Button
                        onClick={() => navigate('/articles')}
                        variant="primary"
                        size="xl"
                        icon={<ChevronsLeft size={24} />}
                        iconPosition="leading"
                        className="shadow-lg hover:shadow-primary/30 transform hover:scale-105 transition-transform duration-300"
                    >
                        חזרה לרשימת המאמרים
                    </Button>
                </AnimatedDiv>
            </div>
        );
    }

    // Share function and content processing remain similar, using 'currentArticle'
    const handleShare = () => {
        if (navigator.share && currentArticle) {
            navigator.share({
                title: currentArticle.title,
                text: currentArticle.excerpt,
                url: window.location.href,
            }).catch(console.error);
        } else {
            // Fallback for browsers that do not support navigator.share
            navigator.clipboard.writeText(window.location.href)
                .then(() => alert('הקישור למאמר הועתק! שתפו אותו.'))
                .catch(() => alert('שיתוף אינו נתמך בדפדפן זה. ניתן להעתיק את הקישור משורת הכתובת.'));
        }
    };

    const processedContent = formatArticleContentToHtml(currentArticle.fullContent || '');

    return (
        <div className="py-1 sm:py-2 selection:bg-primary/30 selection:text-primary-dark dark:selection:bg-primary-light/30 dark:selection:text-primary-light">
            <div
                className="max-w-4xl mx-auto bg-white dark:bg-slate-800/80 dark:backdrop-blur-xl p-6 sm:p-10 md:p-14 lg:p-16 rounded-3xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.1),_0_10px_30px_-5px_rgba(0,0,0,0.07)] dark:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.3),_0_10px_30px_-5px_rgba(0,0,0,0.2)] border border-slate-200/70 dark:border-slate-700/60"
            >
                <div className="mb-8 sm:mb-10">
                    <Button
                        href="/articles"
                        variant="ghost"
                        size="sm"
                        className="text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary-light font-medium !px-2.5 !py-1.5 group"
                        icon={<ChevronsLeft size={22} className="opacity-80 group-hover:opacity-100 transition-opacity" />}
                        iconPosition="leading"
                    >
                        כל המאמרים
                    </Button>
                </div>

                <header className="mb-10 sm:mb-12 md:mb-14">
                    {currentArticle.category && (
                        <AnimatedDiv animation="fadeInDown" delay={0.15} className="uppercase text-base font-bold text-primary dark:text-primary-light flex items-center tracking-wider group mb-5">
                            <Tag size={18} className="me-2.5 opacity-90 group-hover:opacity-100 transition-opacity" strokeWidth={2.5} />
                            <span>{currentArticle.category}</span>
                        </AnimatedDiv>
                    )}

                    <h1 className="text-5xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
                        {currentArticle.title}
                    </h1>

                    <AnimatedDiv animation="fadeInUp" delay={0.35} className="mt-10 sm:mt-12 text-base text-slate-600 dark:text-slate-400 flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-x-8 gap-y-4 border-t-2 border-b-2 border-slate-200 dark:border-slate-700 py-6 sm:py-8">
                        <div className="flex items-center font-medium text-slate-700 dark:text-slate-200">
                            <CalendarDays size={22} className="me-2.5 text-primary/80 dark:text-primary-light/80" strokeWidth={2.5} /> {currentArticle.date}
                        </div>
                        {currentArticle.author && (
                            <div className="flex items-center font-medium text-slate-700 dark:text-slate-200">
                                <UserCircle size={22} className="me-2.5 text-primary/80 dark:text-primary-light/80" strokeWidth={2.5} /> מאת: {currentArticle.author}
                            </div>
                        )}
                        <div className="flex items-center font-medium text-slate-700 dark:text-slate-200">
                            <Edit3 size={22} className="me-2.5 text-primary/80 dark:text-primary-light/80" strokeWidth={2.5} /> מקור: {APP_NAME}
                        </div>
                        <div className="flex items-center font-medium text-primary dark:text-primary-light cursor-pointer hover:underline" onClick={handleShare}>
                            <Share2 size={22} className="me-2.5 text-primary/80 dark:text-primary-light/80" strokeWidth={2.5} /> שתף
                        </div>
                    </AnimatedDiv>
                </header>

                {currentArticle.imageUrl && (
                    <AnimatedDiv animation="fadeIn" delay={0.45} className="my-12 sm:my-16 md:my-20 rounded-3xl overflow-hidden shadow-2xl dark:shadow-black/30 aspect-[16/9] sm:aspect-[16/8] md:aspect-[16/7] border-8 border-white dark:border-slate-700/60">
                        <img src={currentArticle.imageUrl} alt={currentArticle.title} className="w-full h-full object-cover" />
                    </AnimatedDiv>
                )}

                <article
                    className="prose prose-lg dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: processedContent }}
                />

                <AnimatedDiv
                    animation="fadeInUp"
                    delay={0.75}
                    className="mt-16 sm:mt-20 pt-12 sm:pt-16 border-t-2 border-solid border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-50 dark:bg-slate-800/50 p-8 sm:p-10 rounded-2xl shadow-inner"
                >
                    <p className="text-xl font-bold text-slate-700 dark:text-slate-100 text-center md:text-right leading-tight">אהבתם את המאמר? נשמח אם תשתפו!</p>
                    <Button
                        onClick={handleShare}
                        variant="primary"
                        size="lg"
                        icon={<Share2 size={22} className="opacity-90 !mr-3" />}
                        iconPosition="trailing"
                        className="w-full md:w-auto shadow-xl hover:shadow-primary/40 dark:hover:shadow-primary-light/30 transform hover:scale-105 transition-all duration-300 px-8 py-3.5"
                    >
                        שיתוף המאמר
                    </Button>
                </AnimatedDiv>

                <AnimatedDiv
                    animation="fadeInUp"
                    delay={0.85}
                    className="mt-16 sm:mt-20 flex flex-col items-center justify-center text-center"
                >
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-8">למה לקרוא מאמרים במכון אביב?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12 sm:gap-y-16 md:gap-y-20">
                        <div className="flex flex-col items-center text-center p-8 bg-slate-50 dark:bg-slate-900 rounded-xl shadow-inner border border-slate-200 dark:border-slate-700/60">
                            <Award size={48} className="text-primary dark:text-primary-light mb-4" strokeWidth={1.5} />
                            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">איכותי ומקצועי</h3>
                            <p className="text-slate-600 dark:text-slate-400">המאמרים שלנו נכתבים על ידי מומחים בתחום, ומספקים מידע מדויק ואיכותי.</p>
                        </div>
                        <div className="flex flex-col items-center text-center p-8 bg-slate-50 dark:bg-slate-900 rounded-xl shadow-inner border border-slate-200 dark:border-slate-700/60">
                            <SearchX size={48} className="text-primary dark:text-primary-light mb-4" strokeWidth={1.5} />
                            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">עדכני ומקיף</h3>
                            <p className="text-slate-600 dark:text-slate-400">אנו דואגים לעדכן את התכנים באופן שוטף, ולהרחיב אותם כך שיכללו את כל המידע הרלוונטי.</p>
                        </div>
                    </div>
                </AnimatedDiv>
            </div>
        </div>
    );
};

export default FullArticlePage;