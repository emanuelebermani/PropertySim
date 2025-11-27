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
    slate: 'bg-white border-slate-200',
    blue: 'bg-blue-50 border-blue-100',
    green: 'bg-emerald-50 border-emerald-100',
    red: 'bg-rose-50 border-rose-100',
  };

  return (
    <div className={`p-4 rounded-xl border shadow-sm ${colorClasses[color]} flex flex-col justify-between h-full`}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>
      <div>
        <div className="text-xl lg:text-2xl font-bold text-slate-800">{value}</div>
        {subValue && <div className="text-xs text-slate-500 mt-1">{subValue}</div>}
      </div>
    </div>
  );
};

export default StatCard;