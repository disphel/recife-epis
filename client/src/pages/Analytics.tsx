import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useMemo } from "react";
import { useFinancial } from "@/contexts/FinancialContext";
import { Area, AreaChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { addDays, format, parse, isWithinInterval, startOfDay, endOfDay } from "date-fns";

export default function Analytics() {
  // Default to last 30 days
  const [startDate, setStartDate] = useState(format(addDays(new Date(), -30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  // Use financialData directly instead of HistoryContext
  const { financialData, currentData } = useFinancial();

  const filteredData = useMemo(() => {
    if (!financialData || financialData.length === 0) return [];

    // Filter data within range
    const start = startOfDay(parse(startDate, 'yyyy-MM-dd', new Date()));
    const end = endOfDay(parse(endDate, 'yyyy-MM-dd', new Date()));

    const rangeData = financialData.filter(item => {
      // Handle DD/MM/YYYY format from FinancialContext
      const [day, month, year] = item.date.split('/');
      const itemDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return isWithinInterval(itemDate, { start, end });
    });

    // Sort by date
    rangeData.sort((a, b) => {
      const [dayA, monthA, yearA] = a.date.split('/');
      const dateA = new Date(parseInt(yearA), parseInt(monthA) - 1, parseInt(dayA));
      
      const [dayB, monthB, yearB] = b.date.split('/');
      const dateB = new Date(parseInt(yearB), parseInt(monthB) - 1, parseInt(dayB));
      
      return dateA.getTime() - dateB.getTime();
    });
    
    // Map to chart format
    return rangeData.map(item => {
      const [day, month] = item.date.split('/');
      return {
        day: `${day}/${month}`,
        saldo: item.totals.saldo_atual,
        fullDate: item.date
      };
    });
  }, [startDate, endDate, financialData]);

  // Calcular distribuição baseada nos dados atuais reais
  const accountDistribution = useMemo(() => {
    if (!currentData || !currentData.accounts) return [];
    
    const colors = ['#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'];
    
    return currentData.accounts
      .filter(acc => acc.saldo_atual > 0)
      .map((acc, index) => ({
        name: acc.name,
        value: acc.saldo_atual,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.value - a.value);
  }, [currentData]);

  const endBalance = filteredData.length > 0 ? filteredData[filteredData.length - 1].saldo : 0;
  const startBalance = filteredData.length > 0 ? filteredData[0].saldo : 0;
  const difference = endBalance - startBalance;
  const growthPercent = startBalance > 0 ? (difference / startBalance) * 100 : 0;

  // Calcular insights dinâmicos
  const topAccount = accountDistribution.length > 0 ? accountDistribution[0] : null;
  const totalBalance = accountDistribution.reduce((acc, curr) => acc + curr.value, 0);
  const topAccountPercent = topAccount && totalBalance > 0 ? (topAccount.value / totalBalance) * 100 : 0;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-primary tracking-tight">Análise de Distribuição</h2>
            <p className="text-muted-foreground">Composição do saldo atual por conta.</p>
          </div>
          
          <div className="flex flex-wrap items-end gap-3 bg-white p-2 rounded-lg border shadow-sm">
            <div className="grid gap-1.5">
              <Label htmlFor="start-date" className="text-xs text-muted-foreground">Data Inicial</Label>
              <Input 
                id="start-date" 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8 w-[140px]"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="end-date" className="text-xs text-muted-foreground">Data Final</Label>
              <Input 
                id="end-date" 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8 w-[140px]"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Daily Balance Evolution Chart */}
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-medium">Evolução do Saldo Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6 flex flex-col gap-1">
                <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Variação no Período</span>
                <div className={`text-3xl font-bold ${difference >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {difference >= 0 ? '+' : ''}{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(difference)}
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <span className={growthPercent >= 0 ? 'text-emerald-600 font-medium' : 'text-rose-600 font-medium'}>
                    {growthPercent >= 0 ? '+' : ''}{growthPercent.toFixed(2)}%
                  </span>
                  <span>em relação ao saldo inicial</span>
                </div>
              </div>

              <div className="h-[300px] w-full">
                {filteredData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={filteredData}
                      margin={{
                        top: 10,
                        right: 30,
                        left: 0,
                        bottom: 0,
                      }}
                    >
                      <defs>
                        <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="day" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                        dx={-10}
                        domain={['auto', 'auto']}
                      />
                      <Tooltip 
                        formatter={(value: number) => [new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value), 'Saldo Total']}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        labelFormatter={(label) => `Data: ${label}`}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="saldo" 
                        stroke="#0ea5e9" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorSaldo)" 
                        animationDuration={1500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Nenhum dado encontrado para o período selecionado.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle>Distribuição de Saldo por Conta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={accountDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={140}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {accountDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle>Insights Automáticos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topAccount && (
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg">
                    <h4 className="font-semibold text-emerald-800 mb-1">Maior Concentração</h4>
                    <div className="text-sm text-emerald-700">
                      A conta <strong>{topAccount.name}</strong> representa <strong>{topAccountPercent.toFixed(1)}%</strong> do saldo total disponível.
                    </div>
                  </div>
                )}
                
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-1">Tendência de Crescimento</h4>
                  <div className="text-sm text-blue-700">
                    O saldo total {difference >= 0 ? 'cresceu' : 'diminuiu'} <strong>{Math.abs(growthPercent).toFixed(1)}%</strong> no período selecionado.
                  </div>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg">
                  <h4 className="font-semibold text-amber-800 mb-1">Atenção Necessária</h4>
                  <div className="text-sm text-amber-700">
                    Mantenha seus registros atualizados diariamente para garantir a precisão dos gráficos.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
