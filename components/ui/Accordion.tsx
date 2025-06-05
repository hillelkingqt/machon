
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { FAQItem as FAQItemType, FAQCategory as FAQCategoryType } from '../../constants'; // Use existing types if suitable or define locally

interface AccordionItemProps {
  item: FAQItemType;
  isOpen: boolean;
  onToggle: () => void;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ item, isOpen, onToggle }) => {
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg mb-3 overflow-hidden transition-all duration-300 ease-in-out shadow-sm hover:shadow-md dark:hover:shadow-slate-600/50">
      <motion.button
        onClick={onToggle}
        className={`w-full flex justify-between items-center text-right p-4 sm:p-5 transition-colors duration-200 ease-in-out
                    ${isOpen ? 'bg-primary text-white dark:bg-primary-dark' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
        aria-expanded={isOpen}
        aria-controls={`accordion-content-${item.id}`}
      >
        <span className="text-base sm:text-lg font-medium">{item.question}</span>
        {isOpen ? <ChevronUp size={22} className="flex-shrink-0" /> : <ChevronDown size={22} className="flex-shrink-0 opacity-70 group-hover:opacity-100" />}
      </motion.button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={`accordion-content-${item.id}`}
            key="content"
            initial="collapsed"
            animate="open"
            exit="collapsed"
            variants={{
              open: { opacity: 1, height: 'auto', marginTop: 0, marginBottom: 0 },
              collapsed: { opacity: 0, height: 0, marginTop: 0, marginBottom: 0 },
            }}
            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
            className="overflow-hidden"
          >
            <div className="p-4 sm:p-5 text-sm sm:text-base text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 leading-relaxed">
              {item.answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface AccordionProps {
  categories: FAQCategoryType[];
  allowMultipleOpen?: boolean;
  defaultOpenFirstItem?: boolean; // New prop to open first item of first category by default
}

const Accordion: React.FC<AccordionProps> = ({ categories, allowMultipleOpen = false, defaultOpenFirstItem = false }) => {
  const [openItems, setOpenItems] = useState<string[]>(() => {
    if (defaultOpenFirstItem && categories.length > 0 && categories[0].questions.length > 0) {
      return [categories[0].questions[0].id];
    }
    return [];
  });

  const handleToggle = (itemId: string) => {
    setOpenItems(prevOpenItems => {
      const isOpen = prevOpenItems.includes(itemId);
      if (allowMultipleOpen) {
        return isOpen ? prevOpenItems.filter(id => id !== itemId) : [...prevOpenItems, itemId];
      } else {
        return isOpen ? [] : [itemId];
      }
    });
  };

  return (
    <div className="space-y-8">
      {categories.map(category => (
        <section key={category.id} aria-labelledby={`category-title-${category.id}`}>
          {category.title && (
            <div className="flex items-center text-primary dark:text-primary-light mb-5 sm:mb-6">
              {category.icon && <category.icon size={28} className="me-3 opacity-90" strokeWidth={2} />}
              <h2 id={`category-title-${category.id}`} className="text-2xl sm:text-3xl font-bold">
                {category.title}
              </h2>
            </div>
          )}
          {category.questions.map(qItem => (
            <AccordionItem
              key={qItem.id}
              item={qItem}
              isOpen={openItems.includes(qItem.id)}
              onToggle={() => handleToggle(qItem.id)}
            />
          ))}
        </section>
      ))}
    </div>
  );
};

export default Accordion;
