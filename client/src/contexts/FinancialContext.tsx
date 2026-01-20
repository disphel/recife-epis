import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useHistory } from './HistoryContext';
import { parse, subDays, format, isBefore, closestTo } from 'date-fns';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface Transaction {
  id: string;
  description: string;
  value: number;
}

export interface AccountData {
  name: string;
  saldo_anterior: number;
  entradas: number;
  saidas: number;
  taxas?: number;
  saldo_atual: number;
  nota?: string;
  entradas_detalhadas?: Transaction[];
  saidas_detalhadas?: Transaction[];
}

export interface FinancialData {
  date: string;
  accounts: AccountData[];
  totals: {
    saldo_anterior: number;
    entradas: number;
    saidas: number;
    taxas?: number;
    saldo_atual: number;
  };
}

// Dados iniciais (para migração)
const INITIAL_DATA: FinancialData[] = [
  {
    date: '16/01/2026',
    accounts: [
      { name: 'Aplicação', saldo_anterior: 178091.64, entradas: 0, saidas: 1123.54, saldo_atual: 176968.10, taxas: 0 },
      { name: 'M Pago C&Z', saldo_anterior: 36230.45, entradas: 0, saidas: 0, saldo_atual: 36230.45, taxas: 0 },
      { name: 'Brasil Disphel', saldo_anterior: 22369.63, entradas: 19612.74, saidas: 11575.55, saldo_atual: 30406.82, taxas: 0 },
      { name: 'Brasil C&Z', saldo_anterior: 339199.79, entradas: 11319.42, saidas: 2949.83, saldo_atual: 347569.38, taxas: 0 },
      { name: 'BNB Disphel', saldo_anterior: 2815.69, entradas: 0, saidas: 0, saldo_atual: 2815.69, nota: 'Disphel', taxas: 0 },
      { name: 'Sicred Disphel', saldo_anterior: 30355.91, entradas: 3254.50, saidas: 0, saldo_atual: 33610.41, nota: 'C&Z', taxas: 0 },
      { name: 'Sicred Filial', saldo_anterior: 15465.69, entradas: 914.80, saidas: 0, saldo_atual: 16380.49, taxas: 0 }
    ],
    totals: { saldo_anterior: 624528.80, entradas: 35101.46, saidas: 15648.92, taxas: 0, saldo_atual: 643981.34 }
  },
];

