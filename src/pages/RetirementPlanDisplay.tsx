import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, Download, ThumbsUp, ThumbsDown, User, TrendingUp, DollarSign, Check } from 'lucide-react';
import { RetirementPlanResponse, retirementApi } from '../services/api';

const RetirementPlanDisplay = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [planData, setPlanData] = useState<RetirementPlanResponse | null>(null);
  const [feedback, setFeedback] = useState<{
    rating: number | null;
    submitted: boolean;
    message: string | null;
    error: boolean;
  }>({
    rating: null,
    submitted: false,
    message: null,
    error: false
  });

  useEffect(() => {
    if (location.state?.planData) {
      setPlanData(location.state.planData);
    } else {
      navigate('/retirement-planner');
    }
  }, [location.state, navigate]);

  if (!planData) {
    return null;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value);
  };

  const handleFeedback = async (rating: number) => {
    try {
      await retirementApi.submitFeedback(planData.plan_id, rating);
      setFeedback({
        rating,
        submitted: true,
        message: 'Feedback submitted successfully.',
        error: false
      });
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setFeedback({
        rating,
        submitted: true,
        message: 'Failed to submit feedback.',
        error: true
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/retirement-planner')}
              className="flex items-center text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 transition-colors"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back to Calculator
            </button>
            <button className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              <Download size={18} className="mr-2" />
              Download Plan
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto space-y-8"
        >
          {/* Status Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Current Status */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4 flex items-center">
                <User className="mr-2 text-blue-600 dark:text-blue-400" />
                Current Status
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                  <span className="text-slate-600 dark:text-slate-300">Projected Savings</span>
                  <span className="text-xl font-semibold text-blue-600 dark:text-blue-400">
                    {formatCurrency(planData.projected_savings)}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                  <span className="text-slate-600 dark:text-slate-300">Years Until Retirement</span>
                  <span className="text-xl font-semibold text-blue-600 dark:text-blue-400">
                    {planData.years_left} years
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-300">Required Savings Rate</span>
                  <span className="text-xl font-semibold text-blue-600 dark:text-blue-400">
                    {formatPercentage(planData.required_savings_rate)}
                  </span>
                </div>
              </div>
            </div>

            {/* Savings Projection */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4 flex items-center">
                <TrendingUp className="mr-2 text-green-600 dark:text-green-400" />
                Savings Projection
              </h2>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={planData.intermediate_calculations.cumulative}>
                    <XAxis 
                      dataKey="year" 
                      tick={{ fontSize: 12 }}
                      stroke="#94a3b8"
                    />
                    <YAxis 
                      tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`}
                      tick={{ fontSize: 12 }}
                      stroke="#94a3b8"
                    />
                    <Tooltip 
                      formatter={(value) => formatCurrency(Number(value))}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Detailed Plan */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-6 flex items-center">
              <Check className="mr-2 text-green-600 dark:text-green-400" />
              Your Personalized Retirement Plan
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <div dangerouslySetInnerHTML={{ __html: planData.plan.replace(/\n/g, '<br>') }} />
            </div>
          </div>

          {/* Similar Profiles */}
          {planData.similar_profiles.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">
                Similar Profiles
              </h2>
              <div className="grid gap-4">
                {planData.similar_profiles.map((profile) => (
                  <div 
                    key={profile.profile_id}
                    className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium text-slate-600 dark:text-slate-300">
                        Profile Match: {profile.similarity}%
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        Age: {profile.age}
                      </div>
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-300">
                      {profile.strategy}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feedback */}
          {!feedback.submitted && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">
                Was this plan helpful?
              </h2>
              <div className="flex space-x-4">
                <button
                  onClick={() => handleFeedback(1)}
                  className="flex items-center px-4 py-2 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors"
                >
                  <ThumbsUp size={18} className="mr-2" />
                  Yes, it was helpful
                </button>
                <button
                  onClick={() => handleFeedback(0)}
                  className="flex items-center px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
                >
                  <ThumbsDown size={18} className="mr-2" />
                  No, needs improvement
                </button>
              </div>
            </div>
          )}

                    {feedback.submitted && feedback.message && (
            <div
              className={`p-4 rounded-lg border ${
                feedback.error
                  ? 'bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
                  : 'bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
              }`}
            >
              {feedback.message}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default RetirementPlanDisplay;