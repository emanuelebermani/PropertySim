export type PropertyType = 'RESIDENTIAL' | 'COMMERCIAL';

export interface Property {
  id: string;
  name: string;
  type: PropertyType;
  value: number;
  originalPrice: number; // Track purchase price
  loan: number;
  interestRate: number; // Annual %
  growthRate: number; // Annual %
  yieldRate: number; // Annual %
  boughtAt: number; // Month purchased
}

export interface Trust {
  id: string;
  name: string;
  properties: Property[];
}

export interface GameState {
  year: number;
  month: number;
  cash: number;
  salary: number; // Display only base for savings calc
  savingsRate: number; // % of salary saved annually
  maxBorrowingPerTrust: number;
  trusts: Trust[];
  history: {
    label: string;
    netWorth: number;
    cash: number;
    debt: number;
  }[];
  setupComplete: boolean;
}

export const INITIAL_GAME_STATE: GameState = {
  year: 0,
  month: 0,
  cash: 0,
  salary: 0,
  savingsRate: 0,
  maxBorrowingPerTrust: 0,
  trusts: [],
  history: [],
  setupComplete: false,
};