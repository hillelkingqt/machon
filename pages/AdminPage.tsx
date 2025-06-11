import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, APP_NAME } from '../constants';
import { PlusCircle, Edit2, Trash2, XCircle, Loader2 } from 'lucide-react';

// Initialize Supabase client
let supabase: SupabaseClient | null = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
  console.error('Supabase URL or Anon Key is missing. Admin page might not work correctly.');
}

interface Article {
  id: string;
  created_at?: string;
  title: string;
  body: string;
  author_id?: string | null;
  author_name?: string;
  category?: string;
  excerpt?: string;
  image_url?: string;
}

interface QAItem {
  id: string;
  created_at?: string;
  question_text: string;
  answer_text: string | null;
}

const AdminPage: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const navigate = useNavigate();

  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoadingArticles, setIsLoadingArticles] = useState(false);
  const [errorArticles, setErrorArticles] = useState<string | null>(null);
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null);
  const [isSubmittingArticle, setIsSubmittingArticle] = useState(false);

  const [qaItems, setQaItems] = useState<QAItem[]>([]);
  const [isLoadingQA, setIsLoadingQA] = useState(false);
  const [errorQA, setErrorQA] = useState<string | null>(null);
  const [showQAModal, setShowQAModal] = useState(false);
  const [currentQAItem, setCurrentQAItem] = useState<QAItem | null>(null);
  const [isSubmittingQA, setIsSubmittingQA] = useState(false);

  const adminAuthFlag = sessionStorage.getItem('isAdminAuthenticated');
  useEffect(() => {
    if (adminAuthFlag === 'true') {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
      // navigate('/');
    }
  }, [navigate, adminAuthFlag]);

  const fetchArticles = useCallback(async () => {
    if (!supabase) return;
    setIsLoadingArticles(true);
    setErrorArticles(null);
    try {
      const { data, error } = await supabase.from('articles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setArticles(data || []);
    } catch (err: any) {
      setErrorArticles(`שגיאה בטעינת המאמרים: ${err.message}`);
    } finally {
      setIsLoadingArticles(false);
    }
  }, []);

  const fetchQAItems = useCallback(async () => {
    if (!supabase) return;
    setIsLoadingQA(true);
    setErrorQA(null);
    try {
      const { data, error } = await supabase.from('qa').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setQaItems(data || []);
    } catch (err: any) {
      setErrorQA(`שגיאה בטעינת שאלות ותשובות: ${err.message}`);
    } finally {
      setIsLoadingQA(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && supabase) {
      fetchArticles();
      fetchQAItems();
    }
  }, [isAuthenticated, fetchArticles, fetchQAItems]);

  const handleOpenArticleModal = (article: Article | null = null) => {
    setCurrentArticle(article ? { ...article } : { id: '', title: '', body: '', category: '', author_name: '', excerpt: '', image_url: '' });
    setShowArticleModal(true);
  };
  const handleCloseArticleModal = () => { setShowArticleModal(false); setCurrentArticle(null); setErrorArticles(null); };
  const handleArticleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (currentArticle) setCurrentArticle({ ...currentArticle, [e.target.name]: e.target.value });
  };

  const handleArticleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentArticle || !supabase) return;
    setIsSubmittingArticle(true); setErrorArticles(null);
    const articleData = { title: currentArticle.title, body: currentArticle.body, excerpt: currentArticle.excerpt || null, category: currentArticle.category || null, author_name: currentArticle.author_name || null, image_url: currentArticle.image_url || null };
    try {
      const { error } = currentArticle.id ? await supabase.from('articles').update(articleData).eq('id', currentArticle.id) : await supabase.from('articles').insert([articleData]);
      if (error) throw error;
      alert(`מאמר ${currentArticle.id ? 'עודכן' : 'נוצר'} בהצלחה!`);
      handleCloseArticleModal(); fetchArticles();
    } catch (err: any) {
      setErrorArticles(`שגיאה בשמירת המאמר: ${err.message}`);
    } finally {
      setIsSubmittingArticle(false);
    }
  };

  const handleDeleteArticle = async (articleId: string) => {
    if (!supabase || !window.confirm('האם אתה בטוח שברצונך למחוק מאמר זה? פעולה זו אינה ניתנת לשחזור.')) return;
    setErrorArticles(null); setIsLoadingArticles(true); // Show general loading for list
    try {
      const { error } = await supabase.from('articles').delete().eq('id', articleId);
      if (error) throw error;
      alert('המאמר נמחק בהצלחה!'); fetchArticles();
    } catch (err: any) {
      setErrorArticles(`שגיאה במחיקת המאמר: ${err.message}`);
      setIsLoadingArticles(false); // Ensure loading stops on delete error if fetchArticles isn't reached
    }
  };

  const handleOpenQAModal = (qaItem: QAItem | null = null) => {
    setCurrentQAItem(qaItem ? { ...qaItem } : { id: '', question_text: '', answer_text: '' });
    setShowQAModal(true);
  };
  const handleCloseQAModal = () => { setShowQAModal(false); setCurrentQAItem(null); setErrorQA(null); };
  const handleQAFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (currentQAItem) setCurrentQAItem({ ...currentQAItem, [e.target.name]: e.target.value });
  };

  const handleQASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQAItem || !supabase) return;
    setIsSubmittingQA(true); setErrorQA(null);
    const qaData = { question_text: currentQAItem.question_text, answer_text: currentQAItem.answer_text || null };
    try {
      const { error } = currentQAItem.id ? await supabase.from('qa').update(qaData).eq('id', currentQAItem.id) : await supabase.from('qa').insert([qaData]);
      if (error) throw error;
      alert(`שאלה ותשובה ${currentQAItem.id ? 'עודכנו' : 'נוצרו'} בהצלחה!`);
      handleCloseQAModal(); fetchQAItems();
    } catch (err: any) {
      setErrorQA(`שגיאה בשמירת השאלה והתשובה: ${err.message}`);
    } finally {
      setIsSubmittingQA(false);
    }
  };

  const handleDeleteQA = async (qaId: string) => {
    if (!supabase || !window.confirm('האם אתה בטוח שברצונך למחוק שאלה ותשובה זו? פעולה זו אינה ניתנת לשחזור.')) return;
    setErrorQA(null); setIsLoadingQA(true); // Show general loading for list
    try {
      const { error } = await supabase.from('qa').delete().eq('id', qaId);
      if (error) throw error;
      alert('השאלה והתשובה נמחקו בהצלחה!'); fetchQAItems();
    } catch (err: any) {
      setErrorQA(`שגיאה במחיקת השאלה והתשובה: ${err.message}`);
      setIsLoadingQA(false); // Ensure loading stops on delete error if fetchQAItems isn't reached
    }
  };

  if (isAuthenticated === null) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300">
        <Loader2 className="h-12 w-12 animate-spin text-primary dark:text-sky-400" />
        <p className="text-xl mt-4">טוען...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="p-8 text-center min-h-screen bg-slate-100 dark:bg-slate-900 flex flex-col justify-center items-center">
        <XCircle className="h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-2xl sm:text-3xl font-bold text-red-600 mb-3">גישה נדחתה</h1>
        <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300">
          אין לך הרשאה לגשת לדף זה. אנא התחבר כמנהל דרך חלונית הצ'אט.
        </p>
        <button onClick={() => navigate('/')} className="mt-8 px-6 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg shadow-md transition-colors duration-150 font-medium">
          חזור לדף הבית
        </button>
      </div>
    );
  }

  if (!supabase) {
    return (
      <div className="p-8 text-center min-h-screen bg-slate-100 dark:bg-slate-900 flex flex-col justify-center items-center">
        <XCircle className="h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-2xl sm:text-3xl font-bold text-red-600 mb-3">שגיאת הגדרת Supabase</h1>
        <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300">
          פרטי ההתחברות ל-Supabase חסרים. לא ניתן לטעון את לוח הניהול.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200" dir="rtl">
      <header className="bg-white dark:bg-slate-800 shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl sm:text-2xl font-bold text-primary dark:text-sky-400">לוח ניהול - {APP_NAME}</h1>
            <button onClick={() => { sessionStorage.removeItem('isAdminAuthenticated'); navigate('/'); }}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-500 hover:bg-red-600 text-white text-xs sm:text-sm font-medium rounded-md shadow-sm transition-colors duration-150 flex items-center">
              <XCircle size={18} className="ml-1.5 sm:ml-2" /> התנתק
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <p className="mb-6 sm:mb-8 text-base sm:text-lg text-slate-700 dark:text-slate-300">
          ברוך הבא ללוח הניהול. כאן תוכל לנהל את התכנים באתר.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          <section className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center border-b border-slate-300 dark:border-slate-700 pb-4 mb-6">
              <h2 className="text-xl sm:text-2xl font-semibold text-primary dark:text-sky-500">ניהול מאמרים</h2>
              <button onClick={() => handleOpenArticleModal()} className="px-3.5 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center shadow-md text-sm font-medium transition-colors">
                <PlusCircle size={18} className="ml-2" /> הוסף מאמר
              </button>
            </div>
            {isLoadingArticles && (
              <div className="flex flex-col items-center justify-center p-6 text-slate-600 dark:text-slate-400">
                <Loader2 className="h-10 w-10 animate-spin text-primary dark:text-sky-400" />
                <p className="mt-3 text-sm">טוען מאמרים...</p>
              </div>
            )}
            {errorArticles && <div className="p-3 my-3 text-sm rounded-lg border bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700">{errorArticles}</div>}
            {!isLoadingArticles && !errorArticles && articles.length === 0 && (<p className="text-slate-500 dark:text-slate-400 text-center py-6 text-sm">לא נמצאו מאמרים.</p>)}
            {!isLoadingArticles && !errorArticles && articles.length > 0 && (
              <div className="space-y-4">
                {articles.map(article => (
                  <div key={article.id} className="p-3.5 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm hover:shadow-md transition-shadow bg-slate-50 dark:bg-slate-700/40">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1">{article.title}</h3>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                      {article.category && <span className="font-medium bg-slate-200 dark:bg-slate-600 px-1.5 py-0.5 rounded-full">{article.category}</span>}
                      {article.author_name && <span className="mx-1.5">|</span>}
                      {article.author_name && <span>מחבר: {article.author_name}</span>}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-3 clamp-2">{article.excerpt || article.body.substring(0,120) + (article.body.length > 120 ? '...' : '')}</p>
                    <div className="flex gap-x-2 mt-3">
                      <button onClick={() => handleOpenArticleModal(article)} className="px-3 py-1.5 text-xs font-medium rounded-md flex items-center transition-colors bg-sky-500 hover:bg-sky-600 text-white"><Edit2 size={14} className="ml-1.5" />ערוך</button>
                      <button onClick={() => handleDeleteArticle(article.id)} className="px-3 py-1.5 text-xs font-medium rounded-md flex items-center transition-colors bg-red-500 hover:bg-red-600 text-white"><Trash2 size={14} className="ml-1.5" />מחק</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center border-b border-slate-300 dark:border-slate-700 pb-4 mb-6">
              <h2 className="text-xl sm:text-2xl font-semibold text-primary dark:text-sky-500">ניהול שאלות (FAQ)</h2>
              <button onClick={() => handleOpenQAModal()} className="px-3.5 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center shadow-md text-sm font-medium transition-colors">
                <PlusCircle size={18} className="ml-2" /> הוסף שאלה
              </button>
            </div>
            {isLoadingQA && (
              <div className="flex flex-col items-center justify-center p-6 text-slate-600 dark:text-slate-400">
                <Loader2 className="h-10 w-10 animate-spin text-primary dark:text-sky-400" />
                <p className="mt-3 text-sm">טוען שאלות ותשובות...</p>
              </div>
            )}
            {errorQA && <div className="p-3 my-3 text-sm rounded-lg border bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700">{errorQA}</div>}
            {!isLoadingQA && !errorQA && qaItems.length === 0 && (<p className="text-slate-500 dark:text-slate-400 text-center py-6 text-sm">לא נמצאו שאלות ותשובות.</p>)}
            {!isLoadingQA && !errorQA && qaItems.length > 0 && (
              <div className="space-y-3">
                {qaItems.map(item => (
                  <div key={item.id} className="p-3.5 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm hover:shadow-md transition-shadow bg-slate-50 dark:bg-slate-700/40">
                    <h4 className="text-md font-semibold text-slate-800 dark:text-slate-100">{item.question_text}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap mt-1 mb-2.5 clamp-2">{item.answer_text ? item.answer_text.substring(0,120) + (item.answer_text.length > 120 ? '...' : '') : <span className="italic opacity-75">אין תשובה עדיין</span>}</p>
                    <div className="flex gap-x-2 mt-3">
                      <button onClick={() => handleOpenQAModal(item)} className="px-3 py-1.5 text-xs font-medium rounded-md flex items-center transition-colors bg-sky-500 hover:bg-sky-600 text-white"><Edit2 size={14} className="ml-1.5" />ערוך</button>
                      <button onClick={() => handleDeleteQA(item.id)} className="px-3 py-1.5 text-xs font-medium rounded-md flex items-center transition-colors bg-red-500 hover:bg-red-600 text-white"><Trash2 size={14} className="ml-1.5" />מחק</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {showArticleModal && currentArticle && (
          <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-[100] p-4" dir="rtl">
            <div className="bg-white dark:bg-slate-800 p-5 sm:p-8 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center border-b border-slate-300 dark:border-slate-700 pb-4 mb-6">
                <h3 className="text-xl sm:text-2xl font-semibold text-primary dark:text-sky-400">{currentArticle.id ? 'עריכת מאמר' : 'הוספת מאמר חדש'}</h3>
                <button onClick={handleCloseArticleModal} className="text-slate-400 hover:text-slate-600 dark:text-slate-300 dark:hover:text-slate-100 transition-colors"><XCircle size={26} /></button>
              </div>
              <form onSubmit={handleArticleSubmit} className="overflow-y-auto space-y-5 pr-1 sm:pr-2 flex-grow">
                {errorArticles && <div className="p-3 text-sm rounded-lg border bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700">{errorArticles}</div>}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">כותרת</label>
                  <input type="text" name="title" id="title" value={currentArticle.title} onChange={handleArticleFormChange} className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-slate-700 dark:text-white shadow-sm text-sm sm:text-base" required />
                </div>
                <div>
                  <label htmlFor="body" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">תוכן מלא</label>
                  <textarea name="body" id="body" value={currentArticle.body} onChange={handleArticleFormChange} rows={6} className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-slate-700 dark:text-white shadow-sm text-sm sm:text-base" required />
                </div>
                <div>
                  <label htmlFor="excerpt" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">תקציר (אופציונלי)</label>
                  <textarea name="excerpt" id="excerpt" value={currentArticle.excerpt || ''} onChange={handleArticleFormChange} rows={3} className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-slate-700 dark:text-white shadow-sm text-sm sm:text-base" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">קטגוריה</label>
                    <input type="text" name="category" id="category" value={currentArticle.category || ''} onChange={handleArticleFormChange} className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-slate-700 dark:text-white shadow-sm text-sm sm:text-base" />
                  </div>
                  <div>
                    <label htmlFor="author_name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">שם המחבר</label>
                    <input type="text" name="author_name" id="author_name" value={currentArticle.author_name || ''} onChange={handleArticleFormChange} className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-slate-700 dark:text-white shadow-sm text-sm sm:text-base" />
                  </div>
                </div>
                <div>
                  <label htmlFor="image_url" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">כתובת URL של תמונה (אופציונלי)</label>
                  <input type="url" name="image_url" id="image_url" value={currentArticle.image_url || ''} onChange={handleArticleFormChange} className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-slate-700 dark:text-white shadow-sm text-sm sm:text-base ltr" placeholder="https://example.com/image.jpg" />
                </div>
                <div className="flex justify-end gap-x-3 pt-5 mt-auto border-t border-slate-300 dark:border-slate-700">
                  <button type="button" onClick={handleCloseArticleModal} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg transition-colors" disabled={isSubmittingArticle}>ביטול</button>
                  <button type="submit" className="px-5 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg flex items-center disabled:opacity-70 transition-colors" disabled={isSubmittingArticle}>
                    {isSubmittingArticle && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    {isSubmittingArticle ? (currentArticle.id ? 'מעדכן...' : 'שומר...') : (currentArticle.id ? 'שמור שינויים' : 'צור מאמר')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showQAModal && currentQAItem && (
          <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-[100] p-4" dir="rtl">
            <div className="bg-white dark:bg-slate-800 p-5 sm:p-8 rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center border-b border-slate-300 dark:border-slate-700 pb-4 mb-6">
                <h3 className="text-xl sm:text-2xl font-semibold text-primary dark:text-sky-400">{currentQAItem.id ? 'עריכת שאלה ותשובה' : 'הוספת שאלה חדשה'}</h3>
                <button onClick={handleCloseQAModal} className="text-slate-400 hover:text-slate-600 dark:text-slate-300 dark:hover:text-slate-100 transition-colors"><XCircle size={26} /></button>
              </div>
              <form onSubmit={handleQASubmit} className="overflow-y-auto space-y-5 pr-1 sm:pr-2 flex-grow">
                {errorQA && <div className="p-3 text-sm rounded-lg border bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700">{errorQA}</div>}
                <div>
                  <label htmlFor="question_text" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">שאלה</label>
                  <textarea name="question_text" id="question_text" value={currentQAItem.question_text} onChange={handleQAFormChange} rows={3} className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-slate-700 dark:text-white shadow-sm text-sm sm:text-base" required />
                </div>
                <div>
                  <label htmlFor="answer_text" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">תשובה</label>
                  <textarea name="answer_text" id="answer_text" value={currentQAItem.answer_text || ''} onChange={handleQAFormChange} rows={5} className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-slate-700 dark:text-white shadow-sm text-sm sm:text-base" />
                </div>
                <div className="flex justify-end gap-x-3 pt-5 mt-auto border-t border-slate-300 dark:border-slate-700">
                  <button type="button" onClick={handleCloseQAModal} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg transition-colors" disabled={isSubmittingQA}>ביטול</button>
                  <button type="submit" className="px-5 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg flex items-center disabled:opacity-70 transition-colors" disabled={isSubmittingQA}>
                    {isSubmittingQA && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    {isSubmittingQA ? (currentQAItem.id ? 'מעדכן...' : 'שומר...') : (currentQAItem.id ? 'שמור שינויים' : 'צור שאלה')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white dark:bg-slate-800 mt-8 sm:mt-12 py-6 text-center border-t border-slate-200 dark:border-slate-700">
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">&copy; {new Date().getFullYear()} {APP_NAME} Admin Panel</p>
      </footer>
    </div>
  );
};

export default AdminPage;
