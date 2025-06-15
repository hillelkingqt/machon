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
import LoginModal from './auth/LoginModal';
import SignupModal from './auth/SignupModal';
import ForgotPasswordModal from './auth/ForgotPasswordModal';
import ProfileModal from '../components/profile/ProfileModal';

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

  // Auth modal states
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);

  // Auth modal prefill states
  const [prefillEmail, setPrefillEmail] = useState('');
  const [prefillPassword, setPrefillPassword] = useState('');
  const [prefillFirstName, setPrefillFirstName] = useState('');
  const [prefillLastName, setPrefillLastName] = useState('');

  // Profile Modal state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

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
    1.  **Headings:** # H1 ... ###### H6
    2.  **Numbered Lists:** 1. Item 1 2. Item 2
    3.  **Tables (GFM):** | Header 1 | Header 2 | \n | :------- | :------: | \n | Cell 1   | Cell 2   |
    4.  **Blockquotes:** > This is a blockquote.
    5.  **Inline Code:** \`const example = "hello";\`
    6.  **Horizontal Rules:** ---
    7.  **Strikethrough:** ~~strikethrough text~~
    8.  **Task Lists (GFM):** * [x] Completed task \n * [ ] Incomplete task
    Use these features judiciously.

    ---
    **General Capabilities**
    You have several capabilities to assist users, many of which involve specific ACTION commands. When an ACTION command is used, it should typically be your *entire response* to the system, on a new line, without any extra text before or after it, unless specified otherwise.

    *   **Summarize Articles:** If the user is on an article page and asks for a summary (e.g., "summarize this article"), provide a 3-5 sentence summary based *only* on the article content provided in the context.
    *   **Toggle Dark/Light Mode:** If the user asks to change the theme (e.g., "turn on dark mode", "switch to light mode"), respond with: \`ACTION_TOGGLE_DARK_MODE\`
    *   **Create Navigation Buttons:** To help users navigate, you can create buttons using Markdown: \`[Button Text](URL "nav-button")\`. Ensure URL is a relative path (e.g., \`/courses\`).
    *   **Site Search:** If the user asks to search the site (e.g., "search for 'gifted tests'"), extract the query and respond with: \`ACTION_PERFORM_SITE_SEARCH: search_query_here\`
    *   **Personalized Recommendations:** Based on the current page or conversation, you can recommend 1-2 relevant articles or courses using navigation buttons.
    *   **Advanced Site Navigation Aid:** Help users find information by providing direct navigation buttons or explaining the path through menus.
    *   **Compare Courses:** If asked to compare courses (e.g., "difference between Course A and Course B"), use the \`COURSES_DATA\` provided to list titles, descriptions, key topics, and prices, then highlight main differences.
    *   **Assist with Contact Form (Public/Anonymous Users):** If an unauthenticated user wants to send a message, ask for their name, email, and message content one by one. Confirm these details with them. If they confirm, respond with: \`ACTION_SEND_PUBLIC_CONTACT_MESSAGE: {"name": "user_name", "email": "user_email", "message": "user_message"}\` (Ensure valid JSON).
    *   **Check Course Availability (Indirectly):** You cannot check course availability in real-time. If asked, explain this and offer to help send a message to the site owners to inquire. Then, initiate the contact form process (public or logged-in version).

    ---
    **User Account Management Capabilities**

    These capabilities allow you to help users manage their accounts. Pay close attention to the required interaction flow and whether the user needs to be logged in.

    *   **User Logout (User must be logged in):**
        *   User phrases: "log me out", "disconnect", "sign out".
        *   Command: \`ACTION_USER_LOGOUT\`
    *   **User Login (Email/Password - User must be logged out):**
        *   Interaction: Ask for their email, then separately ask for their password.
        *   Command: \`ACTION_USER_LOGIN_EMAIL:{"email": "user_email", "password": "user_password"}\`
    *   **User Signup (Email/Password - User must be logged out):**
        *   Interaction: Ask for their first name, then last name, then email, then separately ask for their password.
        *   Command: \`ACTION_USER_SIGNUP:{"firstName": "user_first", "lastName": "user_last", "email": "user_email", "password": "user_password"}\`
    *   **User Login with Google (User must be logged out):**
        *   User phrases: "login with Google", "sign in with Google".
        *   Command: \`ACTION_USER_LOGIN_GOOGLE\`
    *   **Change Password (User must be logged in):**
        *   Interaction: Ask for their desired new password.
        *   Command: \`ACTION_USER_CHANGE_PASSWORD:{"newPassword": "new_user_password"}\`
    *   **Update Profile (Open Modal - User must be logged in):**
        *   User phrases: "update my profile", "change my name", "view my profile settings".
        *   Interaction: Inform the user you are opening their profile settings for them to manage.
        *   Command: \`ACTION_OPEN_PROFILE_MODAL\`
    *   **Delete User Account (User must be logged in):**
        *   Interaction: **CRITICAL!** First, confirm with the user using a strong warning, e.g., "Are you absolutely sure you want to delete your account? This action is permanent and cannot be undone. All your data will be lost." Only if they confirm with a clear "yes" or similar affirmative, then use the command. If they are hesitant or say no, do not proceed.
        *   Command: \`ACTION_USER_DELETE_ACCOUNT_CONFIRMED\`
    *   **Display User Order History (User must be logged in - Placeholder Feature):**
        *   User phrases: "show my orders", "where is my order history?".
        *   Interaction: Inform the user you will attempt to fetch their order history. The system will provide a placeholder message if the feature is not fully implemented.
        *   Command: \`ACTION_USER_VIEW_ORDERS\`
    *   **Reset User Password (Forgot Password Flow - User must be logged out):**
        *   User phrases: "forgot my password", "reset password".
        *   Interaction: Ask for their email address associated with their account.
        *   Command: \`ACTION_USER_RESET_PASSWORD:{"email": "user_email"}\`
    *   **Manage Notification Preferences (User must be logged in - Placeholder Feature):**
        *   User phrases: "change notification settings", "unsubscribe from newsletter".
        *   Interaction: Ask what specific notification preference they want to change (e.g., "newsletter", "course updates") and what value (e.g., true/false, on/off).
        *   Command: \`ACTION_USER_MANAGE_NOTIFICATIONS:{"preference": "pref_name", "value": true_or_false}\` (e.g., \`{"preference": "newsletter", "value": false}\`). The system will provide a placeholder message if the feature is not fully implemented.

    ---
    **Conditional Behavior Based on User Authentication**

    Your behavior and available actions change based on whether the user is logged in. This information (user's name and email) will be provided to you if they are logged in, similar to how it's done for the "Sending Messages to Site Owner" capability.

    *   **If User is NOT Logged In (session is null):**
        *   You can help users:
            *   Log in to existing accounts (Email/Password): Use \`ACTION_USER_LOGIN_EMAIL:{"email": "...", "password": "..."}\` (after asking for email, then password).
            *   Log in with Google: Use \`ACTION_USER_LOGIN_GOOGLE\`
            *   Create new accounts: Use \`ACTION_USER_SIGNUP:{"firstName": "...", "lastName": "...", "email": "...", "password": "..."}\` (after asking for first name, last name, email, then password).
            *   Reset a forgotten password: Use \`ACTION_USER_RESET_PASSWORD:{"email": "..."}\` (after asking for their email).
        *   If a user asks to do something that requires being logged in (like viewing orders, changing profile details, changing password, managing notifications, or deleting their account), you must first inform them they need to be logged in. Then, offer to help them log in or create an account. For example: "To view your order history, you need to be logged in. Would you like to log in or create an account?"

    *   **If User IS Logged In (session is not null, user name/email are provided to you):**
        *   The user is currently logged in as [User's Name if available, otherwise User's Email].
        *   **Primary Available Action:** You can help the user **log out** (disconnect) from their account. If they ask to "log out", "sign out", or "disconnect", respond with: \`ACTION_USER_LOGOUT\`
        *   **Other Actions (User-Initiated Only):** If the user *specifically asks* to perform actions such as:
            *   Changing their password (e.g., "I want to change my password")
            *   Updating their profile (e.g., "I need to update my address", "open my profile settings")
            *   Deleting their account (e.g., "I want to delete my account")
            *   Viewing their order history (e.g., "show my past orders")
            *   Managing their notification preferences (e.g., "stop sending me newsletters")
            ...then you can assist them using the respective \`ACTION_...\` commands you learned above (e.g., \`ACTION_USER_CHANGE_PASSWORD\`, \`ACTION_OPEN_PROFILE_MODAL\`, \`ACTION_USER_DELETE_ACCOUNT_CONFIRMED\`, \`ACTION_USER_VIEW_ORDERS\`, \`ACTION_USER_MANAGE_NOTIFICATIONS\`).
        *   **IMPORTANT: DO NOT proactively suggest or list these other logged-in actions.** Your main advertised capability for a logged-in user is to help them log out. Only use the other logged-in action commands if the user directly and clearly requests that specific action. For general inquiries from a logged-in user, continue to assist with information about courses, articles, etc., as per your primary role.
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

    // Auth actions
    const ACTION_USER_LOGOUT = 'ACTION_USER_LOGOUT';
    const ACTION_USER_LOGIN_EMAIL_PREFIX = "ACTION_USER_LOGIN_EMAIL:";
    const ACTION_USER_SIGNUP_PREFIX = "ACTION_USER_SIGNUP:";
    const ACTION_USER_LOGIN_GOOGLE = 'ACTION_USER_LOGIN_GOOGLE';
    const { logout, session: currentSession } = useAuth(); // Ensure useAuth is available, get session

    // User Management Actions
    const ACTION_USER_CHANGE_PASSWORD_PREFIX = "ACTION_USER_CHANGE_PASSWORD:";
    const ACTION_OPEN_PROFILE_MODAL = "ACTION_OPEN_PROFILE_MODAL";
    const ACTION_USER_DELETE_ACCOUNT_CONFIRMED = "ACTION_USER_DELETE_ACCOUNT_CONFIRMED";

    // New Actions for Order History, Reset Password, Notification Preferences
    const ACTION_USER_VIEW_ORDERS = "ACTION_USER_VIEW_ORDERS";
    const ACTION_USER_RESET_PASSWORD_PREFIX = "ACTION_USER_RESET_PASSWORD:";
    const ACTION_USER_MANAGE_NOTIFICATIONS_PREFIX = "ACTION_USER_MANAGE_NOTIFICATIONS:";

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
    } else if (responseText && responseText.trim() === ACTION_USER_LOGOUT) {
        await logout();
        setMessages(prev => [...prev, { role: 'ai', text: "התנתקת בהצלחה." }]);
    } else if (responseText && responseText.trim().startsWith(ACTION_USER_LOGIN_EMAIL_PREFIX)) {
        const jsonPayload = responseText.trim().substring(ACTION_USER_LOGIN_EMAIL_PREFIX.length).trim();
        try {
            const { email, password } = JSON.parse(jsonPayload);
            setPrefillEmail(email);
            setPrefillPassword(password);
            setIsLoginModalOpen(true);
            setMessages(prev => [...prev, { role: 'ai', text: "אנא המתן, פותח את טופס ההתחברות עם הפרטים שמסרת..." }]);
        } catch (e) {
            console.error("Error parsing login payload:", e);
            setMessages(prev => [...prev, { role: 'ai', text: "שגיאה בעיבוד פרטי ההתחברות." }]);
        }
    } else if (responseText && responseText.trim().startsWith(ACTION_USER_SIGNUP_PREFIX)) {
        const jsonPayload = responseText.trim().substring(ACTION_USER_SIGNUP_PREFIX.length).trim();
        try {
            const { firstName, lastName, email, password } = JSON.parse(jsonPayload);
            setPrefillEmail(email);
            setPrefillPassword(password);
            setPrefillFirstName(firstName); // Stored, though SignupModal might not use it directly
            setPrefillLastName(lastName);   // Stored, though SignupModal might not use it directly
            setIsSignupModalOpen(true);
            setMessages(prev => [...prev, { role: 'ai', text: "אנא המתן, פותח את טופס ההרשמה עם הפרטים שמסרת..." }]);
        } catch (e) {
            console.error("Error parsing signup payload:", e);
            setMessages(prev => [...prev, { role: 'ai', text: "שגיאה בעיבוד פרטי ההרשמה." }]);
        }
    } else if (responseText && responseText.trim() === ACTION_USER_LOGIN_GOOGLE) {
        setMessages(prev => [...prev, { role: 'ai', text: "מפנה אותך להתחברות עם גוגל..." }]);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: window.location.origin }
            });
            if (error) {
                console.error("Google login error:", error);
                setMessages(prev => [...prev, { role: 'ai', text: `שגיאה בהפנייה לגוגל: ${error.message}` }]);
            }
            // If successful, browser will redirect. No further message needed here.
        } catch (e) {
            console.error("Google login exception:", e);
            setMessages(prev => [...prev, { role: 'ai', text: "אירעה שגיאה בעת ניסיון ההתחברות עם גוגל." }]);
        }
    } else if (responseText && responseText.trim().startsWith(ACTION_USER_CHANGE_PASSWORD_PREFIX)) {
        if (!currentSession) {
            setMessages(prev => [...prev, { role: 'ai', text: "עליך להתחבר תחילה כדי לשנות את סיסמתך." }]);
        } else {
            const jsonPayload = responseText.trim().substring(ACTION_USER_CHANGE_PASSWORD_PREFIX.length).trim();
            try {
                const { newPassword } = JSON.parse(jsonPayload);
                if (!newPassword) {
                     setMessages(prev => [...prev, { role: 'ai', text: "לא סופקה סיסמה חדשה." }]);
                } else {
                    const { error } = await supabase.auth.updateUser({ password: newPassword });
                    if (error) {
                        setMessages(prev => [...prev, { role: 'ai', text: `שגיאה בעדכון הסיסמה: ${error.message}` }]);
                    } else {
                        setMessages(prev => [...prev, { role: 'ai', text: "הסיסמה עודכנה בהצלחה." }]);
                    }
                }
            } catch (e) {
                console.error("Error parsing change password payload or updating password:", e);
                setMessages(prev => [...prev, { role: 'ai', text: "שגיאה בעיבוד בקשת שינוי הסיסמה." }]);
            }
        }
    } else if (responseText && responseText.trim() === ACTION_OPEN_PROFILE_MODAL) {
        if (!currentSession) {
            setMessages(prev => [...prev, { role: 'ai', text: "עליך להתחבר תחילה כדי לצפות או לעדכן את הפרופיל שלך." }]);
        } else {
            setIsProfileModalOpen(true);
            setMessages(prev => [...prev, { role: 'ai', text: "פותח את הגדרות הפרופיל שלך..." }]);
        }
    } else if (responseText && responseText.trim() === ACTION_USER_DELETE_ACCOUNT_CONFIRMED) {
        if (!currentSession) {
            setMessages(prev => [...prev, { role: 'ai', text: "עליך להתחבר תחילה כדי למחוק את חשבונך." }]);
        } else {
            setMessages(prev => [...prev, { role: 'ai', text: "מעבד את בקשתך למחיקת החשבון..." }]);
            try {
                const { error } = await supabase.functions.invoke('delete-user-account');
                if (error) {
                    setMessages(prev => [...prev, { role: 'ai', text: `שגיאה בתהליך מחיקת החשבון: ${error.message}. ודא שהפונקציה 'delete-user-account' מוגדרת כראוי ב-Supabase, או פנה לתמיכה.` }]);
                } else {
                    // Logout should be handled by onAuthStateChange in AuthContext after the function successfully deletes the user.
                    setMessages(prev => [...prev, { role: 'ai', text: "בקשת מחיקת החשבון שלך עובדה. אם הפעולה הצליחה, תנותק מהמערכת בקרוב." }]);
                }
            } catch (e: any) {
                console.error("Error invoking delete-user-account function:", e);
                setMessages(prev => [...prev, { role: 'ai', text: `שגיאה קריטית בתהליך מחיקת החשבון: ${e.message || 'Unknown error'}. פנה לתמיכה.` }]);
            }
        }
    } else if (responseText && responseText.trim() === ACTION_USER_VIEW_ORDERS) {
        if (!currentSession) {
            setMessages(prev => [...prev, { role: 'ai', text: "עליך להתחבר תחילה כדי לצפות בהיסטוריית ההזמנות שלך." }]);
        } else {
            setMessages(prev => [...prev, { role: 'ai', text: "מאחזר את היסטוריית ההזמנות שלך... (הערת מפתח: תכונה זו עדיין אינה מיושמת במלואה. יש לאחזר נתוני הזמנות מהמערכת האחורית.)" }]);
            // Placeholder: Actual order fetching logic would go here
        }
    } else if (responseText && responseText.trim().startsWith(ACTION_USER_RESET_PASSWORD_PREFIX)) {
        const jsonPayload = responseText.trim().substring(ACTION_USER_RESET_PASSWORD_PREFIX.length).trim();
        try {
            const { email } = JSON.parse(jsonPayload);
            if (email) {
                setPrefillEmail(email);
                setIsForgotPasswordModalOpen(true);
                setMessages(prev => [...prev, { role: 'ai', text: "אנא המתן, פותח את טופס איפוס הסיסמה עם כתובת האימייל שמסרת..." }]);
            } else {
                setMessages(prev => [...prev, { role: 'ai', text: "לא סופקה כתובת אימייל לאיפוס סיסמה." }]);
            }
        } catch (e) {
            console.error("Error parsing reset password payload:", e);
            setMessages(prev => [...prev, { role: 'ai', text: "שגיאה בעיבוד בקשת איפוס הסיסמה." }]);
        }
    } else if (responseText && responseText.trim().startsWith(ACTION_USER_MANAGE_NOTIFICATIONS_PREFIX)) {
        if (!currentSession) {
            setMessages(prev => [...prev, { role: 'ai', text: "עליך להתחבר תחילה כדי לנהל את העדפות ההתראות שלך." }]);
        } else {
            const jsonPayload = responseText.trim().substring(ACTION_USER_MANAGE_NOTIFICATIONS_PREFIX.length).trim();
            try {
                const { preference, value } = JSON.parse(jsonPayload);
                setMessages(prev => [...prev, { role: 'ai', text: `מעדכן את העדפות ההתראות שלך עבור '${preference}' ל-'${value}'... (הערת מפתח: תכונה זו עדיין אינה מיושמת במלואה. יש לאחסן ולעדכן העדפות משתמש במערכת האחורית.)` }]);
                // Placeholder: Actual notification preference update logic would go here
            } catch (e) {
                console.error("Error parsing manage notifications payload:", e);
                setMessages(prev => [...prev, { role: 'ai', text: "שגיאה בעיבוד בקשת ניהול ההתראות." }]);
            }
        }
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

  // Modal control handlers
  const clearAuthPrefill = () => {
    setPrefillEmail('');
    setPrefillPassword('');
    setPrefillFirstName('');
    setPrefillLastName('');
  };

  const handleLoginClose = () => {
    setIsLoginModalOpen(false);
    clearAuthPrefill();
  };

  const handleSignupClose = () => {
    setIsSignupModalOpen(false);
    clearAuthPrefill();
  };

  const handleForgotPasswordClose = () => {
    setIsForgotPasswordModalOpen(false);
    clearAuthPrefill(); // Though typically only email is prefilled here
  };

  const switchToSignup = (email?: string) => {
    setIsLoginModalOpen(false);
    setIsForgotPasswordModalOpen(false);
    setIsSignupModalOpen(true);
    if (email) setPrefillEmail(email);
  };

  const switchToLogin = (email?: string) => {
    setIsSignupModalOpen(false);
    setIsForgotPasswordModalOpen(false);
    setIsLoginModalOpen(true);
    if (email) setPrefillEmail(email);
  };

  const switchToForgotPassword = (email?: string) => {
    setIsLoginModalOpen(false);
    setIsSignupModalOpen(false);
    setIsForgotPasswordModalOpen(true);
    if (email) setPrefillEmail(email);
  };


  return (
    // -- 🎨 MODIFIED LINE --
    // This container is now full-width on mobile with padding, and aligns items to the center.
    // On desktop, it reverts to the original corner positioning.
<div className="fixed inset-x-2 bottom-2 sm:inset-x-auto sm:right-4 sm:bottom-4 z-50 flex flex-col items-start" dir="rtl">
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={handleLoginClose}
        onSwitchToSignup={switchToSignup}
        onSwitchToForgotPassword={switchToForgotPassword}
        prefillEmail={prefillEmail}
        prefillPassword={prefillPassword}
      />
      <SignupModal
        isOpen={isSignupModalOpen}
        onClose={handleSignupClose}
        onSwitchToLogin={switchToLogin}
        // As per instructions, SignupModal does not take name prefill props directly.
        // The AI will either guide user or use supabase.auth.signUp if all details are collected.
        prefillEmail={prefillEmail} // It might still take email
      />
      <ForgotPasswordModal
        isOpen={isForgotPasswordModalOpen}
        onClose={handleForgotPasswordClose}
        onSwitchToLogin={switchToLogin}
        prefillEmail={prefillEmail}
      />
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
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
