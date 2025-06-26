import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { 
  DollarSign, 
  User, 
  Briefcase, 
  Home, 
  PiggyBank, 
  Shield, 
  LineChart, 
  Calendar,
  Loader2
} from 'lucide-react';
import retirementApi, { RetirementPlanInput } from '../services/api';

type FormData = {
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
};

const initialFormData: FormData = {
  age: 0,
  currentSavings: 0,
  gender: '',
  currentJob: '',
  income: 0,
  spending: 0,
  hasMortgage: 'no',
  assets: 0,
  hasInsurance: 'no',
  hasInvestment: 'no',
  retirementAge: 0,
  retirementSavingsGoal: 0
};

const RetirementPlanner = () => {
  const navigate = useNavigate();
  const [plan, setPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleNext = () => {
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null); // optional: clear previous error

    try {
      console.log("📤 Sending data to backend:", formData);

      const response = await axios.post("http://localhost:4000/api/retirement/plan", formData);

      console.log("✅ Received plan from backend:", response.data.retirement_plan);
      // Navigate and pass plan data to the result page
      navigate("/retirement-plan", { state: { planData: response.data.retirement_plan } });
    } catch (error) {
      console.error("❌ Error generating retirement plan:", error);
      setError("Failed to generate retirement plan. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
            Retirement Planner
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Plan your retirement with our comprehensive calculator
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full">
              <div 
                className="h-2 bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 8) * 100}%` }}
              />
            </div>
            <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Step {currentStep} of 8
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6"
          >
            <form onSubmit={handleSubmit}>
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="flex items-center text-xl font-semibold text-slate-800 dark:text-white mb-6">
                    <User className="mr-2" />
                    Basic Information
                  </div>
                  
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Age
                      </label>
                      <input
                        type="number"
                        name="age"
                        value={formData.age || ''}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Gender
                      </label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                        required
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Employment */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="flex items-center text-xl font-semibold text-slate-800 dark:text-white mb-6">
                    <Briefcase className="mr-2" />
                    Employment Details
                  </div>
                  
                  <div className="grid gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Current Job
                      </label>
                      <input
                        type="text"
                        name="currentJob"
                        value={formData.currentJob}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Annual Income
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-slate-500 dark:text-slate-400">
                          $
                        </span>
                        <input
                          type="number"
                          name="income"
                          value={formData.income || ''}
                          onChange={handleInputChange}
                          className="w-full pl-8 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Savings */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="flex items-center text-xl font-semibold text-slate-800 dark:text-white mb-6">
                    <PiggyBank className="mr-2" />
                    Current Savings
                  </div>
                  
                  <div className="grid gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Current Retirement Savings
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-slate-500 dark:text-slate-400">
                          $
                        </span>
                        <input
                          type="number"
                          name="currentSavings"
                          value={formData.currentSavings || ''}
                          onChange={handleInputChange}
                          className="w-full pl-8 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Annual Spending
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-slate-500 dark:text-slate-400">
                          $
                        </span>
                        <input
                          type="number"
                          name="spending"
                          value={formData.spending || ''}
                          onChange={handleInputChange}
                          className="w-full pl-8 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Mortgage */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="flex items-center text-xl font-semibold text-slate-800 dark:text-white mb-6">
                    <Home className="mr-2" />
                    Mortgage Information
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Do you have a mortgage?
                      </label>
                      <select
                        name="hasMortgage"
                        value={formData.hasMortgage}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                      >
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </div>

                    {formData.hasMortgage === 'yes' && (
                      <div className="grid gap-6 md:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Mortgage Amount
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-2 text-slate-500 dark:text-slate-400">
                              $
                            </span>
                            <input
                              type="number"
                              name="mortgageAmount"
                              value={formData.mortgageAmount || ''}
                              onChange={handleInputChange}
                              className="w-full pl-8 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Loan Term (years)
                          </label>
                          <input
                            type="number"
                            name="mortgageTerm"
                            value={formData.mortgageTerm || ''}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Down Payment
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-2 text-slate-500 dark:text-slate-400">
                              $
                            </span>
                            <input
                              type="number"
                              name="downPayment"
                              value={formData.downPayment || ''}
                              onChange={handleInputChange}
                              className="w-full pl-8 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Down Payment Percentage
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              name="downPaymentPercent"
                              value={formData.downPaymentPercent || ''}
                              onChange={handleInputChange}
                              className="w-full pr-8 pl-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                            />
                            <span className="absolute right-3 top-2 text-slate-500 dark:text-slate-400">
                              %
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 5: Assets */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div className="flex items-center text-xl font-semibold text-slate-800 dark:text-white mb-6">
                    <DollarSign className="mr-2" />
                    Assets
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Total Value of Other Assets
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-slate-500 dark:text-slate-400">
                        $
                      </span>
                      <input
                        type="number"
                        name="assets"
                        value={formData.assets || ''}
                        onChange={handleInputChange}
                        className="w-full pl-8 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 6: Insurance */}
              {currentStep === 6 && (
                <div className="space-y-6">
                  <div className="flex items-center text-xl font-semibold text-slate-800 dark:text-white mb-6">
                    <Shield className="mr-2" />
                    Insurance
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Do you have insurance?
                      </label>
                      <select
                        name="hasInsurance"
                        value={formData.hasInsurance}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                      >
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </div>

                    {formData.hasInsurance === 'yes' && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Monthly Insurance Payment
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-slate-500 dark:text-slate-400">
                            $
                          </span>
                          <input
                            type="number"
                            name="insurancePayment"
                            value={formData.insurancePayment || ''}
                            onChange={handleInputChange}
                            className="w-full pl-8 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 7: Investments */}
              {currentStep === 7 && (
                <div className="space-y-6">
                  <div className="flex items-center text-xl font-semibold text-slate-800 dark:text-white mb-6">
                    <LineChart className="mr-2" />
                    Investments
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Do you have investments?
                      </label>
                      <select
                        name="hasInvestment"
                        value={formData.hasInvestment}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                      >
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </div>

                    {formData.hasInvestment === 'yes' && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Total Investment Value
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-slate-500 dark:text-slate-400">
                            $
                          </span>
                          <input
                            type="number"
                            name="investmentAmount"
                            value={formData.investmentAmount || ''}
                            onChange={handleInputChange}
                            className="w-full pl-8 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 8: Retirement Goals */}
              {currentStep === 8 && (
                <div className="space-y-6">
                  <div className="flex items-center text-xl font-semibold text-slate-800 dark:text-white mb-6">
                    <Calendar className="mr-2" />
                    Retirement Goals
                  </div>
                  
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Desired Retirement Age
                      </label>
                      <input
                        type="number"
                        name="retirementAge"
                        value={formData.retirementAge || ''}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Target Retirement Savings
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-slate-500 dark:text-slate-400">
                          $
                        </span>
                        <input
                          type="number"
                          name="retirementSavingsGoal"
                          value={formData.retirementSavingsGoal || ''}
                          onChange={handleInputChange}
                          className="w-full pl-8 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="mt-8 flex justify-between">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-6 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    Back
                  </button>
                )}
                
                {currentStep < 8 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="ml-auto px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="ml-auto px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Calculating...
                      </>
                    ) : (
                      'Calculate Retirement Plan'
                    )}
                  </button>
                )}
              </div>
            </form>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default RetirementPlanner;