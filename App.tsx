import React, { useState, useMemo, useEffect } from 'react';
import { GameState, INITIAL_GAME_STATE, Property, Trust, PropertyType } from './types';
import SetupScreen from './components/SetupScreen';
import StatCard from './components/StatCard';
import { 
    BuyPropertyModal, 
    RefinanceModal, 
    SellPropertyModal, 
    PayDownModal, 
    GlobalSettingsModal, 
    TrustSettingsModal, 
    PropertySettingsModal,
    InstructionsModal
} from './components/Modals';
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
  ArrowDownCircle,
  Settings,
  BookOpen,
  Moon,
  Sun,
  ChevronRight,
  HelpCircle
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const [showBuyModal, setShowBuyModal] = useState(false);
  // Track which trust triggered the buy modal (for empty state button)
  const [preSelectedTrustId, setPreSelectedTrustId] = useState<string | undefined>(undefined);
  
  // Selection States
  const [refinanceSelection, setRefinanceSelection] = useState<{trustId: string, propertyId: string} | null>(null);
  const [sellSelection, setSellSelection] = useState<{trustId: string, property: Property} | null>(null);
  const [payDownSelection, setPayDownSelection] = useState<{trustId: string, property: Property} | null>(null);
  
  // Setting Modal States
  const [showGlobalSettings, setShowGlobalSettings] = useState(false);
  const [trustSettingsSelection, setTrustSettingsSelection] = useState<Trust | null>(null);
  const [propertySettingsSelection, setPropertySettingsSelection] = useState<Property | null>(null);

  const [showHistory, setShowHistory] = useState(false);
  const [showGuide, setShowGuide] = useState(false); 
  const [darkMode, setDarkMode] = useState(false);

  // Apply dark mode class to html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

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
        // Residential: Input is Gross Yield. Rent = Value * Gross. Expenses = Value * 2%. Net Yield used effectively = Gross - 2%.
        // Commercial: Input is Net Yield. Rent = Value * Net. Expenses = 0.
        
        const monthlyInterest = calculateMonthlyInterest(prop.loan, prop.interestRate);
        
        let monthlyRent = 0;
        let monthlyExpenses = 0;

        if (prop.type.startsWith('RESIDENTIAL')) {
            // prop.yieldRate is Gross Yield
            monthlyRent = (prop.value * (prop.yieldRate / 100)) / 12;
            // Expenses are 2% of value annually
            monthlyExpenses = (prop.value * 0.02) / 12; 
        } else {
            // Commercial: prop.yieldRate is Net Yield
            monthlyRent = (prop.value * (prop.yieldRate / 100)) / 12;
            monthlyExpenses = 0; 
        }
        
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
      maxBorrowing: gameState.maxBorrowingPerTrust, // Set default from global
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
        cash: prev.cash + additionalLoan,
        trusts: updatedTrusts
      };
    });
    setRefinanceSelection(null);
  };

  const handleGlobalSettingsSave = (salary: number, savingsRate: number, maxBorrowing: number) => {
      setGameState(prev => ({
          ...prev,
          salary,
          savingsRate,
          maxBorrowingPerTrust: maxBorrowing,
          // Also update all existing trusts to reflect the new global policy if desired
          trusts: prev.trusts.map(t => ({ ...t, maxBorrowing: maxBorrowing }))
      }));
      setShowGlobalSettings(false);
  }

  const handleTrustSettingsSave = (trustId: string, maxBorrowing: number) => {
      setGameState(prev => ({
          ...prev,
          trusts: prev.trusts.map(t => t.id === trustId ? { ...t, maxBorrowing } : t)
      }));
      setTrustSettingsSelection(null);
  }

  const handlePropertySettingsSave = (propertyId: string, growthRate: number, yieldRate: number) => {
      setGameState(prev => ({
          ...prev,
          trusts: prev.trusts.map(t => ({
              ...t,
              properties: t.properties.map(p => p.id === propertyId ? { ...p, growthRate, yieldRate } : p)
          }))
      }));
      setPropertySettingsSelection(null);
  }

  const advanceTime = () => {
    // 3 Months logic
    const monthsPassed = 3;
    let accumulatedCash = 0;
    
    // Create deep copy of trusts to update values
    const newTrusts = gameState.trusts.map(trust => {
      const newProperties = trust.properties.map(prop => {
        // Rent & Expense Calc logic matches annualCashflow logic
        let periodRent = 0;
        let periodExpenses = 0;

        if (prop.type.startsWith('RESIDENTIAL')) {
             const annualRent = prop.value * (prop.yieldRate / 100);
             periodRent = (annualRent / 12) * monthsPassed;
             // Expenses 2% of value annually
             periodExpenses = (prop.value * 0.02 / 12) * monthsPassed;
        } else {
             const annualRent = prop.value * (prop.yieldRate / 100);
             periodRent = (annualRent / 12) * monthsPassed;
             periodExpenses = 0;
        }

        const annualInterest = prop.loan * (prop.interestRate / 100);
        const periodInterest = (annualInterest / 12) * monthsPassed;

        accumulatedCash += (periodRent - periodInterest - periodExpenses);

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
    return (
        <SetupScreen 
            onStart={handleStart} 
            darkMode={darkMode} 
            onToggleTheme={() => setDarkMode(!darkMode)} 
        />
    );
  }

  const allProperties = gameState.trusts.flatMap(t => t.properties.map(p => ({ prop: p, trustId: t.id })));
  const timelineMaxYear = Math.max(10, gameState.year + 2); 
  const currentProgress = gameState.year + (gameState.month / 12);
  const progressPercentage = Math.min((currentProgress / timelineMaxYear) * 100, 100);

  // Generate ticks for timeline (every year)
  const timelineTicks = Array.from({ length: timelineMaxYear + 1 }, (_, i) => i);

  // Reusable Buttons
  const ChartButton = ({ compact = false }) => (
      <button 
         onClick={() => setShowHistory(!showHistory)} 
         className={`p-2.5 rounded-lg transition border flex items-center gap-2 text-sm font-medium ${
           showHistory 
             ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/50 dark:border-blue-800 dark:text-blue-300' 
             : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800'
         }`}
         title="Toggle Charts"
      >
         <BarChart2 className={compact ? "w-4 h-4" : "w-5 h-5"} />
         <span className={compact ? "hidden" : "hidden md:inline"}>Chart</span>
      </button>
  );

  const ThemeButton = ({ compact = false }) => (
      <button 
         onClick={() => setDarkMode(!darkMode)} 
         className="p-2.5 rounded-lg transition border flex items-center gap-2 text-sm font-medium bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
         title="Toggle Dark Mode"
      >
         {darkMode ? <Sun className={compact ? "w-4 h-4" : "w-5 h-5"} /> : <Moon className={compact ? "w-4 h-4" : "w-5 h-5"} />}
      </button>
  );
  
  const SettingsButton = ({ compact = false }) => (
      <button 
         onClick={() => setShowGlobalSettings(true)} 
         className="p-2.5 rounded-lg transition border flex items-center gap-2 text-sm font-medium bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
         title="Global Settings"
      >
         <Settings className={compact ? "w-4 h-4" : "w-5 h-5"} />
      </button>
  );

  const HelpButton = ({ compact = false }) => (
    <button 
       onClick={() => setShowGuide(true)} 
       className="p-2.5 rounded-lg transition border flex items-center gap-2 text-sm font-medium bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
       title="How to Play"
    >
       <BookOpen className={compact ? "w-4 h-4" : "w-5 h-5"} />
    </button>
);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-20 transition-colors duration-300">
      
      {/* Top Bar - Sticky */}
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm px-4 py-3 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-4">
                <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-md">
                <Building className="w-6 h-6" />
                </div>
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-800 dark:text-white">PropertySim</h1>
                </div>
            </div>
             {/* Mobile Controls */}
             <div className="flex md:hidden items-center gap-1">
                 <HelpButton compact />
                 <SettingsButton compact />
                 <ThemeButton compact />
                 <ChartButton compact />
            </div>
          </div>
          
          <div className="flex gap-4 lg:gap-8 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 items-center">
             
             <div className="flex flex-col min-w-[100px]">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Net Worth</span>
                <span className="text-xl font-bold text-slate-800 dark:text-white">{formatCurrency(netWorth)}</span>
             </div>
             <div className="flex flex-col min-w-[100px]">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Cash</span>
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(gameState.cash)}</span>
             </div>
             <div className="flex flex-col min-w-[100px]">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Annual Cashflow</span>
                <span className={`text-xl font-bold ${annualCashflow >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                  {annualCashflow > 0 ? '+' : ''}{formatCurrency(annualCashflow)}
                </span>
             </div>
             
             <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden md:block"></div>

             <div className="hidden md:flex items-center gap-2">
                <HelpButton />
                <SettingsButton />
                <ThemeButton />
                <ChartButton />
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard */}
      <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-8">

        {/* Timeline Visualization */}
        <div className="w-full bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
           <div className="flex justify-between items-end mb-6">
               <div>
                   <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                      <Clock className="w-3 h-3" /> Timeline
                   </span>
                   <div className="text-2xl font-bold text-slate-800 dark:text-white flex items-baseline gap-1">
                      Y{gameState.year} <span className="text-lg text-slate-400 dark:text-slate-500 font-medium">M{gameState.month}</span>
                   </div>
               </div>
               <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded border border-blue-100 dark:border-blue-900/50">Projected Scale</span>
           </div>
           
           <div className="px-4"> 
             <div className="relative h-3 bg-slate-100 dark:bg-slate-800 rounded-full w-full mt-2">
                {timelineTicks.map(year => (
                    <div key={year} className="absolute top-0 bottom-0 w-px bg-slate-300 dark:bg-slate-600 h-full" style={{ left: `${(year / timelineMaxYear) * 100}%` }}></div>
                ))}
                
                <div 
                  className="absolute top-0 left-0 bottom-0 bg-blue-500 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white dark:bg-slate-900 border-4 border-blue-600 rounded-full shadow-lg z-10" />
                </div>
             </div>
             
             <div className="relative h-6 mt-2">
                 {timelineTicks.map(year => (
                    <span 
                      key={year} 
                      className="text-[10px] text-slate-400 dark:text-slate-500 font-medium absolute top-0 -translate-x-1/2"
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
            <StatCard label="Trusts Active" value={gameState.trusts.length.toString()} subValue={`Global Cap: ${formatCurrency(gameState.maxBorrowingPerTrust)}`} icon={<Building className="w-4 h-4"/>} />
        </div>

        {/* History Chart */}
        {showHistory && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 animate-in slide-in-from-top-4 duration-300">
             <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2"><PieChart className="w-4 h-4"/> Performance History</h3>
             <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={gameState.history} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#334155" : "#f1f5f9"} vertical={false} />
                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `$${val/1000}k`} tickLine={false} axisLine={false} dx={-10} />
                    <Tooltip 
                        contentStyle={{ 
                            borderRadius: '8px', 
                            border: 'none', 
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                            backgroundColor: darkMode ? '#1e293b' : '#fff',
                            color: darkMode ? '#fff' : '#000'
                        }}
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
             className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 text-slate-700 dark:text-slate-300 px-6 py-4 rounded-xl shadow-sm transition group"
           >
              <div className="bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900 p-2 rounded-full transition"><Home className="w-5 h-5" /></div>
              <div className="text-left">
                <div className="font-bold text-sm">Buy Property</div>
                <div className="text-xs text-slate-400">Res or Comm</div>
              </div>
           </button>

           <button 
             onClick={() => {
                if(totalProperties === 0) { alert("No properties to refinance."); return; }
                setRefinanceSelection({ trustId: gameState.trusts[0].id, propertyId: gameState.trusts[0].properties[0].id });
             }}
             className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 text-slate-700 dark:text-slate-300 px-6 py-4 rounded-xl shadow-sm transition group"
           >
              <div className="bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900 p-2 rounded-full transition"><DollarSign className="w-5 h-5" /></div>
              <div className="text-left">
                <div className="font-bold text-sm">Equity Release</div>
                <div className="text-xs text-slate-400">Up to 88% LVR</div>
              </div>
           </button>
        </div>

        {/* Trusts Container */}
        <div>
           <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              Portfolio Structure 
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">{gameState.trusts.length} Entities</span>
           </h2>
           
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {gameState.trusts.map(trust => {
                 const trustValue = trust.properties.reduce((acc, p) => acc + p.value, 0);
                 const trustDebt = trust.properties.reduce((acc, p) => acc + p.loan, 0);
                 // Use trust specific max borrowing
                 const capacityUsed = (trustDebt / trust.maxBorrowing) * 100;

                 return (
                   <div key={trust.id} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-full">
                      {/* Trust Header */}
                      <div className="bg-slate-50 dark:bg-slate-800 px-5 py-3 border-b border-slate-100 dark:border-slate-700 rounded-t-xl group/header relative">
                         
                         <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <Briefcase className="w-4 h-4 text-slate-500 dark:text-slate-400" /> {trust.name}
                                </h3>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setTrustSettingsSelection(trust); }}
                                    className="text-slate-400 hover:text-blue-600 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition"
                                    title="Edit Trust Settings"
                                >
                                    <Settings className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <div className="text-xs font-semibold bg-white dark:bg-slate-900 border dark:border-slate-700 px-2 py-0.5 rounded text-slate-500 dark:text-slate-400">
                               {trust.properties.length} Assets
                            </div>
                         </div>
                         <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                             <span>Borrowed: {formatCurrency(trustDebt)} <span className={capacityUsed > 90 ? 'text-red-500 dark:text-red-400 font-bold' : 'text-slate-400 dark:text-slate-500'}>({capacityUsed.toFixed(0)}%)</span></span>
                         </div>
                         <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full mt-2 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${capacityUsed > 90 ? 'bg-red-500' : 'bg-blue-500'}`} 
                              style={{ width: `${Math.min(capacityUsed, 100)}%` }} 
                            />
                         </div>
                      </div>
                      
                      <div className="p-4 space-y-4 flex-grow bg-slate-50/30 dark:bg-slate-800/30">
                         {trust.properties.length === 0 && (
                            <div className="flex flex-col items-center justify-center text-center py-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-800/50">
                                <p className="text-sm text-slate-400 italic mb-3">No assets in this trust.</p>
                                <button 
                                  onClick={() => {
                                      setPreSelectedTrustId(trust.id);
                                      setShowBuyModal(true);
                                  }}
                                  className="text-xs bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 transition shadow-sm font-medium flex items-center gap-1"
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
                            
                            const boughtYear = Math.floor(prop.boughtAt / 12);
                            const boughtMonth = prop.boughtAt % 12;

                            return (
                               <div key={prop.id} className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm hover:shadow-md transition group overflow-hidden">
                                  {/* Header */}
                                  <div className="p-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-start">
                                     <div className="flex items-center gap-2">
                                        <div className={`p-1.5 rounded-md ${prop.type.startsWith('RESIDENTIAL') ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'}`}>
                                            {prop.type.startsWith('RESIDENTIAL') ? <Home className="w-4 h-4" /> : <Store className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-slate-800 dark:text-white text-sm leading-tight pr-4">{prop.name}</div>
                                            <div className="text-[10px] text-slate-400 uppercase tracking-wide">
                                                {prop.type === 'COMMERCIAL' ? 'Commercial' : (prop.type === 'RESIDENTIAL_CASHFLOW' ? 'Res Cashflow' : 'Res Growth')}
                                            </div>
                                        </div>
                                     </div>
                                     <div className="flex items-center gap-1.5">
                                         <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${lvr > 80 ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-800' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800'}`}>
                                            {lvr.toFixed(0)}% LVR
                                         </span>
                                         <button 
                                            onClick={(e) => { e.stopPropagation(); setPropertySettingsSelection(prop); }}
                                            className="text-slate-300 hover:text-blue-500 p-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition"
                                            title="Edit Property"
                                        >
                                            <Settings className="w-3.5 h-3.5" />
                                        </button>
                                     </div>
                                  </div>
                                  
                                  {/* Detailed Body */}
                                  <div className="p-3 text-sm dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/20">
                                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                           {/* Row 1 */}
                                           <div className="flex justify-between items-center">
                                               <span className="text-[10px] text-slate-400 uppercase">Current Value</span>
                                               <span className="font-bold text-slate-700 dark:text-white">{formatCurrency(prop.value)}</span>
                                           </div>
                                           <div className="flex justify-between items-center">
                                               <span className="text-[10px] text-slate-400 uppercase">Loan</span>
                                               <span className="font-medium">{formatCurrency(prop.loan)}</span>
                                           </div>

                                           {/* Row 2 */}
                                           <div className="flex justify-between items-center">
                                               <span className="text-[10px] text-slate-400 uppercase">Purchase</span>
                                               <span className="text-slate-500 dark:text-slate-400 text-xs">{formatCurrency(prop.originalPrice)}</span>
                                           </div>
                                            <div className="flex justify-between items-center">
                                               <span className="text-[10px] text-slate-400 uppercase">Equity</span>
                                               <span className="font-medium text-emerald-600 dark:text-emerald-400">{formatCurrency(equity)}</span>
                                           </div>

                                           {/* Row 3 */}
                                           <div className="flex justify-between items-center">
                                               <span className="text-[10px] text-slate-400 uppercase">Growth</span>
                                               <span className="text-green-600 dark:text-green-400 font-bold text-xs">+{profitPercent.toFixed(1)}%</span>
                                           </div>
                                           <div className="flex justify-between items-center">
                                               <span className="text-[10px] text-slate-400 uppercase">Usable</span>
                                               <span className="font-medium text-blue-600 dark:text-blue-400">{formatCurrency(usableEquity)}</span>
                                           </div>

                                           {/* Row 4 */}
                                           <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-700 pt-1 mt-1">
                                               <span className="text-[10px] text-slate-400 uppercase">Yield</span>
                                               <span className="text-xs">{prop.yieldRate}%</span>
                                           </div>
                                            <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-700 pt-1 mt-1">
                                               <span className="text-[10px] text-slate-400 uppercase">Age</span>
                                               <span className="text-xs text-slate-500">Y{boughtYear} M{boughtMonth}</span>
                                           </div>
                                      </div>
                                  </div>

                                  <div className="grid grid-cols-2 border-t border-slate-100 dark:border-slate-700 divide-x divide-slate-100 dark:divide-slate-700">
                                      <button 
                                        onClick={() => setRefinanceSelection({ trustId: trust.id, propertyId: prop.id })}
                                        className="py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition flex items-center justify-center gap-1"
                                      >
                                          <Coins className="w-3 h-3" /> Equity
                                      </button>
                                      {prop.type === 'COMMERCIAL' ? (
                                          <div className="grid grid-cols-2 divide-x divide-slate-100 dark:divide-slate-700">
                                              <button 
                                                onClick={() => setPayDownSelection({ trustId: trust.id, property: prop })}
                                                className="py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition flex items-center justify-center gap-1"
                                                title="Pay Down Loan"
                                              >
                                                  <ArrowDownCircle className="w-3 h-3" /> Pay loan
                                              </button>
                                              <button 
                                                onClick={() => setSellSelection({ trustId: trust.id, property: prop })}
                                                className="py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition flex items-center justify-center gap-1"
                                                title="Sell Asset"
                                              >
                                                  <DollarSign className="w-3 h-3" /> Sell
                                              </button>
                                          </div>
                                      ) : (
                                        <button 
                                            onClick={() => setSellSelection({ trustId: trust.id, property: prop })}
                                            className="py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition flex items-center justify-center gap-1"
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
                    className="group border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center p-8 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition h-full min-h-[200px]"
                >
                    <div className="bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-200 dark:group-hover:bg-blue-800 p-4 rounded-full mb-3 transition">
                        <Plus className="w-6 h-6 text-slate-500 dark:text-slate-400 group-hover:text-blue-700 dark:group-hover:text-blue-300" />
                    </div>
                    <span className="font-semibold text-slate-600 dark:text-slate-300 group-hover:text-blue-700 dark:group-hover:text-blue-400">Open New Trust</span>
                    <span className="text-sm text-slate-400 mt-1">Cost: $3,000</span>
                </button>

             </div>
           
        </div>

        {/* Floating Action Button (Universal) */}
        <div className="fixed bottom-6 right-6 z-40">
            <button 
                onClick={advanceTime}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 md:px-6 md:py-4 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 font-bold text-sm md:text-lg"
            >
                Next quarter <ChevronRight className="w-4 h-4 md:w-6 md:h-6" />
            </button>
        </div>

      </div>

      {showBuyModal && (
        <BuyPropertyModal 
          trusts={gameState.trusts} 
          cash={gameState.cash} 
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

      {showGlobalSettings && (
          <GlobalSettingsModal 
            salary={gameState.salary}
            savingsRate={gameState.savingsRate}
            maxBorrowingPerTrust={gameState.maxBorrowingPerTrust}
            onClose={() => setShowGlobalSettings(false)}
            onSave={handleGlobalSettingsSave}
          />
      )}

      {trustSettingsSelection && (
          <TrustSettingsModal 
            trust={trustSettingsSelection}
            onClose={() => setTrustSettingsSelection(null)}
            onSave={handleTrustSettingsSave}
          />
      )}

      {propertySettingsSelection && (
          <PropertySettingsModal 
            property={propertySettingsSelection}
            onClose={() => setPropertySettingsSelection(null)}
            onSave={handlePropertySettingsSave}
          />
      )}

      {showGuide && (
          <InstructionsModal onClose={() => setShowGuide(false)} />
      )}
    </div>
  );
}