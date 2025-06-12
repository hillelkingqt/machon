import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Article, FAQCategory, FAQItem } from '../types'; // Assuming these types exist and are comprehensive
import { ARTICLES_DATA, FAQ_DATA } from '../constants'; // Local fallback data

interface DataContextState {
  articles: Article[];
  faqCategories: FAQCategory[];
  loading: boolean;
  error: string | null;
  fetchData: () => Promise<void>; // Allow manual refetch if needed
}

const DataContext = createContext<DataContextState | undefined>(undefined);

export const useData = (): DataContextState => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [articles, setArticles] = useState<Article[]>(ARTICLES_DATA);
  const [faqCategories, setFaqCategories] = useState<FAQCategory[]>(FAQ_DATA);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch Articles
      const { data: supabaseArticles, error: articlesError } = await supabase
        .from('articles')
        .select('*');

      if (articlesError) {
        console.error('Error fetching articles from Supabase:', articlesError);
        // Keep local articles if fetch fails, but set an error message
        setError(prevError => prevError ? prevError + '; Articles fetch failed: ' + articlesError.message : 'Articles fetch failed: ' + articlesError.message);
      }

      let combinedArticles = [...ARTICLES_DATA];
      if (supabaseArticles) {
        const fetchedArticles: Article[] = supabaseArticles.map((supaArticle: any) => ({
          ...supaArticle,
          fullContent: supaArticle.fullContent || supaArticle.body || '',
          excerpt: supaArticle.excerpt || (supaArticle.fullContent || supaArticle.body || '').substring(0, 150),
          author: supaArticle.author || 'צוות מכון אביב',
          imageUrl: supaArticle.imageUrl,
          date: supaArticle.date || supaArticle.created_at ? new Date(supaArticle.date || supaArticle.created_at).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A',
          id: String(supaArticle.id),
          artag: supaArticle.artag || String(supaArticle.id), // Ensure artag exists
        }));

        combinedArticles = [
          ...fetchedArticles,
          ...ARTICLES_DATA.filter(localArticle =>
            !fetchedArticles.find(fetched => String(fetched.id) === String(localArticle.id))
          )
        ];
      }
      setArticles(combinedArticles);

      // Fetch FAQs
      const { data: supabaseFaqItems, error: faqError } = await supabase
        .from('qa') // Ensure this table name is correct
        .select('id, question_text, answer_text'); // Adjust columns as needed

      if (faqError) {
        console.error('Error fetching FAQ data from Supabase:', faqError);
         setError(prevError => prevError ? prevError + '; FAQ fetch failed: ' + faqError.message : 'FAQ fetch failed: ' + faqError.message);
        // Keep local FAQs if fetch fails
      }

      let combinedFaqData = [...FAQ_DATA];
      if (supabaseFaqItems && supabaseFaqItems.length > 0) {
        const supabaseCategoriesMap: { [key: string]: FAQCategory } = {};
        const defaultCategoryId = 'supabase_qa';
        const defaultCategoryTitle = 'שאלות שאתם שאלתם אותנו';

        supabaseFaqItems.forEach((item: any) => {
          if (!supabaseCategoriesMap[defaultCategoryId]) {
            supabaseCategoriesMap[defaultCategoryId] = {
              id: defaultCategoryId,
              title: defaultCategoryTitle,
              questions: [],
            };
          }
          supabaseCategoriesMap[defaultCategoryId].questions.push({
            id: String(item.id),
            question: item.question_text,
            answer: item.answer_text || '',
          });
        });

        const fetchedCategoriesArray = Object.values(supabaseCategoriesMap);

        fetchedCategoriesArray.forEach(supaCategory => {
          const existingCategoryIndex = combinedFaqData.findIndex(
            localCat => localCat.title.trim().toLowerCase() === supaCategory.title.trim().toLowerCase()
          );

          if (existingCategoryIndex > -1) {
            const existingQuestions = combinedFaqData[existingCategoryIndex].questions;
            supaCategory.questions.forEach(supaQuestion => {
              if (!existingQuestions.find(q => q.id === supaQuestion.id)) {
                existingQuestions.push(supaQuestion);
              }
            });
            combinedFaqData[existingCategoryIndex].questions = [...existingQuestions];
          } else {
            combinedFaqData.push(supaCategory);
          }
        });
      }
      setFaqCategories(combinedFaqData);

    } catch (err: any) {
      console.error('Error in DataProvider fetchData:', err);
      setError('An unexpected error occurred while fetching data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <DataContext.Provider value={{ articles, faqCategories, loading, error, fetchData }}>
      {children}
    </DataContext.Provider>
  );
};
