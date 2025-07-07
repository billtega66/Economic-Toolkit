import axios from 'axios';

const API_BASE_URL = '/api';

export interface Article {
  _id: string;
  source: string;
  author?: string;
  title: string;
  description?: string;
  url: string;
  urlToImage?: string;
  publishedAt: string;
  content?: string;
  category: string;
}

export interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  data: Array<{
    time: string;
    value: number;
  }>;
}

export interface RetirementPlanInput {
  age: number;
  currentSavings: number;
  gender: string;
  currentJob: string;
  income: number;
  spending: number;
  hasMortgage: string;
  mortgageAmount?: number;
  mortgageTerm?: number;
  downPayment?: number;
  downPaymentPercent?: number;
  assets: number;
  hasInsurance: string;
  insurancePayment?: number;
  hasInvestment: string;
  investmentAmount?: number;
  retirementAge: number;
  retirementSavingsGoal: number;
}

export interface RetirementPlanResponse {
  plan_id: string;
  plan: string;
  projected_savings: number;
  years_left: number;
  gap: number;
  required_savings_rate: number;
  intermediate_calculations: {
    contributions: Array<{ year: number; amount: number }>;
    growth: Array<{ year: number; amount: number }>;
    cumulative: Array<{ year: number; amount: number }>;
  };
  similar_profiles: Array<{
    profile_id: string;
    similarity: number;
    age: number;
    income: number;
    savings: number;
    strategy: string;
  }>;
}

export const newsApi = {
  getArticles: async (category?: string, limit: number = 30): Promise<Article[]> => {
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (limit) params.append('limit', limit.toString());

      const response = await axios.get(`${API_BASE_URL}/articles?${params.toString()}`);
      return response.data.articles;
    } catch (error) {
      console.error('Error fetching articles:', error);
      throw error;
    }
  }
};

export const stocksApi = {
  getStocks: async (symbols?: string[]): Promise<StockData[]> => {
    try {
      const params = new URLSearchParams();
      if (symbols) {
        symbols.forEach(symbol => params.append('symbols', symbol));
      }

      const response = await axios.get(`${API_BASE_URL}/stocks?${params.toString()}`);
      return response.data.stocks;
    } catch (error) {
      console.error('Error fetching stock data:', error);
      throw error;
    }
  }
};

export const retirementApi = {
  generatePlan: async (input: RetirementPlanInput): Promise<RetirementPlanResponse> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/retirement/plan`, input);
      return response.data.retirement_plan;
    } catch (error) {
      console.error('Error generating retirement plan:', error);
      throw error;
    }
  },

  submitFeedback: async (
    planId: string,
    rating: number
  ): Promise<{ status: string; [key: string]: unknown }> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/retirement/feedback`, {
        plan_id: planId,
        rating
      });
      return response.data;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  }
};

export default {
  ...newsApi,
  ...retirementApi
};