interface FinancialContextType {
  financialData: FinancialData[];
  currentData: FinancialData;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  updateAccount: (index: number, updatedAccount: AccountData) => void;
  isLoading: boolean;
  isSyncing: boolean;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export function FinancialProvider({ children }: { children: ReactNode }) {
  const [financialData, setFinancialData] = useState<FinancialData[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'dd/MM/yyyy'));
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncHash, setLastSyncHash] = useState<string>('');
  const { addOrUpdateDailyBalance } = useHistory();
  
  const utils = trpc.useUtils();
  const saveMutation = trpc.financial.save.useMutation();

  // Fetch all financial data from API
  const { data: apiData, isLoading: isQueryLoading, refetch } = trpc.financial.getAll.useQuery(undefined, {
    refetchInterval: 5000, // Poll every 5 seconds for real-time sync
  });
  
  // Detect changes from other users
  useEffect(() => {
    if (apiData) {
      const newHash = JSON.stringify(apiData);
      if (newHash !== lastSyncHash && lastSyncHash !== '') {
        setIsSyncing(true);
        toast.info('📊 Dados atualizados por outro usuário', {
          duration: 3000,
        });
        setTimeout(() => setIsSyncing(false), 1000);
      }
      setLastSyncHash(newHash);
    }
  }, [apiData, lastSyncHash]);

  // Migrate localStorage data to API on first load
  useEffect(() => {
    const migrateData = async () => {
      const localData = localStorage.getItem('financial_data');
      if (localData && (!apiData || apiData.length === 0)) {
        try {
          const parsed: FinancialData[] = JSON.parse(localData);
          // Upload each day to the API
          for (const day of parsed) {
            await saveMutation.mutateAsync({
              date: day.date,
              accounts: day.accounts.map(acc => ({
                name: acc.name,
                saldo_anterior: acc.saldo_anterior,
                entradas: acc.entradas,
                saidas: acc.saidas,
                taxas: acc.taxas || 0,
                saldo_atual: acc.saldo_atual,
                nota: acc.nota || '',
                entradas_detalhadas: acc.entradas_detalhadas || [],
                saidas_detalhadas: acc.saidas_detalhadas || []
              }))
            });
          }
          toast.success('✅ Dados migrados para a nuvem com sucesso!');
          // Clear localStorage after migration
          localStorage.removeItem('financial_data');
          refetch();
        } catch (error) {
          console.error('Migration failed:', error);
          toast.error('❌ Falha ao migrar dados para a nuvem');
        }
      }
    };
    
    if (!isQueryLoading) {
      migrateData();
    }
  }, [isQueryLoading, apiData]);

  // Update financialData when API data changes
  useEffect(() => {
    if (apiData) {
      // Calculate totals for each day
      const dataWithTotals = apiData.map(day => ({
        ...day,
        totals: day.accounts.reduce((acc, curr) => ({
          saldo_anterior: acc.saldo_anterior + curr.saldo_anterior,
          entradas: acc.entradas + curr.entradas,
          saidas: acc.saidas + curr.saidas,
          taxas: (acc.taxas || 0) + (curr.taxas || 0),
          saldo_atual: acc.saldo_atual + curr.saldo_atual
        }), { saldo_anterior: 0, entradas: 0, saidas: 0, taxas: 0, saldo_atual: 0 })
      }));
      
      setFinancialData(dataWithTotals);
      setIsLoading(false);
    }
  }, [apiData]);

  // Helper to find the closest previous date with data
  const findPreviousData = useCallback((targetDateStr: string, allData: FinancialData[]) => {
    const targetDate = parse(targetDateStr, 'dd/MM/yyyy', new Date());
    
    // Filter only dates before target
    const previousDates = allData
      .map(d => parse(d.date, 'dd/MM/yyyy', new Date()))
      .filter(d => isBefore(d, targetDate));
    
    if (previousDates.length === 0) return null;
    
    // Find the closest date
    const closestDate = closestTo(targetDate, previousDates);
    if (!closestDate) return null;
    
    const closestDateStr = format(closestDate, 'dd/MM/yyyy');
    return allData.find(d => d.date === closestDateStr) || null;
  }, []);

  // Get current data for selected date
  const currentData: FinancialData = financialData.find(d => d.date === selectedDate) || {
    date: selectedDate,
    accounts: [],
    totals: { saldo_anterior: 0, entradas: 0, saidas: 0, taxas: 0, saldo_atual: 0 }
  };

  // If no data for selected date, try to use previous day's saldo_atual as saldo_anterior
  if (currentData.accounts.length === 0 && financialData.length > 0) {
    const previousData = findPreviousData(selectedDate, financialData);
    if (previousData) {
      currentData.accounts = previousData.accounts.map(acc => ({
        ...acc,
        saldo_anterior: acc.saldo_atual,
        entradas: 0,
        saidas: 0,
        taxas: 0,
        saldo_atual: acc.saldo_atual,
        nota: ''
      }));
      currentData.totals = {
        saldo_anterior: previousData.totals.saldo_atual,
        entradas: 0,
        saidas: 0,
        taxas: 0,
        saldo_atual: previousData.totals.saldo_atual
      };
    }
  }

  const updateAccount = useCallback(async (index: number, updatedAccount: AccountData) => {
    const newAccounts = [...currentData.accounts];
    newAccounts[index] = updatedAccount;
    
    const newTotals = newAccounts.reduce((acc, curr) => ({
      saldo_anterior: acc.saldo_anterior + curr.saldo_anterior,
      entradas: acc.entradas + curr.entradas,
      saidas: acc.saidas + curr.saidas,
      taxas: (acc.taxas || 0) + (curr.taxas || 0),
      saldo_atual: acc.saldo_atual + curr.saldo_atual
    }), { saldo_anterior: 0, entradas: 0, saidas: 0, taxas: 0, saldo_atual: 0 });

    // Save to API
    try {
      await saveMutation.mutateAsync({
        date: selectedDate,
        accounts: newAccounts.map(acc => ({
          name: acc.name,
          saldo_anterior: acc.saldo_anterior,
          entradas: acc.entradas,
          saidas: acc.saidas,
          taxas: acc.taxas || 0,
          saldo_atual: acc.saldo_atual,
          nota: acc.nota || '',
          entradas_detalhadas: acc.entradas_detalhadas || [],
          saidas_detalhadas: acc.saidas_detalhadas || []
        }))
      });
      
      // Refetch to get latest data
      refetch();
      
      // Update history
      addOrUpdateDailyBalance(selectedDate, newTotals.saldo_atual);
    } catch (error) {
      console.error('Failed to save:', error);
      toast.error('❌ Falha ao salvar alterações');
    }
  }, [currentData, selectedDate, saveMutation, refetch, addOrUpdateDailyBalance]);

  return (
    <FinancialContext.Provider value={{ 
      financialData, 
      currentData, 
      selectedDate, 
      setSelectedDate, 
      updateAccount,
      isLoading,
      isSyncing
    }}>
      {children}
    </FinancialContext.Provider>
  );
}

export function useFinancial() {
  const context = useContext(FinancialContext);
  if (!context) {
    throw new Error('useFinancial must be used within a FinancialProvider');
  }
  return context;
}
