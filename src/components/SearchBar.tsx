import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type SearchBarProps = {
  onSearch: (term: string) => void;
};

const SearchBar = ({ onSearch }: SearchBarProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, onSearch]);

  const clearSearch = () => {
    setSearchTerm('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div 
      className={`relative group rounded-xl flex items-center bg-white dark:bg-slate-800 shadow-sm transition-all duration-300 ${
        isFocused ? 'ring-2 ring-blue-500 dark:ring-blue-400' : 'hover:ring-1 hover:ring-slate-300 dark:hover:ring-slate-600'
      }`}
    >
      <div className="flex items-center pl-4">
        <Search 
          size={18} 
          className={`transition-colors duration-300 ${
            isFocused 
              ? 'text-blue-600 dark:text-blue-400' 
              : 'text-slate-400 dark:text-slate-500'
          }`} 
        />
      </div>
      
      <input
        ref={inputRef}
        type="text"
        placeholder="Search for tools..."
        className="w-full py-3 px-3 text-slate-800 dark:text-white bg-transparent outline-none"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      
      <AnimatePresence>
        {searchTerm && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            onClick={clearSearch}
            className="p-2 mr-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Clear search"
          >
            <X size={18} className="text-slate-500 dark:text-slate-400" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;