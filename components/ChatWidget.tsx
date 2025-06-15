import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { MessageSquare, Send } from 'lucide-react';
import Button from './ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { useDarkMode } from '../hooks/useDarkMode';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

import { APP_NAME, ARTICLES_DATA, COURSES_DATA, FAQ_DATA, PREVIEW_SECTIONS } from '../constants.tsx';
import { supabase } from '../utils/supabaseClient';
import { Article, Course, FAQCategory } from '../types.ts';
import { useData } from '../contexts/DataContext';

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
  const { session, user, profile } = useAuth();
  const { articles } = useData();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const { toggleDarkMode, darkMode } = useDarkMode();

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

  const [chatWidth, setChatWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('chatWidth');
      return stored ? parseInt(stored, 10) : 384; // default 24rem (w-96)
    }
    return 384;
  });

  const [chatHeight, setChatHeight] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('chatHeight');
      return stored ? parseInt(stored, 10) : 550;
    }
    return 550;
  });

  const resizingRef = useRef(false);
  const startPos = useRef<{x:number,y:number,width:number,height:number}>();

  const handleResizeStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if (window.innerWidth < 640) return; // disable on mobile
    resizingRef.current = true;
    startPos.current = { x: e.clientX, y: e.clientY, width: chatWidth, height: chatHeight };
    window.addEventListener('mousemove', handleResizing);
    window.addEventListener('mouseup', handleResizeEnd);
  };

  const handleResizing = (e: MouseEvent) => {
    if (!resizingRef.current || !startPos.current) return;
    const deltaX = startPos.current.x - e.clientX;
    const deltaY = startPos.current.y - e.clientY;
    setChatWidth(Math.max(320, startPos.current.width + deltaX));
    setChatHeight(Math.max(400, startPos.current.height + deltaY));
  };

  const handleResizeEnd = () => {
    resizingRef.current = false;
    window.removeEventListener('mousemove', handleResizing);
    window.removeEventListener('mouseup', handleResizeEnd);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('chatWidth', String(chatWidth));
      localStorage.setItem('chatHeight', String(chatHeight));
    }
  }, [chatWidth, chatHeight]);

  const initialAiMessage = "שלום לך! \n במה אנו יכולים לעזור לך היום?";

  const SITE_SEARCH_COMMAND_PREFIX = 'ACTION_PERFORM_SITE_SEARCH:';
  const PUBLIC_CONTACT_MESSAGE_PREFIX = 'ACTION_SEND_PUBLIC_CONTACT_MESSAGE:';

  const performSiteSearch = async (query: string): Promise<string> => {
    const lowerQuery = query.toLowerCase();
    let resultText = "";
    let totalResults = 0;

    // Search Articles
    const articleResults = ARTICLES_DATA.filter(article =>
      article.title.toLowerCase().includes(lowerQuery) ||
      article.excerpt.toLowerCase().includes(lowerQuery) ||
      (article.fullContent && article.fullContent.toLowerCase().includes(lowerQuery))
    ).slice(0, 3); // Max 3 articles

    if (articleResults.length > 0) {
      totalResults += articleResults.length;
      resultText += `**מאמרים:**\n${articleResults.map(article => `* [${article.title}](/article/${article.id} "nav-button")`).join('\n')}\n\n`;
    }

    // Search Courses
    const courseResults = COURSES_DATA.filter(course =>
      course.title.toLowerCase().includes(lowerQuery) ||
      course.description.toLowerCase().includes(lowerQuery) ||
      (course.detailedContent && course.detailedContent.toLowerCase().includes(lowerQuery))
    ).slice(0, 2); // Max 2 courses

    if (courseResults.length > 0) {
      totalResults += courseResults.length;
      resultText += `**קורסים:**\n${courseResults.map(course => `* **קורס:** [${course.title}](${course.links?.[0]?.href || '/shop'} "nav-button") - ${course.description.substring(0, 100)}...`).join('\n')}\n\n`;
    }

    // Search FAQs
    const faqResults: { question: string, answer: string, category: string }[] = [];
    FAQ_DATA.forEach(category => {
      category.questions.forEach(qa => {
        if (faqResults.length < 2 && (qa.question.toLowerCase().includes(lowerQuery) || qa.answer.toLowerCase().includes(lowerQuery))) {
          faqResults.push({ question: qa.question, answer: qa.answer, category: category.categoryName });
        }
      });
    }); // Max 2 FAQs

    if (faqResults.length > 0) {
      totalResults += faqResults.length;
      resultText += `**שאלות נפוצות:**\n${faqResults.map(faq => `* **שאלה (${faq.category}):** ${faq.question} - *תשובה:* ${faq.answer.substring(0, 100)}...`).join('\n')}\n\n`;
    }

    if (totalResults > 0) {
      return `נמצאו ${totalResults} תוצאות באתר בנושא "${query}":\n\n${resultText}תוכל ללחוץ על הקישורים לקריאה נוספת.`;
    } else {
      return `לא נמצאו תוצאות רלוונטיות באתר בנושא '${query}'.`;
    }
  };

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
      setMessages(prev => [...prev, { role: 'ai', text: 'שגיאה: פרטי המשתמש שלך (שם ואימייל) חסרים. לא ניתן לשלוח הודעה כעת.' }]);
      return;
    }

    setMessages(prev => [...prev, { role: 'ai', text: 'שולח הודעה לבעלי האתר...' }]);

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
        setMessages(prev => [...prev, { role: 'ai', text: 'ההודעה שלך נשלחה בהצלחה לבעלי האתר.' }]);
      } else {
        console.error('Failed to send Telegram message:', result);
        setMessages(prev => [...prev, { role: 'ai', text: `אירעה שגיאה בשליחת ההודעה: ${result.error || 'נסה שנית מאוחר יותר.'}` }]);
      }
    } catch (error) {
      console.error('Error sending Telegram message:', error);
      setMessages(prev => [...prev, { role: 'ai', text: 'אירעה שגיאה קריטית בשליחת ההודעה. אנא בדוק את חיבור האינטרנט שלך ונסה שוב.' }]);
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

    const baseSystemPrompt = `אתה נציג שירות לקוחות באתר של '${APP_NAME}'. שמך הוא 'נציג מכון אביב'.
    המטרה שלך היא לסייע למשתמשים עם שאלותיהם לגבי המכון, הקורסים שלנו, המאמרים, ותכנים נוספים באתר.
    עליך להתנהג בצורה מקצועית, ידידותית, פרואקטיבית ועוזרת.

    **שים לב היטב להקשר מהדף הנוכחי בו המשתמש נמצא (יינתן לך בהמשך) ולהיסטוריית השיחה המלאה כדי לספק תשובות מדויקות ורלוונטיות.**
    כאשר המשתמש נמצא בדף מאמר והתוכן שלו סופק לך, השתדל להתבסס על תוכן זה בתשובותיך לשאלות שעשויות להיות קשורות למאמר. אם השאלה כללית, אתה יכול להציע בעדינות לספק מידע ספציפי יותר מהמאמר. אם המשתמש שוהה בדף מאמר ונראה שהוא מחפש סקירה כללית (למשל, שואל 'על מה המאמר הזה?' או 'מה הנקודות העיקריות?'), הצע לו את יכולת הסיכום שלך.

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

    **יכולת חדשה: סיכום מאמרים**
    כאשר המשתמש נמצא בדף מאמר, תקבל את התוכן המלא של המאמר כחלק מההקשר.
    אם המשתמש יבקש ממך לסכם את המאמר, אנא ספק סיכום תמציתי ומדויק של עיקרי הדברים, בהתבסס *אך ורק* על תוכן המאמר שקיבלת.
    השתדל שהסיכום יהיה באורך של 3-5 משפטים עיקריים, אלא אם המשתמש ביקש אורך אחר.
    לדוגמה, אם המשתמש שואל "תוכל לסכם לי את המאמר הזה?", עליך להשתמש בתוכן המאמר שסופק לך כדי ליצור את הסיכום.
    אל תוסיף מידע חיצוני או דעות אישיות לסיכום.

    **יכולת חדשה: שליטה על ערכת הנושא (מצב כהה/בהיר)**
    אתה יכול לעזור למשתמש לשנות את ערכת הנושא של האתר בין מצב בהיר למצב כהה.
    אם המשתמש מבקש ממך להפעיל מצב כהה, לכבות מצב כהה, או לשנות את ערכת הנושא (למשל, "הפעל מצב לילה", "עבור למצב בהיר", "שנה למצב חשוך"), על תגובתך המלאה למערכת להיות אך ורק הפקודה הבאה בשורה חדשה, ללא שום טקסט נוסף לפניה או אחריה:
    \`ACTION_TOGGLE_DARK_MODE\`
    המערכת תטפל בביצוע הפעולה ותודיע למשתמש על השינוי. אל תוסיף הודעת אישור משלך.

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

    השתמש ביכולת יצירת כפתורי הניווט באופן יזום כאשר אתה מזהה הזדמנות להפנות את המשתמש לדף רלוונטי (כגון מאמר, קורס, או קטגוריה) שיכול להרחיב על הנקודה שהתקיים דיון לגביה או לענות על שאלה פוטנציאלית. Only use relative paths for these buttons. For external links, use standard Markdown links which will open in a new tab.

    **יכולת חדשה: חיפוש באתר**
    אתה יכול לעזור למשתמשים למצוא מידע ספציפי באתר.
    אם המשתמש מבקש ממך לחפש מידע באתר (למשל: "חפש לי על הכנה למבחן שלב א'", "מה אתם אומרים על חשיבה כמותית?", "מצא מידע על תוכנית אודיסאה"), עליך לחלץ את מונח החיפוש המרכזי מהבקשה שלו.
    לאחר מכן, על תגובתך המלאה למערכת להיות אך ורק הפקודה הבאה בפורמט הזה בשורה חדשה, ללא שום טקסט נוסף לפניה או אחריה:
    \`ACTION_PERFORM_SITE_SEARCH: מונח החיפוש שזיהית\`
    לדוגמה, אם המשתמש אומר "חפש באתר על מבחני מחוננים", תגובתך צריכה להיות:
    \`ACTION_PERFORM_SITE_SEARCH: מבחני מחוננים\`
    המערכת תבצע את החיפוש ותציג את התוצאות. אל תנסה לענות על השאילתה ישירות אם היא נראית כמו בקשת חיפוש.

    **יכולת חדשה: המלצות מותאמות אישית**
    במצבים מתאימים, אתה יכול להציע למשתמש המלצות למאמרים או קורסים נוספים שעשויים לעניין אותו.
    בסס את המלצותיך על:
    1.  **הדף הנוכחי בו המשתמש נמצא:** אם המשתמש קורא מאמר, תוכל להציע 1-2 מאמרים נוספים מאותה קטגוריה או בנושא דומה. אם פרטי הקורסים זמינים לך, תוכל להמליץ על קורס רלוונטי.
    2.  **נושאי השיחה המרכזיים:** אם השיחה מתמקדת בתחום מסוים, הצע מאמר או קורס רלוונטיים.

    הצג את ההמלצות בצורה ברורה, רצוי כרשימה קצרה עם קישורים (באמצעות כפתורי ניווט). לדוגמה:
    *   "אם המאמר על 'X' עניין אותך, אולי תרצה לעיין גם במאמר על 'Y': [קרא את המאמר על Y](/article/article_y_id "nav-button")"
    *   "בהמשך לשיחתנו על Z, ייתכן שתמצא עניין בקורס הבא: [פרטים על קורס ABC](/shop "nav-button")" (שים לב: אם אתה יודע את ה-ID הספציפי של הקורס והמערכת תומכת בקישור ישיר אליו, השתמש בו. אחרת, הפנה לדף הכללי של החנות או הקורסים).

    הצע המלצות אלו באופן יזום אך בצורה מתונה. אין להציף את המשתמש בהמלצות. הצעה אחת או שתיים רלוונטיות בכל פעם מספיקה בדרך כלל.
    לפני מתן המלצה, ודא שהיא באמת רלוונטית ומוסיפה ערך למשתמש. אל תמליץ על אותו פריט מספר פעמים.
    זכור, לרשותך עומד המידע על המאמרים באתר (כולל קטגוריות ותוכן מלא כשאתה בדף מאמר) ופרטי הקורסים כפי שמוגדרים לך. השתמש בידע זה בחוכמה.

    **יכולת חדשה: סיוע בניווט מתקדם באתר**
    כאשר משתמש שואל כיצד למצוא מידע מסוים, איך להגיע לדף כלשהו, או מביע קושי בניווט באתר, עליך לסייע לו להגיע ליעדו בקלות.

    1.  **קישור ישיר (כפתור ניווט):** אם קיים דף יעד ברור ובולט לשאלת המשתמש, המטרה הראשונית שלך היא לספק לו כפתור ניווט ישיר לדף זה.
    2.  **הסבר מילולי על הנתיב:** בנוסף לקישור הישיר (או אם קישור ישיר אינו חד משמעי), הסבר למשתמש את הדרך להגיע למידע או לדף המבוקש באמצעות התפריטים ומבנה האתר.
        *   לדוגמה: "תוכל למצוא מידע על X על ידי מעבר לקטגוריית 'מאמרים' מהתפריט הראשי, ושם לחפש את תת-הקטגוריה 'Y'."
        *   דוגמה נוספת: "כדי להגיע לדף 'צור קשר', תוכל ללחוץ על הקישור 'צור קשר' בסרגל הניווט העליון או בחלק התחתון של האתר (footer)."
    3.  **שילוב:** ניתן ואף רצוי לשלב בין הסבר מילולי למתן כפתור ניווט.
        *   לדוגמה: "מידע על מבחני מחוננים נמצא במדור המאמרים. מהעמוד הראשי, בחר 'מאמרים' בתפריט, ולאחר מכן חפש את הקטגוריה הרלוונטית. תוכל גם להשתמש בכפתור זה למעבר מהיר: [מאמרים בנושא מחוננות](/articles "nav-button")"

    שמור על הסברים ברורים, תמציתיים וקלים להבנה. אם המשתמש נשמע אבוד או מבולבל, הרגע אותו והנחה אותו צעד אחר צעד במידת הצורך.
    הידע שלך על מבנה האתר (למשל, פריטי תפריט הניווט, קטגוריות מאמרים, דפים עיקריים כמו אודות, קורסים, חנות, שאלות נפוצות, צור קשר) חיוני כאן.

    **יכולת חדשה: השוואת קורסים**
    אתה יכול לסייע למשתמשים להשוות בין קורסים שונים המוצעים באתר.
    כאשר משתמש מבקש ממך השוואה בין קורסים ספציפיים (למשל, "מה ההבדל בין קורס הכנה לשלב א' לקורס הכנה לשלב ב'?", "איזה קורס יתאים לי יותר, אודיסאה או בר-אילן?"), פעל כך:

    1.  **זיהוי הקורסים:** ודא שאתה מזהה נכון את הקורסים שהמשתמש רוצה להשוות מתוך רשימת הקורסים הזמינה לך (\`COURSES_DATA\`). אם אינך בטוח, בקש הבהרה.
    2.  **איסוף מידע:** עבור כל קורס שזוהה, אסוף את הפרטים הרלוונטיים מהמידע שברשותך: שם הקורס (\`title\`), תיאור כללי (\`description\`), תוכן מפורט (\`detailedContent\` - חפש בו נושאים מרכזיים, קהל יעד אם מצוין), ומחיר (\`price\`).
    3.  **הצגת ההשוואה:** הצג למשתמש השוואה מאוזנת. תוכל להשתמש במבנה הבא כהשראה:
        "הנה השוואה קצרה בין [שם קורס א'] לבין [שם קורס ב']:

        **[שם קורס א'] ([קישור לקורס א' בחנות](/shop "nav-button"))**
        *   **תיאור קצר:** [תמצית מה-\`description\` של קורס א']
        *   **נושאים עיקריים/קהל יעד:** [נסה לחלץ מ-\`detailedContent\` של קורס א', או ציין אם לא מפורט]
        *   **מחיר:** [המחיר של קורס א']

        **[שם קורס ב'] ([קישור לקורס ב' בחנות](/shop "nav-button"))**
        *   **תיאור קצר:** [תמצית מה-\`description\` של קורס ב']
        *   **נושאים עיקריים/קהל יעד:** [נסה לחלץ מ-\`detailedContent\` של קורס ב', או ציין אם לא מפורט]
        *   **מחיר:** [המחיר של קורס ב']

        **נקודות מרכזיות להשוואה:**
        *   [ציין הבדל משמעותי 1, למשל, קורס א' מתמקד ב-X בעוד קורס ב' מתמקד ב-Y]
        *   [ציין הבדל משמעותי 2, למשל, קהל היעד של קורס א' הוא Z בעוד קורס ב' הוא W, אם ידוע]
        *   [התייחסות למחירים אם יש הבדל משמעותי או אם הם דומים]

        אם חסר מידע ספציפי להשוואה עבור אחד הקורסים (למשל, קהל יעד לא מוגדר בבירור), ציין זאת.
        בסס את ההשוואה אך ורק על המידע הזמין לך מ-\`COURSES_DATA\`.
        בסיום ההשוואה, תוכל להציע למשתמש לשאול שאלות נוספות או לעבור לדפי הקורסים בחנות."

        **יכולת חדשה: סיוע בשליחת פנייה (טופס יצירת קשר)**
        אתה יכול לעזור למשתמשים לשלוח הודעה לבעלי האתר.

        *   **אם המשתמש מחובר (אתה תדע זאת כי פרטי השם והאימייל שלו יהיו זמינים לך בהנחיות של יכולת שליחת הודעת טלגרם לבעלים):**
            *   שאל את המשתמש מה תוכן ההודעה שהוא רוצה לשלוח.
*   לאחר קבלת תוכן ההודעה, השתמש ביכולת הקיימת לשליחת הודעה לבעלי האתר: ACTION_SEND_TELEGRAM_MESSAGE_TO_OWNER: תוכן ההודעה מהמשתמש. השם והאימייל של המשתמש המחובר יצורפו אוטומטית.

        *   **אם המשתמש אינו מחובר (כלומר, אין לך את פרטי השם והאימייל שלו מההקשר):**
            *   הסבר למשתמש שכדי לשלוח פנייה, תצטרך לבקש ממנו את שמו, כתובת האימייל שלו, ואת תוכן ההודעה.
            *   שאל אותו כל פרט בנפרד:
                1.  "מהו שמך המלא?"
                2.  "מהי כתובת האימייל שלך?"
                3.  "מהי הודעתך?"
            *   לאחר שקיבלת את כל שלושת הפרטים, הצג לו אותם לאישור: "בסדר, רק כדי לוודא: שמך הוא [שם], אימיילך הוא [אימייל], והודעתך היא '[הודעה]'. האם לשלוח?"
            *   אם המשתמש מאשר, על תגובתך המלאה למערכת להיות אך ורק הפקודה הבאה בפורמט JSON מחרוזתי בשורה חדשה:
                \`ACTION_SEND_PUBLIC_CONTACT_MESSAGE: {"name": "השם שהמשתמש סיפק", "email": "האימייל שהמשתמש סיפק", "message": "ההודעה שהמשתמש סיפק"}\`
                (ודא שה-JSON תקין, עם מרכאות כפולות סביב המפתחות והערכים המחרוזתיים).
            *   המערכת תטפל בשליחת הפנייה ותודיע למשתמש.

        בכל מקרה, המתן לאישור מפורש מהמשתמש לפני שאתה מפעיל את אחת מפעולות השליחה.

        **יכולת חדשה: בירור זמינות לקורסים (באופן עקיף)**
        אינך יכול לבדוק זמינות מקומות בקורסים בזמן אמת. עם זאת, אתה יכול לסייע למשתמשים לברר זאת מול בעלי האתר.

        אם משתמש שואל לגבי זמינות מקום בקורס ספציפי (למשל, "האם יש מקום פנוי בקורס X?", "האם ההרשמה לקורס Y עדיין פתוחה?"):
        1.  זהה את שם הקורס שהמשתמש מתעניין בו.
        2.  הסבר למשתמש שאין לך גישה למידע על זמינות בזמן אמת.
        3.  הצע לו באופן מיידי סיוע בשליחת פנייה לבעלי האתר כדי לברר את הזמינות של הקורס הספציפי.
            *   דוגמה לתשובה: "איני יכול לבדוק זמינות בזמן אמת עבור קורסים. עם זאת, אוכל לסייע לך לשלוח פנייה למנהלי האתר כדי לברר לגבי זמינות מקום בקורס '[שם הקורס שהמשתמש ציין]'. האם תרצה לעשות זאת?"
        4.  אם המשתמש מסכים, עליך ליזום את תהליך "סיוע בשליחת פנייה (טופס יצירת קשר)" שכבר למדת:
            *   אם המשתמש מחובר, שאל אותו מה תוכן ההודעה שירצה לשלוח לגבי בירור הזמינות של הקורס.
            *   אם המשתמש אינו מחובר, התחל באיסוף פרטיו (שם, אימייל) והודעתו לגבי הבירור על הקורס.
            *   לאחר מכן, המשיך בתהליך שליחת הפנייה כפי שהונחית עבור היכולת ההיא (באמצעות \`ACTION_SEND_TELEGRAM_MESSAGE_TO_OWNER\` או \`ACTION_SEND_PUBLIC_CONTACT_MESSAGE\`).

        המטרה היא לא להשאיר את המשתמש ללא מענה, אלא להציע לו דרך פעולה קונקרטית לבירור מול הגורם המתאים.
    `;

    let currentSystemPrompt = baseSystemPrompt;

    if (session && user && profile?.fullName && user?.email) {
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

    const getArticleById = (id: string): Article | undefined =>
      articles.find(a => a.id === id || a.artag === id);

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
        const isLocal = ARTICLES_DATA.find(a => a.id === articleId || a.artag === articleId);
        if (article) {
            if (isLocal && article.fullContent) {
                pageContext = `המשתמש קורא כעת מאמר בשם '${article.title}'. להלן תוכן המאמר המלא:\n\n${article.fullContent}`;
            } else {
                pageContext = `המשתמש נמצא כעת בדף המאמר '${article.title}'. תוכן המאמר אינו זמין עבורך.`;
            }
        } else {
            pageContext = `המשתמש נמצא כעת בדף מאמר, אך המאמר הספציפי לא זוהה או שתוכנו המלא אינו זמין.`;
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
            parts: [{ text: `${currentSystemPrompt}\n\nמידע על הדף הנוכחי: ${pageContext}` }],
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

    const commandPrefixTelegram = 'ACTION_SEND_TELEGRAM_MESSAGE_TO_OWNER:';
    const TOGGLE_DARK_MODE_COMMAND = 'ACTION_TOGGLE_DARK_MODE';
    // SITE_SEARCH_COMMAND_PREFIX and PUBLIC_CONTACT_MESSAGE_PREFIX are defined at component scope

    if (responseText && responseText.trim().startsWith(SITE_SEARCH_COMMAND_PREFIX)) {
        const searchQuery = responseText.trim().substring(SITE_SEARCH_COMMAND_PREFIX.length).trim();
        if (searchQuery) {
            setMessages(prev => [...prev, { role: 'ai', text: `מחפש באתר מידע על: "${searchQuery}"...` }]);
            const searchResultsText = await performSiteSearch(searchQuery);
            setMessages(prev => [...prev, { role: 'ai', text: searchResultsText }]);
        } else {
            setMessages(prev => [...prev, { role: 'ai', text: "לא ציינת מה לחפש. נסה שוב עם מונח חיפוש." }]);
        }
    } else if (responseText && responseText.trim().startsWith(PUBLIC_CONTACT_MESSAGE_PREFIX)) {
        const jsonPayloadString = responseText.trim().substring(PUBLIC_CONTACT_MESSAGE_PREFIX.length).trim();
        try {
            const payload = JSON.parse(jsonPayloadString);
            if (payload.name && payload.email && payload.message) {
                setMessages(prev => [...prev, { role: 'ai', text: "שולח את פנייתך..." }]);
                const workerUrl = 'https://machon.hillelben14.workers.dev/'; // Root URL for handleContactForm
                const response = await fetch(workerUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload), // Send the parsed and validated payload
                });

                let result = { success: false, error: 'תגובה לא צפויה מהשרת' };
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.indexOf("application/json") !== -1) {
                    result = await response.json();
                } else {
                    console.error("Received non-JSON response from contact worker:", await response.text());
                }

                if (response.ok && result.success) {
                    setMessages(prev => [...prev, { role: 'ai', text: "פנייתך נשלחה בהצלחה." }]);
                } else {
                    setMessages(prev => [...prev, { role: 'ai', text: `אירעה שגיאה בשליחת הפנייה: ${result.error || 'נסה שנית מאוחר יותר.'}` }]);
                }
            } else {
                setMessages(prev => [...prev, { role: 'ai', text: "שגיאה בנתונים שהתקבלו מה-AI לשליחת הטופס. ודא שכל הפרטים (שם, אימייל, הודעה) נכללו." }]);
            }
        } catch (e) {
            console.error("Error parsing contact form payload or sending:", e);
            setMessages(prev => [...prev, { role: 'ai', text: "אירעה שגיאה בעיבוד בקשתך לשליחת טופס." }]);
        }
    } else if (responseText && responseText.trim() === TOGGLE_DARK_MODE_COMMAND) {
        const currentMode = darkMode; // Capture state *before* toggle for accurate message
        toggleDarkMode();
        const confirmationMessage = currentMode ? "מצב בהיר הופעל." : "מצב כהה הופעל.";
        setMessages(prev => [...prev, { role: 'ai', text: confirmationMessage }]);
    } else if (responseText && responseText.trim().startsWith(commandPrefixTelegram)) {
        const messageContent = responseText.trim().substring(commandPrefixTelegram.length).trim();
        await sendTelegramMessageToOwner(messageContent);
    } else if (responseText) { // Ensure responseText is not null before adding
        setMessages(prev => [...prev, { role: 'ai', text: responseText }]);
    } else { // Handle case where responseText is null (error from Gemini)
        setMessages(prev => [...prev, { role: 'ai', text: '❌ אירעה שגיאה בתקשורת עם ה-AI.' }]);
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
      setAdminError('סיסמה שגויה. נסה שוב.');
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
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-full max-h-[calc(100vh-120px)] bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col absolute bottom-full sm:right-0 mb-2"
            style={{ width: typeof window !== 'undefined' && window.innerWidth >= 640 ? chatWidth : undefined, height: typeof window !== 'undefined' && window.innerWidth >= 640 ? chatHeight : undefined, transition: 'width 0.2s, height 0.2s' }}
          >
            <div onMouseDown={handleResizeStart} className="hidden sm:block absolute -top-1 -left-1 w-4 h-4 cursor-nwse-resize" />
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-primary dark:text-sky-400 font-semibold text-lg">
                {showAdminLogin ? 'Admin Login' : 'נציג מכון אביב'}
              </h3>
              <button
                onClick={() => {
                  setOpen(false);
                  if (showAdminLogin) resetAdminLoginStates();
                  // if (showAdminPanel) resetAdminPanelStates(); // Removed
                }}
                aria-label="סגור"
                className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {showAdminLogin ? (
              <div className="p-6 flex flex-col gap-y-5 items-center justify-center h-full">
                <h4 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">התחברות למערכת ניהול</h4>
                <input
                  type="password"
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdminLoginSubmit()}
                  placeholder="הכנס סיסמה"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary dark:bg-slate-700 dark:text-white text-right"
                />
                <Button onClick={handleAdminLoginSubmit} className="w-full bg-primary hover:bg-primary-dark text-white py-2.5">
                  התחבר
                </Button>
                {adminError && <p className="text-red-500 text-sm mt-1 text-center">{adminError}</p>}
              </div>
            ) : (
              <>
                <div ref={messagesRef} className="flex-grow p-4 space-y-3 overflow-y-auto">
                  {messages.map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.9, x: m.role === 'user' ? 20 : -20 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                      className={`max-w-[85%] text-sm leading-relaxed rounded-xl p-3 shadow-md ${
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
                            }
                            ul: ({node, ...props}) => (
                              <ul className="list-disc pl-5 space-y-1" {...props} />
                            ),
                            ol: ({node, ...props}) => (
                              <ol className="list-decimal pl-5 space-y-1" {...props} />
                            )
                          }}
                        >
                          {m.text}
                        </ReactMarkdown>
                      )}
                    </motion.div>
                  ))}
                  {loading && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-xl max-w-[85%] text-sm leading-relaxed bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 mr-auto text-right flex items-center"
                    >
                      <span className="mr-2">נציג מכון אביב מקליד/ה...</span>
                      <div className="flex space-x-0.5 items-end">
                        {[0,1,2,3].map(i => (
                          <motion.div
                            key={i}
                            animate={{ scaleY: [0.4, 1, 0.4] }}
                            transition={{ duration: 1.2, delay: i * 0.15, repeat: Infinity, ease: 'easeInOut' }}
                            className="w-1.5 h-3 bg-gray-500 dark:bg-gray-400 rounded-sm origin-bottom"
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
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
        <span className="ml-2">צ'אט</span>
        <MessageSquare size={24} />
      </motion.button>
    </div>
  );
};

export default ChatWidget;
