import React, { useState } from 'react';
import { GameState } from '../types';
import { Building2, Wallet, Landmark, Percent, Moon, Sun, BookOpen, X, TrendingUp, Building, Home, Coins, Clock } from 'lucide-react';
import { formatNumber, parseFormattedNumber } from '../utils/format';
import { InstructionsModal } from './Modals';

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

// Color mapping for Tailwind to detect classes
const colorVariants: Record<string, { badge: string, border: string, range: string }> = {
  blue: {
    badge: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 border-blue-100 dark:border-blue-800',
    border: 'border-blue-100 dark:border-blue-800',
    range: 'accent-blue-600'
  },
  green: {
    badge: 'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400 border-green-100 dark:border-green-800',
    border: 'border-green-100 dark:border-green-800',
    range: 'accent-green-600'
  },
  purple: {
    badge: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-400 border-purple-100 dark:border-purple-800',
    border: 'border-purple-100 dark:border-purple-800',
    range: 'accent-purple-600'
  }
};

const SliderInput = ({ label, value, min, max, step, onChange, unit = "%", color = "blue" }: any) => {
  const styles = colorVariants[color] || colorVariants.blue;

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
        <div className={`text-sm font-bold px-2 py-0.5 rounded border min-w-[3rem] text-center ${styles.badge}`}>
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
          className={`w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer ${styles.range}`}
        />
      </div>
    </div>
  )
}

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