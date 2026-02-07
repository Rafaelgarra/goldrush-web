"use client"

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ResultsChartProps {
    data: any[]
    currency: string
}

export function ResultsChart({ data, currency }: ResultsChartProps) {
    const symbolPrefix = currency === 'USD' ? '$' : 'R$';

    return (
        <Card className="bg-zinc-900 border-zinc-800 col-span-2 lg:col-span-4 h-[400px]">
            <CardHeader>
                <CardTitle className="text-zinc-400 text-sm">Evolução Patrimonial</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px] w-full min-h-[320px]">
                {data && data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/> {/* Amber */}
                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3f3f46" stopOpacity={0.8}/> {/* Zinc */}
                                    <stop offset="95%" stopColor="#3f3f46" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis 
                                dataKey="month" 
                                hide 
                            />
                            <YAxis 
                                stroke="#52525b" 
                                tickFormatter={(value) => `${(Number(value)/1000).toFixed(0)}k`} 
                                style={{ fontSize: '12px' }}
                                width={40}
                            />
                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                                formatter={(value: any) => `${symbolPrefix} ${Number(value).toLocaleString('pt-BR', {maximumFractionDigits: 2})}`}
                                labelFormatter={(label) => `Data: ${label}`}
                            />
                            <Legend verticalAlign="top" height={36}/>
                            <Area 
                                type="monotone" 
                                dataKey="total" 
                                name="Patrimônio Total" 
                                stroke="#f59e0b" 
                                fillOpacity={1} 
                                fill="url(#colorTotal)" 
                                isAnimationActive={true}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="invested" 
                                name="Total Investido" 
                                stroke="#71717a" 
                                fillOpacity={1} 
                                fill="url(#colorInvested)" 
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-zinc-600 text-sm">
                        Sem dados para exibir o gráfico.
                    </div>
                )}
            </CardContent>
        </Card>
    )
}