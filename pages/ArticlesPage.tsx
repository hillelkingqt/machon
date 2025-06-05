
import React from 'react';
// Removed useLocation and useEffect as hash scrolling is no longer needed
import ArticlesSection from '../components/sections/ArticlesSection';

const ArticlesPage: React.FC = () => {
  // useEffect for scrolling to hash is removed. 
  // ScrollToTop component in App.tsx handles scrolling to top on page navigation.

  return (
    // ArticlesSection will show all articles by default when maxItems is not provided
    <ArticlesSection /> 
  );
};

export default ArticlesPage;