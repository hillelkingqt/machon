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

export const formatArticleContentToHtml = (text: string | undefined): string => {
    if (!text) return '';

    const applyInlineStyles = (str: string): string => {
        // Bold: **text**
        str = str.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Italics: *text* (not surrounded by word characters)
        str = str.replace(/(?<!\w)\*(?!\*)([^*]+?)\*(?!\w|\*)/g, '<em>$1</em>');
        // Strikethrough: ~~text~~
        str = str.replace(/~~(.*?)~~/g, '<del>$1</del>');
        // Inline Code: `code`
        str = str.replace(/`(.*?)`/g, '<code>$1</code>');
        // Links: [text](url)
        str = str.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary dark:text-primary-light hover:underline">$1</a>');
        return str;
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

        // Custom Alert Blocks
        if (currentLine.startsWith('>>> ')) {
            const blockContent = currentLine.substring(4);
            const typeMatch = blockContent.match(/^([A-Z]+):\s*/i);
            let type: SvgIconKey = 'note'; // Default type
            let content = blockContent;

            if (typeMatch) {
                const potentialType = typeMatch[1].toLowerCase();
                if (isKeyOfObject(potentialType, SVG_ICONS)) {
                    type = potentialType;
                }
                content = blockContent.substring(typeMatch[0].length).trim();
            }

            const iconSvg = SVG_ICONS[type];
            let alertBodyLines = [applyInlineStyles(content)];
            i++;
            // Collect subsequent lines for the multi-line alert block
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
            continue; // Continue to next block after processing alert
        }

        // Headings
        if (currentLine.startsWith('#### ')) { htmlBlocks.push(`<h4 class="text-xl font-medium mt-8 mb-3 text-slate-700 dark:text-slate-300">${applyInlineStyles(currentLine.substring(5))}</h4>`); i++; continue; }
        if (currentLine.startsWith('### ')) { htmlBlocks.push(`<h3 class="text-2xl font-semibold mt-10 mb-4 text-slate-800 dark:text-slate-200">${applyInlineStyles(currentLine.substring(4))}</h3>`); i++; continue; }
        if (currentLine.startsWith('## ')) { htmlBlocks.push(`<h2 class="text-3xl font-bold mt-12 mb-5 text-slate-800 dark:text-slate-100">${applyInlineStyles(currentLine.substring(3))}</h2>`); i++; continue; }
        if (currentLine.startsWith('# ')) { htmlBlocks.push(`<h1 class="text-4xl font-extrabold mt-10 mb-6 text-slate-900 dark:text-slate-50 tracking-tight">${applyInlineStyles(currentLine.substring(2))}</h1>`); i++; continue; }

        // Horizontal Rules
        if (currentLine === '---' || currentLine === '***' || currentLine === '___') { htmlBlocks.push('<hr class="my-10 sm:my-12 border-t-2 border-slate-200 dark:border-slate-700/60" />'); i++; continue; }

        // Unordered Lists
        if (currentLine.startsWith('* ') || currentLine.startsWith('- ')) {
            let listItems = '';
            while (i < lines.length) {
                const lineTrimmed = lines[i].trim();
                if (lineTrimmed.startsWith('* ') || lineTrimmed.startsWith('- ')) {
                    listItems += `<li class="mb-1.5">${applyInlineStyles(lineTrimmed.substring(2))}</li>`;
                    i++;
                } else { break; }
            }
            htmlBlocks.push(`<ul class="list-disc list-outside pl-7 my-5 space-y-1 text-base sm:text-lg text-slate-700 dark:text-slate-300">${listItems}</ul>`);
            continue;
        }

        // Ordered Lists
        if (/^\d+\.\s+/.test(currentLine)) {
            let listItems = '';
            const startNum = parseInt(currentLine.match(/^(\d+)\./)?.[1] || '1', 10);
            while (i < lines.length) {
                const lineTrimmed = lines[i].trim();
                if (/^\d+\.\s+/.test(lineTrimmed)) {
                    listItems += `<li class="mb-1.5">${applyInlineStyles(lineTrimmed.replace(/^\d+\.\s+/, ''))}</li>`;
                    i++;
                } else { break; }
            }
            htmlBlocks.push(`<ol class="list-decimal list-outside pl-7 my-5 space-y-1 text-base sm:text-lg text-slate-700 dark:text-slate-300" start="${startNum}">${listItems}</ol>`);
            continue;
        }

        // Blockquotes
        if (currentLine.startsWith('> ')) {
            let quoteLines: string[] = [];
            while (i < lines.length) {
                const lineTrimmed = lines[i].trim();
                if (lineTrimmed.startsWith('> ')) {
                    quoteLines.push(applyInlineStyles(lineTrimmed.substring(2))); // Handle inline styles within quote
                    i++;
                } else { break; }
            }
             // Join with <br /> for explicit line breaks within the blockquote's paragraph
            htmlBlocks.push(`<blockquote><p class="border-r-4 border-primary dark:border-primary-light bg-slate-100 dark:bg-slate-800/70 p-5 my-7 text-base sm:text-lg text-slate-600 dark:text-slate-300 shadow rounded-r-md leading-relaxed">${quoteLines.join('<br />')}</p></blockquote>`);
            continue;
        }

        // Default: Paragraphs
        // Collect consecutive lines that are not any other block type
        let paraLines: string[] = [];
        while (i < lines.length) {
            const lineTrimmed = lines[i].trim();
            if (lineTrimmed === '' || lineTrimmed.match(/^(#|>|- |\* |\d+\. |---|\*\*\*|___|>>> )/)) {
                break; // Start of a new block or empty line
            }
            paraLines.push(applyInlineStyles(lineTrimmed));
            i++;
        }
        if (paraLines.length > 0) {
            // Join lines with a space for typical paragraph flow, unless they were intended as hard breaks.
            // The current `applyInlineStyles` and this simple join won't convert single newlines within a paragraph to <br>.
            // This behavior is standard for Markdown paragraphs.
            htmlBlocks.push(`<p class="text-base sm:text-lg text-slate-700 dark:text-slate-300 leading-relaxed my-5 hyphens-auto text-justify break-words">${paraLines.join(' ')}</p>`);
        }
    }
    return htmlBlocks.join('\n');
};
