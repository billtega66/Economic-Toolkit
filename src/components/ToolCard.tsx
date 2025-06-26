import React from 'react';
import { Tool } from '../types';
import { motion } from 'framer-motion';
import { ChevronRight, Star } from 'lucide-react';

type ToolCardProps = {
  tool: Tool;
  delay?: number;
};

const ToolCard: React.FC<ToolCardProps> = ({ tool, delay = 0 }) => {
  const [isFavorite, setIsFavorite] = React.useState(false);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };
  
  const IconComponent = tool.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.1 }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <div 
        className="relative h-full bg-white dark:bg-slate-800/80 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-slate-100 dark:border-slate-700 group"
      >
        <div 
          className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r"
          style={{ 
            backgroundImage: `linear-gradient(to right, ${tool.gradientFrom}, ${tool.gradientTo})`
          }}
        />
        
        <button
          onClick={toggleFavorite}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-700 transition-colors z-10"
        >
          <Star 
            size={16} 
            fill={isFavorite ? "#FFC107" : "transparent"} 
            className={`${isFavorite ? 'text-yellow-500' : 'text-slate-400'}`} 
          />
        </button>

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
          
          <p className="text-slate-600 dark:text-slate-300 mb-4 line-clamp-2">
            {tool.description}
          </p>
          
          <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
            <span className="inline-flex px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
              {tool.category}
            </span>
          </div>
        </div>
        
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-end group-hover:bg-slate-50 dark:group-hover:bg-slate-700/50 transition-colors">
          <button 
            className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            <span>Open tool</span>
            <ChevronRight size={16} className="ml-1 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ToolCard;