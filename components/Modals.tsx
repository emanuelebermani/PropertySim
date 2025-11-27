import React, { useState, useEffect } from 'react';
import { Property, Trust, PropertyType } from '../types';
import { formatCurrency, getMaxLoan, formatNumber, parseFormattedNumber, calculateLMI } from '../utils/format';
import { X, HelpCircle, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';

// --- Base Modal ---
const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center p-4 border-b bg-slate-50 sticky top-0 z-10">
        <h3 className="font-bold text-lg text-slate-800">{title}</h3>
        <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition">
          <X className="w-5 h-5 text-slate-500" />
        </button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

// --- Buy Property Modal ---
interface BuyPropertyModalProps {
  trusts: Trust[];
  cash: number;
  maxBorrowingPerTrust: number;
  initialTrustId?: string;
  onClose: () => void;
  onBuy: (trustId: string, property: Omit<Property, 'id' | 'boughtAt'>, cost: number) => void;
}

export const BuyPropertyModal: React.FC<BuyPropertyModalProps> = ({ trusts, cash, maxBorrowingPerTrust, initialTrustId, onClose, onBuy }) => {
  const [trustId, setTrustId] = useState(initialTrustId || trusts[0]?.id || '');
  const [name, setName] = useState('');
  const [type, setType] = useState<PropertyType>('RESIDENTIAL');
  const [price, setPrice] = useState(500000);
  const [lvr, setLvr] = useState(88); 
  const [rate, setRate] = useState<number | string>(6.0);
  const [growth, setGrowth] = useState<number | string>(20.0);
  const [yieldRate, setYieldRate] = useState<number | string>(5.0);
  const [otherCosts, setOtherCosts] = useState(40000);

  // Auto-naming logic
  useEffect(() => {
    const allProps = trusts.flatMap(t => t.properties);
    const count = allProps.filter(p => p.type === type).length + 1;
    setName(type === 'RESIDENTIAL' ? `IP ${count}` : `Commercial ${count}`);
  }, [type, trusts]);

  // Handle Default switching based on Type
  const handleTypeChange = (newType: PropertyType) => {
    setType(newType);
    if (newType === 'COMMERCIAL') {
      setPrice(1000000);
      setLvr(65);
      setGrowth(4.0);
    } else {
      setPrice(500000);
      setLvr(88);
      setGrowth(20.0);
    }
  };

  const handleCurrencyChange = (value: string, setter: (val: number) => void) => {
      const num = parseFormattedNumber(value);
      if(!isNaN(num)) setter(num);
  }
  
  const handlePercentChange = (value: string, setter: (val: number | string) => void) => {
      if (value === '') {
          setter('');
      } else {
          setter(Number(value));
      }
  }

  // Calculations based on LVR
  const loanAmount = price * (lvr / 100);
  const depositRequired = price - loanAmount;
  const totalUpfront = depositRequired + otherCosts;
  
  const selectedTrust = trusts.find((t) => t.id === trustId);
  const currentTrustDebt = selectedTrust?.properties.reduce((acc, p) => acc + p.loan, 0) || 0;
  const newTrustDebt = currentTrustDebt + loanAmount;
  const isOverBorrowing = newTrustDebt > maxBorrowingPerTrust;
  const isAffordable = totalUpfront <= cash;

  return (
    <Modal title="Acquire Asset" onClose={onClose}>
      <form onSubmit={(e) => {
        e.preventDefault();
        if (!isOverBorrowing && isAffordable) {
          onBuy(trustId, { 
            name, 
            type, 
            value: price, 
            originalPrice: price,
            loan: loanAmount, 
            interestRate: Number(rate), 
            growthRate: Number(growth), 
            yieldRate: Number(yieldRate) 
          }, totalUpfront);
        }
      }} className="space-y-4">
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Select Trust</label>
          <select value={trustId} onChange={(e) => setTrustId(e.target.value)} className="w-full border p-2 rounded-lg bg-slate-50">
            {trusts.map((t) => (
              <option key={t.id} value={t.id}>{t.name} (Debt: {formatCurrency(t.properties.reduce((acc, p) => acc + p.loan, 0))})</option>
            ))}
          </select>
          {isOverBorrowing && <p className="text-xs text-red-500 mt-1">Exceeds Trust Borrowing Capacity of {formatCurrency(maxBorrowingPerTrust)}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Property Name</label>
            <input required type="text" placeholder="e.g. 123 Main St" value={name} onChange={(e) => setName(e.target.value)} className="w-full border p-2 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
            <select value={type} onChange={(e) => handleTypeChange(e.target.value as PropertyType)} className="w-full border p-2 rounded-lg">
              <option value="RESIDENTIAL">Bread and butter</option>
              <option value="COMMERCIAL">Commercial</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Purchase Price</label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-slate-500">$</span>
            <input type="text" value={formatNumber(price)} onChange={(e) => handleCurrencyChange(e.target.value, setPrice)} className="w-full border pl-6 p-2 rounded-lg" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
          <div>
            <label className="block text-sm font-medium text-blue-900 mb-1">LVR</label>
            <div className="relative">
              <input 
                type="number" 
                min="0" 
                max="100" 
                value={lvr} 
                onChange={(e) => setLvr(Number(e.target.value))} 
                className="w-full border p-2 rounded-lg text-center font-bold text-blue-800 pr-6" 
              />
              <span className="absolute right-3 top-2 text-blue-600 font-bold">%</span>
            </div>
            <p className="text-xs text-blue-600 mt-1 text-center">Loan: {formatCurrency(loanAmount)}</p>
          </div>
          <div>
             <label className="block text-sm font-medium text-blue-900 mb-1">Required Deposit</label>
             <div className="w-full border p-2 rounded-lg bg-white text-slate-500 text-center">
                {formatCurrency(depositRequired)}
             </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
           <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Loan Interest Rate</label>
            <div className="relative">
                <input type="number" step="0.1" value={rate} onChange={(e) => handlePercentChange(e.target.value, setRate)} className="w-full border p-2 pr-6 rounded-lg" />
                <span className="absolute right-3 top-2 text-slate-500">%</span>
            </div>
          </div>
           <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 leading-tight">Annual growth</label>
            <div className="relative">
                <input type="number" step="0.1" value={growth} onChange={(e) => handlePercentChange(e.target.value, setGrowth)} className="w-full border p-2 pr-6 rounded-lg" />
                <span className="absolute right-3 top-2 text-slate-500">%</span>
            </div>
          </div>
           <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Yield</label>
            <div className="relative">
                <input type="number" step="0.1" value={yieldRate} onChange={(e) => handlePercentChange(e.target.value, setYieldRate)} className="w-full border p-2 pr-6 rounded-lg" />
                <span className="absolute right-3 top-2 text-slate-500">%</span>
            </div>
          </div>
        </div>

        <div>
            <div className="flex items-center gap-2 mb-1">
              <label className="block text-sm font-medium text-slate-700">Other Costs</label>
              <div className="group relative">
                <HelpCircle className="w-4 h-4 text-slate-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-white text-xs p-2 rounded hidden group-hover:block z-20">
                  Includes Stamp Duty, Legal Fees, and Buyer's Agency Fees.
                </div>
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-500">$</span>
              <input type="text" value={formatNumber(otherCosts)} onChange={(e) => handleCurrencyChange(e.target.value, setOtherCosts)} className="w-full border pl-6 p-2 rounded-lg" />
            </div>
        </div>

        <div className="bg-slate-100 p-3 rounded-lg text-sm space-y-2 border border-slate-200">
            <div className="flex justify-between"><span>Deposit ({(100-lvr).toFixed(0)}%):</span> <span>{formatCurrency(depositRequired)}</span></div>
            <div className="flex justify-between"><span>Other Costs:</span> <span>{formatCurrency(otherCosts)}</span></div>
            <div className="h-px bg-slate-300 my-1"></div>
            <div className="flex justify-between font-bold text-lg"><span>Total Cash Required:</span> <span className={isAffordable ? 'text-slate-800' : 'text-red-600'}>{formatCurrency(totalUpfront)}</span></div>
            {!isAffordable && <div className="text-red-500 text-xs text-right font-medium">Insufficient Cash</div>}
        </div>

        <button 
            disabled={!isAffordable || isOverBorrowing || !name} 
            type="submit" 
            className="w-full bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
            Complete Purchase
        </button>
      </form>
    </Modal>
  );
};

// --- Sell Property Modal ---
interface SellPropertyModalProps {
    property: Property;
    trustId: string;
    currentDate: { year: number, month: number };
    onClose: () => void;
    onSell: (trustId: string, propertyId: string, netProceeds: number) => void;
}

export const SellPropertyModal: React.FC<SellPropertyModalProps> = ({ property, trustId, currentDate, onClose, onSell }) => {
    // Logic
    const currentMonthTotal = currentDate.year * 12 + currentDate.month;
    const monthsHeld = currentMonthTotal - property.boughtAt;
    
    // States
    const [cgtRate, setCgtRate] = useState<number | string>(30); // Default 30% tax bracket
    const [applyDiscount, setApplyDiscount] = useState(monthsHeld >= 12);
    
    const sellingCostsRate = 0.02; // 2% Agent Fees
    const sellingCosts = property.value * sellingCostsRate;
    const loanPayout = property.loan;
    
    const grossProfit = property.value - property.originalPrice;
    
    // Capital Gains Calculation
    const taxRate = Number(cgtRate);
    const taxableGain = Math.max(0, grossProfit); // Assuming selling costs are separate or you could deduct them from profit. Simple model: Profit = Value - OrigPrice.
    // To be more accurate: Capital Gain = Sale Price - Selling Costs - Cost Base (Original Price). 
    // Let's use that formula for tax purposes.
    const capitalGain = property.value - sellingCosts - property.originalPrice;
    const taxableAmount = applyDiscount && capitalGain > 0 ? capitalGain * 0.5 : capitalGain;
    const taxPayable = taxableAmount > 0 ? taxableAmount * (taxRate / 100) : 0;

    const netProceeds = property.value - loanPayout - sellingCosts - taxPayable;

    const handlePercentChange = (value: string, setter: (val: number | string) => void) => {
        if (value === '') {
            setter('');
        } else {
            setter(Number(value));
        }
    }

    return (
        <Modal title="Sell Property & Tax" onClose={onClose}>
            <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <h4 className="font-bold text-slate-800 text-lg mb-1">{property.name}</h4>
                    <p className="text-slate-500 text-sm">Held for {Math.floor(monthsHeld / 12)} Years, {monthsHeld % 12} Months</p>
                </div>

                {/* Financial Breakdown */}
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center py-1">
                        <span className="text-slate-600">Sale Price</span>
                        <span className="font-semibold text-slate-800">{formatCurrency(property.value)}</span>
                    </div>
                     <div className="flex justify-between items-center py-1 text-slate-400">
                        <span>Original Purchase Price</span>
                        <span>-{formatCurrency(property.originalPrice)}</span>
                    </div>
                     <div className="flex justify-between items-center py-1 border-b border-slate-100 pb-2">
                        <span>Selling Costs (2%)</span>
                        <span className="text-red-500">-{formatCurrency(sellingCosts)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-1 font-medium text-slate-700">
                        <span>Gross Capital Gain</span>
                        <span>{formatCurrency(Math.max(0, capitalGain))}</span>
                    </div>

                    {/* Tax Section */}
                    <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 space-y-3 mt-2">
                        <div className="flex justify-between items-center">
                            <label className="text-orange-900 font-medium text-sm">Est. Tax Rate (%)</label>
                            <div className="relative w-24">
                                <input 
                                    type="number" 
                                    value={cgtRate} 
                                    onChange={(e) => handlePercentChange(e.target.value, setCgtRate)} 
                                    className="w-full border border-orange-200 rounded p-1 text-right pr-6 focus:ring-orange-500"
                                />
                                <span className="absolute right-2 top-1 text-orange-400 text-sm">%</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <input 
                                type="checkbox" 
                                id="cgtDiscount"
                                checked={applyDiscount} 
                                onChange={(e) => setApplyDiscount(e.target.checked)}
                                className="rounded text-orange-600 focus:ring-orange-500"
                            />
                            <label htmlFor="cgtDiscount" className="text-sm text-orange-800">Apply 50% CGT Discount (Held &gt; 12m)</label>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-orange-200 font-medium text-orange-800">
                            <span>Tax Payable to ATO</span>
                            <span>{formatCurrency(taxPayable)}</span>
                        </div>
                    </div>

                    <div className="flex justify-between items-center py-2 border-t border-slate-200">
                        <span className="text-slate-600">Less: Loan Discharge</span>
                        <span className="text-red-600">-{formatCurrency(loanPayout)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center pt-2 text-lg bg-emerald-50 p-3 rounded-lg border border-emerald-100 mt-2">
                        <span className="font-bold text-emerald-900">Net Cash to Bank</span>
                        <span className="font-bold text-emerald-600">{formatCurrency(netProceeds)}</span>
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button 
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition font-medium"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={() => onSell(trustId, property.id, netProceeds)}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-bold shadow-md"
                    >
                        Confirm Sale
                    </button>
                </div>
            </div>
        </Modal>
    )
}

// --- Pay Down Loan Modal ---
interface PayDownModalProps {
    property: Property;
    trustId: string;
    cashAvailable: number;
    onClose: () => void;
    onPayDown: (trustId: string, propertyId: string, amount: number) => void;
}

export const PayDownModal: React.FC<PayDownModalProps> = ({ property, trustId, cashAvailable, onClose, onPayDown }) => {
    const [amount, setAmount] = useState<number | string>('');
    const maxPayable = Math.min(cashAvailable, property.loan);
    const numAmount = Number(amount);

    return (
        <Modal title="Pay Down Loan" onClose={onClose}>
             <div className="space-y-5">
                 <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm text-blue-800">
                     Paying down debt reduces your interest expenses and increases cashflow, but consumes available cash.
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4 text-sm">
                     <div className="p-2 border rounded bg-slate-50">
                         <span className="block text-slate-500 text-xs uppercase">Current Loan</span>
                         <span className="font-bold text-slate-800">{formatCurrency(property.loan)}</span>
                     </div>
                     <div className="p-2 border rounded bg-slate-50">
                         <span className="block text-slate-500 text-xs uppercase">Cash Available</span>
                         <span className="font-bold text-emerald-600">{formatCurrency(cashAvailable)}</span>
                     </div>
                 </div>

                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Payment Amount</label>
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-slate-500">$</span>
                        <input 
                            type="text"
                            value={amount === '' ? '' : formatNumber(numAmount)}
                            onChange={(e) => {
                                const val = parseFormattedNumber(e.target.value);
                                if (!isNaN(val) && val <= maxPayable) setAmount(val);
                                if (e.target.value === '') setAmount('');
                            }}
                            className="w-full border pl-8 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="0"
                        />
                    </div>
                    <div className="flex justify-end gap-2 mt-1">
                        <button onClick={() => setAmount(maxPayable)} className="text-xs text-blue-600 hover:underline">Max Available</button>
                    </div>
                 </div>

                 <button 
                    disabled={numAmount <= 0}
                    onClick={() => onPayDown(trustId, property.id, numAmount)}
                    className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg disabled:bg-slate-300 disabled:cursor-not-allowed hover:bg-blue-700 transition"
                 >
                     Pay {numAmount > 0 ? formatCurrency(numAmount) : ''} & Reduce Debt
                 </button>
             </div>
        </Modal>
    )
}

// --- Refinance Modal ---
interface RefinanceModalProps {
    properties: { prop: Property, trustId: string }[];
    maxBorrowingPerTrust: number;
    trusts: Trust[];
    initialSelection?: { trustId: string; propertyId: string } | null;
    onClose: () => void;
    onRefinance: (trustId: string, propertyId: string, additionalLoan: number, lmiCost: number) => void;
}

export const RefinanceModal: React.FC<RefinanceModalProps> = ({ properties, maxBorrowingPerTrust, trusts, initialSelection, onClose, onRefinance }) => {
    const [selectedId, setSelectedId] = useState(initialSelection?.propertyId || properties[0]?.prop.id || '');
    const [amountToRelease, setAmountToRelease] = useState(0);

    // Update selection if props change or modal opens with new selection
    useEffect(() => {
        if (initialSelection) {
            setSelectedId(initialSelection.propertyId);
        }
    }, [initialSelection]);

    const selected = properties.find(p => p.prop.id === selectedId);
    const property = selected?.prop;
    const trust = trusts.find(t => t.id === selected?.trustId);
    
    if (!property || !trust) return null;

    const maxLoan = getMaxLoan(property.value);
    const availableEquity = Math.max(0, maxLoan - property.loan);
    const trustCurrentDebt = trust.properties.reduce((acc, p) => acc + p.loan, 0);
    const trustRemainingCapacity = Math.max(0, maxBorrowingPerTrust - trustCurrentDebt);
    
    const maxReleaseable = Math.min(availableEquity, trustRemainingCapacity);

    // Helpers to set amount based on LVR target
    const setAmountByLVR = (targetLVR: number) => {
        const targetLoan = property.value * (targetLVR / 100);
        const additionalNeeded = targetLoan - property.loan;
        if (additionalNeeded > 0) {
            const cappedAmount = Math.min(additionalNeeded, maxReleaseable);
            setAmountToRelease(Math.floor(cappedAmount));
        } else {
            setAmountToRelease(0);
        }
    };

    // LMI Calculation
    const newTotalLoanRaw = property.loan + amountToRelease;
    const lmiCost = calculateLMI(newTotalLoanRaw, property.value);
    const finalNewLoan = newTotalLoanRaw + lmiCost;
    const finalLVR = (finalNewLoan / property.value) * 100;

    return (
        <Modal title="Release Equity" onClose={onClose}>
            <form onSubmit={(e) => {
                e.preventDefault();
                if (amountToRelease > 0 && amountToRelease <= maxReleaseable) {
                    onRefinance(trust.id, property.id, amountToRelease, lmiCost);
                }
            }} className="space-y-6">
                
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Select Property</label>
                    <select value={selectedId} onChange={(e) => {
                        setSelectedId(e.target.value);
                        setAmountToRelease(0);
                    }} className="w-full border p-2 rounded-lg">
                        {properties.map(({ prop, trustId: tId }) => {
                           const t = trusts.find(tr => tr.id === tId);
                           return <option key={prop.id} value={prop.id}>{prop.name} ({t?.name})</option>
                        })}
                    </select>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg space-y-2 text-sm">
                    <div className="flex justify-between"><span>Current Value:</span> <span>{formatCurrency(property.value)}</span></div>
                    <div className="flex justify-between"><span>Current Loan ({(property.loan/property.value*100).toFixed(1)}%):</span> <span>{formatCurrency(property.loan)}</span></div>
                    <div className="border-t pt-2 flex justify-between font-bold text-green-600">
                        <span>Max Releaseable (88% LVR):</span> 
                        <span>{formatCurrency(maxReleaseable)}</span>
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-end mb-1">
                        <label className="block text-sm font-medium text-slate-700">Amount to Release</label>
                        <div className="flex gap-2">
                             <button 
                                type="button"
                                onClick={() => setAmountByLVR(80)}
                                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition"
                             >
                                Max 80%
                             </button>
                             <button 
                                type="button"
                                onClick={() => setAmountByLVR(88)}
                                className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 transition"
                             >
                                Max 88%
                             </button>
                        </div>
                    </div>
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-slate-500">$</span>
                        <input 
                            type="text" 
                            value={formatNumber(amountToRelease)}
                            onChange={(e) => {
                                const val = parseFormattedNumber(e.target.value);
                                if (!isNaN(val) && val <= maxReleaseable) setAmountToRelease(val);
                            }}
                            className="w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <input 
                        type="range" 
                        min="0" 
                        max={maxReleaseable} 
                        value={amountToRelease} 
                        onChange={(e) => setAmountToRelease(Number(e.target.value))}
                        className="w-full mt-2 accent-blue-600"
                    />
                    
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>$0</span>
                        <span>{formatCurrency(maxReleaseable)}</span>
                    </div>

                    {amountToRelease > 0 && (
                         <div className="mt-4 p-3 bg-slate-50 rounded-lg text-sm border border-slate-200 space-y-1">
                            {lmiCost > 0 && (
                                <div className="flex justify-between text-orange-600 items-center">
                                    <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> LMI Added (1.5%):</span>
                                    <span>{formatCurrency(lmiCost)}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span>New Loan Amount:</span>
                                <span>{formatCurrency(finalNewLoan)}</span>
                            </div>
                            <div className="flex justify-between font-bold">
                                <span>New LVR:</span>
                                <span className={finalLVR > 80 ? 'text-orange-600' : 'text-slate-800'}>{finalLVR.toFixed(2)}%</span>
                            </div>
                         </div>
                    )}
                </div>

                <button 
                    disabled={amountToRelease <= 0 || amountToRelease > maxReleaseable} 
                    type="submit" 
                    className="w-full bg-emerald-600 disabled:bg-slate-300 disabled:cursor-not-allowed hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition shadow hover:shadow-lg"
                >
                    Confirm & Cash Out {formatCurrency(amountToRelease)}
                </button>
            </form>
        </Modal>
    );
};