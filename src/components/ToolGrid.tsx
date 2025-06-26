import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ToolCard from './ToolCard';
import { Tool } from '../types';

type ToolGridProps = {
  tools: Tool[];
};

const ToolGrid = ({ tools }: ToolGridProps) => {
  const navigate = useNavigate();
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      }
    }
  };

  const handleToolClick = (toolId: string) => {
    switch (toolId) {
      case 'market-watchdog':
        navigate('/market-watchdog');
        break;
      case 'news-digest':
        navigate('/news-digest');
        break;
      case 'retirement-planner':
        navigate('/retirement-planner');
        break;
      // Add more cases for other tools
      default:
        break;
    }
  };
  
  return (
    <>
      {tools.length === 0 ? (
        <div className="text-center py-12">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-slate-500 dark:text-slate-400"
          >
            <p className="text-xl mb-2">No tools found</p>
            <p>Try adjusting your search or filter criteria</p>
          </motion.div>
        </div>
      ) : (
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {tools.map((tool, index) => (
            <div key={tool.id} onClick={() => handleToolClick(tool.id)}>
              <ToolCard tool={tool} delay={index} />
            </div>
          ))}
        </motion.div>
      )}
    </>
  );
};

export default ToolGrid;