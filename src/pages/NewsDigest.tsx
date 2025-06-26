import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, ArrowRight, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import { Article, newsApi } from '../services/api';
import { format } from 'date-fns';

const NewsDigest = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await newsApi.getArticles('business-us', 30);
        setArticles(data);
      } catch (err) {
        setError('Failed to load articles. Please try again later.');
        console.error('Error fetching articles:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticles();
  }, []);

  const getSnippet = (article: Article): string => {
    if (article.description) return article.description;
    if (article.content) return article.content.slice(0, 100) + '...';
    return 'No description available';
  };

  const handleReadFullArticle = (article: Article) => {
    navigate('/article', { state: { article } });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="animate-spin" />
          <span className="text-slate-600 dark:text-slate-300">Loading articles...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
            Economic News Digest
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Stay informed with the latest economic developments
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center text-red-700 dark:text-red-400">
              <AlertCircle size={20} className="mr-2" />
              <p>{error}</p>
            </div>
          </div>
        )}

        <div className="grid gap-6">
          {articles.map((article) => (
            <motion.article
              key={article.url}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 mb-3">
                  <Clock size={16} className="mr-2" />
                  <span>{format(new Date(article.publishedAt), 'MMM d, yyyy')}</span>
                  <span className="mx-2">•</span>
                  <span>{article.source}</span>
                  <span className="mx-2">•</span>
                  <span className="flex items-center">
                    <TrendingUp size={16} className="mr-1" />
                    {article.category}
                  </span>
                </div>

                <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-3">
                  {article.title}
                </h2>

                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  {getSnippet(article)}
                </p>

                <button
                  onClick={() => handleReadFullArticle(article)}
                  className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                >
                  Read full article
                  <ArrowRight size={16} className="ml-2" />
                </button>
              </div>
            </motion.article>
          ))}
        </div>
      </main>
    </div>
  );
};

export default NewsDigest;