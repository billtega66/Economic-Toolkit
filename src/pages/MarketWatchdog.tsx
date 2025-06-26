import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, TrendingUp, TrendingDown, Bell, Star, Loader2, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { stocksApi, StockData } from '../services/api';

const MarketWatchdog = () => {
  const [watchlist, setWatchlist] = useState<StockData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStockData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await stocksApi.getStocks();
        setWatchlist(data || []); // Ensure we always set an array
      } catch (err) {
        setError('Failed to load stock data. Please try again later.');
        console.error('Error fetching stock data:', err);
        setWatchlist([]); // Reset watchlist on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchStockData();
    const interval = setInterval(fetchStockData, 300000); // Refresh every 5 minutes

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="animate-spin" />
          <span className="text-slate-600 dark:text-slate-300">Loading market data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center text-red-700 dark:text-red-400">
            <AlertCircle size={20} className="mr-2" />
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
              Market Watchdog
            </h1>
            <button className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              <Plus size={18} className="mr-2" />
              Add Stock
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {watchlist.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600 dark:text-slate-300">No stocks in watchlist</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {watchlist.map((stock) => (
              <motion.div
                key={stock.symbol}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center space-x-3">
                        <h3 className="text-xl font-semibold text-slate-800 dark:text-white">
                          {stock.symbol}
                        </h3>
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          {stock.name}
                        </span>
                      </div>
                      <div className="flex items-center mt-2">
                        <span className="text-2xl font-bold text-slate-800 dark:text-white">
                          ${stock.price.toFixed(2)}
                        </span>
                        <span className={`ml-3 flex items-center ${
                          stock.change >= 0 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {stock.change >= 0 ? (
                            <TrendingUp size={16} className="mr-1" />
                          ) : (
                            <TrendingDown size={16} className="mr-1" />
                          )}
                          {Math.abs(stock.change).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300">
                        <Bell size={20} />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300">
                        <Star size={20} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stock.data}>
                        <XAxis 
                          dataKey="time" 
                          tick={{ fontSize: 12 }}
                          stroke="#94a3b8"
                        />
                        <YAxis 
                          domain={['auto', 'auto']}
                          tick={{ fontSize: 12 }}
                          stroke="#94a3b8"
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            border: 'none',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke={stock.change >= 0 ? '#22c55e' : '#ef4444'}
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MarketWatchdog;