export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatNumber = (amount: number): string => {
  return new Intl.NumberFormat('en-US').format(amount);
};

export const parseFormattedNumber = (value: string): number => {
  return Number(value.replace(/,/g, ''));
};

export const formatPercentage = (rate: number): string => {
  return `${rate.toFixed(2)}%`;
};

export const calculateMonthlyInterest = (loan: number, rate: number): number => {
  return (loan * (rate / 100)) / 12;
};

// 88% LVR Cap for Equity Release
export const getMaxLoan = (value: number): number => {
  return value * 0.88;
};

export const calculateLMI = (loanAmount: number, value: number): number => {
  const lvr = loanAmount / value;
  // Simple rule: If LVR > 80%, LMI is roughly 1.5% of the total loan amount
  if (lvr > 0.80) {
    return loanAmount * 0.015;
  }
  return 0;
};