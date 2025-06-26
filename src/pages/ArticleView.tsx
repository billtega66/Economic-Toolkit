import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, TrendingUp } from 'lucide-react';

const ArticleView = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const article = location.state?.article;

  if (!article) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-slate-600 dark:text-slate-300">Article not found</p>
          <button
            onClick={() => navigate('/news-digest')}
            className="mt-4 text-blue-600 dark:text-blue-400 hover:underline"
          >
            Return to News Digest
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/news-digest')}
            className="flex items-center text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to News Digest
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden"
        >
          <div className="p-6">
            <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 mb-3">
              <Clock size={16} className="mr-2" />
              <span>{article.date}</span>
              <span className="mx-2">•</span>
              <span>{article.source}</span>
              <span className="mx-2">•</span>
              <span className="flex items-center">
                <TrendingUp size={16} className="mr-1" />
                {article.category}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white mb-6">
              {article.title}
            </h1>

            <div className="prose dark:prose-invert max-w-none">
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {article.content || article.description || 'No content available'}
              </p>
            </div>
          </div>
        </motion.article>
      </main>
    </div>
  );
};

export default ArticleView;