import React, { useState } from 'react';
import { GameState } from '../types';
import { Building2, Wallet, Landmark, Percent, Moon, Sun, BookOpen, X, TrendingUp, Building, Home, Coins, Clock } from 'lucide-react';
import { formatNumber, parseFormattedNumber } from '../utils/format';

interface SetupScreenProps {
  onStart: (initialState: Partial<GameState>) => void;
  darkMode: boolean;
  onToggleTheme: () => void;
}

// Internal AppLogo component for SetupScreen
const AppLogo = ({ size = "large" }: { size?: "small" | "large" }) => {
  const isLarge = size === "large";
  return (
    <div className={`${isLarge ? "w-20 h-20" : "w-8 h-8"} relative transition-all duration-300`}>
       <svg 
        viewBox="0 0 100 100" 
        className="w-full h-full drop-shadow-md" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* House Base */}
        <path d="M50 10 L10 45 V90 H90 V45 L50 10 Z" fill="#2563eb" stroke="white" strokeWidth="4" strokeLinejoin="round" />
        
        {/* Upward Arrow Inside House */}
        <path d="M35 65 L50 40 L65 65 H55 V80 H45 V65 H35 Z" fill="white" />
      </svg>
    </div>
  );
};

// Internal InstructionsModal component
const InstructionsModal = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 relative">
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
      >
        <X className="w-6 h-6" />
      </button>
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
             <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">How to Play</h2>
      </div>
      
      <div className="space-y-6 text-sm text-slate-600 dark:text-slate-300">
            <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-100 dark:border-blue-900/50">
                <h4 className="font-bold text-blue-900 dark:text-blue-200 mb-1 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> The Goal
                </h4>
                <p>
                Build a massive property portfolio. Increase your <strong>Net Worth</strong> (Assets - Debt) and generate positive <strong>Cashflow</strong> to replace your salary.
                </p>
            </div>

            <div className="space-y-4">
                <div>
                <h5 className="font-bold text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-2"><Building className="w-4 h-4"/> 1. Trusts & Structure</h5>
                <p>
                    You cannot buy properties in your personal name. You must open <strong>Trusts</strong>. Each Trust has a borrowing capacity limit. When a Trust is full, open a new one.
                </p>
                </div>

                <div>
                <h5 className="font-bold text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-2"><Home className="w-4 h-4"/> 2. Buying Assets</h5>
                <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Residential Growth:</strong> High capital growth (value goes up), lower yield. Good for building equity.</li>
                    <li><strong>Residential Cashflow:</strong> Higher yield, moderate growth. Good for servicing debt.</li>
                    <li><strong>Commercial:</strong> High yield, lower growth. Excellent for boosting cashflow.</li>
                </ul>
                </div>

                <div>
                <h5 className="font-bold text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-2"><Coins className="w-4 h-4"/> 3. The Power of Equity</h5>
                <p>
                    As properties grow in value, you gain <strong>Equity</strong>. Use "Equity Release" to refinance and turn that paper growth into usable Cash without selling the asset.
                </p>
                </div>

                <div>
                <h5 className="font-bold text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-2"><Clock className="w-4 h-4"/> 4. Time & Money</h5>
                <p>
                    Click <strong>Next Quarter</strong> to advance time by 3 months. Your tenant pays rent, the bank takes interest, and your salary savings are added to your Cash balance.
                </p>
                </div>
            </div>
      </div>
      
      <button 
        onClick={onClose}
        className="w-full mt-6 bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition"
      >
        Let's Start
      </button>
    </div>
  </div>
);

const SetupScreen: React.FC<SetupScreenProps> = ({ onStart, darkMode, onToggleTheme }) => {
  const [salary, setSalary] = useState(150000);
  const [savingsRate, setSavingsRate] = useState(20);
  const [cash, setCash] = useState(200000);
  const [maxBorrowing, setMaxBorrowing] = useState(1000000);
  const [showGuide, setShowGuide] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart({
      salary,
      savingsRate,
      cash,
      maxBorrowingPerTrust: maxBorrowing,
      history: [{ label: 'Start', netWorth: cash, cash: cash, debt: 0 }]
    });
  };

  const handleCurrencyChange = (value: string, setter: (val: number) => void) => {
    const num = parseFormattedNumber(value);
    if (!isNaN(num)) setter(num);
  };

  // Internal SliderInput
  const SliderInput = ({ label, value, min, max, step, onChange, unit = "%", color = "blue" }: any) => {
    return (
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
          <div className={`text-sm font-bold text-${color}-600 bg-${color}-50 dark:bg-${color}-900/30 dark:text-${color}-400 px-2 py-0.5 rounded border border-${color}-100 dark:border-${color}-800 min-w-[3rem] text-center`}>
            {value}{unit}
          </div>
        </div>
        <div className="flex items-center gap-4">
           <input 
            type="range" 
            min={min} 
            max={max} 
            step={step} 
            value={value} 
            onChange={(e) => onChange(Number(e.target.value))}
            className={`w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-${color}-600`}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 p-4 relative transition-colors duration-300">
      
       <div className="absolute top-4 right-4 md:top-8 md:right-8 z-10 flex gap-2">
           <button 
            onClick={onToggleTheme}
            className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button 
            onClick={() => setShowGuide(true)}
            className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-full shadow-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
              <BookOpen className="w-4 h-4" /> How to Play
          </button>
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-xl w-full max-w-md border-t-4 border-blue-600 relative">
        <div className="mb-6 text-center flex flex-col items-center">
          <div className="mb-4 transform hover:scale-105 transition duration-300">
            <AppLogo size="large" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">PropertySim</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Configure your portfolio parameters</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
              <Wallet className="w-4 h-4" /> Annual Salary
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-500">$</span>
              <input
                type="text"
                required
                value={formatNumber(salary)}
                onChange={(e) => handleCurrencyChange(e.target.value, setSalary)}
                className="w-full pl-8 pr-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
          </div>

          <SliderInput 
            label="Savings Rate (of Annual Salary)" 
            value={savingsRate} 
            min={0} 
            max={100} 
            step={1} 
            onChange={setSavingsRate} 
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
              <Landmark className="w-4 h-4" /> Initial Cash Savings
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-500">$</span>
              <input
                type="text"
                required
                value={formatNumber(cash)}
                onChange={(e) => handleCurrencyChange(e.target.value, setCash)}
                className="w-full pl-8 pr-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Max Borrowing per Trust
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-500">$</span>
              <input
                type="text"
                required
                value={formatNumber(maxBorrowing)}
                onChange={(e) => handleCurrencyChange(e.target.value, setMaxBorrowing)}
                className="w-full pl-8 pr-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow-md transition duration-200 transform hover:scale-[1.02]"
          >
            Start Portfolio
          </button>
        </form>
      </div>

      {showGuide && <InstructionsModal onClose={() => setShowGuide(false)} />}
    </div>
  );
};

export default SetupScreen;