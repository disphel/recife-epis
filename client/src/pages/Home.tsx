import { FinancialCard } from "@/components/FinancialCard";
import { FinancialTable } from "@/components/FinancialTable";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { ArrowDownCircle, ArrowUpCircle, Calendar as CalendarIcon, Wallet, FileSpreadsheet, FileText, AlertCircle, Search, RotateCcw } from "lucide-react";
import { useAudit } from "@/contexts/AuditContext";
import { exportToExcel, exportToPDF } from "@/lib/exportUtils";
import { useFinancial, AccountData } from "@/contexts/FinancialContext";
import { useState, useMemo, useEffect } from "react";
import { parse, isWithinInterval, startOfDay, endOfDay, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function Home() {
  const { financialData, currentData, selectedDate, setSelectedDate, updateAccount } = useFinancial();
  const { logAction } = useAudit();

  // State for date range
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [startPopoverOpen, setStartPopoverOpen] = useState(false);
  const [endPopoverOpen, setEndPopoverOpen] = useState(false);

  // Sync local state with context when context changes (e.g. initial load)
  useEffect(() => {
    const parsedDate = parse(selectedDate, 'dd/MM/yyyy', new Date());
    setStartDate(parsedDate);
    setEndDate(parsedDate);
  }, [selectedDate]);

  // Check if we are in range mode (different dates)
  const isRangeMode = startDate && endDate && startDate.getTime() !== endDate.getTime();

  // Calculate aggregated data for range mode
  const aggregatedData = useMemo(() => {
    if (!isRangeMode || !startDate || !endDate) return currentData;

    const start = startOfDay(startDate);
    const end = endOfDay(endDate);

    // Filter data within range
    const rangeData = financialData.filter(item => {
      const [day, month, year] = item.date.split('/');
      const itemDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return isWithinInterval(itemDate, { start, end });
    });

    if (rangeData.length === 0) return currentData;

    // Sort by date to find first and last
    rangeData.sort((a, b) => {
      const [dayA, monthA, yearA] = a.date.split('/');
      const dateA = new Date(parseInt(yearA), parseInt(monthA) - 1, parseInt(dayA));
      
      const [dayB, monthB, yearB] = b.date.split('/');
      const dateB = new Date(parseInt(yearB), parseInt(monthB) - 1, parseInt(dayB));
      
      return dateA.getTime() - dateB.getTime();
    });

    const firstDay = rangeData[0];
    const lastDay = rangeData[rangeData.length - 1];

    // Aggregate accounts
    const accountMap = new Map<string, AccountData>();

    // Initialize with all accounts from all days to ensure we capture everything
    rangeData.forEach(dayData => {
      dayData.accounts.forEach(acc => {
        if (!accountMap.has(acc.name)) {
          accountMap.set(acc.name, {
            name: acc.name,
            saldo_anterior: 0, // Will be set later
            entradas: 0,
            saidas: 0,
            taxas: 0,
            saldo_atual: 0, // Will be set later
            nota: ''
          });
        }
      });
    });

    // Sum up values
    rangeData.forEach(dayData => {
      dayData.accounts.forEach(acc => {
        const current = accountMap.get(acc.name)!;
        current.entradas += acc.entradas;
        current.saidas += acc.saidas;
        current.taxas = (current.taxas || 0) + (acc.taxas || 0);
      });
    });

    // Set balances
    accountMap.forEach((acc, name) => {
      const startAcc = firstDay.accounts.find(a => a.name === name);
      const endAcc = lastDay.accounts.find(a => a.name === name);

      if (startAcc) acc.saldo_anterior = startAcc.saldo_anterior;
      if (endAcc) acc.saldo_atual = endAcc.saldo_atual;
    });

    const accounts = Array.from(accountMap.values());

    // Calculate totals
    const totals = accounts.reduce((acc, curr) => ({
      saldo_anterior: acc.saldo_anterior + curr.saldo_anterior,
      entradas: acc.entradas + curr.entradas,
      saidas: acc.saidas + curr.saidas,
      taxas: (acc.taxas || 0) + (curr.taxas || 0),
      saldo_atual: acc.saldo_atual + curr.saldo_atual
    }), { saldo_anterior: 0, entradas: 0, saidas: 0, taxas: 0, saldo_atual: 0 });

    return {
      date: `${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`,
      accounts,
      totals
    };

  }, [startDate, endDate, financialData, currentData, isRangeMode]);

  // Update context when single date changes (to keep sync if user switches back)
  const handleDateSelect = (type: 'start' | 'end', date: Date | undefined) => {
    if (!date) return;
    
    if (type === 'start') {
      setStartDate(date);
      setStartPopoverOpen(false); // Close popover after selection
      // If start > end, update end to match start
      if (endDate && date > endDate) {
        setEndDate(date);
        setSelectedDate(format(date, 'dd/MM/yyyy'));
      } else if (endDate && date.getTime() === endDate.getTime()) {
        setSelectedDate(format(date, 'dd/MM/yyyy'));
      }
    } else {
      setEndDate(date);
      setEndPopoverOpen(false); // Close popover after selection
      // If end < start, update start to match end (or prevent? let's update start)
      if (startDate && date < startDate) {
        setStartDate(date);
        setEndDate(date);
        setSelectedDate(format(date, 'dd/MM/yyyy'));
      } else {
        if (startDate && date.getTime() === startDate.getTime()) {
          setSelectedDate(format(date, 'dd/MM/yyyy'));
        }
      }
    }
  };

  const handleTodayClick = () => {
    const today = new Date();
    setStartDate(today);
    setEndDate(today);
    setSelectedDate(format(today, 'dd/MM/yyyy'));
  };

  const handleUpdateAccount = (index: number, updatedAccount: any) => {
    if (isRangeMode) return; // Disable editing in range mode

    const oldAccount = currentData.accounts[index];
    updateAccount(index, updatedAccount);
    
    // Log audit action
    logAction(
      'update',
      'Conta',
      `Atualizou saldo da conta ${updatedAccount.name}`
    );
  };

  const formattedStartDate = startDate ? format(startDate, 'dd/MM/yyyy') : '';
  const formattedEndDate = endDate ? format(endDate, 'dd/MM/yyyy') : '';

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-primary tracking-tight">Visão Geral Financeira</h2>
            <p className="text-muted-foreground">
              {isRangeMode 
                ? "Visualizando relatório consolidado por período." 
                : "Acompanhe o fluxo de caixa e saldos diários."}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
            {/* Today Button */}
            <Button 
              variant={!isRangeMode && formattedStartDate === format(new Date(), 'dd/MM/yyyy') ? "default" : "outline"}
              size="sm"
              onClick={handleTodayClick}
              className="h-9 gap-2 shadow-sm"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Hoje
            </Button>

            <div className="w-px h-8 bg-border hidden sm:block mx-1" />

            {/* Date Range Selector with Calendar */}
            <div className="flex items-center gap-2 bg-white p-1.5 rounded-lg shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 px-2 border-r border-slate-100">
                <Search className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Período</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Popover open={startPopoverOpen} onOpenChange={setStartPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[130px] h-8 text-xs justify-start text-left font-normal border-0 bg-slate-50 focus:ring-0 focus:bg-slate-100 transition-colors",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-3 w-3" />
                      {startDate ? format(startDate, "dd/MM/yyyy") : <span>Início</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[9999]" align="start" collisionPadding={20}>
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => handleDateSelect('start', date)}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>

                <span className="text-slate-300 text-xs">à</span>

                <Popover open={endPopoverOpen} onOpenChange={setEndPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[130px] h-8 text-xs justify-start text-left font-normal border-0 bg-slate-50 focus:ring-0 focus:bg-slate-100 transition-colors",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-3 w-3" />
                      {endDate ? format(endDate, "dd/MM/yyyy") : <span>Fim</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[9999]" align="start" collisionPadding={20}>
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => handleDateSelect('end', date)}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="w-px h-8 bg-border hidden sm:block mx-1" />

            {/* Export Actions */}
            <div className="flex items-center gap-1 bg-white p-1.5 rounded-lg shadow-sm border border-slate-200 ml-0 sm:ml-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
                onClick={() => exportToExcel(
                  aggregatedData.accounts.map(acc => ({
                    Conta: acc.name,
                    'Saldo Anterior': acc.saldo_anterior,
                    Entradas: acc.entradas,
                    Saídas: acc.saidas,
                    Taxas: acc.taxas || 0,
                    'Saldo Atual': acc.saldo_atual,
                    Nota: acc.nota || ''
                  })), 
                  `relatorio_${formattedStartDate.replace(/\//g, '-')}_a_${formattedEndDate.replace(/\//g, '-')}`, 
                  'Relatorio'
                )}
                title="Exportar Excel"
              >
                <FileSpreadsheet className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                onClick={() => exportToPDF(
                  `Relatório Financeiro: ${formattedStartDate} a ${formattedEndDate}`,
                  [
                    { header: 'Conta', dataKey: 'name' },
                    { header: 'Saldo Ant.', dataKey: 'saldo_anterior' },
                    { header: 'Entradas', dataKey: 'entradas' },
                    { header: 'Saídas', dataKey: 'saidas' },
                    { header: 'Taxas', dataKey: 'taxas' },
                    { header: 'Saldo Atual', dataKey: 'saldo_atual' }
                  ],
                  aggregatedData.accounts.map(acc => ({
                    ...acc,
                    saldo_anterior: acc.saldo_anterior.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                    entradas: acc.entradas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                    saidas: acc.saidas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                    taxas: (acc.taxas || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                    saldo_atual: acc.saldo_atual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                  })),
                  `relatorio_${formattedStartDate.replace(/\//g, '-')}_a_${formattedEndDate.replace(/\//g, '-')}`
                )}
                title="Exportar PDF"
              >
                <FileText className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {isRangeMode && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-3 text-amber-800 text-sm animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <p>
              <strong>Modo Relatório Ativo:</strong> Você está visualizando a soma das movimentações entre <strong>{formattedStartDate}</strong> e <strong>{formattedEndDate}</strong>. 
              A edição de dados está desabilitada neste modo. Para editar, clique no botão <strong>Hoje</strong> ou selecione a mesma data nos dois campos.
            </p>
          </div>
        )}

        {/* Cards Section - 3 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Card: Saldo Atual Total */}
          <FinancialCard 
            title={isRangeMode ? "Saldo Final (Fim do Período)" : "Saldo Atual Total"} 
            value={aggregatedData.totals.saldo_atual} 
            type="default"
            icon={Wallet}
          />
          
          {/* Middle Column: Stacked Entradas and Saídas */}
          <div className="flex flex-col gap-6">
            <FinancialCard 
              title="Entradas do Período" 
              value={aggregatedData.totals.entradas} 
              type="success"
              icon={ArrowUpCircle}
            />
            <FinancialCard 
              title="Saídas do Período" 
              value={aggregatedData.totals.saidas} 
              type="danger"
              icon={ArrowDownCircle}
            />
          </div>
          
          {/* Right Card: Saldo Anterior */}
          <FinancialCard 
            title={isRangeMode ? "Saldo Inicial (Início do Período)" : "Saldo Anterior"} 
            value={aggregatedData.totals.saldo_anterior} 
            type="default"
            icon={Wallet}
            expandable={true}
            onExpand={(expanded) => {
              if (expanded) {
                setStartPopoverOpen(false);
                setEndPopoverOpen(false);
              }
            }}
            expandedContent={
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-slate-700 mb-2">Detalhamento por Conta:</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {aggregatedData.accounts.map((acc, idx) => (
                      <div key={idx} className="flex justify-between items-center py-1 border-b border-slate-100 last:border-0">
                        <span className="text-xs font-medium text-slate-600">{acc.name}</span>
                        <span className="text-xs font-bold text-slate-900">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(acc.saldo_anterior)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground pt-2 border-t border-slate-200">
                  {isRangeMode 
                    ? `Saldo inicial de cada conta em ${formattedStartDate}` 
                    : `Saldo de cada conta no início do dia ${selectedDate}`
                  }
                </div>
              </div>
            }
          />
        </div>

        {/* Main Table Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-lg font-semibold text-slate-800">
              {isRangeMode ? "Consolidado por Conta" : "Detalhamento por Conta"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isRangeMode 
                ? "Soma das movimentações e saldos inicial/final de cada conta no período." 
                : "Gerencie as movimentações de cada conta bancária."}
            </p>
          </div>
          <FinancialTable 
            accounts={aggregatedData.accounts} 
            date={aggregatedData.date}
            totals={aggregatedData.totals}
            onUpdateAccount={handleUpdateAccount}
            onAddAccount={() => {}} // Placeholder
            onDeleteAccount={() => {}} // Placeholder
            readOnly={isRangeMode} // Pass readOnly prop
          />
        </div>
      </div>
    </Layout>
  );
}
