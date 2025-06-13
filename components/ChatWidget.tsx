import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { MessageSquare, Send } from 'lucide-react';
import Button from './ui/Button';
import { useAuth } from '../contexts/AuthContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

import { APP_NAME, ARTICLES_DATA, COURSES_DATA, FAQ_DATA, PREVIEW_SECTIONS } from '../constants.tsx';
import { supabase } from '../utils/supabaseClient';
import { Article, Course, FAQCategory } from '../types.ts';

// Supabase client is imported

// Simple chat widget using Gemini API
const GEMINI_API_KEYS = [
  'AIzaSyD5YKvEiSeUPy3HhHjKmvkhB-f6kr1mtKo',
  'AIzaSyAqgGxBFKXGAbwGOUpXr0ywY2IryANPEBE',
  'AIzaSyC1E7-eJZ4JY1oLQ9r6d9p5ocxS4KO_-40',
];
const GEMINI_MODEL = 'gemini-2.0-flash-thinking-exp';

interface Message {
  role: 'user' | 'ai';
  text: string;
}

const ChatWidget: React.FC = () => {
  const { t } = useTranslation();
  const { session, user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  // New state variables
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  // const [showAdminPanel, setShowAdminPanel] = useState(false); // Removed
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  // const [articleTitle, setArticleTitle] = useState(''); // Removed
  // const [articleBody, setArticleBody] = useState(''); // Removed
  // const [questionText, setQuestionText] = useState(''); // Removed
  // const [answerText, setAnswerText] = useState(''); // Removed
  const [adminError, setAdminError] = useState('');
  // const [submissionStatus, setSubmissionStatus] = useState(''); // Removed
  // const [isSubmitting, setIsSubmitting] = useState(false); // Removed, or rename if login needs specific loading

  const initialAiMessage = t('chatWidget.initialAiMessage', "שלום לך! \n במה אנו יכולים לעזור לך היום?");

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

  const sendTelegramMessageToOwner = async (messageContent: string) => {
    if (!user?.email || !profile?.fullName) {
      console.error('User email or profile name is missing. Cannot send Telegram message.');
      setMessages(prev => [...prev, { role: 'ai', text: t('chatWidget.errorUserInfoMissing', 'שגיאה: פרטי המשתמש שלך (שם ואימייל) חסרים. לא ניתן לשלוח הודעה כעת.') }]);
      return;
    }

    setMessages(prev => [...prev, { role: 'ai', text: t('chatWidget.statusSendingToOwner', 'שולח הודעה לבעלי האתר...') }]);

    const TELEGRAM_WORKER_URL = 'https://machon.hillelben14.workers.dev/send-telegram'; // Conceptual endpoint

    try {
      const response = await fetch(TELEGRAM_WORKER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profile.fullName,
          email: user.email,
          message: messageContent,
        }),
      });

      // Assuming the worker returns { success: true } or an error object
      const result = await response.json();

      if (response.ok && result.success) {
        setMessages(prev => [...prev, { role: 'ai', text: t('chatWidget.telegramSuccess', 'ההודעה שלך נשלחה בהצלחה לבעלי האתר.') }]);
      } else {
        console.error('Failed to send Telegram message:', result);
        setMessages(prev => [...prev, { role: 'ai', text: t('chatWidget.telegramErrorResult', `אירעה שגיאה בשליחת ההודעה: ${result.error || 'נסה שנית מאוחר יותר.'}`, { error: result.error || t('chatWidget.tryAgainLater', 'נסה שנית מאוחר יותר.')}) }]);
      }
    } catch (error) {
      console.error('Error sending Telegram message:', error);
      setMessages(prev => [...prev, { role: 'ai', text: t('chatWidget.telegramErrorCritical', 'אירעה שגיאה קריטית בשליחת ההודעה. אנא בדוק את חיבור האינטרנט שלך ונסה שוב.') }]);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    if (input.trim().toLowerCase() === 'admin') {
      setMessages([]);
      setShowAdminLogin(true);
      setInput('');
      // Optionally, close the chat widget if you want admin login to take full focus
      // setOpen(false);
      return;
    }

    const userMsg = { role: 'user', text: input } as Message;
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    const appNameTranslated = t('appName', APP_NAME);
    const baseSystemPrompt = t('chatWidget.systemPrompt.roleDescription', `אתה נציג שירות לקוחות באתר של '${appNameTranslated}'. שמך הוא 'נציג מכון אביב'.`, { appName: appNameTranslated }) + "\n" +
      t('chatWidget.systemPrompt.goal', 'המטרה שלך היא לסייע למשתמשים עם שאלותיהם לגבי המכון, הקורסים שלנו, המאמרים, ותכנים נוספים באתר.') + "\n" +
      t('chatWidget.systemPrompt.behavior', 'עליך להתנהג בצורה מקצועית, ידידותית ועוזרת.') + "\n" +
      t('chatWidget.systemPrompt.identityConstraint', `**שים לב היטב להקשר מהדף הנוכחי בו המשתמש נמצא (יינתן לך בהמשך) ולהיסטוריית השיחה המלאה כדי לספק תשובות מדויקות ורלוונטיות.**\nבשום פנים ואופן אל תזכיר שאתה מודל שפה, בינה מלאכותית, או שנוצרת על ידי גוגל. אתה אך ורק נציג שירות של '${appNameTranslated}'.`, { appName: appNameTranslated }) + "\n" +
      t('chatWidget.systemPrompt.siteOfferings', 'האתר מציע קורסי הכנה למבחני מחוננים ותוכניות הצטיינות, מאמרים מקצועיים בתחום, וחנות מוצרים.') + "\n" +
      t('chatWidget.systemPrompt.markdownUsage', 'אנא השתמש ב-Markdown לעיצוב התשובות שלך כאשר זה רלוונטי ומוסיף ערך. לדוגמה, השתמש ב-**כדי להדגיש טקסט**, ב-*טקסט נטוי* לטקסט נטוי, וברשימות (באמצעות כוכביות * או מקפים -) כאשר אתה מציג מספר פריטים. היוזמה לשימוש ב-Markdown היא שלך כאשר אתה חושב שזה ישפר את קריאות התשובה.\nWhen creating bulleted lists, ensure you use an asterisk (*) or a hyphen (-) followed by a space, then the list item text. For example: `* First item` or `- Second item`.\n\nCorrect Bullet List Formatting:\n* Item 1\n* Item 2\n  - Nested Item A (use two spaces for indentation then asterisk/hyphen)\n- Another Item\n\nExtended Markdown Formatting Guide:\nIn addition to bold, italics, and basic lists, you can use the following Markdown features to enhance your responses:\n\n1.  **Headings:**\n    # H1 Heading\n    ## H2 Heading\n    ### H3 Heading\n    #### H4 Heading\n    ##### H5 Heading\n    ###### H6 Heading\n\n2.  **Numbered Lists:**\n    1. First item\n    2. Second item\n    3. Third item\n       1. Nested item (indent with 3 spaces)\n\n3.  **Tables (GFM):**\n    | Header 1 | Header 2 | Header 3 |\n    | :------- | :------: | -------: |\n    | Align-L  | Center   | Align-R  |\n    | Cell 2   | Cell 3   | Cell 4   |\n\n4.  **Blockquotes:**\n    > This is a blockquote.\n    > It can span multiple lines.\n\n5.  **Inline Code:**\n    Use backticks for inline code, like `const example = "hello";`.\n\n6.  **Horizontal Rules:**\n    Use three or more hyphens, asterisks, or underscores:\n    ---\n    ***\n    ___\n\n7.  **Strikethrough:**\n    Use two tildes for ~~strikethrough text~~.\n\n8.  **Task Lists (GFM):**\n    * [x] Completed task\n    * [ ] Incomplete task\n    * [ ] Another task\n      * [x] Nested completed task\nUse these features judiciously to improve the clarity and presentation of your answers.\n\nCreating Navigation Buttons:\nYou can create special links that will be rendered as clickable buttons for navigating within the site. This is useful for guiding users to relevant pages.\nTo create a navigation button, use the following Markdown syntax:\n`[Button Text](URL "nav-button")`\n\n-   `Button Text`: The text that will appear on the button.\n-   `URL`: The relative path for navigation (e.g., `/courses`, `/about`, `/article/some-id`). **Must be a relative path.**\n-   `"nav-button"`: The title attribute must be exactly "nav-button" (including the quotes in the Markdown link definition).\n\nExamples:\n-   To direct a user to the main courses page: `[${t('chatWidget.systemPrompt.navButtonExampleCourses', 'לרשימת הקורסים המלאה')}](/courses "nav-button")`\n-   To link to a specific article: `[${t('chatWidget.systemPrompt.navButtonExampleArticle', 'קרא עוד על המאמר בנושא X')}](/article/article-x-id "nav-button")`\n-   To suggest navigating to the "About Us" page: `[${t('chatWidget.systemPrompt.navButtonExampleAbout', 'עבור לדף אודותינו')}](/about "nav-button")`\n\nOffer these navigation buttons when it's helpful for the user, such as after providing information that has a corresponding page on the site, or when the user asks for directions to a specific section. Only use relative paths for these buttons. For external links, use standard Markdown links which will open in a new tab.\n');

    let currentSystemPrompt = baseSystemPrompt;

    if (session && user && profile?.fullName && user?.email) {
      // The content of loggedInInstructions is highly technical and might not need direct translation,
      // but if parts of it are user-facing or need to be understood by a non-English speaking developer,
      // then those specific parts would need translation. For now, keeping as is for system functionality.
      const loggedInInstructions = `\n\n**Special Capability: Sending Messages to Site Owner**
You have a special ability: if the user asks you to send a message to the website owner or administrator, you can do this. The message will be sent via Telegram.
When you use this ability, their name ('${profile.fullName}') and email ('${user.email}') will be automatically included with their message.
To initiate this, after confirming the message content with the user, your *entire response to the system* must be ONLY the following command on a new line, without any other text before or after it:
\`\`\`
ACTION_SEND_TELEGRAM_MESSAGE_TO_OWNER: {message_content_here}
\`\`\`
Replace \`{message_content_here}\` with the exact message the user wants to send. Do not include their name or email in \`{message_content_here}\` as it will be added automatically by the system.
For example, if the user says 'Tell the owner I need help with course X', you should first confirm the message with them. If they agree, your *entire response to the system* should be ONLY the command, like this:
\`\`\`
ACTION_SEND_TELEGRAM_MESSAGE_TO_OWNER: I need help with course X
\`\`\`
Only use this command when the user explicitly wants to send a message to the owner and has confirmed its content. Do not offer this proactively unless they are trying to contact the owner. If the user is not logged in, or if their name/email is missing, you cannot use this feature.`;
      currentSystemPrompt += loggedInInstructions;
    }

    let pageContext = "";
    const currentPath = location.pathname;

    const getArticleById = (id: string): Article | undefined => ARTICLES_DATA.find(article => article.id === id);

    if (currentPath === "/") {
        pageContext = t('chatWidget.pageContext.home', `המשתמש נמצא כעת בדף הבית. דף הבית מציג מידע כללי על המכון, תצוגה מקדימה של קורסים ומאמרים. עודד אותו לשאול על הקורסים או על נושאים ספציפיים שמעניינים אותו.`);
    } else if (currentPath === "/about") {
        const aboutSection = PREVIEW_SECTIONS.find(s => s.id === 'about-preview');
        pageContext = t('chatWidget.pageContext.about', `המשתמש נמצא כעת בדף 'אודותינו'. דף זה מתאר את '${appNameTranslated}': ${aboutSection?.description}. ניתן גם למצוא בו מידע על צוות המכון והניסיון שלנו.`, { appName: appNameTranslated, description: aboutSection?.description });
    } else if (currentPath === "/courses") {
        const courseTitlesList = COURSES_DATA.map(c => c.title).join('\n- ');
        pageContext = t('chatWidget.pageContext.courses', `המשתמש נמצא כעת בדף 'הקורסים שלנו'. רשימת הקורסים שאנו מציעים:\n- ${courseTitlesList}\nניתן לשאול על כל קורס באופן ספציפי, למשל מה הוא כולל, למי הוא מיועד, מה המחיר וכו'.`, { courseTitlesList });
    } else if (currentPath === "/articles") {
        const articleTitles = ARTICLES_DATA.map(article => article.title).join('\n- ');
        pageContext = t('chatWidget.pageContext.articles', `המשתמש נמצא כעת בדף המאמרים הראשי. רשימת המאמרים הזמינים באתר:\n- ${articleTitles}\nניתן לשאול על כל אחד מהמאמרים הללו.`, { articleTitles });
    } else if (currentPath.startsWith("/article/")) {
        const articleId = currentPath.split("/article/")[1];
        const article = getArticleById(articleId);
        if (article) {
            pageContext = t('chatWidget.pageContext.articleDetail', `המשתמש נמצא כעת בדף המאמר '${article.title}'. תקציר המאמר: ${article.excerpt}. ניתן לשאול על פרטים נוספים מהמאמר.`, { title: article.title, excerpt: article.excerpt });
        } else {
            pageContext = t('chatWidget.pageContext.articleNotFound', `המשתמש נמצא כעת בדף מאמר, אך המאמר הספציפי לא זוהה.`);
        }
    } else if (currentPath === "/faq") {
        const allFaqQuestions = FAQ_DATA.flatMap(category => category.questions.map(q => q.question)).join('\n- ');
        pageContext = t('chatWidget.pageContext.faq', `המשתמש נמצא כעת בדף 'שאלות נפוצות'. רשימת השאלות הנפוצות באתר:\n- ${allFaqQuestions}\nניתן לשאול על כל אחת מהשאלות הללו.`, { allFaqQuestions });
    } else if (currentPath === "/contact") {
        pageContext = t('chatWidget.pageContext.contact', `המשתמש נמצא כעת בדף 'צור קשר'. בדף זה ניתן למצוא את פרטי ההתקשרות שלנו ולשלוח פנייה.`);
    } else if (currentPath === "/shop") {
        pageContext = t('chatWidget.pageContext.shop', `המשתמש נמצא כעת בדף החנות. בדף זה ניתן לרכוש את קורסי ההכנה שלנו ומוצרים נוספים.`);
    }

    const apiPayloadContents = [
        {
            role: 'user' as const,
            parts: [{ text: `${currentSystemPrompt}\n\nמידע על הדף הנוכחי: ${pageContext}` }],
        },
        {
            role: 'model' as const,
            parts: [{ text: t('chatWidget.initialModelResponse', 'הבנתי את ההקשר. כיצד אוכל לסייע לך?') }],
        },
        ...updatedMessages.map(msg => ({
            role: msg.role === 'ai' ? 'model' : 'user',
            parts: [{ text: msg.text }],
        })),
    ];

    const shuffledKeys = [...GEMINI_API_KEYS].sort(() => Math.random() - 0.5);
    let responseText: string | null = null;
    for (let attempt = 0; attempt < 5 && !responseText; attempt++) {
      const key = shuffledKeys[attempt % shuffledKeys.length];
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: apiPayloadContents }),
          }
        );

        if (res.ok) {
          const data = await res.json();
          responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || null;
        }
      } catch {
        // ignore and try next key
      }
    }

    setLoading(false); // AI has responded

    const commandPrefix = 'ACTION_SEND_TELEGRAM_MESSAGE_TO_OWNER:';
    if (responseText && responseText.trim().startsWith(commandPrefix)) {
        const messageContent = responseText.trim().substring(commandPrefix.length).trim();
        await sendTelegramMessageToOwner(messageContent);
    } else if (responseText) { // Ensure responseText is not null before adding
        setMessages(prev => [...prev, { role: 'ai', text: responseText }]);
    } else { // Handle case where responseText is null (error from Gemini)
        setMessages(prev => [...prev, { role: 'ai', text: t('chatWidget.errorAiCommunication', '❌ אירעה שגיאה בתקשורת עם ה-AI.') }]);
    }
  };

  const handleAdminLoginSubmit = () => {
    if (adminPasswordInput === '8725') {
      sessionStorage.setItem('isAdminAuthenticated', 'true');
      setAdminPasswordInput(''); // Clear password input
      setAdminError(''); // Clear any previous error
      setShowAdminLogin(false); // Hide login form
      setOpen(false); // Close chat widget
      navigate('/admin'); // Navigate to admin page
    } else {
      setAdminError(t('chatWidget.adminLogin.errorWrongPassword', 'סיסמה שגויה. נסה שוב.'));
    }
  };

  // Removed handleArticleSubmit
  // Removed handleQASubmit
  // Removed resetAdminPanelStates

  const resetAdminLoginStates = () => {
    setShowAdminLogin(false);
    setAdminError('');
    setAdminPasswordInput('');
  };


  return (
    // -- 🎨 MODIFIED LINE --
    // This container is now full-width on mobile with padding, and aligns items to the center.
    // On desktop, it reverts to the original corner positioning.
<div className="fixed inset-x-2 bottom-2 sm:inset-x-auto sm:right-4 sm:bottom-4 z-50 flex flex-col items-start" dir="rtl">
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
              <h3 className="text-primary dark:text-sky-400 font-semibold text-lg">
                {showAdminLogin ? t('chatWidget.headerAdminLogin', 'Admin Login') : t('chatWidget.headerDefault', 'נציג מכון אביב')}
              </h3>
              <button
                onClick={() => {
                  setOpen(false);
                  if (showAdminLogin) resetAdminLoginStates();
                  // if (showAdminPanel) resetAdminPanelStates(); // Removed
                }}
                aria-label={t('chatWidget.closeButtonAriaLabel', "סגור")}
                className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {showAdminLogin ? (
              <div className="p-6 flex flex-col gap-y-5 items-center justify-center h-full">
                <h4 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">{t('chatWidget.adminLogin.title', 'התחברות למערכת ניהול')}</h4>
                <input
                  type="password"
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdminLoginSubmit()}
                  placeholder={t('chatWidget.adminLogin.passwordPlaceholder', "הכנס סיסמה")}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary dark:bg-slate-700 dark:text-white text-right"
                />
                <Button onClick={handleAdminLoginSubmit} className="w-full bg-primary hover:bg-primary-dark text-white py-2.5">
                  {t('chatWidget.adminLogin.loginButton', 'התחבר')}
                </Button>
                {adminError && <p className="text-red-500 text-sm mt-1 text-center">{adminError}</p>}
              </div>
            ) : (
              <>
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
                  {loading && <div className="p-3 text-center text-xs text-gray-400 dark:text-gray-500">{t('chatWidget.loadingMessage', 'מטעין...')}</div>}
                </div>
                <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2">
                  <input
                    className="flex-grow bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none dark:placeholder-gray-400"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    placeholder={t('chatWidget.inputPlaceholder', "כתבו הודעה...")}
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={sendMessage}
                    disabled={loading}
                    className="bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-md px-4 py-2 text-sm disabled:opacity-60 transition-colors duration-150 flex items-center justify-center"
                  >
                    <span className="mr-2">{t('chatWidget.sendButton', 'שלח')}</span>
                    <Send size={18} />
                  </motion.button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(o => !o)}
        className="bg-gradient-to-br from-primary to-primary-dark text-white rounded-full p-3 shadow-xl focus:outline-none flex items-center"
      >
        <span className="ml-2">{t('chatWidget.toggleButton', 'צ\'אט')}</span>
        <MessageSquare size={24} />
      </motion.button>
    </div>
  );
};

export default ChatWidget;
