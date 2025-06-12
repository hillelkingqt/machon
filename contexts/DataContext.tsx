import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../utils/supabaseClient';
import { ARTICLES_DATA, FAQ_DATA } from '../constants';
import { Article, FAQCategory } from '../types';

interface DataContextType {
  articles: Article[];
  faqs: FAQCategory[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

interface DataProviderProps { children: ReactNode; }

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [articles, setArticles] = useState<Article[]>(ARTICLES_DATA);
  const [faqs, setFaqs] = useState<FAQCategory[]>(FAQ_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArticles = async () => {
    try {
      const { data: supabaseArticles, error: supabaseError } = await supabase
        .from('articles')
        .select('*');

      if (supabaseError) {
        console.error('Error fetching articles from Supabase:', supabaseError);
        setError('Failed to load articles from database. Error: ' + supabaseError.message);
        setArticles(ARTICLES_DATA);
        return;
      }

      if (supabaseArticles) {
        const fetchedArticles: Article[] = supabaseArticles.map((supaArticle: any) => {
          const created = supaArticle.date || supaArticle.created_at;
          const bodyText: string = supaArticle.fullContent || supaArticle.body || '';
          return {
            ...supaArticle,
            fullContent: bodyText,
            excerpt: supaArticle.excerpt || bodyText.substring(0, 150),
            author: supaArticle.author || 'צוות מכון אביב',
            imageUrl: supaArticle.imageUrl,
            date: created ? new Date(created).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A',
            id: String(supaArticle.id),
          } as Article;
        });
        const combinedArticles = [
          ...fetchedArticles,
          ...ARTICLES_DATA.filter(localArticle =>
            !fetchedArticles.find(fetched => String(fetched.id) === String(localArticle.id))
          )
        ];
        setArticles(combinedArticles);
      } else {
        setArticles(ARTICLES_DATA);
      }
    } catch (err) {
      console.error('Error in fetchArticles:', err);
      setError('An unexpected error occurred while fetching articles.');
      setArticles(ARTICLES_DATA);
    }
  };

  const fetchFaqs = async () => {
    try {
      const { data: supabaseFaqItems, error: supabaseError } = await supabase
        .from('qa')
        .select('id, question_text, answer_text');

      if (supabaseError) {
        console.error('Error fetching FAQ data from Supabase:', supabaseError);
        setError('Failed to load some Q&A from the database. Error: ' + supabaseError.message);
        setFaqs(FAQ_DATA);
        return;
      }

      if (supabaseFaqItems && supabaseFaqItems.length > 0) {
        const supabaseCategories: { [key: string]: FAQCategory } = {};
        const defaultCategoryId = 'supabase_qa';
        const defaultCategoryTitle = 'שאלות שאתם שאלתם אותנו';

        supabaseFaqItems.forEach(item => {
          if (!supabaseCategories[defaultCategoryId]) {
            supabaseCategories[defaultCategoryId] = {
              id: defaultCategoryId,
              title: defaultCategoryTitle,
              questions: [],
            };
          }
          supabaseCategories[defaultCategoryId].questions.push({
            id: String(item.id),
            question: item.question_text,
            answer: item.answer_text || '',
          });
        });

        const fetchedCategoriesArray = Object.values(supabaseCategories);
        let combinedData = [...FAQ_DATA];

        fetchedCategoriesArray.forEach(supaCategory => {
          const existingCategoryIndex = combinedData.findIndex(
            localCat => localCat.title.trim().toLowerCase() === supaCategory.title.trim().toLowerCase()
          );

          if (existingCategoryIndex > -1) {
            const existingQuestions = combinedData[existingCategoryIndex].questions;
            supaCategory.questions.forEach(supaQuestion => {
              if (!existingQuestions.find(q => q.id === supaQuestion.id)) {
                existingQuestions.push(supaQuestion);
              }
            });
            combinedData[existingCategoryIndex].questions = [...existingQuestions];
          } else {
            combinedData.push(supaCategory);
          }
        });

        setFaqs(combinedData);
      } else {
        setFaqs(FAQ_DATA);
      }
    } catch (err) {
      console.error('Error in fetchFaqData:', err);
      setError('An unexpected error occurred while fetching Q&A.');
      setFaqs(FAQ_DATA);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    await Promise.all([fetchArticles(), fetchFaqs()]);
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DataContext.Provider value={{ articles, faqs, loading, error, refreshData }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
