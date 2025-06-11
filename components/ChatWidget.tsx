import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, Link } from 'react-router-dom';
import { MessageSquare, Send } from 'lucide-react';
import Button from './ui/Button';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

import { APP_NAME, ARTICLES_DATA, COURSES_DATA, FAQ_DATA, PREVIEW_SECTIONS } from '../constants.tsx';
import { Article, Course, FAQCategory } from '../types.ts';

// Simple chat widget using Gemini API
const GEMINI_API_KEY = 'AIzaSyA4TppVdydykoU7bCPGr-IeyAbhCJZQDBM';
const GEMINI_MODEL = 'gemini-2.0-flash-thinking-exp';

interface Message {
  role: 'user' | 'ai';
  text: string;
}

const ChatWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const messagesRef = useRef<HTMLDivElement | null>(null);

  const initialAiMessage = "שלום לך! \n במה אנו יכולים לעזור לך היום?";

  useEffect(() => {
    const container = messagesRef.current;
    if (container) {
      // גלילה אוטומטית לסוף
      container.scrollTop = container.scrollHeight;
    }

    if (open && messages.length === 0) {
      setMessages([{ role: 'ai', text: initialAiMessage }]);
    }
  }, [messages, open]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', text: input } as Message;
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    const baseSystemPrompt = `אתה נציג שירות לקוחות באתר של '${APP_NAME}'. שמך הוא 'נציג מכון אביב'.
    המטרה שלך היא לסייע למשתמשים עם שאלותיהם לגבי המכון, הקורסים שלנו, המאמרים, ותכנים נוספים באתר.
    עליך להתנהג בצורה מקצועית, ידידותית ועוזרת.
    **שים לב היטב להקשר מהדף הנוכחי בו המשתמש נמצא (יינתן לך בהמשך) ולהיסטוריית השיחה המלאה כדי לספק תשובות מדויקות ורלוונטיות.**
    בשום פנים ואופן אל תזכיר שאתה מודל שפה, בינה מלאכותית, או שנוצרת על ידי גוגל. אתה אך ורק נציג שירות של '${APP_NAME}'.
    האתר מציע קורסי הכנה למבחני מחוננים ותוכניות הצטיינות, מאמרים מקצועיים בתחום, וחנות מוצרים.
    אנא השתמש ב-Markdown לעיצוב התשובות שלך כאשר זה רלוונטי ומוסיף ערך. לדוגמה, השתמש ב-**כדי להדגיש טקסט**, ב-*טקסט נטוי* לטקסט נטוי, וברשימות (באמצעות כוכביות * או מקפים -) כאשר אתה מציג מספר פריטים. היוזמה לשימוש ב-Markdown היא שלך כאשר אתה חושב שזה ישפר את קריאות התשובה.
    When creating bulleted lists, ensure you use an asterisk (*) or a hyphen (-) followed by a space, then the list item text. For example: \`* First item\` or \`- Second item\`.

    Correct Bullet List Formatting:
    * Item 1
    * Item 2
      - Nested Item A (use two spaces for indentation then asterisk/hyphen)
    - Another Item

    Extended Markdown Formatting Guide:
    In addition to bold, italics, and basic lists, you can use the following Markdown features to enhance your responses:

    1.  **Headings:**
        # H1 Heading
        ## H2 Heading
        ### H3 Heading
        #### H4 Heading
        ##### H5 Heading
        ###### H6 Heading

    2.  **Numbered Lists:**
        1. First item
        2. Second item
        3. Third item
           1. Nested item (indent with 3 spaces)

    3.  **Tables (GFM):**
        | Header 1 | Header 2 | Header 3 |
        | :------- | :------: | -------: |
        | Align-L  | Center   | Align-R  |
        | Cell 2   | Cell 3   | Cell 4   |

    4.  **Blockquotes:**
        > This is a blockquote.
        > It can span multiple lines.

    5.  **Inline Code:**
        Use backticks for inline code, like \`const example = "hello";\`.

    6.  **Horizontal Rules:**
        Use three or more hyphens, asterisks, or underscores:
        ---
        ***
        ___

    7.  **Strikethrough:**
        Use two tildes for ~~strikethrough text~~.

    8.  **Task Lists (GFM):**
        * [x] Completed task
        * [ ] Incomplete task
        * [ ] Another task
          * [x] Nested completed task
    Use these features judiciously to improve the clarity and presentation of your answers.

    Creating Navigation Buttons:
    You can create special links that will be rendered as clickable buttons for navigating within the site. This is useful for guiding users to relevant pages.
    To create a navigation button, use the following Markdown syntax:
    \`[Button Text](URL "nav-button")\`

    -   \`Button Text\`: The text that will appear on the button.
    -   \`URL\`: The relative path for navigation (e.g., \`/courses\`, \`/about\`, \`/article/some-id\`). **Must be a relative path.**
    -   \`"nav-button"\`: The title attribute must be exactly "nav-button" (including the quotes in the Markdown link definition).

    Examples:
    -   To direct a user to the main courses page: \`[לרשימת הקורסים המלאה](/courses "nav-button")\`
    -   To link to a specific article: \`[קרא עוד על המאמר בנושא X](/article/article-x-id "nav-button")\`
    -   To suggest navigating to the "About Us" page: \`[עבור לדף אודותינו](/about "nav-button")\`

    Offer these navigation buttons when it's helpful for the user, such as after providing information that has a corresponding page on the site, or when the user asks for directions to a specific section. Only use relative paths for these buttons. For external links, use standard Markdown links which will open in a new tab.
    `;

    let pageContext = "";
    const currentPath = location.pathname;

    const getArticleById = (id: string): Article | undefined => ARTICLES_DATA.find(article => article.id === id);

    if (currentPath === "/") {
        pageContext = `המשתמש נמצא כעת בדף הבית. דף הבית מציג מידע כללי על המכון, תצוגה מקדימה של קורסים ומאמרים. עודד אותו לשאול על הקורסים או על נושאים ספציפיים שמעניינים אותו.`;
    } else if (currentPath === "/about") {
        const aboutSection = PREVIEW_SECTIONS.find(s => s.id === 'about-preview');
        pageContext = `המשתמש נמצא כעת בדף 'אודותינו'. דף זה מתאר את '${APP_NAME}': ${aboutSection?.description}. ניתן גם למצוא בו מידע על צוות המכון והניסיון שלנו.`;
    } else if (currentPath === "/courses") {
        const courseTitlesList = COURSES_DATA.map(c => c.title).join('\n- ');
        pageContext = `המשתמש נמצא כעת בדף 'הקורסים שלנו'. רשימת הקורסים שאנו מציעים:
- ${courseTitlesList}
ניתן לשאול על כל קורס באופן ספציפי, למשל מה הוא כולל, למי הוא מיועד, מה המחיר וכו'.`;
    } else if (currentPath === "/articles") {
        const articleTitles = ARTICLES_DATA.map(article => article.title).join('\n- ');
        pageContext = `המשתמש נמצא כעת בדף המאמרים הראשי. רשימת המאמרים הזמינים באתר:
- ${articleTitles}
ניתן לשאול על כל אחד מהמאמרים הללו.`;
    } else if (currentPath.startsWith("/article/")) {
        const articleId = currentPath.split("/article/")[1];
        const article = getArticleById(articleId);
        if (article) {
            pageContext = `המשתמש נמצא כעת בדף המאמר '${article.title}'. תקציר המאמר: ${article.excerpt}. ניתן לשאול על פרטים נוספים מהמאמר.`;
        } else {
            pageContext = `המשתמש נמצא כעת בדף מאמר, אך המאמר הספציפי לא זוהה.`;
        }
    } else if (currentPath === "/faq") {
        const allFaqQuestions = FAQ_DATA.flatMap(category => category.questions.map(q => q.question)).join('\n- ');
        pageContext = `המשתמש נמצא כעת בדף 'שאלות נפוצות'. רשימת השאלות הנפוצות באתר:
- ${allFaqQuestions}
ניתן לשאול על כל אחת מהשאלות הללו.`;
    } else if (currentPath === "/contact") {
        pageContext = `המשתמש נמצא כעת בדף 'צור קשר'. בדף זה ניתן למצוא את פרטי ההתקשרות שלנו ולשלוח פנייה.`;
    } else if (currentPath === "/shop") {
        pageContext = `המשתמש נמצא כעת בדף החנות. בדף זה ניתן לרכוש את קורסי ההכנה שלנו ומוצרים נוספים.`;
    }

    const apiPayloadContents = [
        {
            role: 'user' as const,
            parts: [{ text: `${baseSystemPrompt}\n\nמידע על הדף הנוכחי: ${pageContext}` }],
        },
        {
            role: 'model' as const,
            parts: [{ text: 'הבנתי את ההקשר. כיצד אוכל לסייע לך?' }],
        },
        ...updatedMessages.map(msg => ({
            role: msg.role === 'ai' ? 'model' : 'user',
            parts: [{ text: msg.text }],
        })),
    ];

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: apiPayloadContents }),
        }
      );
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '❌ אירעה שגיאה';
      setMessages(prev => [...prev, { role: 'ai', text }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: '❌ אירעה שגיאה' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    // -- 🎨 MODIFIED LINE --
    // This container is now full-width on mobile with padding, and aligns items to the center.
    // On desktop, it reverts to the original corner positioning.
    <div className="fixed inset-x-2 bottom-2 sm:inset-x-auto sm:right-4 sm:bottom-4 z-50 flex flex-col items-center sm:items-end" dir="rtl">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 250, damping: 25 }}
            // -- 🎨 MODIFIED LINE --
            // Width is now `w-full` on mobile to fill the parent, with a robust `max-h` calculation.
            // On desktop (`sm:`), it uses a fixed width. `sm:right-0` ensures it's aligned correctly on desktop.
            className="w-full sm:w-96 h-[70vh] sm:h-[550px] max-h-[calc(100vh-120px)] bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col absolute bottom-full sm:right-0 mb-2"
          >
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-primary dark:text-sky-400 font-semibold text-lg">נציג מכון אביב</h3>
              <button onClick={() => setOpen(false)} aria-label="סגור" className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors">
                ✕
              </button>
            </div>
            <div ref={messagesRef} className="flex-grow p-4 space-y-3 overflow-y-auto">
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: m.role === 'user' ? 50 : -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className={`p-3 rounded-md max-w-[85%] text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-sky-500 text-white ml-auto text-right whitespace-pre-wrap'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 mr-auto text-right'
                  }`}
                >
                  {m.role === 'user' ? (
                    m.text
                  ) : (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                      className="prose prose-sm dark:prose-invert max-w-none"
                      components={{
                        a: (props: any) => {
                          const { href, children, title, ...rest } = props;
                          const isNavButton = title === 'nav-button';
                          const isRelative = href && !href.startsWith('http://') && !href.startsWith('https://');

                          if (isNavButton && isRelative) {
                            return (
                              <Button variant="outline" size="sm" className="my-1 text-sm dark:text-sky-400 dark:hover:text-sky-300" asChild>
                                <Link to={href} {...rest} onClick={() => setOpen(false)}>
                                  {children}
                                </Link>
                              </Button>
                            );
                          }

                          return (
                            <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
                              {children}
                            </a>
                          );
                        }
                      }}
                    >
                      {m.text}
                    </ReactMarkdown>
                  )}
                </motion.div>
              ))}
              {loading && <div className="p-3 text-center text-xs text-gray-400 dark:text-gray-500">מטעין...</div>}
            </div>
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2">
              <input
                className="flex-grow bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none dark:placeholder-gray-400"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="כתבו הודעה..."
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={sendMessage}
                disabled={loading}
                className="bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-md px-4 py-2 text-sm disabled:opacity-60 transition-colors duration-150 flex items-center justify-center"
              >
                <span className="mr-2">שלח</span>
                <Send size={18} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(o => !o)}
        className="bg-gradient-to-br from-primary to-primary-dark text-white rounded-full p-3 shadow-xl focus:outline-none flex items-center"
      >
        <span className="ml-2">צ'אט</span>
        <MessageSquare size={24} />
      </motion.button>
    </div>
  );
};

export default ChatWidget;
