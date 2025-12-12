import React from 'react';

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'slate' | 'blue' | 'green' | 'red';
}

const StatCard: React.FC<StatCardProps> = ({ label, value, subValue, icon, color = 'slate' }) => {
  const colorClasses = {
    slate: 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700',
    blue: 'bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800',
    green: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-100 dark:border-emerald-800',
    red: 'bg-rose-50 dark:bg-rose-900/30 border-rose-100 dark:border-rose-800',
  };

  return (
    <div className={`p-4 rounded-xl border shadow-sm ${colorClasses[color]} flex flex-col justify-between h-full transition-colors duration-300`}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</span>
        {icon && <div className="text-slate-400 dark:text-slate-500">{icon}</div>}
      </div>
      <div>
        <div className="text-xl lg:text-2xl font-bold text-slate-800 dark:text-white">{value}</div>
        {subValue && <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{subValue}</div>}
      </div>
    </div>
  );
};

export default StatCard;