import React, { useState, useMemo } from 'react';
import { GameState, INITIAL_GAME_STATE, Property, Trust, PropertyType } from './types';
import SetupScreen from './components/SetupScreen';
import StatCard from './components/StatCard';
import { BuyPropertyModal, RefinanceModal, SellPropertyModal, PayDownModal } from './components/Modals';
import { formatCurrency, formatPercentage, getMaxLoan, calculateMonthlyInterest } from './utils/format';
import { 
  Plus, 
  Briefcase, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Building, 
  PieChart, 
  Home, 
  Store,
  Wallet,
  Coins,
  BarChart2,
  ArrowDownCircle
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const [showBuyModal, setShowBuyModal] = useState(false);
  // Track which trust triggered the buy modal (for empty state button)
  const [preSelectedTrustId, setPreSelectedTrustId] = useState<string | undefined>(undefined);
  
  // Refinance state now tracks specific property selection
  const [refinanceSelection, setRefinanceSelection] = useState<{trustId: string, propertyId: string} | null>(null);

  // Sell state
  const [sellSelection, setSellSelection] = useState<{trustId: string, property: Property} | null>(null);
  
  // Pay Down state
  const [payDownSelection, setPayDownSelection] = useState<{trustId: string, property: Property} | null>(null);

  const [showHistory, setShowHistory] = useState(false);

  // --- Derived State ---
  const totalProperties = useMemo(() => 
    gameState.trusts.reduce((acc, t) => acc + t.properties.length, 0), 
  [gameState.trusts]);

  const totalValue = useMemo(() => 
    gameState.trusts.reduce((acc, t) => acc + t.properties.reduce((pAcc, p) => pAcc + p.value, 0), 0), 
  [gameState.trusts]);

  const totalDebt = useMemo(() => 
    gameState.trusts.reduce((acc, t) => acc + t.properties.reduce((pAcc, p) => pAcc + p.loan, 0), 0), 
  [gameState.trusts]);

  const totalEquity = totalValue - totalDebt;
  const netWorth = totalEquity + gameState.cash;

  const annualCashflow = useMemo(() => {
    let total = 0;
    gameState.trusts.forEach(trust => {
      trust.properties.forEach(prop => {
        const monthlyRent = (prop.value * (prop.yieldRate / 100)) / 12;
        const monthlyInterest = calculateMonthlyInterest(prop.loan, prop.interestRate);
        const monthlyExpenses = prop.type === 'RESIDENTIAL' 
          ? monthlyRent * 0.20 
          : monthlyRent * 0.10;
        
        total += (monthlyRent - monthlyInterest - monthlyExpenses);
      });
    });
    return total * 12; // Annualised
  }, [gameState.trusts]);

  // --- Actions ---

  const handleStart = (setupData: Partial<GameState>) => {
    setGameState(prev => ({ ...prev, ...setupData, setupComplete: true }));
  };

  const handleOpenTrust = () => {
    if (gameState.cash < 3000) {
      alert("Insufficient cash to open a Trust ($3,000 required).");
      return;
    }
    const newTrust: Trust = {
      id: Math.random().toString(36).substr(2, 9),
      name: `Trust ${gameState.trusts.length + 1}`,
      properties: []
    };
    setGameState(prev => ({
      ...prev,
      cash: prev.cash - 3000,
      trusts: [...prev.trusts, newTrust]
    }));
  };

  const handleBuyProperty = (trustId: string, propertyData: Omit<Property, 'id' | 'boughtAt'>, cost: number) => {
    const newProperty: Property = {
      ...propertyData,
      id: Math.random().toString(36).substr(2, 9),
      boughtAt: gameState.year * 12 + gameState.month
    };

    setGameState(prev => {
      const updatedTrusts = prev.trusts.map(t => {
        if (t.id === trustId) {
          return { ...t, properties: [...t.properties, newProperty] };
        }
        return t;
      });
      return {
        ...prev,
        cash: prev.cash - cost,
        trusts: updatedTrusts
      };
    });
    setShowBuyModal(false);
    setPreSelectedTrustId(undefined);
  };

  const handleSellProperty = (trustId: string, propertyId: string, netProceeds: number) => {
    setGameState(prev => {
        const updatedTrusts = prev.trusts.map(t => {
            if(t.id === trustId) {
                return {
                    ...t,
                    properties: t.properties.filter(p => p.id !== propertyId)
                }
            }
            return t;
        });

        return {
            ...prev,
            cash: prev.cash + netProceeds,
            trusts: updatedTrusts
        }
    });
    setSellSelection(null);
  }

  const handlePayDownLoan = (trustId: string, propertyId: string, amount: number) => {
      setGameState(prev => {
          const updatedTrusts = prev.trusts.map(t => {
              if (t.id === trustId) {
                  return {
                      ...t,
                      properties: t.properties.map(p => {
                          if (p.id === propertyId) {
                              return { ...p, loan: Math.max(0, p.loan - amount) };
                          }
                          return p;
                      })
                  }
              }
              return t;
          });
          return {
              ...prev,
              cash: prev.cash - amount,
              trusts: updatedTrusts
          }
      });
      setPayDownSelection(null);
  }

  const handleRefinance = (trustId: string, propertyId: string, additionalLoan: number, lmiCost: number) => {
    setGameState(prev => {
      const updatedTrusts = prev.trusts.map(t => {
        if (t.id === trustId) {
          const updatedProps = t.properties.map(p => {
            if (p.id === propertyId) {
              return { ...p, loan: p.loan + additionalLoan + lmiCost };
            }
            return p;
          });
          return { ...t, properties: updatedProps };
        }
        return t;
      });
      return {
        ...prev,
        cash: prev.cash + additionalLoan, // Only cash out is added, LMI is absorbed into loan
        trusts: updatedTrusts
      };
    });
    setRefinanceSelection(null);
  };

  const advanceTime = () => {
    // 3 Months logic
    const monthsPassed = 3;
    let accumulatedCash = 0;
    
    // Create deep copy of trusts to update values
    const newTrusts = gameState.trusts.map(trust => {
      const newProperties = trust.properties.map(prop => {
        // Rent Calc
        const annualRent = prop.value * (prop.yieldRate / 100);
        const periodRent = (annualRent / 12) * monthsPassed;
        
        const annualInterest = prop.loan * (prop.interestRate / 100);
        const periodInterest = (annualInterest / 12) * monthsPassed;

        const expenseRate = prop.type === 'RESIDENTIAL' ? 0.20 : 0.10;
        const periodExpenses = periodRent * expenseRate;

        accumulatedCash += (periodRent - periodInterest - periodExpenses);

        // Value Growth (3 months worth of the annual rate)
        // Formula: Value * (1 + rate)^(months/12) is accurate compounding, 
        // but simplified: Value * (1 + (rate/100 * 3/12))
        const growthFactor = 1 + (prop.growthRate / 100) * (monthsPassed / 12);
        const newValue = prop.value * growthFactor;

        return { ...prop, value: newValue };
      });
      return { ...trust, properties: newProperties };
    });

    // Savings Injection
    const quarterlySavings = (gameState.salary * (gameState.savingsRate / 100)) / 4;
    accumulatedCash += quarterlySavings;

    // Update time
    let newMonth = gameState.month + monthsPassed;
    let newYear = gameState.year;
    if (newMonth >= 12) {
      newYear += 1;
      newMonth = newMonth % 12;
    }

    // New Totals for history
    const nextTotalValue = newTrusts.reduce((acc, t) => acc + t.properties.reduce((pAcc, p) => pAcc + p.value, 0), 0);
    const nextTotalDebt = newTrusts.reduce((acc, t) => acc + t.properties.reduce((pAcc, p) => pAcc + p.loan, 0), 0); 
    const nextCash = gameState.cash + accumulatedCash;
    const nextNetWorth = nextTotalValue - nextTotalDebt + nextCash;

    setGameState(prev => ({
      ...prev,
      year: newYear,
      month: newMonth,
      cash: nextCash,
      trusts: newTrusts,
      history: [...prev.history, { 
        label: `Y${newYear}`, 
        netWorth: nextNetWorth,
        cash: nextCash,
        debt: nextTotalDebt 
      }]
    }));
  };

  if (!gameState.setupComplete) {
    return <SetupScreen onStart={handleStart} />;
  }

  const allProperties = gameState.trusts.flatMap(t => t.properties.map(p => ({ prop: p, trustId: t.id })));
  const timelineMaxYear = Math.max(10, gameState.year + 2); // Default 10 years, or current + 2
  const currentProgress = gameState.year + (gameState.month / 12);
  const progressPercentage = Math.min((currentProgress / timelineMaxYear) * 100, 100);

  // Generate ticks for timeline (every year)
  const timelineTicks = Array.from({ length: timelineMaxYear + 1 }, (_, i) => i);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      
      {/* Top Bar - Sticky */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm px-4 py-3 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-md">
              <Building className="w-6 h-6" />
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-800">PropertySim</h1>
            </div>
          </div>
          
          <div className="flex gap-4 lg:gap-8 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 items-center">
             {/* Timeline Widget - Moved Here */}
             <div className="flex flex-col min-w-[100px] border-r border-slate-100 pr-6 mr-2">
                <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> Timeline</span>
                <span className="text-xl font-bold text-slate-800 flex items-baseline gap-1">
                   Y{gameState.year} <span className="text-sm text-slate-400 font-medium">M{gameState.month}</span>
                </span>
             </div>

             <div className="flex flex-col min-w-[100px]">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Net Worth</span>
                <span className="text-xl font-bold text-slate-800">{formatCurrency(netWorth)}</span>
             </div>
             <div className="flex flex-col min-w-[100px]">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Cash</span>
                <span className="text-xl font-bold text-emerald-600">{formatCurrency(gameState.cash)}</span>
             </div>
             <div className="flex flex-col min-w-[100px]">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Annual Cashflow</span>
                <span className={`text-xl font-bold ${annualCashflow >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {annualCashflow > 0 ? '+' : ''}{formatCurrency(annualCashflow)}
                </span>
             </div>
             
             <div className="h-8 w-px bg-slate-200 hidden md:block"></div>

             <div className="flex items-center gap-2">
                <button 
                    onClick={() => setShowHistory(!showHistory)} 
                    className={`p-2.5 rounded-lg transition border flex items-center gap-2 text-sm font-medium ${showHistory ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                    <BarChart2 className="w-5 h-5" />
                    <span className="hidden md:inline">Chart</span>
                </button>
                <button 
                onClick={advanceTime} 
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                    <Clock className="w-4 h-4" /> Fast forward
                </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard */}
      <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-8">

        {/* Timeline Visualization */}
        <div className="w-full bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
           <div className="flex justify-between items-center mb-4">
               <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Clock className="w-3 h-3" /> Investment Journey</span>
               <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">Projected Scale</span>
           </div>
           
           <div className="px-4"> {/* Added padding to prevent edge clipping */}
             <div className="relative h-3 bg-slate-100 rounded-full w-full mt-2">
                {/* Markers for years */}
                {timelineTicks.map(year => (
                    <div key={year} className="absolute top-0 bottom-0 w-px bg-slate-300 h-full" style={{ left: `${(year / timelineMaxYear) * 100}%` }}></div>
                ))}
                
                {/* Progress */}
                <div 
                  className="absolute top-0 left-0 bottom-0 bg-blue-500 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-4 border-blue-600 rounded-full shadow-lg z-10" />
                </div>
             </div>
             
             <div className="relative h-6 mt-2">
                 {timelineTicks.map(year => (
                    <span 
                      key={year} 
                      className="text-[10px] text-slate-400 font-medium absolute top-0 -translate-x-1/2"
                      style={{ left: `${(year / timelineMaxYear) * 100}%` }}
                    >
                       Y{year}
                    </span>
                 ))}
             </div>
           </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Equity" value={formatCurrency(totalEquity)} icon={<Wallet className="w-4 h-4"/>} color="green" />
            <StatCard label="Portfolio Value" value={formatCurrency(totalValue)} icon={<TrendingUp className="w-4 h-4"/>} color="blue" />
            <StatCard label="Total Debt" value={formatCurrency(totalDebt)} icon={<Briefcase className="w-4 h-4"/>} color="slate" />
            <StatCard label="Trusts Active" value={gameState.trusts.length.toString()} subValue={`Cap: ${formatCurrency(gameState.maxBorrowingPerTrust)} ea`} icon={<Building className="w-4 h-4"/>} />
        </div>

        {/* History Chart (Collapsible) */}
        {showHistory && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 animate-in slide-in-from-top-4 duration-300">
             <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><PieChart className="w-4 h-4"/> Performance History</h3>
             <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={gameState.history} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `$${val/1000}k`} tickLine={false} axisLine={false} dx={-10} />
                    <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: number, name: string) => [formatCurrency(value), name]} 
                    />
                    <Legend verticalAlign="top" height={36} />
                    <Line name="Net Worth" type="monotone" dataKey="netWorth" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                    <Line name="Cash" type="monotone" dataKey="cash" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} />
                    <Line name="Debt" type="monotone" dataKey="debt" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
             </div>
          </div>
        )}

        {/* Action Bar */}
        <div className="flex flex-wrap gap-4">
           <button 
             onClick={() => {
                if(gameState.trusts.length === 0) { alert("Open a Trust first!"); return; }
                setShowBuyModal(true);
             }} 
             className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-slate-300 hover:border-blue-400 hover:text-blue-600 text-slate-700 px-6 py-4 rounded-xl shadow-sm transition group"
           >
              <div className="bg-slate-100 group-hover:bg-blue-100 p-2 rounded-full transition"><Home className="w-5 h-5" /></div>
              <div className="text-left">
                <div className="font-bold text-sm">Buy Property</div>
                <div className="text-xs text-slate-400">Res or Comm</div>
              </div>
           </button>

           <button 
             onClick={() => {
                if(totalProperties === 0) { alert("No properties to refinance."); return; }
                // Default pick first property if generic button clicked
                setRefinanceSelection({ trustId: gameState.trusts[0].id, propertyId: gameState.trusts[0].properties[0].id });
             }}
             className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-slate-300 hover:border-blue-400 hover:text-blue-600 text-slate-700 px-6 py-4 rounded-xl shadow-sm transition group"
           >
              <div className="bg-slate-100 group-hover:bg-blue-100 p-2 rounded-full transition"><DollarSign className="w-5 h-5" /></div>
              <div className="text-left">
                <div className="font-bold text-sm">Equity Release</div>
                <div className="text-xs text-slate-400">Up to 88% LVR</div>
              </div>
           </button>
        </div>

        {/* Trusts Container */}
        <div>
           <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              Portfolio Structure 
              <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded-full">{gameState.trusts.length} Entities</span>
           </h2>
           
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {gameState.trusts.map(trust => {
                 const trustValue = trust.properties.reduce((acc, p) => acc + p.value, 0);
                 const trustDebt = trust.properties.reduce((acc, p) => acc + p.loan, 0);
                 const capacityUsed = (trustDebt / gameState.maxBorrowingPerTrust) * 100;

                 return (
                   <div key={trust.id} className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
                      {/* Trust Header */}
                      <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 rounded-t-xl">
                         <div className="flex justify-between items-center mb-1">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                               <Briefcase className="w-4 h-4 text-slate-500" /> {trust.name}
                            </h3>
                            <div className="text-xs font-semibold bg-white border px-2 py-0.5 rounded text-slate-500">
                               {trust.properties.length} Assets
                            </div>
                         </div>
                         <div className="flex justify-between text-xs text-slate-500">
                             <span>Borrowed: {formatCurrency(trustDebt)}</span>
                             <span className={capacityUsed > 90 ? 'text-red-500 font-bold' : ''}>
                                {capacityUsed.toFixed(0)}% Cap
                             </span>
                         </div>
                         {/* Capacity Bar */}
                         <div className="h-1.5 w-full bg-slate-200 rounded-full mt-2 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${capacityUsed > 90 ? 'bg-red-500' : 'bg-blue-500'}`} 
                              style={{ width: `${Math.min(capacityUsed, 100)}%` }} 
                            />
                         </div>
                      </div>
                      
                      <div className="p-4 space-y-4 flex-grow bg-slate-50/30">
                         {trust.properties.length === 0 && (
                            <div className="flex flex-col items-center justify-center text-center py-6 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                                <p className="text-sm text-slate-400 italic mb-3">No assets in this trust.</p>
                                <button 
                                  onClick={() => {
                                      setPreSelectedTrustId(trust.id);
                                      setShowBuyModal(true);
                                  }}
                                  className="text-xs bg-white border border-blue-200 text-blue-600 px-3 py-1.5 rounded-md hover:bg-blue-50 transition shadow-sm font-medium flex items-center gap-1"
                                >
                                    <Plus className="w-3 h-3" /> Buy Property
                                </button>
                            </div>
                         )}
                         {trust.properties.map(prop => {
                            const equity = prop.value - prop.loan;
                            const usableEquity = Math.max(0, getMaxLoan(prop.value) - prop.loan);
                            const lvr = (prop.loan / prop.value) * 100;
                            const profitSinceBuy = prop.value - prop.originalPrice;
                            const profitPercent = (profitSinceBuy / prop.originalPrice) * 100;
                            
                            // Calculate bought date
                            const boughtYear = Math.floor(prop.boughtAt / 12);
                            const boughtMonth = prop.boughtAt % 12;

                            return (
                               <div key={prop.id} className="relative bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition group">
                                  
                                  {/* Header */}
                                  <div className="p-3 border-b border-slate-100 flex justify-between items-start">
                                     <div className="flex items-center gap-2">
                                        <div className={`p-1.5 rounded-md ${prop.type === 'RESIDENTIAL' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                                            {prop.type === 'RESIDENTIAL' ? <Home className="w-4 h-4" /> : <Store className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-slate-800 text-sm leading-tight">{prop.name}</div>
                                            <div className="text-[10px] text-slate-400 uppercase tracking-wide">
                                                {prop.type === 'RESIDENTIAL' ? 'Bread & Butter' : 'Commercial'}
                                            </div>
                                        </div>
                                     </div>
                                     <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${lvr > 80 ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                                        {lvr.toFixed(0)}% LVR
                                     </span>
                                  </div>
                                  
                                  {/* Stats Body */}
                                  <div className="p-3 grid grid-cols-2 gap-y-2 gap-x-4 text-sm relative">
                                      {/* Detail Tooltip (Hover) */}
                                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[110%] w-72 bg-slate-800 text-white text-xs rounded-lg p-3 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                          <h5 className="font-bold border-b border-slate-600 pb-1 mb-2 text-slate-300">Asset Details</h5>
                                          <div className="grid grid-cols-2 gap-y-1 gap-x-4">
                                              <span className="text-slate-400">Bought:</span> <span className="text-right">Year {boughtYear}, Month {boughtMonth}</span>
                                              <span className="text-slate-400">Original Price:</span> <span className="text-right">{formatCurrency(prop.originalPrice)}</span>
                                              <span className="text-slate-400">Current Value:</span> <span className="text-right font-bold text-white">{formatCurrency(prop.value)}</span>
                                              <span className="text-slate-400">Current Debt:</span> <span className="text-right text-red-200">{formatCurrency(prop.loan)}</span>
                                              <span className="text-slate-400">Net Equity:</span> <span className="text-right text-emerald-300">{formatCurrency(equity)}</span>
                                              <div className="col-span-2 h-px bg-slate-600 my-1"></div>
                                              <span className="text-slate-400">Growth:</span> <span className="text-right text-green-400">+{profitPercent.toFixed(1)}%</span>
                                              <span className="text-slate-400">Yield:</span> <span className="text-right">{prop.yieldRate}%</span>
                                          </div>
                                          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-slate-800"></div>
                                      </div>

                                      <div className="flex flex-col">
                                          <span className="text-[10px] text-slate-400 uppercase">Value</span>
                                          <span className="font-semibold text-slate-700">{formatCurrency(prop.value)}</span>
                                      </div>
                                      <div className="flex flex-col text-right">
                                          <span className="text-[10px] text-slate-400 uppercase">Loan</span>
                                          <span className="font-medium text-slate-600">{formatCurrency(prop.loan)}</span>
                                      </div>
                                      <div className="flex flex-col">
                                          <span className="text-[10px] text-slate-400 uppercase">Equity</span>
                                          <span className="font-medium text-emerald-600">{formatCurrency(equity)}</span>
                                      </div>
                                      <div className="flex flex-col text-right">
                                          <span className="text-[10px] text-slate-400 uppercase">Usable</span>
                                          <span className="font-medium text-blue-600">{formatCurrency(usableEquity)}</span>
                                      </div>
                                  </div>

                                  {/* Action Footer */}
                                  <div className="grid grid-cols-2 border-t border-slate-100 divide-x divide-slate-100">
                                      <button 
                                        onClick={() => setRefinanceSelection({ trustId: trust.id, propertyId: prop.id })}
                                        className="py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition flex items-center justify-center gap-1"
                                      >
                                          <Coins className="w-3 h-3" /> Equity
                                      </button>
                                      {prop.type === 'COMMERCIAL' ? (
                                          <div className="grid grid-cols-2 divide-x divide-slate-100">
                                              <button 
                                                onClick={() => setPayDownSelection({ trustId: trust.id, property: prop })}
                                                className="py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition flex items-center justify-center gap-1"
                                                title="Pay Down Loan"
                                              >
                                                  <ArrowDownCircle className="w-3 h-3" /> Pay loan
                                              </button>
                                              <button 
                                                onClick={() => setSellSelection({ trustId: trust.id, property: prop })}
                                                className="py-2 text-xs font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition flex items-center justify-center gap-1"
                                                title="Sell Asset"
                                              >
                                                  <DollarSign className="w-3 h-3" /> Sell
                                              </button>
                                          </div>
                                      ) : (
                                        <button 
                                            onClick={() => setSellSelection({ trustId: trust.id, property: prop })}
                                            className="py-2 text-xs font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition flex items-center justify-center gap-1"
                                        >
                                            <DollarSign className="w-3 h-3" /> Sell
                                        </button>
                                      )}
                                  </div>
                               </div>
                            );
                         })}
                      </div>
                   </div>
                 );
               })}

                {/* Inline Add Trust Card */}
                <button 
                    onClick={handleOpenTrust}
                    className="group border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center p-8 hover:border-blue-400 hover:bg-blue-50/50 transition h-full min-h-[200px]"
                >
                    <div className="bg-slate-100 group-hover:bg-blue-200 p-4 rounded-full mb-3 transition">
                        <Plus className="w-6 h-6 text-slate-500 group-hover:text-blue-700" />
                    </div>
                    <span className="font-semibold text-slate-600 group-hover:text-blue-700">Open New Trust</span>
                    <span className="text-sm text-slate-400 mt-1">Cost: $3,000</span>
                </button>

             </div>
           
        </div>

      </div>

      {showBuyModal && (
        <BuyPropertyModal 
          trusts={gameState.trusts} 
          cash={gameState.cash} 
          maxBorrowingPerTrust={gameState.maxBorrowingPerTrust}
          initialTrustId={preSelectedTrustId}
          onClose={() => {
              setShowBuyModal(false);
              setPreSelectedTrustId(undefined);
          }}
          onBuy={handleBuyProperty}
        />
      )}

      {refinanceSelection && (
        <RefinanceModal 
          properties={allProperties}
          maxBorrowingPerTrust={gameState.maxBorrowingPerTrust}
          trusts={gameState.trusts}
          initialSelection={refinanceSelection}
          onClose={() => setRefinanceSelection(null)}
          onRefinance={handleRefinance}
        />
      )}

      {sellSelection && (
          <SellPropertyModal 
            property={sellSelection.property}
            trustId={sellSelection.trustId}
            currentDate={{ year: gameState.year, month: gameState.month }}
            onClose={() => setSellSelection(null)}
            onSell={handleSellProperty}
          />
      )}

      {payDownSelection && (
          <PayDownModal 
            property={payDownSelection.property}
            trustId={payDownSelection.trustId}
            cashAvailable={gameState.cash}
            onClose={() => setPayDownSelection(null)}
            onPayDown={handlePayDownLoan}
          />
      )}
    </div>
  );
}