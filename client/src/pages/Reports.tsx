import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useFinancial } from "@/contexts/FinancialContext";
import { parse, format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Reports() {
  const { financialData } = useFinancial();

  // Processar dados reais para os gráficos
  const chartData = financialData
    .map(day => {
      try {
        // Tentar converter data DD/MM/YYYY para objeto Date
        const dateObj = parse(day.date, 'dd/MM/yyyy', new Date());
        return {
          rawDate: dateObj,
          name: format(dateObj, 'dd/MM', { locale: ptBR }),
          entradas: day.totals.entradas,
          saidas: day.totals.saidas,
          saldo: day.totals.saldo_atual
        };
      } catch (e) {
        return null;
      }
    })
    .filter(item => item !== null)
    .sort((a, b) => a!.rawDate.getTime() - b!.rawDate.getTime()); // Ordenar cronologicamente

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-primary tracking-tight">Relatórios Financeiros</h2>
          <p className="text-muted-foreground">Análise detalhada de movimentações e saldos baseada nos seus registros.</p>
        </div>
        <div className="flex justify-end print:hidden">
          <Button onClick={() => window.print()} variant="outline" className="gap-2">
            <Printer className="h-4 w-4" />
            Imprimir Relatório
          </Button>
        </div>

        {chartData.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              Nenhum dado financeiro registrado ainda para gerar relatórios.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Evolução do Saldo Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis 
                        tickFormatter={(value) => 
                          new Intl.NumberFormat('pt-BR', { notation: "compact", compactDisplay: "short" }).format(value)
                        }
                      />
                      <Tooltip 
                        formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                      />
                      <Line type="monotone" dataKey="saldo" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 4 }} name="Saldo Total" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Entradas vs Saídas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis 
                        tickFormatter={(value) => 
                          new Intl.NumberFormat('pt-BR', { notation: "compact", compactDisplay: "short" }).format(value)
                        }
                      />
                      <Tooltip 
                        formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                      />
                      <Legend />
                      <Bar dataKey="entradas" fill="#10b981" name="Entradas" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="saidas" fill="#f43f5e" name="Saídas" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
