import React, { useState } from 'react';
import { GameState } from '../types';
import { Building2, Wallet, Landmark, Percent } from 'lucide-react';
import { formatNumber, parseFormattedNumber } from '../utils/format';

interface SetupScreenProps {
  onStart: (initialState: Partial<GameState>) => void;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ onStart }) => {
  const [salary, setSalary] = useState(150000);
  const [savingsRate, setSavingsRate] = useState(20);
  const [cash, setCash] = useState(200000);
  const [maxBorrowing, setMaxBorrowing] = useState(1000000);

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
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md border-t-4 border-blue-600">
        <div className="mb-6 text-center">
          <div className="bg-blue-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">PropertySim</h1>
          <p className="text-slate-500 mt-2">Configure your portfolio parameters</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
              <Wallet className="w-4 h-4" /> Annual Salary
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-500">$</span>
              <input
                type="text"
                required
                value={formatNumber(salary)}
                onChange={(e) => handleCurrencyChange(e.target.value, setSalary)}
                className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
              <Percent className="w-4 h-4" /> Savings Rate
            </label>
            <p className="text-xs text-slate-400 mb-2">% of salary added to cash annually.</p>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-500">%</span>
              <input
                type="number"
                required
                min="0"
                max="100"
                value={savingsRate}
                onChange={(e) => setSavingsRate(Number(e.target.value))}
                className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
              <Landmark className="w-4 h-4" /> Initial Cash Savings
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-500">$</span>
              <input
                type="text"
                required
                value={formatNumber(cash)}
                onChange={(e) => handleCurrencyChange(e.target.value, setCash)}
                className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Max Borrowing per Trust
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-500">$</span>
              <input
                type="text"
                required
                value={formatNumber(maxBorrowing)}
                onChange={(e) => handleCurrencyChange(e.target.value, setMaxBorrowing)}
                className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
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
    </div>
  );
};

export default SetupScreen;