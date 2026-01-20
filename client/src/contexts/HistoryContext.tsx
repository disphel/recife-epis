import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface DailyBalance {
  date: string; // Format: YYYY-MM-DD
  totalBalance: number;
}

interface HistoryContextType {
  history: DailyBalance[];
  addOrUpdateDailyBalance: (date: string, totalBalance: number) => void;
  getHistoryByRange: (startDate: string, endDate: string) => DailyBalance[];
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<DailyBalance[]>(() => {
    const saved = localStorage.getItem('balance_history');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('balance_history', JSON.stringify(history));
  }, [history]);

  const addOrUpdateDailyBalance = useCallback((date: string, totalBalance: number) => {
    // Convert DD/MM/YYYY to YYYY-MM-DD if necessary
    let formattedDate = date;
    if (date.includes('/')) {
      const [day, month, year] = date.split('/');
      formattedDate = `${year}-${month}-${day}`;
    }

    setHistory(prev => {
      const existingIndex = prev.findIndex(item => item.date === formattedDate);
      
      // Check if value actually changed to avoid unnecessary updates
      if (existingIndex >= 0) {
        if (prev[existingIndex].totalBalance === totalBalance) {
          return prev; // No change, return same reference
        }
        const newHistory = [...prev];
        newHistory[existingIndex] = { date: formattedDate, totalBalance };
        return newHistory.sort((a, b) => a.date.localeCompare(b.date));
      } else {
        return [...prev, { date: formattedDate, totalBalance }].sort((a, b) => a.date.localeCompare(b.date));
      }
    });
  }, []);

  const getHistoryByRange = useCallback((startDate: string, endDate: string) => {
    return history.filter(item => item.date >= startDate && item.date <= endDate);
  }, [history]);

  return (
    <HistoryContext.Provider value={{ history, addOrUpdateDailyBalance, getHistoryByRange }}>
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory() {
  const context = useContext(HistoryContext);
  if (context === undefined) {
    throw new Error('useHistory must be used within a HistoryProvider');
  }
  return context;
}
