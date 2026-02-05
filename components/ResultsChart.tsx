"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SimulationPoint {
  date: string;
  portfolio_value: number;
  total_invested: number;
}

interface ResultsChartProps {
  data: SimulationPoint[];
  currency?: string; // NOVO: Aceita a moeda (opcional, padrão BRL)
}

export function ResultsChart({ data, currency = "BRL" }: ResultsChartProps) {
  // Define o símbolo com base na prop
  const symbol = currency === "USD" ? "$" : "R$";

  return (
    <Card className="w-full h-[500px] bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-zinc-100">Projeção de Patrimônio</CardTitle>
      </CardHeader>
      <CardContent className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="date" 
              stroke="#888" 
              fontSize={12}
              tickFormatter={(str) => {
                const date = new Date(str);
                return `${date.getMonth() + 1}/${date.getFullYear().toString().slice(2)}`;
              }}
            />
            {/* YAxis usa o símbolo correto (k para milhar) */}
            <YAxis 
              stroke="#888"
              fontSize={12}
              tickFormatter={(value) => `${symbol} ${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
              itemStyle={{ color: '#fff' }}
              labelStyle={{ color: '#a1a1aa' }}
              // Tooltip usa o símbolo correto
              formatter={(value: any) => [
                `${symbol} ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
                ''
              ]}
            />
            <Legend />
            <Line type="monotone" dataKey="total_invested" name="Total Investido" stroke="#71717a" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="portfolio_value" name="Patrimônio Acumulado" stroke="#fbbf24" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}