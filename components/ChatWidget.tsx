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

interface Message {
  role: 'user' | 'ai';
  text: string;
}

const ChatWidget: React.FC = () => {
  const { session, user, profile, logout, loginWithPassword, signupWithDetails, loginWithGoogle } = useAuth();
  const { articles } = useData();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const { toggleDarkMode, darkMode } = useDarkMode();

  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminError, setAdminError] = useState('');

  const [chatWidth, setChatWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('chatWidth');
      return stored ? parseInt(stored, 10) : 384;
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
    if (window.innerWidth < 640) return;
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

  // Action Command Prefixes/Commands
  const SITE_SEARCH_COMMAND_PREFIX = 'ACTION_PERFORM_SITE_SEARCH:';
  const PUBLIC_CONTACT_MESSAGE_PREFIX = 'ACTION_SEND_PUBLIC_CONTACT_MESSAGE:';
  const LOGIN_PASSWORD_COMMAND_PREFIX = 'ACTION_LOGIN_PASSWORD:';
  const SIGNUP_DETAILS_COMMAND_PREFIX = 'ACTION_SIGNUP_DETAILS:';
  const LOGIN_GOOGLE_COMMAND = 'ACTION_LOGIN_GOOGLE';
  const LOGOUT_USER_COMMAND = 'ACTION_LOGOUT_USER';
  const TELEGRAM_MESSAGE_COMMAND_PREFIX = 'ACTION_SEND_TELEGRAM_MESSAGE_TO_OWNER:';
  const TOGGLE_DARK_MODE_COMMAND = 'ACTION_TOGGLE_DARK_MODE';
  const NAVIGATE_TO_COMMAND_PREFIX = 'ACTION_NAVIGATE_TO:';
  const DISPLAY_ALERT_COMMAND_PREFIX = 'ACTION_DISPLAY_ALERT:';
  const STORE_FEEDBACK_COMMAND_PREFIX = 'ACTION_STORE_FEEDBACK:';


  const performSiteSearch = async (query: string): Promise<string> => {
    const lowerQuery = query.toLowerCase();
    let resultText = "";
    let totalResults = 0;

    const articleResults = ARTICLES_DATA.filter(article =>
      article.title.toLowerCase().includes(lowerQuery) ||
      article.excerpt.toLowerCase().includes(lowerQuery) ||
      (article.fullContent && article.fullContent.toLowerCase().includes(lowerQuery))
    ).slice(0, 3);

    if (articleResults.length > 0) {
      totalResults += articleResults.length;
      resultText += `**מאמרים:**\n${articleResults.map(article => `* [${article.title}](/article/${article.id} "nav-button")`).join('\n')}\n\n`;
    }

    const courseResults = COURSES_DATA.filter(course =>
      course.title.toLowerCase().includes(lowerQuery) ||
      course.description.toLowerCase().includes(lowerQuery) ||
      (course.detailedContent && course.detailedContent.toLowerCase().includes(lowerQuery))
    ).slice(0, 2);

    if (courseResults.length > 0) {
      totalResults += courseResults.length;
      resultText += `**קורסים:**\n${courseResults.map(course => `* **קורס:** [${course.title}](${course.links?.[0]?.href || '/shop'} "nav-button") - ${course.description.substring(0, 100)}...`).join('\n')}\n\n`;
    }

    const faqResults: { question: string, answer: string, category: string }[] = [];
    FAQ_DATA.forEach(category => {
      category.questions.forEach(qa => {
        if (faqResults.length < 2 && (qa.question.toLowerCase().includes(lowerQuery) || qa.answer.toLowerCase().includes(lowerQuery))) {
          faqResults.push({ question: qa.question, answer: qa.answer, category: category.categoryName });
        }
      });
    });

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
    const TELEGRAM_WORKER_URL = 'https://machon.hillelben14.workers.dev/send-telegram';

    try {
      const response = await fetch(TELEGRAM_WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.fullName,
          email: user.email,
          message: messageContent,
        }),
      });
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
      return;
    }

    const userMsg = { role: 'user', text: input } as Message;
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    let baseSystemPrompt = `אתה 'נציג מכון אביב', נציג שירות לקוחות וירטואלי באתר של '${APP_NAME}'.
    מטרתך העיקרית היא לסייע למשתמשים באופן מקצועי, ידידותי, פרואקטיבי ועוזר.
    השתמש ב-Markdown לעיצוב תשובותיך כדי לשפר את הקריאות והבהירות.
    בשום פנים ואופן אל תזכיר שאתה מודל שפה או בינה מלאכותית. אתה אך ורק נציג שירות של '${APP_NAME}'.

    **מידע על הדף הנוכחי של המשתמש (pageContext):**
    המידע על הדף הנוכחי בו המשתמש גולש (כולל הנתיב, למשל \`(נתיב: '/articles')\`) מסופק לך תחת הכותרת 'מידע על הדף הנוכחי:'.
    אם המשתמש שואל "איפה אני?" או "באיזה דף אני נמצא?", השתמש במידע זה כדי לענות לו במדויק. הנתיב (\`page\`) מהקשר זה ישמש אותך גם עבור פקודות מסוימות.

    **יכולות מבוססות פקודה (ACTION COMMANDS):**
    כדי להפעיל יכולות מיוחדות, תגובתך המלאה למערכת חייבת להיות *אך ורק* הפקודה הרלוונטית עם הפרמטרים הנדרשים, ללא טקסט נוסף לפניה או אחריה.
    תמיד אשר את כל הפרטים הנדרשים עם המשתמש *לפני* שאתה שולח פקודה הדורשת פרמטרים.

    1.  **ניווט באתר:**
        -   פקודה: \`${NAVIGATE_TO_COMMAND_PREFIX}/path/to/page\`
        -   שימוש: כאשר המשתמש מבקש לעבור לדף ספציפי (למשל, "קח אותי לדף הקורסים"). החלף את \`/path/to/page\` בנתיב היחסי המתאים (למשל, \`/courses\`) או בכתובת URL מלאה אם מדובר באתר חיצוני.

    2.  **הצגת התראה (בצ'אט):**
        -   פקודה: \`${DISPLAY_ALERT_COMMAND_PREFIX}{"message": "תוכן ההתראה", "type": "info|warning|error"}\`
        -   שימוש: להצגת הודעות חשובות למשתמש כהתראה בתוך הצ'אט. ודא שה-JSON תקין עם מרכאות כפולות סביב המפתחות והערכים המחרוזתיים.
        -   סוגי התראות: 'info' (מידע כללי, אייקון ℹ️), 'warning' (אזהרה, אייקון ⚠️), 'error' (שגיאה, אייקון ❌).

    3.  **שליטה על ערכת נושא (כהה/בהיר):**
        -   פקודה: \`${TOGGLE_DARK_MODE_COMMAND}\`
        -   שימוש: כאשר המשתמש מבקש לשנות את ערכת הנושא (למשל, "הפעל מצב לילה").

    4.  **חיפוש באתר:**
        -   פקודה: \`${SITE_SEARCH_COMMAND_PREFIX}מונח חיפוש\`
        -   שימוש: כאשר המשתמש מבקש לחפש מידע באתר. חלץ את מונח החיפוש המרכזי.

    5.  **שליחת פנייה (טופס יצירת קשר - משתמש לא מחובר):**
        -   שלבים:
            1.  הסבר למשתמש שתצטרך את שמו, כתובת האימייל, ותוכן ההודעה.
            2.  שאל כל פרט בנפרד ואשר אותו עם המשתמש.
            3.  לאחר קבלת כל שלושת הפרטים ואישורם, השתמש בפקודה (JSON תקין):
                \`${PUBLIC_CONTACT_MESSAGE_PREFIX}{"name": "השם שסופק", "email": "האימייל שסופק", "message": "ההודעה שסופקה"}\`

    **יכולות נוספות (שאינן דורשות פקודה בפורמט מיוחד):**
    -   **סיכום מאמרים:** כאשר תוכן המאמר מסופק לך בהקשר, ותתבקש לסכם אותו.
    -   **יצירת כפתורי ניווט פנימיים:** השתמש בפורמט Markdown: \`[טקסט הכפתור](/נתיב-פנימי-באתר "nav-button")\`
    -   **המלצות מותאמות אישית:** למאמרים או קורסים רלוונטיים, בהתבסס על השיחה והדף הנוכחי.
    -   **סיוע בניווט כללי באתר:** הסבר למשתמש כיצד להגיע למידע או לדפים באמצעות התפריטים ומבנה האתר.
    -   **השוואת קורסים:** בהתבסס על המידע שסופק לך ב-\`COURSES_DATA\`.
    -   **בירור זמינות לקורסים:** הסבר שאין לך גישה למידע בזמן אמת, והצע סיוע בשליחת פנייה לבירור.
    `;

    if (session) { // User IS logged in
      baseSystemPrompt += `

**ניהול חשבון משתמש (מחובר כעת):**
המשתמש מחובר כעת. פרטיו (\`שם: ${profile?.fullName || user?.email}\`, \`אימייל: ${user?.email}\`) ישמשו אוטומטית במידת הצורך.
-   **התנתקות:**
    1.  אם המשתמש מבקש להתנתק, שאל אותו לאישור (לדוגמה: "האם אתה בטוח שברצונך להתנתק?").
    2.  אם הוא מאשר, השתמש בפקודה: \`${LOGOUT_USER_COMMAND}\`
-   אל תציע אפשרויות התחברות או הרשמה כיוון שהמשתמש כבר מחובר.

**שליחת הודעות לבעלי האתר (משתמש מחובר):**
השם והאימייל של המשתמש המחובר יצורפו אוטומטית להודעה.
-   שלבים:
    1.  שאל את המשתמש מה תוכן ההודעה שהוא רוצה לשלוח.
    2.  אשר את תוכן ההודעה עם המשתמש.
    3.  לאחר אישורו, השתמש בפקודה: \`${TELEGRAM_MESSAGE_COMMAND_PREFIX}תוכן ההודעה המאושרת\`

**איסוף משוב מהמשתמש (משתמש מחובר):**
-   תוכל לשאול את המשתמש אם הוא מעוניין לתת משוב על הדף הנוכחי או על חוויתו באתר (לדוגמה: "האם תרצה להשאיר משוב קצר על הדף הזה?").
-   אם המשתמש מסכים ומספק משוב טקסטואלי:
    1.  קבל את טקסט המשוב מהמשתמש.
    2.  השתמש בפקודה (JSON תקין), כאשר הערך עבור \`"page"\` הוא הנתיב המדויק מה-\`pageContext\` שסופק לך:
        \`${STORE_FEEDBACK_COMMAND_PREFIX}{"feedback_text": "המשוב שהמשתמש סיפק", "page": "הנתיב מה-pageContext"}\`
        לדוגמה, אם ה-\`pageContext\` מציין \`(נתיב: '/some-article')\`, אז \`"page": "/some-article"\`.
      `;
    } else { // User IS NOT logged in
      baseSystemPrompt += `

**ניהול חשבון משתמש (לא מחובר כעת):**
המשתמש אינו מחובר כעת.
-   **התחברות עם סיסמה:**
    1.  שאל את המשתמש מה כתובת האימייל שלו ומה הסיסמה שלו.
    2.  לאחר שקיבלת את שני הפרטים, השתמש בפקודה (JSON תקין):
        \`${LOGIN_PASSWORD_COMMAND_PREFIX}{"email": "user@example.com", "password": "userpassword"}\`
-   **הרשמה עם פרטים:**
    1.  שאל את המשתמש מה כתובת האימייל שלו, הסיסמה הרצויה, שמו הפרטי ושם משפחתו.
    2.  לאחר שקיבלת את כל ארבעת הפרטים, השתמש בפקודה (JSON תקין):
        \`${SIGNUP_DETAILS_COMMAND_PREFIX}{"email": "newuser@example.com", "password": "newpassword", "firstName": "FName", "lastName": "LName"}\`
-   **התחברות עם גוגל:**
    -   אם המשתמש מבקש להתחבר עם גוגל, השתמש בפקודה: \`${LOGIN_GOOGLE_COMMAND}\`
-   אל תציע אפשרות התנתקות כיוון שהמשתמש אינו מחובר.

**איסוף משוב מהמשתמש (לא מחובר כעת):**
-   תוכל לשאול את המשתמש אם הוא מעוניין לתת משוב על הדף הנוכחי או על חוויתו באתר (לדוגמה: "האם תרצה להשאיר משוב קצר על הדף הזה?").
-   אם המשתמש מסכים ומספק משוב טקסטואלי:
    1.  קבל את טקסט המשוב מהמשתמש.
    2.  השתמש בפקודה (JSON תקין), כאשר הערך עבור \`"page"\` הוא הנתיב המדויק מה-\`pageContext\` שסופק לך:
        \`${STORE_FEEDBACK_COMMAND_PREFIX}{"feedback_text": "המשוב שהמשתמש סיפק", "page": "הנתיב מה-pageContext"}\`
        לדוגמה, אם ה-\`pageContext\` מציין \`(נתיב: '/some-page')\`, אז \`"page": "/some-page"\`.
      `;
    }

    let pageContext = "";
    const currentPath = location.pathname;
    const getArticleById = (id: string): Article | undefined => articles.find(a => a.id === id || a.artag === id);

    if (currentPath === "/") {
        pageContext = `המשתמש נמצא כעת בדף הבית. (נתיב: '/')`;
    } else if (currentPath === "/about") {
        const aboutSection = PREVIEW_SECTIONS.find(s => s.id === 'about-preview');
        pageContext = `המשתמש נמצא כעת בדף 'אודותינו'. (נתיב: '/about'). תיאור קצר: ${aboutSection?.description}.`;
    } else if (currentPath === "/courses") {
        const courseTitlesList = COURSES_DATA.map(c => c.title).join(', ');
        pageContext = `המשתמש נמצא כעת בדף 'הקורסים שלנו'. (נתיב: '/courses'). רשימת קורסים: ${courseTitlesList}.`;
    } else if (currentPath === "/articles") {
        const articleTitles = ARTICLES_DATA.map(article => article.title).join(', ');
        pageContext = `המשתמש נמצא כעת בדף המאמרים הראשי. (נתיב: '/articles'). רשימת מאמרים חלקית: ${articleTitles.substring(0,150)}...`;
    } else if (currentPath.startsWith("/article/")) {
        const articleId = currentPath.split("/article/")[1];
        const article = getArticleById(articleId);
        if (article) {
            if (ARTICLES_DATA.find(a => a.id === articleId || a.artag === articleId) && article.fullContent) {
                 pageContext = `המשתמש קורא כעת מאמר בשם '${article.title}'. (נתיב: '${currentPath}'). תוכן המאמר המלא מסופק לך.`;
            } else {
                pageContext = `המשתמש נמצא כעת בדף המאמר '${article.title}'. (נתיב: '${currentPath}'). תוכן המאמר אינו זמין עבורך.`;
            }
        } else {
            pageContext = `המשתמש נמצא כעת בדף מאמר לא מזוהה. (נתיב: '${currentPath}').`;
        }
    } else if (currentPath === "/faq") {
        pageContext = `המשתמש נמצא כעת בדף 'שאלות נפוצות'. (נתיב: '/faq').`;
    } else if (currentPath === "/contact") {
        pageContext = `המשתמש נמצא כעת בדף 'צור קשר'. (נתיב: '/contact').`;
    } else if (currentPath === "/shop") {
        pageContext = `המשתמש נמצא כעת בדף החנות. (נתיב: '/shop').`;
    } else {
        pageContext = `המשתמש נמצא כעת בדף עם הנתיב: '${currentPath}'.`;
    }

    const apiPayloadContents = [
        { role: 'user' as const, parts: [{ text: `${baseSystemPrompt}\n\nמידע על הדף הנוכחי: ${pageContext}` }] },
        { role: 'model' as const, parts: [{ text: 'הבנתי את ההקשר. כיצד אוכל לסייע לך?' }] },
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
      } catch { /* ignore and try next key */ }
    }
    setLoading(false);

    if (responseText) {
        const trimmedResponse = responseText.trim();

        if (trimmedResponse.startsWith(NAVIGATE_TO_COMMAND_PREFIX)) {
            const path = trimmedResponse.substring(NAVIGATE_TO_COMMAND_PREFIX.length).trim();
            if (path && (path.startsWith('/') || path.startsWith('http'))) {
                setMessages(prev => [...prev, { role: 'ai', text: `מעביר אותך אל ${path}...` }]);
                if (path.startsWith('http')) {
                    window.open(path, '_blank');
                } else {
                    navigate(path);
                }
                setOpen(false);
            } else {
                setMessages(prev => [...prev, { role: 'ai', text: "נתיב ניווט לא תקין התקבל מה-AI." }]);
            }
        } else if (trimmedResponse.startsWith(DISPLAY_ALERT_COMMAND_PREFIX)) {
            const jsonPayloadString = trimmedResponse.substring(DISPLAY_ALERT_COMMAND_PREFIX.length).trim();
            try {
                const { message: alertMessage, type: alertType } = JSON.parse(jsonPayloadString);
                let icon = "ℹ️";
                if (alertType === 'warning') icon = '⚠️';
                if (alertType === 'error') icon = '❌';
                const formattedAlert = `**${icon} ${alertType.toUpperCase()}:** ${alertMessage}`;
                setMessages(prev => [...prev, { role: 'ai', text: formattedAlert }]);
            } catch (e) {
                console.error("Error parsing alert payload:", e);
                setMessages(prev => [...prev, { role: 'ai', text: "שגיאה בעיבוד בקשת ההתראה." }]);
            }
        } else if (trimmedResponse.startsWith(STORE_FEEDBACK_COMMAND_PREFIX)) {
            const jsonPayloadString = trimmedResponse.substring(STORE_FEEDBACK_COMMAND_PREFIX.length).trim();
            try {
                const { feedback_text, page: feedbackPage } = JSON.parse(jsonPayloadString);
                setMessages(prev => [...prev, { role: 'ai', text: "שולח את המשוב שלך..." }]);
                const { error: feedbackError } = await supabase
                    .from('user_feedback')
                    .insert([{
                        page_url: feedbackPage || location.pathname,
                        feedback_content: feedback_text,
                        user_id: user?.id || null,
                        submitted_at: new Date().toISOString()
                    }]);
                if (feedbackError) {
                    console.error('Error submitting feedback to Supabase:', feedbackError);
                    setMessages(prev => [...prev, { role: 'ai', text: `אירעה שגיאה בשליחת המשוב: ${feedbackError.message}` }]);
                } else {
                    setMessages(prev => [...prev, { role: 'ai', text: "תודה! המשוב שלך נשלח בהצלחה." }]);
                }
            } catch (e) {
                console.error("Error parsing feedback payload or submitting:", e);
                setMessages(prev => [...prev, { role: 'ai', text: "שגיאה בעיבוד בקשת המשוב." }]);
            }
        } else if (trimmedResponse.startsWith(LOGIN_PASSWORD_COMMAND_PREFIX)) {
            const jsonPayloadString = trimmedResponse.substring(LOGIN_PASSWORD_COMMAND_PREFIX.length).trim();
            try {
                const { email, password } = JSON.parse(jsonPayloadString);
                setMessages(prev => [...prev, { role: 'ai', text: `מנסה להתחבר עם האימייל ${email}...` }]);
                await loginWithPassword(email, password);
            } catch (e) {
                console.error("Error parsing login payload or logging in:", e);
                setMessages(prev => [...prev, { role: 'ai', text: "שגיאה בעיבוד בקשת ההתחברות." }]);
            }
        } else if (trimmedResponse.startsWith(SIGNUP_DETAILS_COMMAND_PREFIX)) {
            const jsonPayloadString = trimmedResponse.substring(SIGNUP_DETAILS_COMMAND_PREFIX.length).trim();
            try {
                const { email, password, firstName, lastName } = JSON.parse(jsonPayloadString);
                setMessages(prev => [...prev, { role: 'ai', text: `יוצר חשבון חדש עבור ${email}...` }]);
                await signupWithDetails(email, password, firstName, lastName);
            } catch (e) {
                console.error("Error parsing signup payload or signing up:", e);
                setMessages(prev => [...prev, { role: 'ai', text: "שגיאה בעיבוד בקשת ההרשמה." }]);
            }
        } else if (trimmedResponse === LOGIN_GOOGLE_COMMAND) {
            setMessages(prev => [...prev, { role: 'ai', text: "מעביר אותך להתחברות עם גוגל..." }]);
            await loginWithGoogle();
        } else if (trimmedResponse === LOGOUT_USER_COMMAND) {
            setMessages(prev => [...prev, { role: 'ai', text: "מתנתק..." }]);
            await logout();
        } else if (trimmedResponse.startsWith(SITE_SEARCH_COMMAND_PREFIX)) {
            const searchQuery = trimmedResponse.substring(SITE_SEARCH_COMMAND_PREFIX.length).trim();
            if (searchQuery) {
                setMessages(prev => [...prev, { role: 'ai', text: `מחפש באתר מידע על: "${searchQuery}"...` }]);
                const searchResultsText = await performSiteSearch(searchQuery);
                setMessages(prev => [...prev, { role: 'ai', text: searchResultsText }]);
            } else {
                setMessages(prev => [...prev, { role: 'ai', text: "לא ציינת מה לחפש." }]);
            }
        } else if (trimmedResponse.startsWith(PUBLIC_CONTACT_MESSAGE_PREFIX)) {
            const jsonPayloadString = trimmedResponse.substring(PUBLIC_CONTACT_MESSAGE_PREFIX.length).trim();
            try {
                const payload = JSON.parse(jsonPayloadString);
                if (payload.name && payload.email && payload.message) {
                    setMessages(prev => [...prev, { role: 'ai', text: "שולח את פנייתך..." }]);
                    const workerUrl = 'https://machon.hillelben14.workers.dev/';
                    const response = await fetch(workerUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                    });
                    let result = { success: false, error: 'תגובה לא צפויה מהשרת' };
                    const contentType = response.headers.get("content-type");
                    if (contentType && contentType.indexOf("application/json") !== -1) {
                        result = await response.json();
                    }
                    if (response.ok && result.success) {
                        setMessages(prev => [...prev, { role: 'ai', text: "פנייתך נשלחה בהצלחה." }]);
                    } else {
                        setMessages(prev => [...prev, { role: 'ai', text: `אירעה שגיאה בשליחת הפנייה: ${result.error || 'נסה שנית מאוחר יותר.'}` }]);
                    }
                } else {
                    setMessages(prev => [...prev, { role: 'ai', text: "שגיאה בנתונים שהתקבלו מה-AI לשליחת הטופס." }]);
                }
            } catch (e) {
                console.error("Error parsing contact form payload or sending:", e);
                setMessages(prev => [...prev, { role: 'ai', text: "אירעה שגיאה בעיבוד בקשתך לשליחת טופס." }]);
            }
        } else if (trimmedResponse === TOGGLE_DARK_MODE_COMMAND) {
            const currentMode = darkMode;
            toggleDarkMode();
            const confirmationMessage = currentMode ? "מצב בהיר הופעל." : "מצב כהה הופעל.";
            setMessages(prev => [...prev, { role: 'ai', text: confirmationMessage }]);
        } else if (trimmedResponse.startsWith(TELEGRAM_MESSAGE_COMMAND_PREFIX)) {
            const messageContent = trimmedResponse.substring(TELEGRAM_MESSAGE_COMMAND_PREFIX.length).trim();
            await sendTelegramMessageToOwner(messageContent);
        } else {
            setMessages(prev => [...prev, { role: 'ai', text: trimmedResponse }]);
        }
    } else {
        setMessages(prev => [...prev, { role: 'ai', text: '❌ אירעה שגיאה בתקשורת עם ה-AI.' }]);
    }
  };

  const handleAdminLoginSubmit = () => {
    if (adminPasswordInput === '8725') {
      sessionStorage.setItem('isAdminAuthenticated', 'true');
      setAdminPasswordInput('');
      setAdminError('');
      setShowAdminLogin(false);
      setOpen(false);
      navigate('/admin');
    } else {
      setAdminError('סיסמה שגויה. נסה שוב.');
    }
  };

  const resetAdminLoginStates = () => {
    setShowAdminLogin(false);
    setAdminError('');
    setAdminPasswordInput('');
  };


  return (
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
                            },
                            ul: ({node, ...props}) => (
                              <ul className="list-disc list-outside pr-5 space-y-1" {...props} />
                            ),
                            ol: ({node, ...props}) => (
                              <ol className="list-decimal list-outside pr-5 space-y-1" {...props} />
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
                      <div className="flex space-x-1 items-center">
                        {[0, 1, 2].map(i => (
                          <motion.div
                            key={i}
                            animate={{
                              scale: [1, 1.2, 1],
                              opacity: [0.7, 1, 0.7],
                            }}
                            transition={{
                              duration: 0.8,
                              delay: i * 0.2,
                              repeat: Infinity,
                              ease: 'easeInOut',
                            }}
                            className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full"
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
