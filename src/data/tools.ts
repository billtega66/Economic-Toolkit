import { 
  LineChart, 
  Newspaper, 
  Wallet, 
  PieChart, 
  Calculator, 
  Bookmark, 
  DollarSign, 
  Building, 
  Briefcase,
  CalendarClock,
  BookOpen,
  TrendingUp
} from 'lucide-react';

import { Tool } from '../types';

export const tools: Tool[] = [
  {
    id: 'market-watchdog',
    title: 'Market Watchdog',
    description: 'Real-time monitoring of stock market trends and alert notifications for significant price movements.',
    category: 'Investing',
    icon: LineChart,
    gradientFrom: '#3B82F6',
    gradientTo: '#2563EB',
    isPopular: true
  },
  {
    id: 'news-digest',
    title: 'News Digest',
    description: 'Personalized economic news updates and summaries from trusted sources worldwide.',
    category: 'Research',
    icon: Newspaper,
    gradientFrom: '#8B5CF6',
    gradientTo: '#6D28D9',
    isNew: true
  },
  {
    id: 'retirement-planner',
    title: 'Retirement Planner',
    description: 'Comprehensive retirement planning tools with personalized recommendations based on your financial goals.',
    category: 'Planning',
    icon: CalendarClock,
    gradientFrom: '#EC4899',
    gradientTo: '#BE185D',
    isPopular: true
  },
  {
    id: 'scenario-simulator',
    title: 'Scenario Simulator',
    description: 'Simulate various economic scenarios to understand potential impacts on your investments and financial plans.',
    category: 'Planning',
    icon: PieChart,
    gradientFrom: '#10B981',
    gradientTo: '#059669'
  },
  {
    id: 'budget-planner',
    title: 'Budget Planner',
    description: 'Create, track and optimize your personal or business budget with intelligent spending insights.',
    category: 'Budgeting',
    icon: Calculator,
    gradientFrom: '#F59E0B',
    gradientTo: '#D97706'
  },
  {
    id: 'glossary-explainer',
    title: 'Glossary Explainer',
    description: 'Comprehensive dictionary of financial terms with easy-to-understand explanations and practical examples.',
    category: 'Education',
    icon: BookOpen,
    gradientFrom: '#6366F1',
    gradientTo: '#4F46E5'
  },
  {
    id: 'investment-assistant',
    title: 'Investment Assistant',
    description: 'Get personalized investment advice based on your risk profile and financial goals.',
    category: 'Investing',
    icon: DollarSign,
    gradientFrom: '#EF4444',
    gradientTo: '#B91C1C',
    isNew: true
  },
  {
    id: 'business-valuator',
    title: 'Business Valuator',
    description: 'Professional tools to evaluate business worth and market potential for investors and entrepreneurs.',
    category: 'Business',
    icon: Building,
    gradientFrom: '#0EA5E9',
    gradientTo: '#0369A1'
  },
  {
    id: 'portfolio-optimizer',
    title: 'Portfolio Optimizer',
    description: 'Advanced algorithms to optimize your investment portfolio for maximum returns with minimal risk.',
    category: 'Investing',
    icon: Briefcase,
    gradientFrom: '#14B8A6',
    gradientTo: '#0F766E'
  },
  {
    id: 'market-trends',
    title: 'Market Trends',
    description: 'Visualize and analyze market trends with interactive charts and predictive analytics.',
    category: 'Research',
    icon: TrendingUp,
    gradientFrom: '#F97316',
    gradientTo: '#C2410C'
  },
  {
    id: 'tax-calculator',
    title: 'Tax Calculator',
    description: 'Accurately estimate your tax obligations and identify potential deductions and credits.',
    category: 'Taxes',
    icon: Calculator,
    gradientFrom: '#4ADE80',
    gradientTo: '#16A34A'
  },
  {
    id: 'financial-terms',
    title: 'Financial Terms',
    description: 'Extensive database of financial terminology with detailed explanations for beginners and professionals.',
    category: 'Education',
    icon: Bookmark,
    gradientFrom: '#A855F7',
    gradientTo: '#7E22CE'
  }
];