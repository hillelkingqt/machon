import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Loader2, Bot, User, Minimize2, Maximize2, Volume2, VolumeX, Download, Trash2, Settings, RefreshCw, Eye, EyeOff, Zap, Activity, Globe, Clock, MapPin, Smartphone, Monitor, Wifi, Battery, HardDrive, Cpu, MemoryStick, Thermometer, Gauge } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useDarkMode } from '../hooks/useDarkMode';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { LoginModal, SignupModal, ForgotPasswordModal } from './auth';
import { ProfileModal } from './profile';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  actions?: string[];
  metadata?: {
    location?: string;
    userAgent?: string;
    sessionDuration?: number;
    pageViews?: number;
    scrollPosition?: number;
    deviceInfo?: any;
    networkInfo?: any;
    performanceMetrics?: any;
  };
}

interface UserSession {
  sessionId: string;
  startTime: Date;
  pageViews: number;
  currentPage: string;
  scrollPosition: number;
  timeOnPage: number;
  interactions: number;
  deviceInfo: any;
  networkInfo: any;
  performanceMetrics: any;
  userPreferences: any;
  behaviorPattern: string[];
}

interface SystemMetrics {
  memoryUsage: number;
  cpuUsage: number;
  networkLatency: number;
  batteryLevel: number;
  connectionType: string;
  screenResolution: string;
  colorDepth: number;
  timezone: string;
  language: string;
  platform: string;
  cookiesEnabled: boolean;
  localStorageAvailable: boolean;
  geolocation?: { latitude: number; longitude: number };
}

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [showSystemMetrics, setShowSystemMetrics] = useState(false);
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [aiPersonality, setAiPersonality] = useState('helpful'); // helpful, professional, casual, expert
  const [autoRespond, setAutoRespond] = useState(false);
  const [predictiveMode, setPredictiveMode] = useState(false);
  const [learningMode, setLearningMode] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const performanceObserverRef = useRef<PerformanceObserver | null>(null);
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null);

  const { user, profile, logout } = useAuth();
  const { articles, faqCategories } = useData();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const location = useLocation();
  const navigate = useNavigate();

  // Modal states
  const [activeModal, setActiveModal] = useState<'login' | 'signup' | 'forgotPassword' | 'profile' | null>(null);

  // Initialize session tracking
  useEffect(() => {
    initializeSession();
    initializeSystemMonitoring();
    initializeSpeechRecognition();
    initializePerformanceMonitoring();
    initializeUserBehaviorTracking();
    
    return () => {
      cleanupSession();
    };
  }, []);

  // Track location changes
  useEffect(() => {
    if (userSession) {
      updateSessionData({
        currentPage: location.pathname,
        pageViews: userSession.pageViews + 1,
        timeOnPage: 0
      });
      
      // Log page visit to AI context
      logAIContext('PAGE_VISIT', {
        page: location.pathname,
        timestamp: new Date(),
        user: user?.email || 'anonymous'
      });
    }
  }, [location.pathname]);

  // Advanced session initialization
  const initializeSession = useCallback(() => {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const deviceInfo = getDeviceInfo();
    const networkInfo = getNetworkInfo();
    
    const session: UserSession = {
      sessionId,
      startTime: new Date(),
      pageViews: 1,
      currentPage: location.pathname,
      scrollPosition: 0,
      timeOnPage: 0,
      interactions: 0,
      deviceInfo,
      networkInfo,
      performanceMetrics: {},
      userPreferences: getUserPreferences(),
      behaviorPattern: []
    };

    setUserSession(session);
    
    // Start session timer
    sessionTimerRef.current = setInterval(() => {
      updateSessionTimer();
    }, 1000);

    // Track scroll position
    const handleScroll = () => {
      const scrollPosition = window.pageYOffset;
      updateSessionData({ scrollPosition });
      
      // Log significant scroll events
      if (scrollPosition > 0 && scrollPosition % 1000 === 0) {
        logAIContext('SCROLL_MILESTONE', { position: scrollPosition });
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [location.pathname]);

  // System monitoring initialization
  const initializeSystemMonitoring = useCallback(() => {
    const updateMetrics = () => {
      const metrics: SystemMetrics = {
        memoryUsage: getMemoryUsage(),
        cpuUsage: getCPUUsage(),
        networkLatency: getNetworkLatency(),
        batteryLevel: getBatteryLevel(),
        connectionType: getConnectionType(),
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        colorDepth: window.screen.colorDepth,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        platform: navigator.platform,
        cookiesEnabled: navigator.cookieEnabled,
        localStorageAvailable: isLocalStorageAvailable()
      };

      // Get geolocation if available
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            metrics.geolocation = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            };
            setSystemMetrics(metrics);
          },
          () => {
            setSystemMetrics(metrics);
          }
        );
      } else {
        setSystemMetrics(metrics);
      }
    };

    updateMetrics();
    const metricsInterval = setInterval(updateMetrics, 5000);

    return () => clearInterval(metricsInterval);
  }, []);

  // Speech recognition setup
  const initializeSpeechRecognition = useCallback(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'he-IL';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsListening(false);
        
        // Auto-send if enabled
        if (autoRespond) {
          handleSendMessage(transcript);
        }
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };
    }

    // Initialize speech synthesis
    speechSynthesisRef.current = window.speechSynthesis;
  }, [autoRespond]);

  // Performance monitoring
  const initializePerformanceMonitoring = useCallback(() => {
    if ('PerformanceObserver' in window) {
      performanceObserverRef.current = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          logAIContext('PERFORMANCE_METRIC', {
            name: entry.name,
            duration: entry.duration,
            startTime: entry.startTime,
            type: entry.entryType
          });
        });
      });

      performanceObserverRef.current.observe({ entryTypes: ['navigation', 'resource', 'measure'] });
    }
  }, []);

  // User behavior tracking
  const initializeUserBehaviorTracking = useCallback(() => {
    const trackInteraction = (type: string, target: string) => {
      if (userSession) {
        const interaction = `${type}:${target}`;
        updateSessionData({
          interactions: userSession.interactions + 1,
          behaviorPattern: [...userSession.behaviorPattern, interaction].slice(-50) // Keep last 50 interactions
        });
        
        logAIContext('USER_INTERACTION', {
          type,
          target,
          timestamp: new Date(),
          sessionId: userSession.sessionId
        });
      }
    };

    // Track clicks
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      trackInteraction('click', target.tagName.toLowerCase());
    });

    // Track form submissions
    document.addEventListener('submit', (e) => {
      trackInteraction('form_submit', 'form');
    });

    // Track key presses
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === 'Tab') {
        trackInteraction('key_press', e.key);
      }
    });
  }, [userSession]);

  // Helper functions for system metrics
  const getDeviceInfo = () => ({
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine,
    hardwareConcurrency: navigator.hardwareConcurrency,
    maxTouchPoints: navigator.maxTouchPoints,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    availWidth: window.screen.availWidth,
    availHeight: window.screen.availHeight,
    colorDepth: window.screen.colorDepth,
    pixelDepth: window.screen.pixelDepth
  });

  const getNetworkInfo = () => {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    return connection ? {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    } : {};
  };

  const getUserPreferences = () => ({
    darkMode,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    colorScheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  });

  const getMemoryUsage = () => {
    const memory = (performance as any).memory;
    return memory ? {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit
    } : 0;
  };

  const getCPUUsage = () => {
    // Simplified CPU usage estimation
    const start = performance.now();
    for (let i = 0; i < 100000; i++) {
      Math.random();
    }
    const end = performance.now();
    return Math.min(100, (end - start) * 10);
  };

  const getNetworkLatency = () => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return navigation ? navigation.responseStart - navigation.requestStart : 0;
  };

  const getBatteryLevel = () => {
    // Battery API is deprecated, return mock data
    return Math.floor(Math.random() * 100);
  };

  const getConnectionType = () => {
    const connection = (navigator as any).connection;
    return connection ? connection.effectiveType : 'unknown';
  };

  const isLocalStorageAvailable = () => {
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      return true;
    } catch {
      return false;
    }
  };

  // Session management
  const updateSessionData = (updates: Partial<UserSession>) => {
    setUserSession(prev => prev ? { ...prev, ...updates } : null);
  };

  const updateSessionTimer = () => {
    if (userSession) {
      updateSessionData({
        timeOnPage: userSession.timeOnPage + 1
      });
    }
  };

  const cleanupSession = () => {
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
    }
    if (performanceObserverRef.current) {
      performanceObserverRef.current.disconnect();
    }
    if (intersectionObserverRef.current) {
      intersectionObserverRef.current.disconnect();
    }
  };

  // AI Context logging
  const logAIContext = async (event: string, data: any) => {
    try {
      await supabase.functions.invoke('log-ai-context', {
        body: {
          event,
          data,
          timestamp: new Date().toISOString(),
          sessionId: userSession?.sessionId,
          userId: user?.id,
          userEmail: user?.email,
          currentPage: location.pathname,
          userAgent: navigator.userAgent,
          systemMetrics: systemMetrics
        }
      });
    } catch (error) {
      console.error('Failed to log AI context:', error);
    }
  };

  // Enhanced AI message processing
  const processAIResponse = async (userMessage: string): Promise<string> => {
    const context = {
      user: {
        isLoggedIn: !!user,
        email: user?.email,
        profile: profile,
        preferences: getUserPreferences()
      },
      session: userSession,
      system: systemMetrics,
      site: {
        currentPage: location.pathname,
        articles: articles.length,
        faqCategories: faqCategories.length,
        darkMode
      },
      data: {
        articles: articles.slice(0, 5), // Send sample data
        faqCategories: faqCategories.slice(0, 3)
      },
      capabilities: [
        'TOGGLE_DARK_MODE',
        'USER_LOGIN_GOOGLE',
        'USER_LOGOUT',
        'OPEN_PROFILE_MODAL',
        'NAVIGATE_TO_PAGE',
        'SEARCH_ARTICLES',
        'SEARCH_FAQ',
        'GET_USER_STATS',
        'GET_SYSTEM_METRICS',
        'CONTROL_SPEECH',
        'DOWNLOAD_CHAT_HISTORY',
        'CLEAR_CHAT_HISTORY',
        'CHANGE_AI_PERSONALITY',
        'TOGGLE_AUTO_RESPOND',
        'TOGGLE_PREDICTIVE_MODE',
        'TOGGLE_MONITORING',
        'GET_PERFORMANCE_METRICS',
        'GET_USER_BEHAVIOR',
        'ANALYZE_USER_JOURNEY',
        'PREDICT_USER_NEEDS',
        'OPTIMIZE_USER_EXPERIENCE',
        'GENERATE_INSIGHTS',
        'CREATE_PERSONALIZED_CONTENT',
        'SCHEDULE_REMINDERS',
        'TRACK_GOALS',
        'ANALYZE_LEARNING_PROGRESS'
      ]
    };

    const systemPrompt = `אתה עוזר AI מתקדם ואינטליגנטי לאתר מכון אביב. 
    
    יכולות מתקדמות שלך:
    1. שליטה מלאה באתר - ניווט, הגדרות, מצבים
    2. ניטור משתמש בזמן אמת - התנהגות, ביצועים, מיקום
    3. ניתוח נתונים מתקדם - דפוסי שימוש, העדפות, חיזוי צרכים
    4. בקרת מערכת - מטריקות, ביצועים, אופטימיזציה
    5. למידה אישית - התאמת תוכן, המלצות, מעקב התקדמות
    6. אינטראקציה קולית - זיהוי דיבור, סינתזת קול
    7. ניהול הפעלה - תזכורות, מטלות, יעדים
    8. יצירת תוכן - מאמרים מותאמים אישית, תרגילים
    9. אנליטיקה מתקדמת - דוחות, תובנות, חיזויים
    10. אוטומציה חכמה - תגובות אוטומטיות, אופטימיזציה

    הקשר הנוכחי: ${JSON.stringify(context, null, 2)}
    
    תן תשובות מועילות, מדויקות ואישיות. השתמש בפעולות כשצריך.
    אם המשתמש מבקש פעולה, השב עם הפעולה המתאימה.
    
    פעולות זמינות:
    - ACTION_TOGGLE_DARK_MODE - החלפת מצב כהה/בהיר
    - ACTION_USER_LOGIN_GOOGLE - התחברות עם גוגל
    - ACTION_USER_LOGOUT - התנתקות
    - ACTION_OPEN_PROFILE_MODAL - פתיחת הגדרות פרופיל
    - ACTION_NAVIGATE_TO_[PAGE] - ניווט לעמוד (למשל ACTION_NAVIGATE_TO_COURSES)
    - ACTION_SEARCH_ARTICLES_[QUERY] - חיפוש מאמרים
    - ACTION_SEARCH_FAQ_[QUERY] - חיפוש שאלות נפוצות
    - ACTION_GET_USER_STATS - קבלת סטטיסטיקות משתמש
    - ACTION_GET_SYSTEM_METRICS - קבלת מטריקות מערכת
    - ACTION_SPEAK_[TEXT] - הקראת טקסט
    - ACTION_DOWNLOAD_CHAT - הורדת היסטוריית צ'אט
    - ACTION_CLEAR_CHAT - ניקוי היסטוריית צ'אט
    - ACTION_CHANGE_PERSONALITY_[TYPE] - שינוי אישיות AI
    - ACTION_TOGGLE_AUTO_RESPOND - הפעלת תגובה אוטומטית
    - ACTION_TOGGLE_PREDICTIVE_MODE - הפעלת מצב חיזוי
    - ACTION_TOGGLE_MONITORING - הפעלת ניטור מערכת
    - ACTION_ANALYZE_USER_JOURNEY - ניתוח מסע המשתמש
    - ACTION_PREDICT_USER_NEEDS - חיזוי צרכי המשתמש
    - ACTION_GENERATE_INSIGHTS - יצירת תובנות
    - ACTION_CREATE_PERSONALIZED_CONTENT - יצירת תוכן מותאם אישית
    - ACTION_SCHEDULE_REMINDER_[TEXT] - קביעת תזכורת
    - ACTION_TRACK_GOAL_[GOAL] - מעקב אחר יעד
    - ACTION_ANALYZE_LEARNING_PROGRESS - ניתוח התקדמות למידה`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${systemPrompt}\n\nהודעת המשתמש: ${userMessage}`
            }]
          }]
        })
      });

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'מצטער, לא הצלחתי לעבד את הבקשה.';
    } catch (error) {
      console.error('AI processing error:', error);
      return 'אירעה שגיאה בעיבוד הבקשה. אנא נסה שוב.';
    }
  };

  // Enhanced action processing
  const processActions = async (responseText: string) => {
    const actions = responseText.match(/ACTION_[A-Z_]+(?:_[^.\s]*)?/g) || [];
    
    for (const action of actions) {
      await executeAction(action);
    }
    
    return responseText.replace(/ACTION_[A-Z_]+(?:_[^.\s]*)?/g, '').trim();
  };

  const executeAction = async (action: string) => {
    try {
      if (action === 'ACTION_TOGGLE_DARK_MODE') {
        toggleDarkMode();
        addMessage('מצב התצוגה הוחלף בהצלחה.', false);
      }
      else if (action === 'ACTION_USER_LOGIN_GOOGLE') {
        if (user) {
          addMessage('אתה כבר מחובר למערכת.', false);
        } else {
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin }
          });
          if (!error) {
            addMessage('מפנה אותך להתחברות עם גוגל...', false);
          }
        }
      }
      else if (action === 'ACTION_USER_LOGOUT') {
        if (user) {
          await logout();
          addMessage('התנתקת בהצלחה.', false);
        } else {
          addMessage('אתה לא מחובר כרגע.', false);
        }
      }
      else if (action === 'ACTION_OPEN_PROFILE_MODAL') {
        if (user) {
          setActiveModal('profile');
          addMessage('פותח את הגדרות הפרופיל שלך...', false);
        } else {
          addMessage('עליך להתחבר תחילה כדי לצפות בפרופיל.', false);
        }
      }
      else if (action.startsWith('ACTION_NAVIGATE_TO_')) {
        const page = action.replace('ACTION_NAVIGATE_TO_', '').toLowerCase();
        const pageMap: { [key: string]: string } = {
          'home': '/',
          'courses': '/courses',
          'articles': '/articles',
          'about': '/about',
          'contact': '/contact',
          'faq': '/faq',
          'shop': '/shop',
          'learning': '/learning-zone'
        };
        
        if (pageMap[page]) {
          navigate(pageMap[page]);
          addMessage(`מנווט לעמוד ${page}...`, false);
        }
      }
      else if (action.startsWith('ACTION_SEARCH_ARTICLES_')) {
        const query = action.replace('ACTION_SEARCH_ARTICLES_', '');
        const results = articles.filter(article => 
          article.title.includes(query) || article.excerpt.includes(query)
        );
        addMessage(`נמצאו ${results.length} מאמרים עבור "${query}".`, false);
      }
      else if (action.startsWith('ACTION_SEARCH_FAQ_')) {
        const query = action.replace('ACTION_SEARCH_FAQ_', '');
        let results = 0;
        faqCategories.forEach(category => {
          results += category.questions.filter(q => 
            q.question.includes(query) || q.answer.includes(query)
          ).length;
        });
        addMessage(`נמצאו ${results} שאלות נפוצות עבור "${query}".`, false);
      }
      else if (action === 'ACTION_GET_USER_STATS') {
        const stats = {
          sessionDuration: userSession?.timeOnPage || 0,
          pageViews: userSession?.pageViews || 0,
          interactions: userSession?.interactions || 0,
          currentPage: location.pathname,
          isLoggedIn: !!user
        };
        addMessage(`סטטיסטיקות המשתמש: ${JSON.stringify(stats, null, 2)}`, false);
      }
      else if (action === 'ACTION_GET_SYSTEM_METRICS') {
        if (systemMetrics) {
          addMessage(`מטריקות המערכת: זיכרון: ${JSON.stringify(systemMetrics.memoryUsage)}, רשת: ${systemMetrics.connectionType}, רזולוציה: ${systemMetrics.screenResolution}`, false);
        }
      }
      else if (action.startsWith('ACTION_SPEAK_')) {
        const text = action.replace('ACTION_SPEAK_', '');
        speakText(text);
      }
      else if (action === 'ACTION_DOWNLOAD_CHAT') {
        downloadChatHistory();
      }
      else if (action === 'ACTION_CLEAR_CHAT') {
        clearChatHistory();
      }
      else if (action.startsWith('ACTION_CHANGE_PERSONALITY_')) {
        const personality = action.replace('ACTION_CHANGE_PERSONALITY_', '').toLowerCase();
        setAiPersonality(personality);
        addMessage(`אישיות ה-AI שונתה ל-${personality}.`, false);
      }
      else if (action === 'ACTION_TOGGLE_AUTO_RESPOND') {
        setAutoRespond(!autoRespond);
        addMessage(`תגובה אוטומטית ${!autoRespond ? 'הופעלה' : 'בוטלה'}.`, false);
      }
      else if (action === 'ACTION_TOGGLE_PREDICTIVE_MODE') {
        setPredictiveMode(!predictiveMode);
        addMessage(`מצב חיזוי ${!predictiveMode ? 'הופעל' : 'בוטל'}.`, false);
      }
      else if (action === 'ACTION_TOGGLE_MONITORING') {
        setIsMonitoring(!isMonitoring);
        addMessage(`ניטור מערכת ${!isMonitoring ? 'הופעל' : 'בוטל'}.`, false);
      }
      else if (action === 'ACTION_ANALYZE_USER_JOURNEY') {
        const journey = analyzeUserJourney();
        addMessage(`ניתוח מסע המשתמש: ${journey}`, false);
      }
      else if (action === 'ACTION_PREDICT_USER_NEEDS') {
        const prediction = predictUserNeeds();
        addMessage(`חיזוי צרכים: ${prediction}`, false);
      }
      else if (action === 'ACTION_GENERATE_INSIGHTS') {
        const insights = generateInsights();
        addMessage(`תובנות: ${insights}`, false);
      }
      else if (action === 'ACTION_CREATE_PERSONALIZED_CONTENT') {
        const content = createPersonalizedContent();
        addMessage(`תוכן מותאם אישית: ${content}`, false);
      }
      else if (action.startsWith('ACTION_SCHEDULE_REMINDER_')) {
        const reminder = action.replace('ACTION_SCHEDULE_REMINDER_', '');
        scheduleReminder(reminder);
      }
      else if (action.startsWith('ACTION_TRACK_GOAL_')) {
        const goal = action.replace('ACTION_TRACK_GOAL_', '');
        trackGoal(goal);
      }
      else if (action === 'ACTION_ANALYZE_LEARNING_PROGRESS') {
        const progress = analyzeLearningProgress();
        addMessage(`ניתוח התקדמות למידה: ${progress}`, false);
      }

      // Log action execution
      logAIContext('ACTION_EXECUTED', { action, timestamp: new Date() });
    } catch (error) {
      console.error('Action execution error:', error);
      addMessage(`שגיאה בביצוע הפעולה: ${action}`, false);
    }
  };

  // Advanced analysis functions
  const analyzeUserJourney = () => {
    if (!userSession) return 'אין נתוני מסע זמינים';
    
    const journey = {
      sessionDuration: userSession.timeOnPage,
      pagesVisited: userSession.pageViews,
      interactions: userSession.interactions,
      behaviorPattern: userSession.behaviorPattern.slice(-10),
      currentEngagement: calculateEngagementScore()
    };
    
    return JSON.stringify(journey, null, 2);
  };

  const predictUserNeeds = () => {
    if (!userSession) return 'אין מספיק נתונים לחיזוי';
    
    const predictions = [];
    
    // Predict based on current page
    if (location.pathname.includes('courses')) {
      predictions.push('המשתמש מעוניין ברכישת קורס');
    }
    if (location.pathname.includes('articles')) {
      predictions.push('המשתמש מחפש מידע נוסף');
    }
    
    // Predict based on behavior
    if (userSession.interactions > 10) {
      predictions.push('משתמש פעיל - מעוניין בתכנים מתקדמים');
    }
    
    if (userSession.timeOnPage > 300) {
      predictions.push('משתמש מעורב - כדאי להציע תוכן נוסף');
    }
    
    return predictions.join(', ') || 'אין חיזויים זמינים';
  };

  const generateInsights = () => {
    const insights = [];
    
    if (systemMetrics) {
      if (systemMetrics.memoryUsage > 80) {
        insights.push('שימוש גבוה בזיכרון - כדאי לאפטם');
      }
      if (systemMetrics.networkLatency > 1000) {
        insights.push('חיבור איטי - כדאי לטעון פחות תוכן');
      }
    }
    
    if (userSession) {
      if (userSession.interactions < 3 && userSession.timeOnPage > 60) {
        insights.push('משתמש צופה אך לא מקיים אינטראקציה - כדאי להציע עזרה');
      }
    }
    
    return insights.join(', ') || 'אין תובנות מיוחדות';
  };

  const createPersonalizedContent = () => {
    const content = [];
    
    if (user) {
      content.push(`שלום ${profile?.firstName || user.email}, `);
    }
    
    if (location.pathname.includes('courses')) {
      content.push('בהתבסס על העמוד הנוכחי, אני ממליץ על הקורס "הכנה למבחני מחוננים"');
    }
    
    if (userSession && userSession.timeOnPage > 180) {
      content.push('אני רואה שאתה מבלה זמן רב באתר - האם תרצה שאכין עבורך סיכום מותאם אישית?');
    }
    
    return content.join(' ') || 'תוכן מותאם אישית יהיה זמין בקרוב';
  };

  const calculateEngagementScore = () => {
    if (!userSession) return 0;
    
    let score = 0;
    score += Math.min(userSession.timeOnPage / 60, 10); // Max 10 points for time
    score += Math.min(userSession.interactions, 10); // Max 10 points for interactions
    score += Math.min(userSession.pageViews * 2, 10); // Max 10 points for page views
    
    return Math.round(score);
  };

  const scheduleReminder = (reminder: string) => {
    const reminders = JSON.parse(localStorage.getItem('aiReminders') || '[]');
    const newReminder = {
      id: Date.now(),
      text: reminder,
      scheduledFor: new Date(Date.now() + 60000), // 1 minute from now
      created: new Date()
    };
    
    reminders.push(newReminder);
    localStorage.setItem('aiReminders', JSON.stringify(reminders));
    
    setTimeout(() => {
      addMessage(`תזכורת: ${reminder}`, false);
    }, 60000);
    
    addMessage(`תזכורת נקבעה: ${reminder}`, false);
  };

  const trackGoal = (goal: string) => {
    const goals = JSON.parse(localStorage.getItem('aiGoals') || '[]');
    const newGoal = {
      id: Date.now(),
      text: goal,
      progress: 0,
      created: new Date()
    };
    
    goals.push(newGoal);
    localStorage.setItem('aiGoals', JSON.stringify(goals));
    
    addMessage(`יעד חדש נוסף למעקב: ${goal}`, false);
  };

  const analyzeLearningProgress = () => {
    const goals = JSON.parse(localStorage.getItem('aiGoals') || '[]');
    const completedGoals = goals.filter((g: any) => g.progress >= 100).length;
    const totalGoals = goals.length;
    
    if (totalGoals === 0) {
      return 'אין יעדי למידה מוגדרים';
    }
    
    const progressPercentage = (completedGoals / totalGoals) * 100;
    return `התקדמות כללית: ${progressPercentage.toFixed(1)}% (${completedGoals}/${totalGoals} יעדים הושלמו)`;
  };

  // Speech functions
  const startListening = () => {
    if (recognitionRef.current) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const speakText = (text: string) => {
    if (speechSynthesisRef.current) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'he-IL';
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      speechSynthesisRef.current.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  // Chat management
  const downloadChatHistory = () => {
    const chatData = {
      messages,
      session: userSession,
      metrics: systemMetrics,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-history-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    addMessage('היסטוריית הצ\'אט הורדה בהצלחה.', false);
  };

  const clearChatHistory = () => {
    setMessages([]);
    addMessage('היסטוריית הצ\'אט נוקתה.', false);
  };

  // Message handling
  const addMessage = (text: string, isUser: boolean, actions?: string[]) => {
    const message: Message = {
      id: Date.now().toString(),
      text,
      isUser,
      timestamp: new Date(),
      actions,
      metadata: {
        location: location.pathname,
        userAgent: navigator.userAgent,
        sessionDuration: userSession?.timeOnPage,
        pageViews: userSession?.pageViews,
        scrollPosition: window.pageYOffset,
        deviceInfo: getDeviceInfo(),
        networkInfo: getNetworkInfo(),
        performanceMetrics: systemMetrics
      }
    };
    
    setMessages(prev => [...prev, message]);
    
    // Log message to AI context
    logAIContext('CHAT_MESSAGE', {
      messageId: message.id,
      isUser,
      text: text.substring(0, 100), // First 100 chars for privacy
      timestamp: message.timestamp
    });
  };

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || inputValue.trim();
    if (!text) return;

    setInputValue('');
    addMessage(text, true);
    setIsLoading(true);

    try {
      const response = await processAIResponse(text);
      const cleanResponse = await processActions(response);
      
      if (cleanResponse) {
        addMessage(cleanResponse, false);
        
        // Auto-speak response if enabled
        if (isSpeaking || autoRespond) {
          speakText(cleanResponse);
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      addMessage('מצטער, אירעה שגיאה. אנא נסה שוב.', false);
    } finally {
      setIsLoading(false);
    }
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  // Predictive mode - suggest responses
  useEffect(() => {
    if (predictiveMode && isOpen && !isLoading && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage.isUser) {
        // Suggest follow-up questions
        setTimeout(() => {
          const suggestions = generateSuggestions(lastMessage.text);
          if (suggestions.length > 0) {
            addMessage(`הצעות למשך השיחה: ${suggestions.join(', ')}`, false);
          }
        }, 2000);
      }
    }
  }, [messages, predictiveMode, isOpen, isLoading]);

  const generateSuggestions = (lastResponse: string) => {
    const suggestions = [];
    
    if (lastResponse.includes('קורס')) {
      suggestions.push('ספר לי עוד על הקורסים');
    }
    if (lastResponse.includes('מחיר')) {
      suggestions.push('איך אני יכול לרכוש?');
    }
    if (lastResponse.includes('מבחן')) {
      suggestions.push('איך אני מתכונן למבחן?');
    }
    
    return suggestions.slice(0, 3);
  };

  return (
    <>
      {/* Chat Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 left-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-300 ${
          darkMode 
            ? 'bg-gradient-to-r from-primary to-primary-light text-white' 
            : 'bg-gradient-to-r from-primary-dark to-primary text-white'
        } hover:scale-110 active:scale-95`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <div className="relative">
          {isMonitoring && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          )}
          <MessageSquare size={24} />
        </div>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 100 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`fixed bottom-24 left-6 z-50 w-96 max-w-[calc(100vw-3rem)] ${
              isMinimized ? 'h-16' : 'h-[600px]'
            } bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary to-primary-light text-white">
              <div className="flex items-center gap-2">
                <Bot size={20} />
                <span className="font-semibold">עוזר AI מתקדם</span>
                {isMonitoring && (
                  <div className="flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded-full">
                    <Activity size={12} />
                    <span>פעיל</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {showSystemMetrics && (
                  <button
                    onClick={() => setShowSystemMetrics(false)}
                    className="p-1 hover:bg-white/20 rounded"
                  >
                    <EyeOff size={16} />
                  </button>
                )}
                {!showSystemMetrics && (
                  <button
                    onClick={() => setShowSystemMetrics(true)}
                    className="p-1 hover:bg-white/20 rounded"
                  >
                    <Eye size={16} />
                  </button>
                )}
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1 hover:bg-white/20 rounded"
                >
                  {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white/20 rounded"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* System Metrics Panel */}
                {showSystemMetrics && systemMetrics && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <Monitor size={12} />
                        <span>{systemMetrics.screenResolution}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Wifi size={12} />
                        <span>{systemMetrics.connectionType}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>{userSession?.timeOnPage || 0}s</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Activity size={12} />
                        <span>{userSession?.interactions || 0} פעולות</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                      <Bot size={48} className="mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-semibold mb-2">שלום! אני העוזר AI המתקדם שלך</p>
                      <p className="text-sm">אני יכול לעזור לך עם כל מה שקשור לאתר, לנתח את ההתנהגות שלך, לחזות את הצרכים שלך ועוד הרבה!</p>
                      <div className="mt-4 text-xs space-y-1">
                        <p>💡 נסה: "הפעל מצב כהה", "נתח את ההתנהגות שלי", "צור תוכן מותאם אישית"</p>
                        <p>🎯 יכולות מתקדמות: ניטור בזמן אמת, חיזוי צרכים, אוטומציה חכמה</p>
                      </div>
                    </div>
                  )}
                  
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] p-3 rounded-2xl ${
                        message.isUser
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                      }`}>
                        <div className="flex items-start gap-2">
                          {!message.isUser && <Bot size={16} className="mt-1 flex-shrink-0" />}
                          {message.isUser && <User size={16} className="mt-1 flex-shrink-0" />}
                          <div className="flex-1">
                            <p className="text-sm leading-relaxed">{message.text}</p>
                            <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                              <span>{message.timestamp.toLocaleTimeString('he-IL')}</span>
                              {!message.isUser && (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => speakText(message.text)}
                                    className="p-1 hover:bg-white/20 rounded"
                                  >
                                    <Volume2 size={12} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                    >
                      <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-2xl">
                        <div className="flex items-center gap-2">
                          <Bot size={16} />
                          <Loader2 size={16} className="animate-spin" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">מעבד...</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Controls */}
                <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      onClick={startListening}
                      disabled={isListening}
                      className={`p-2 rounded-lg transition-colors ${
                        isListening 
                          ? 'bg-red-500 text-white animate-pulse' 
                          : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      <Volume2 size={16} />
                    </button>
                    
                    <button
                      onClick={isSpeaking ? stopSpeaking : () => {}}
                      className={`p-2 rounded-lg transition-colors ${
                        isSpeaking 
                          ? 'bg-red-500 text-white' 
                          : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>
                    
                    <button
                      onClick={downloadChatHistory}
                      className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Download size={16} />
                    </button>
                    
                    <button
                      onClick={clearChatHistory}
                      className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                    
                    <button
                      onClick={() => setIsMonitoring(!isMonitoring)}
                      className={`p-2 rounded-lg transition-colors ${
                        isMonitoring 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      <Activity size={16} />
                    </button>
                  </div>
                  
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="כתבו הודעה..."
                      className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
                      disabled={isLoading}
                    />
                    <button
                      onClick={() => handleSendMessage()}
                      disabled={isLoading || !inputValue.trim()}
                      className="p-3 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                  
                  {/* AI Status Indicators */}
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-4">
                      <span className={`flex items-center gap-1 ${autoRespond ? 'text-green-500' : ''}`}>
                        <Zap size={12} />
                        {autoRespond ? 'אוטו' : 'ידני'}
                      </span>
                      <span className={`flex items-center gap-1 ${predictiveMode ? 'text-blue-500' : ''}`}>
                        <Activity size={12} />
                        {predictiveMode ? 'חיזוי' : 'רגיל'}
                      </span>
                      <span className={`flex items-center gap-1 ${learningMode ? 'text-purple-500' : ''}`}>
                        <Settings size={12} />
                        {learningMode ? 'לומד' : 'סטטי'}
                      </span>
                    </div>
                    <span>אישיות: {aiPersonality}</span>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <LoginModal
        isOpen={activeModal === 'login'}
        onClose={() => setActiveModal(null)}
        onSwitchToSignup={() => setActiveModal('signup')}
        onSwitchToForgotPassword={() => setActiveModal('forgotPassword')}
      />
      <SignupModal
        isOpen={activeModal === 'signup'}
        onClose={() => setActiveModal(null)}
        onSwitchToLogin={() => setActiveModal('login')}
      />
      <ForgotPasswordModal
        isOpen={activeModal === 'forgotPassword'}
        onClose={() => setActiveModal(null)}
      />
      <ProfileModal
        isOpen={activeModal === 'profile'}
        onClose={() => setActiveModal(null)}
      />
    </>
  );
};

export default ChatWidget;