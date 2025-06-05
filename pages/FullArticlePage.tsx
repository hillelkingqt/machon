
import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ARTICLES_DATA, APP_NAME } from '../constants';
import AnimatedDiv from '../components/ui/AnimatedDiv';
import Button from '../components/ui/Button';
import { CalendarDays, UserCircle, Tag, ArrowLeft, Edit3, Share2, ChevronsLeft, Award } from 'lucide-react'; // Changed ArrowRight to ArrowLeft, ChevronsLeft for RTL

// Helper function to check if a key is a valid key of an object
function isKeyOfObject<T extends object>(key: string | number | symbol, obj: T): key is keyof T {
    return key in obj;
}

const SVG_ICONS = {
    info: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="alert-icon"><path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.041.022l-1.293.517a.75.75 0 01-.942-.015l-.442-.442a.75.75 0 01-.21-.527l.035-2.886c.086-.715.738-1.245 1.452-1.245zM12 15.75a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd" /></svg>`,
    tip: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="alert-icon"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>`, // Simple tip bulb icon
    note: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="alert-icon"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>`, // Simple note/chat icon
    warning: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="alert-icon"><path fill-rule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.557 13.031c1.155 2-.002 4.5-2.598 4.5H4.442c-2.598 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd" /></svg>`,
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

            htmlBlocks.push(
                // Removed <h4 class="alert-box-title">${typeDisplay}</h4>
                `<div class="alert-box alert-box-${type}">
           <div class="alert-icon-container">${iconSvg}</div>
           <div class="alert-content-container">
             <p>${alertBodyLines.join('<br />')}</p>
           </div>
         </div>`
            );
            continue;
        }

        if (currentLine.startsWith('#### ')) { htmlBlocks.push(`<h4 class="h4-article-style">${applyInlineStyles(currentLine.substring(5))}</h4>`); i++; continue; }
        if (currentLine.startsWith('### ')) { htmlBlocks.push(`<h3 class="h3-article-style">${applyInlineStyles(currentLine.substring(4))}</h3>`); i++; continue; }
        if (currentLine.startsWith('## ')) { htmlBlocks.push(`<h2 class="h2-article-style">${applyInlineStyles(currentLine.substring(3))}</h2>`); i++; continue; }
        if (currentLine.startsWith('# ')) { htmlBlocks.push(`<h1 class="h1-article-style">${applyInlineStyles(currentLine.substring(2))}</h1>`); i++; continue; }

        if (currentLine === '---' || currentLine === '***' || currentLine === '___') { htmlBlocks.push('<hr />'); i++; continue; }

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
            htmlBlocks.push(`<ul>${listItems}</ul>`);
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
            htmlBlocks.push(`<ol>${listItems}</ol>`);
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
            htmlBlocks.push(`<blockquote><p>${quoteLines.join('<br />')}</p></blockquote>`);
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
            htmlBlocks.push(`<p>${paraLines.join(' ')}</p>`);
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
                    <Award size={64} className="text-red-500 dark:text-red-400 mx-auto mb-6" strokeWidth={1} />
                    <h1 className="text-4xl font-bold text-red-600 dark:text-red-400 mb-6">מאמר לא נמצא</h1>
                    <p className="text-xl text-gray-700 dark:text-gray-300 mb-10">
                        מצטערים, לא הצלחנו למצוא את המאמר שחיפשת. ייתכן שהקישור שבור או שהמאמר הוסר.
                    </p>
                    <Button onClick={() => navigate('/articles')} variant="primary" size="lg" icon={<ArrowLeft size={22} />} iconPosition="leading">
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
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 my-10 sm:my-14 md:my-20">
                <AnimatedDiv
                    animation="fadeInUp"
                    duration={0.8}
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
                            <AnimatedDiv animation="fadeInDown" delay={0.15} className="mb-4 text-sm font-semibold text-primary dark:text-primary-light flex items-center tracking-wider group">
                                <Tag size={18} className="me-2.5 opacity-90 group-hover:opacity-100 transition-opacity" strokeWidth={2.5} />
                                <span>{article.category.toUpperCase()}</span>
                            </AnimatedDiv>
                        )}

                        <h1 className="h1-article-style">
                            {article.title}
                        </h1>

                        <AnimatedDiv animation="fadeInUp" delay={0.35} className="mt-8 sm:mt-10 text-sm text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-x-7 gap-y-3.5 border-t-2 border-b-2 border-slate-200 dark:border-slate-700 py-5 sm:py-6 px-1">
                            <div className="flex items-center font-medium text-slate-600 dark:text-slate-300">
                                <CalendarDays size={20} className="me-2.5 text-primary/80 dark:text-primary-light/80" strokeWidth={2.2} /> {article.date}
                            </div>
                            {article.author && (
                                <div className="flex items-center font-medium text-slate-600 dark:text-slate-300">
                                    <UserCircle size={20} className="me-2.5 text-primary/80 dark:text-primary-light/80" strokeWidth={2.2} /> מאת: {article.author}
                                </div>
                            )}
                            <div className="flex items-center font-medium text-slate-600 dark:text-slate-300">
                                <Edit3 size={20} className="me-2.5 text-primary/80 dark:text-primary-light/80" strokeWidth={2.2} /> מקור: {APP_NAME}
                            </div>
                        </AnimatedDiv>
                    </header>

                    {article.imageUrl && (
                        <AnimatedDiv animation="fadeIn" delay={0.45} className="my-10 sm:my-12 md:my-14 rounded-2xl overflow-hidden shadow-2xl dark:shadow-black/25 aspect-video sm:aspect-[16/7.5] md:aspect-[2/0.9] border-4 border-white dark:border-slate-700/50">
                            <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover" />
                        </AnimatedDiv>
                    )}

                    <AnimatedDiv animation="fadeInUp" delay={0.55}>
                        <article
                            className="prose prose-lg dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: processedContent }}
                        />
                    </AnimatedDiv>

                    <AnimatedDiv animation="fadeInUp" delay={0.75} className="mt-12 sm:mt-16 pt-10 sm:pt-12 border-t-2 border-dashed border-slate-300/70 dark:border-slate-600/50 flex flex-col sm:flex-row justify-between items-center gap-5">
                        <p className="text-lg font-semibold text-gray-800 dark:text-gray-200 text-center sm:text-right">אהבתם את המאמר? נשמח אם תשתפו!</p>
                        <Button
                            onClick={handleShare}
                            variant="primary"
                            size="md"
                            icon={<Share2 size={20} className="opacity-90" />}
                            className="w-full sm:w-auto shadow-xl hover:shadow-2xl px-7 py-3"
                        >
                            שיתוף המאמר
                        </Button>
                    </AnimatedDiv>

                </AnimatedDiv>
            </div>
        </div>
    );
};

export default FullArticlePage;
