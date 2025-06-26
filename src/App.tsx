import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Header from './components/Header';
import ToolGrid from './components/ToolGrid';
import SearchBar from './components/SearchBar';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import { CategoryFilter } from './components/CategoryFilter';
import MarketWatchdog from './pages/MarketWatchdog';
import NewsDigest from './pages/NewsDigest';
import ArticleView from './pages/ArticleView';
import RetirementPlanner from './pages/RetirementPlanner';
import RetirementPlanDisplay from './pages/RetirementPlanDisplay';
import { Tool } from './types';
import { tools as allTools } from './data/tools';

function HomePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filteredTools, setFilteredTools] = useState<Tool[]>(allTools);

  useEffect(() => {
    let result = allTools;
    
    if (searchTerm) {
      result = result.filter(tool => 
        tool.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        tool.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedCategory) {
      result = result.filter(tool => tool.category === selectedCategory);
    }
    
    setFilteredTools(result);
  }, [searchTerm, selectedCategory]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category);
  };

  const categories = Array.from(new Set(allTools.map(tool => tool.category)));

  return (
    <main className="flex-grow container mx-auto px-4 py-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 dark:text-white mb-4 tracking-tight">
            Economic Toolkit
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-3xl">
            Powerful financial tools and resources to help you make informed economic decisions.
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="md:w-2/3">
            <SearchBar onSearch={handleSearch} />
          </div>
          <div className="md:w-1/3">
            <CategoryFilter 
              categories={categories} 
              selectedCategory={selectedCategory}
              onSelectCategory={handleCategorySelect}
            />
          </div>
        </div>
        
        <ToolGrid tools={filteredTools} />
      </div>
    </main>
  );
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-colors duration-300">
          <Header />
          <main className="max-w-7xl mx-auto px-4 py-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/market-watchdog" element={<MarketWatchdog />} />
              <Route path="/news-digest" element={<NewsDigest />} />
              <Route path="/article" element={<ArticleView />} />
              <Route path="/retirement-planner" element={<RetirementPlanner />} />
              <Route path="/retirement-plan" element={<RetirementPlanDisplay />} />
            </Routes>
          </main>
        </div>
      </ThemeProvider>
    </Router>
  );
}

export default App;