
// Minimal mock for logic guidance within the parser, used to help determine table structure for specific courses.
// Renamed from COURSES_DATA to avoid confusion if actual constants were ever imported here.
const COURSES_DATA_PARSER_INTERNAL_CONFIG = [
    { id: 'bar-ilan-acceleration', detailedContent: 'some_content_marker_for_bar_ilan' } // This marker is a placeholder for context.
];

// Helper function to check if a key is a valid key of an object (used for custom alert icons)
function isKeyOfObject<T extends object>(key: string | number | symbol, obj: T): key is keyof T {
    return key in obj;
}

const SVG_ICONS_COURSE_DETAIL = {
    info: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-7 w-7 text-sky-500 dark:text-sky-400"><path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.041.022l-1.293.517a.75.75 0 01-.942-.015l-.442-.442a.75.75 0 01-.21-.527l.035-2.886c.086-.715.738-1.245 1.452-1.245zM12 15.75a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd" /></svg>`,
    tip: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-7 w-7 text-emerald-500 dark:text-emerald-400"><path d="M12 2.25c-3.866 0-7 3.134-7 7 0 2.643 1.33 4.932 3.327 6.23v1.77a.75.75 0 00.75.75h5.846a.75.75 0 00.75-.75v-1.77c1.996-1.298 3.327-3.587 3.327-6.23 0-3.866-3.134-7-7-7zM9.009 18.75a.75.75 0 00.75.75h4.482a.75.75 0 00.75-.75v-.938a3.001 3.001 0 01-5.982 0v.938z" /></svg>`,
    note: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-7 w-7 text-slate-500 dark:text-slate-400"><path fill-rule="evenodd" d="M5.074 2.276a2.5 2.5 0 012.176-.018L19.02 8.532a2.5 2.5 0 011.23 2.175v6.586a2.5 2.5 0 01-1.23 2.175L7.25 22.744a2.5 2.5 0 01-2.176-.018A2.5 2.5 0 013.75 20.55V4.45a2.5 2.5 0 011.324-2.174zm0 1.448A1 1 0 004.75 4.45v16.1a1 1 0 00.526.868l.001.001 11.77-6.276a1 1 0 00.494-.868V10.707a1 1 0 00-.494-.868L5.074 3.724zM8.25 8.25a.75.75 0 01.75-.75h6a.75.75 0 010 1.5h-6a.75.75 0 01-.75-.75zm.75 3a.75.75 0 000 1.5h6a.75.75 0 000-1.5h-6zm-.75 3.75a.75.75 0 01.75-.75h3a.75.75 0 010 1.5h-3a.75.75 0 01-.75-.75z" clip-rule="evenodd"></path></svg>`,
    warning: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-7 w-7 text-amber-500 dark:text-amber-400"><path fill-rule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.557 13.031c1.155 2-.002 4.5-2.598 4.5H4.442c-2.598 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd" /></svg>`,
};
type SvgIconKeyCourseDetail = keyof typeof SVG_ICONS_COURSE_DETAIL;

const KNOWN_TABLE_KEYS_COL1: string[] = [
    "שם המבחן", "כיתות יעד", "מיקום הבחינה", "תחומי הערכה עיקריים", "נושאים ספציפיים (שפה)",
    "נושאים ספציפיים (מתמטיקה)", "פורמט המבחן", "קריטריוני מעבר לשלב ב'", "אופי המבחן",
    "פרקים עיקריים", "נושאים ספציפיים (מילולי)", "נושאים ספציפיים (כמותי)",
    "נושאים ספציפיים (צורני)", "קריטריוני קבלה",
    // For table 3
    "שם התוכנית", "מטרות התוכנית", "תהליך קבלה", "פרטי מבחן כניסה- מועד",
    "- עלות", "- משך", "- מס' שאלות", "- הגבלות", "- אחוז מעבר", "- פטורים", "מבנה התוכנית",
    // For table 4
    "שלב קבלה", "שם השלב", "סוג הערכה/תוכן", "תזמון/משך", "מאפיינים/מטרת השלב העיקריים"
];


export const formatCourseDetailedContentToHtml = (text: string | undefined): string => {
    if (!text) return '';

    const applyInlineStyles = (str: string): string => {
        return str
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
            .replace(/(?<!\w)(?<!\*)\*(?!\*)([^*]+?)(?<!\*)\*(?!\w)(?!\*)/g, '<em>$1</em>') // Italic
            .replace(/<sup>(.*?)<\/sup>/g, '<sup class="text-xs opacity-70 ms-0.5">$1</sup>'); // Superscript for citations
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
            let type: SvgIconKeyCourseDetail = 'note';
            let content = blockContent;

            if (typeMatch) {
                const potentialType = typeMatch[1].toLowerCase();
                if (isKeyOfObject(potentialType, SVG_ICONS_COURSE_DETAIL)) {
                    type = potentialType;
                }
                content = blockContent.substring(typeMatch[0].length).trim();
            }
            
            const iconSvg = SVG_ICONS_COURSE_DETAIL[type];
            let alertBodyLines = [applyInlineStyles(content)];
            i++;
            while (i < lines.length && lines[i].trim() !== '' && !lines[i].trim().match(/^(#|>|- |\* |\d+\. |---|\*\*\*|___|>>> |טבלה)/)) {
                alertBodyLines.push(applyInlineStyles(lines[i].trim()));
                i++;
            }

            const alertTypeClasses: Record<SvgIconKeyCourseDetail, string> = {
                info: "bg-sky-50 dark:bg-sky-900/50 border-sky-400 dark:border-sky-600 text-sky-700 dark:text-sky-200",
                tip: "bg-emerald-50 dark:bg-emerald-900/50 border-emerald-400 dark:border-emerald-600 text-emerald-700 dark:text-emerald-200",
                note: "bg-slate-100 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200",
                warning: "bg-amber-50 dark:bg-amber-900/50 border-amber-400 dark:border-amber-600 text-amber-700 dark:text-amber-200",
            };

            htmlBlocks.push(
                `<div class="custom-alert-box custom-alert-box-${type} ${alertTypeClasses[type]} my-6 p-5 rounded-xl shadow-md border-s-4 flex items-start gap-x-4">
                    <div class="flex-shrink-0 pt-0.5">${iconSvg}</div>
                    <div class="flex-grow prose prose-sm sm:prose-base dark:prose-invert max-w-none">
                        <p class="text-sm sm:text-base leading-relaxed">${alertBodyLines.join('<br />')}</p>
                    </div>
                </div>`
            );
            continue;
        }
        
        if (currentLine.startsWith('טבלה ')) {
            htmlBlocks.push(`<div class="my-8 overflow-x-auto rounded-lg shadow-lg border border-slate-200 dark:border-slate-700"><table class="w-full text-sm text-right border-collapse">`);
            const captionText = currentLine.substring(currentLine.indexOf(':') + 1).trim();
            htmlBlocks.push(`<caption class="p-4 text-lg font-semibold text-right text-slate-900 bg-slate-100 dark:bg-slate-700 dark:text-white border-b border-slate-200 dark:border-slate-700">${applyInlineStyles(captionText)}</caption>`);
            i++;
            currentLine = lines[i]?.trim() || ''; 

            // Header Row
            if (currentLine) {
                htmlBlocks.push(`<thead class="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-800 dark:text-slate-300"><tr>`);
                const headerCellClass = "px-4 py-3 border-x border-slate-200 dark:border-slate-700 text-right font-semibold";
                if (currentLine === "מאפיין/נושאפירוט") {
                    htmlBlocks.push(`<th scope="col" class="${headerCellClass}">מאפיין/נושא</th><th scope="col" class="${headerCellClass}">פירוט</th>`);
                } else if (currentLine === "מאפיין/נושאתוכנית העשרהתוכנית האצה") {
                    htmlBlocks.push(`<th scope="col" class="${headerCellClass}">מאפיין/נושא</th><th scope="col" class="${headerCellClass}">תוכנית העשרה</th><th scope="col" class="${headerCellClass}">תוכנית האצה</th>`);
                } else if (currentLine === "שלב קבלהשם השלבסוג הערכה/תוכןתזמון/משךמאפיינים/מטרת השלב העיקריים") {
                     ['שלב קבלה','שם השלב','סוג הערכה/תוכן','תזמון/משך','מאפיינים/מטרת השלב העיקריים'].forEach(h => htmlBlocks.push(`<th scope="col" class="${headerCellClass}">${h}</th>`));
                } else { 
                    htmlBlocks.push(`<th scope="col" class="${headerCellClass}">${applyInlineStyles(currentLine)}</th>`);
                }
                htmlBlocks.push(`</tr></thead>`);
                i++;
            }
            
            htmlBlocks.push(`<tbody>`);
            const tdKeyClass = "px-4 py-3 font-semibold text-slate-800 dark:text-white border-x border-slate-200 dark:border-slate-700 text-right whitespace-nowrap";
            const tdValueClass = "px-4 py-3 text-slate-600 dark:text-slate-300 border-x border-slate-200 dark:border-slate-700 text-right";
            let rowCount = 0;

            while (i < lines.length && lines[i]?.trim() !== '' && !lines[i]?.trim().startsWith('טבלה ') && !lines[i]?.trim().match(/^(#|>|- |\* |\d+\. |---|\*\*\*|___|>>> )/)) {
                currentLine = lines[i].trim();
                const rowClass = rowCount % 2 === 0 ? 'bg-white dark:bg-slate-800/70' : 'bg-slate-50/50 dark:bg-slate-800/40';
                htmlBlocks.push(`<tr class="${rowClass} border-b border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60">`);
                
                let keyFound = false;
                for (const key of KNOWN_TABLE_KEYS_COL1) {
                    if (currentLine.startsWith(key)) {
                        const value = currentLine.substring(key.length).trim();
                        
                        // This is a heuristic to determine if the current line is part of the Bar-Ilan course's detailed content.
                        // It checks if the input 'text' contains the marker from our internal config AND the currentLine.
                        // This is a simplification; a more robust method would involve knowing the source course ID.
                        const isBarIlanTableContextForThisLine =
                            COURSES_DATA_PARSER_INTERNAL_CONFIG.find(c => c.id === 'bar-ilan-acceleration') &&
                            text?.includes(COURSES_DATA_PARSER_INTERNAL_CONFIG[0].detailedContent) && // Check if 'text' is likely Bar-Ilan content
                            text?.includes(currentLine); // Check if currentLine is part of that 'text'

                        const threeColumnCandidateKeys = ["פרטי מבחן כניסה- מועד", "- עלות", "- משך", "- מס' שאלות", "- הגבלות", "- אחוז מעבר", "- פטורים"];
                        const explicitlyTwoColumnKeysForBarIlan = ["מבנה התוכנית", "שם התוכנית", "כיתות יעד", "מטרות התוכנית", "תהליך קבלה"];

                        if (currentLine === "שם התוכניתנוער מוכשר במתמטיקה - בר אילןנוער מוכשר במתמטיקה - בר אילן") {
                             htmlBlocks.push(`<td class="${tdKeyClass}">${applyInlineStyles("שם התוכנית")}</td><td class="${tdValueClass}">${applyInlineStyles("נוער מוכשר במתמטיקה - בר אילן")}</td><td class="${tdValueClass}">${applyInlineStyles("נוער מוכשר במתמטיקה - בר אילן")}</td>`);
                        } else if (isBarIlanTableContextForThisLine && threeColumnCandidateKeys.includes(key)) {
                            const valueParts = value.split(/\s+/);
                            if (valueParts.length > 1) { // Value can be split for a third column
                                htmlBlocks.push(`<td class="${tdKeyClass}">${applyInlineStyles(key)}</td><td class="${tdValueClass}">${applyInlineStyles(valueParts[0] || '')}</td><td class="${tdValueClass}">${applyInlineStyles(valueParts.slice(1).join(' ') || '')}</td>`);
                            } else { // Not enough parts for 3 columns, use 2-column with colspan
                                htmlBlocks.push(`<td class="${tdKeyClass}">${applyInlineStyles(key)}</td><td class="${tdValueClass}" colspan="2">${applyInlineStyles(value)}</td>`);
                            }
                        } else if (isBarIlanTableContextForThisLine && explicitlyTwoColumnKeysForBarIlan.includes(key)) {
                            // These keys are always 2-column (key + value with colspan) in Bar-Ilan table context
                            htmlBlocks.push(`<td class="${tdKeyClass}">${applyInlineStyles(key)}</td><td class="${tdValueClass}" colspan="2">${applyInlineStyles(value)}</td>`);
                        }
                        else { // Default for other tables or keys not specially handled
                            htmlBlocks.push(`<td class="${tdKeyClass}">${applyInlineStyles(key)}</td><td class="${tdValueClass}">${applyInlineStyles(value)}</td>`);
                        }
                        keyFound = true;
                        break;
                    }
                }

                if (!keyFound) { 
                    if (currentLine.match(/^\d/)) { 
                        const stageNum = currentLine.match(/^\d+/)?.[0] || '';
                        let restOfLine = currentLine.substring(stageNum.length);
                        // Naive split for table 4 (Odyssey program stages)
                        const cell1 = restOfLine.substring(0, Math.min(restOfLine.length, 10)); 
                        restOfLine = restOfLine.substring(cell1.length);
                        const cell2 = restOfLine.substring(0, Math.min(restOfLine.length, 40)); 
                        restOfLine = restOfLine.substring(cell2.length);
                        const cell3 = restOfLine.substring(0, Math.min(restOfLine.length, 20)); 
                        const cell4 = restOfLine.substring(cell3.length); 
                        htmlBlocks.push(`<td class="${tdKeyClass}">${applyInlineStyles(stageNum)}</td>
                                         <td class="${tdValueClass}">${applyInlineStyles(cell1)}</td>
                                         <td class="${tdValueClass}">${applyInlineStyles(cell2)}</td>
                                         <td class="${tdValueClass}">${applyInlineStyles(cell3)}</td>
                                         <td class="${tdValueClass}">${applyInlineStyles(cell4)}</td>`);

                    } else {
                         htmlBlocks.push(`<td colspan="5" class="${tdValueClass}">${applyInlineStyles(currentLine)}</td>`); 
                    }
                }
                htmlBlocks.push(`</tr>`);
                i++;
                rowCount++;
            }
            htmlBlocks.push(`</tbody></table></div>`);
            continue;
        }


        if (currentLine.startsWith('#### ')) { htmlBlocks.push(`<h5 class="text-xl font-semibold mt-8 mb-3 text-slate-700 dark:text-slate-200">${applyInlineStyles(currentLine.substring(5))}</h5>`); i++; continue; }
        if (currentLine.startsWith('### ')) { htmlBlocks.push(`<h4 class="text-2xl font-bold mt-10 mb-4 text-slate-800 dark:text-slate-100">${applyInlineStyles(currentLine.substring(4))}</h4>`); i++; continue; }
        if (currentLine.startsWith('## ')) { htmlBlocks.push(`<h3 class="text-3xl font-extrabold mt-12 mb-5 text-slate-800 dark:text-slate-100">${applyInlineStyles(currentLine.substring(3))}</h3>`); i++; continue; }
        if (currentLine.startsWith('# ')) { htmlBlocks.push(`<h2 class="text-4xl font-black mt-10 mb-6 text-slate-900 dark:text-slate-50 tracking-tight">${applyInlineStyles(currentLine.substring(2))}</h2>`); i++; continue; }

        if (currentLine === '---' || currentLine === '***' || currentLine === '___') { htmlBlocks.push('<hr class="my-8 sm:my-10 border-t-2 border-slate-200 dark:border-slate-700/60" />'); i++; continue; }

        if (currentLine.startsWith('* ') || currentLine.startsWith('- ')) {
            let listItems = '';
            while (i < lines.length) {
                const lineTrimmed = lines[i]?.trim();
                if (!lineTrimmed) { i++; break; } // handle end of lines array
                if (lineTrimmed.startsWith('* ') || lineTrimmed.startsWith('- ')) {
                    const itemContent = lineTrimmed.substring(2);
                    listItems += `<li class="py-1">${applyInlineStyles(itemContent)}</li>`;
                    i++;
                } else {
                    break;
                }
            }
            htmlBlocks.push(`<ul class="list-disc list-outside ms-6 my-5 space-y-1 text-slate-700 dark:text-slate-300">${listItems}</ul>`);
            continue;
        }

        if (/^\d+\.\s+/.test(currentLine)) {
            let listItems = '';
            while (i < lines.length) {
                const lineTrimmed = lines[i]?.trim();
                if (!lineTrimmed) { i++; break; }
                if (/^\d+\.\s+/.test(lineTrimmed)) {
                    const itemContent = lineTrimmed.replace(/^\d+\.\s+/, '');
                    listItems += `<li class="py-1">${applyInlineStyles(itemContent)}</li>`;
                    i++;
                } else {
                    break;
                }
            }
            htmlBlocks.push(`<ol class="list-decimal list-outside ms-6 my-5 space-y-1 text-slate-700 dark:text-slate-300">${listItems}</ol>`);
            continue;
        }
        
        // Paragraphs
        let paraLines: string[] = [];
        while (i < lines.length) {
            const lineTrimmed = lines[i]?.trim();
            if (lineTrimmed === '' || lineTrimmed.match(/^(#|>|- |\* |\d+\. |---|\*\*\*|___|>>> |טבלה)/)) {
                break; 
            }
            paraLines.push(applyInlineStyles(lineTrimmed));
            i++;
        }
        if (paraLines.length > 0) {
            htmlBlocks.push(`<p class="text-base text-slate-700 dark:text-slate-300 leading-relaxed my-4 hyphens-auto text-justify break-words">${paraLines.join(' ')}</p>`);
        }
    }
    return htmlBlocks.join('\n');
};
