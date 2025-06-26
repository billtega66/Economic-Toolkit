import { DivideIcon as LucideIcon } from 'lucide-react';

export type Tool = {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: LucideIcon;
  gradientFrom: string;
  gradientTo: string;
  isNew?: boolean;
  isPopular?: boolean;
};