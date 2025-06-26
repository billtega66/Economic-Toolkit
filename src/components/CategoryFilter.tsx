import { useState } from 'react';
import { CheckCircle2, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type CategoryFilterProps = {
  categories: string[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
};

export const CategoryFilter = ({ 
  categories, 
  selectedCategory, 
  onSelectCategory 
}: CategoryFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => setIsOpen(!isOpen);
  
  const handleCategorySelect = (category: string | null) => {
    onSelectCategory(category);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:ring-1 hover:ring-slate-300 dark:hover:ring-slate-600 transition-all"
      >
        <div className="flex items-center">
          <Filter size={18} className="text-slate-500 dark:text-slate-400 mr-2" />
          <span className="text-slate-700 dark:text-slate-300">
            {selectedCategory || "All Categories"}
          </span>
        </div>
        <div className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 mt-2 w-full rounded-xl bg-white dark:bg-slate-800 shadow-lg ring-1 ring-slate-200 dark:ring-slate-700 focus:outline-none overflow-hidden"
            style={{ backdropFilter: 'blur(8px)' }}
          >
            <div className="py-1">
              <button
                onClick={() => handleCategorySelect(null)}
                className={`w-full text-left px-4 py-2.5 flex items-center ${
                  selectedCategory === null
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <span className="flex-1">All Categories</span>
                {selectedCategory === null && (
                  <CheckCircle2 size={16} className="text-blue-600 dark:text-blue-400" />
                )}
              </button>
              
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategorySelect(category)}
                  className={`w-full text-left px-4 py-2.5 flex items-center ${
                    selectedCategory === category
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="flex-1">{category}</span>
                  {selectedCategory === category && (
                    <CheckCircle2 size={16} className="text-blue-600 dark:text-blue-400" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};