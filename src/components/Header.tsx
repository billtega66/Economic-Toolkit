import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  Bell,
  User,
  ChevronDown,
  LineChart,
  Newspaper,
  PiggyBank,
  LayoutDashboard,
  Home,
  Search
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const Header = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const dropdownItems = [
    {
      name: 'Market Overview',
      path: '/market-watchdog',
      icon: LineChart
    },
    {
      name: 'News Digest',
      path: '/news-digest',
      icon: Newspaper
    },
    {
      name: 'Retirement Planner',
      path: '/retirement-planner',
      icon: PiggyBank
    }
  ];

  return (
    <header className="sticky top-0 z-20 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-slate-800 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
          >
            <LayoutDashboard size={24} className="mr-2" />
            <span className="font-semibold">Economic Toolkit</span>
          </button>

          <nav className="hidden md:flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                location.pathname === '/'
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Home size={18} className="mr-2" />
              <span>Home</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <span className="text-slate-700 dark:text-slate-300">Dashboard</span>
                <ChevronDown
                  size={16}
                  className={`ml-2 text-slate-400 transition-transform duration-200 ${
                    isDropdownOpen ? 'transform rotate-180' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-20"
                      onClick={() => setIsDropdownOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden z-30"
                    >
                      {dropdownItems.map((item) => (
                        <button
                          key={item.path}
                          onClick={() => {
                            navigate(item.path);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full flex items-center px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${
                            location.pathname === item.path
                              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                              : ''
                          }`}
                        >
                          <item.icon size={18} className="mr-2" />
                          <span>{item.name}</span>
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={() => navigate('/explore')}
              className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                location.pathname === '/explore'
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Search size={18} className="mr-2" />
              <span>Explore</span>
            </button>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <Bell size={20} className="text-slate-600 dark:text-slate-300" />
          </button>
          <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <User size={20} className="text-slate-600 dark:text-slate-300" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;