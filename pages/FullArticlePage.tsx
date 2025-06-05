import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ARTICLES_DATA, APP_NAME } from '../constants';
import AnimatedDiv from '../components/ui/AnimatedDiv';
import Button from '../components/ui/Button';
import { CalendarDays, UserCircle, Tag, ArrowLeft, Edit3, Share2, ChevronsLeft, Award, SearchX } from 'lucide-react';

// Helper function to check if a key is a valid key of an object
function isKeyOfObject<T extends object>(key: string | number | symbol, obj: T): key is keyof T {
    return key in obj;
}

const SVG_ICONS = {
    info: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-6 w-6 text-sky-500 dark:text-sky-400"><path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.041.022l-1.293.517a.75.75 0 01-.942-.015l-.442-.442a.75.75 0 01-.21-.527l.035-2.886c.086-.715.738-1.245 1.452-1.245zM12 15.75a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd" /></svg>`,
    tip: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-6 w-6 text-emerald-500 dark:text-emerald-400"><path d="M12 2.25c-3.866 0-7 3.134-7 7 0 2.643 1.33 4.932 3.327 6.23v1.77a.75.75 0 00.75.75h5.846a.75.75 0 00.75-.75v-1.77c1.996-1.298 3.327-3.587 3.327-6.23 0-3.866-3.134-7-7-7zM9.009 18.75a.75.75 0 00.75.75h4.482a.75.75 0 00.75-.75v-.938a3.001 3.001 0 01-5.982 0v.938z" /></svg>`,
    note: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-6 w-6 text-slate-500 dark:text-slate-400"><path fill-rule="evenodd" d="M5.074 2.276a2.5 2.5 0 012.176-.018L19.02 8.532a2.5 2.5 0 011.23 2.175v6.586a2.5 2.5 0 01-1.23 2.175L7.25 22.744a2.5 2.5 0 01-2.176-.018A2.5 2.5 0 013.75 20.55V4.45a2.5 2.5 0 011.324-2.174zm0 1.448A1 1 0 004.75 4.45v16.1a1 1 0 00.526.868l.001.001 11.77-6.276a1 1 0 00.494-.868V10.707a1 1 0 00-.494-.868L5.074 3.724zM8.25 8.25a.75.75 0 01.75-.75h6a.75.75 0 010 1.5h-6a.75.75 0 01-.75-.75zm.75 3a.75.75 0 000 1.5h6a.75.75 0 000-1.5h-6zm-.75 3.75a.75.75 0 01.75-.75h3a.75.75 0 010 1.5h-3a.75.75 0 01-.75-.75z" clip-rule="evenodd"></path></svg>`,
    warning: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-6 w-6 text-amber-500 dark:text-amber-400"><path fill-rule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.557 13.031c1.155 2-.002 4.5-2.598 4.5H4.442c-2.598 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd" /></svg>`,
};
type SvgIconKey = keyof typeof SVG_ICONS;

const formatArticleContentToHtml = (text: string | undefined): string => {
    if (!text) return '';

    const applyInlineStyles = (str: string): string => {
        return str
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/(?<!\w)(?<!\*)\*(?!\*)([^*]+?)(?<!\*)\*(?!\w)(?!\*)/g, '<em>$1</em>');
    };

    const lines = text.trim().split('\n');
    let htmlBlocks: string[] = [];
    let i = 0;

    while (i < lines.length) {
        let currentLine = lines[i].trim();

        if (currentLine === '') {
            i++;
            continue;
        }

        if (currentLine.startsWith('>>> ')) {
            const blockContent = currentLine.substring(4);
            const typeMatch = blockContent.match(/^([A-Z]+):\s*/i);
            let type: SvgIconKey = 'note';
            let content = blockContent;

            if (typeMatch) {
                const potentialType = typeMatch[1].toLowerCase();
                if (isKeyOfObject(potentialType, SVG_ICONS)) {
                    type = potentialType;
                }
                content = blockContent.substring(typeMatch[0].length).trim();
            }

            // const typeDisplay = type.charAt(0).toUpperCase() + type.slice(1); // Title removed
            const iconSvg = SVG_ICONS[type];

            let alertBodyLines = [applyInlineStyles(content)];
            i++;
            while (i < lines.length && lines[i].trim() !== '' && !lines[i].trim().match(/^(#|>|- |\* |\d+\. |---|\*\*\*|___|>>> )/)) {
                alertBodyLines.push(applyInlineStyles(lines[i].trim()));
                i++;
            }

            const alertTypeClasses: Record<SvgIconKey, string> = {
                info: "bg-sky-50 dark:bg-sky-900/70 border-sky-400 dark:border-sky-700 text-sky-800 dark:text-sky-100",
                tip: "bg-emerald-50 dark:bg-emerald-900/70 border-emerald-400 dark:border-emerald-700 text-emerald-800 dark:text-emerald-100",
                note: "bg-slate-100 dark:bg-slate-800/70 border-slate-400 dark:border-slate-600 text-slate-800 dark:text-slate-100",
                warning: "bg-amber-50 dark:bg-amber-900/70 border-amber-400 dark:border-amber-700 text-amber-800 dark:text-amber-100",
            };

            htmlBlocks.push(
                `<div class="custom-alert-box custom-alert-box-${type} ${alertTypeClasses[type]} my-8 p-5 rounded-xl shadow-lg border flex items-start gap-x-4">
                    <div class="flex-shrink-0 pt-0.5">${iconSvg}</div>
                    <div class="flex-grow">
                        <p class="text-base leading-relaxed">${alertBodyLines.join('<br />')}</p>
                    </div>
                </div>`
            );
            continue;
        }

        if (currentLine.startsWith('#### ')) { htmlBlocks.push(`<h4 class="text-2xl font-medium mt-10 mb-5 text-slate-700 dark:text-slate-300">${applyInlineStyles(currentLine.substring(5))}</h4>`); i++; continue; }
        if (currentLine.startsWith('### ')) { htmlBlocks.push(`<h3 class="text-3xl font-semibold mt-12 mb-6 text-slate-800 dark:text-slate-200">${applyInlineStyles(currentLine.substring(4))}</h3>`); i++; continue; }
        if (currentLine.startsWith('## ')) { htmlBlocks.push(`<h2 class="text-4xl font-bold mt-14 mb-7 text-slate-800 dark:text-slate-100">${applyInlineStyles(currentLine.substring(3))}</h2>`); i++; continue; }
        if (currentLine.startsWith('# ')) { htmlBlocks.push(`<h1 class="text-5xl font-extrabold mt-12 mb-8 text-slate-900 dark:text-slate-50 tracking-tight">${applyInlineStyles(currentLine.substring(2))}</h1>`); i++; continue; }

        if (currentLine === '---' || currentLine === '***' || currentLine === '___') { htmlBlocks.push('<hr class="my-12 sm:my-16 border-t-2 border-slate-200 dark:border-slate-700/60" />'); i++; continue; }

        if (currentLine.startsWith('* ') || currentLine.startsWith('- ')) {
            let listItems = '';
            while (i < lines.length) {
                const lineTrimmed = lines[i].trim();
                if (lineTrimmed.startsWith('* ') || lineTrimmed.startsWith('- ')) {
                    const itemContent = lineTrimmed.substring(2);
                    listItems += `<li>${applyInlineStyles(itemContent)}</li>`;
                    i++;
                } else {
                    break;
                }
            }
            htmlBlocks.push(`<ul class="list-disc list-outside pl-8 my-6 space-y-3 text-lg text-slate-700 dark:text-slate-300">${listItems}</ul>`);
            continue;
        }

        if (/^\d+\.\s+/.test(currentLine)) {
            let listItems = '';
            while (i < lines.length) {
                const lineTrimmed = lines[i].trim();
                if (/^\d+\.\s+/.test(lineTrimmed)) {
                    const itemContent = lineTrimmed.replace(/^\d+\.\s+/, '');
                    listItems += `<li>${applyInlineStyles(itemContent)}</li>`;
                    i++;
                } else {
                    break;
                }
            }
            htmlBlocks.push(`<ol class="list-decimal list-outside pl-8 my-6 space-y-3 text-lg text-slate-700 dark:text-slate-300">${listItems}</ol>`);
            continue;
        }

        if (currentLine.startsWith('> ')) {
            let quoteLines: string[] = [];
            while (i < lines.length) {
                const lineTrimmed = lines[i].trim();
                if (lineTrimmed.startsWith('> ')) {
                    quoteLines.push(applyInlineStyles(lineTrimmed.substring(2)));
                    i++;
                } else {
                    break;
                }
            }
            htmlBlocks.push(`<blockquote><p class="border-r-4 border-primary dark:border-primary-light bg-slate-100 dark:bg-slate-800/80 p-6 my-8 text-xl text-slate-600 dark:text-slate-300 shadow-lg rounded-r-lg leading-relaxed">${quoteLines.join('<br />')}</p></blockquote>`);
            continue;
        }

        let paraLines: string[] = [];
        while (i < lines.length) {
            const lineTrimmed = lines[i].trim();
            if (lineTrimmed === '') {
                break;
            }
            if (lineTrimmed.match(/^(#|>|- |\* |\d+\. |---|\*\*\*|___|>>> )/)) {
                break;
            }
            paraLines.push(applyInlineStyles(lineTrimmed));
            i++;
        }
        if (paraLines.length > 0) {
            htmlBlocks.push(`<p class="text-lg text-slate-700 dark:text-slate-300 leading-relaxed my-6 hyphens-auto text-justify break-words">${paraLines.join(' ')}</p>`);
        }
    }
    return htmlBlocks.join('\n');
};


const FullArticlePage: React.FC = () => {
    const { articleId } = useParams<{ articleId: string }>();
    const navigate = useNavigate();
    const article = ARTICLES_DATA.find(art => art.id === articleId);

    if (!article) {
        return (
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
                <AnimatedDiv animation="fadeInUp">
                    <SearchX size={72} className="text-primary dark:text-primary-light mx-auto mb-8" strokeWidth={1.5} />
                    <h1 className="text-5xl font-extrabold text-slate-700 dark:text-slate-200 mb-6">מאמר לא נמצא</h1>
                    <p className="text-xl text-slate-500 dark:text-slate-400 mb-12 leading-relaxed">
                        מצטערים, לא הצלחנו למצוא את המאמר שחיפשת. ייתכן שהקישור שבור או שהמאמר הוסר.
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

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: article.title,
                text: article.excerpt,
                url: window.location.href,
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(window.location.href)
                .then(() => alert('הקישור למאמר הועתק! שתפו אותו.'))
                .catch(() => alert('שיתוף אינו נתמך בדפדפן זה. ניתן להעתיק את הקישור משורת הכתובת.'));
        }
    };

    const processedContent = formatArticleContentToHtml(article.fullContent);

    return (
        <div className="py-1 sm:py-2 selection:bg-primary/30 selection:text-primary-dark dark:selection:bg-primary-light/30 dark:selection:text-primary-light">
            <AnimatedDiv
                animation="fadeInUp"
                duration={0.8}
                delay={0.1}
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
                    {article.category && (
                        <AnimatedDiv animation="fadeInDown" delay={0.15} className="uppercase text-base font-bold text-primary dark:text-primary-light flex items-center tracking-wider group mb-5">
                            <Tag size={18} className="me-2.5 opacity-90 group-hover:opacity-100 transition-opacity" strokeWidth={2.5} />
                            <span>{article.category}</span>
                        </AnimatedDiv>
                    )}

                    <h1 className="text-5xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
                        {article.title}
                    </h1>

                    <AnimatedDiv animation="fadeInUp" delay={0.35} className="mt-10 sm:mt-12 text-base text-slate-600 dark:text-slate-400 flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-x-8 gap-y-4 border-t-2 border-b-2 border-slate-200 dark:border-slate-700 py-6 sm:py-8">
                        <div className="flex items-center font-medium text-slate-700 dark:text-slate-200">
                            <CalendarDays size={22} className="me-2.5 text-primary/80 dark:text-primary-light/80" strokeWidth={2.5} /> {article.date}
                        </div>
                        {article.author && (
                            <div className="flex items-center font-medium text-slate-700 dark:text-slate-200">
                                <UserCircle size={22} className="me-2.5 text-primary/80 dark:text-primary-light/80" strokeWidth={2.5} /> מאת: {article.author}
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

                {article.imageUrl && (
                    <AnimatedDiv animation="fadeIn" delay={0.45} className="my-12 sm:my-16 md:my-20 rounded-3xl overflow-hidden shadow-2xl dark:shadow-black/30 aspect-[16/9] sm:aspect-[16/8] md:aspect-[16/7] border-8 border-white dark:border-slate-700/60">
                        <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover" />
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
            </AnimatedDiv>
        </div>
    );
};

export default FullArticlePage;