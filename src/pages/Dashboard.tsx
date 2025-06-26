import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { tools } from '../data/tools';

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-4">
          Welcome to Economic Toolkit
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-300">
          Access powerful financial tools and resources to make informed economic decisions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.slice(0, 6).map((tool, index) => {
          const IconComponent = tool.icon;
          
          return (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => navigate(`/${tool.id}`)}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-300 cursor-pointer group"
            >
              <div className="p-6">
                <div 
                  className="mb-4 p-3 inline-flex items-center justify-center rounded-lg"
                  style={{ 
                    background: `linear-gradient(135deg, ${tool.gradientFrom}20, ${tool.gradientTo}30)`,
                    color: tool.gradientFrom
                  }}
                >
                  <IconComponent size={24} strokeWidth={1.5} />
                </div>

                <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {tool.title}
                </h3>

                <p className="text-slate-600 dark:text-slate-300">
                  {tool.description}
                </p>

                {(tool.isNew || tool.isPopular) && (
                  <div className="mt-4 flex gap-2">
                    {tool.isNew && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                        New
                      </span>
                    )}
                    {tool.isPopular && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                        Popular
                      </span>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;