"use client"

import { useMemo, useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, Wallet, PieChart as PieIcon, Activity } from "lucide-react"
import { getApiUrl } from "@/lib/api"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface DashboardProps {
  assets: any[]
}

const COLORS = ['#8b5cf6', '#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#6366f1'];

export function Dashboard({ assets }: DashboardProps) {
  const safeAssets = Array.isArray(assets) ? assets : []
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [usdPrice, setUsdPrice] = useState(5.80)

  useEffect(() => {
    const fetchData = async () => {
        try {
            const res = await fetch(getApiUrl("/api/price/BRL=X"))
            const data = await res.json()
            if (data.current_price) setUsdPrice(data.current_price)
        } catch(e) {}

        const newPrices: Record<string, number> = {}
        const promises = safeAssets.map(async (asset) => {
             if (newPrices[asset.symbol]) return;
             try {
                 const res = await fetch(getApiUrl(`/api/price/${asset.symbol}`))
                 const data = await res.json()
                 if (data.current_price) newPrices[asset.symbol] = data.current_price
             } catch (e) {}
        })
        await Promise.all(promises)
        setPrices(newPrices)
    }
    
    if (safeAssets.length > 0) fetchData()
  }, [safeAssets])

  const stats = useMemo(() => {
    let totalInvested = 0
    let totalCurrent = 0
    const distribution: Record<string, number> = {}

    safeAssets.forEach(item => {
      const currentPrice = prices[item.symbol] || item.price_paid
      const rate = item.currency === "USD" ? usdPrice : 1

      totalInvested += (item.quantity * item.price_paid) * rate
      
      const marketValue = (item.quantity * currentPrice) * rate
      totalCurrent += marketValue

      const type = item.asset_type || "Outros"
      distribution[type] = (distribution[type] || 0) + marketValue
    })

    const profit = totalCurrent - totalInvested
    const profitPercent = totalInvested > 0 ? (profit / totalInvested) * 100 : 0

    const chartData = Object.entries(distribution).map(([name, value]) => ({
        name: name.toUpperCase(),
        value: value
    })).filter(item => item.value > 0);

    return { totalInvested, totalCurrent, profit, profitPercent, chartData }
  }, [safeAssets, prices, usdPrice])

  const recentActivity = [...safeAssets].slice(-3).reverse();

  return (
    <div className="space-y-6">
      {/* 1. LINHA DE CARDS (TOPO) */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-zinc-900 border-zinc-800 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Total Investido</CardTitle>
            <Wallet className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">R$ {stats.totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-zinc-500">Custo de aquisição</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Patrimônio Real (Mercado)</CardTitle>
            <DollarSign className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400">R$ {stats.totalCurrent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-zinc-500">
               Investido: R$ {stats.totalInvested.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
               <span className={stats.profit >= 0 ? "text-green-500 ml-1" : "text-red-500 ml-1"}>
                 ({stats.profit >= 0 ? '+' : ''} R$ {Math.abs(stats.profit).toLocaleString('pt-BR', { maximumFractionDigits: 2 })})
               </span>
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Lucro / Prejuízo</CardTitle>
            <TrendingUp className={`h-4 w-4 ${stats.profit >= 0 ? 'text-green-500' : 'text-red-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              R$ {Math.abs(stats.profit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className={`text-xs ${stats.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {stats.profit >= 0 ? '+' : ''}{stats.profitPercent.toFixed(2)}% de retorno
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 2. LINHA DE GRÁFICOS E LISTAS */}
      <div className="grid gap-4 md:grid-cols-2">
         
         {/* ESQUERDA: GRÁFICO DONUT */}
         <Card className="bg-zinc-900 border-zinc-800 shadow-lg">
            <CardHeader>
                <CardTitle className="flex gap-2 items-center text-zinc-100 text-sm">
                    <PieIcon className="w-4 h-4 text-amber-500"/> Alocação Atual (Valor de Mercado)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[250px] w-full">
                    {stats.chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {stats.chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }} // <--- AQUI ESTÁ A CORREÇÃO MÁGICA
                                    formatter={(value: any) => `R$ ${Number(value).toLocaleString('pt-BR', {maximumFractionDigits: 0})}`}
                                />
                                <Legend verticalAlign="bottom" iconType="circle"/>
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-zinc-500 text-xs">
                            Sem dados para exibir.
                        </div>
                    )}
                </div>
            </CardContent>
         </Card>

         {/* DIREITA: ÚLTIMAS MOVIMENTAÇÕES */}
         <Card className="bg-zinc-900 border-zinc-800 shadow-lg">
            <CardHeader>
                <CardTitle className="flex gap-2 items-center text-zinc-100 text-sm">
                    <Activity className="w-4 h-4 text-amber-500"/> Últimas Movimentações
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {recentActivity.length > 0 ? recentActivity.map((item, idx) => {
                         const currentPrice = prices[item.symbol] || item.price_paid;
                         const totalVal = currentPrice * item.quantity;
                         return (
                            <div key={idx} className="flex items-center justify-between border-b border-zinc-800 pb-3 last:border-0 last:pb-0">
                                <div>
                                    <p className="text-sm font-bold text-white">{item.symbol}</p>
                                    <p className="text-xs text-zinc-500 uppercase">{item.asset_type}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-amber-400">
                                        R$ {totalVal.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                    </p>
                                    <p className="text-xs text-zinc-500">
                                        {item.quantity} cotas
                                    </p>
                                </div>
                            </div>
                         )
                    }) : (
                        <p className="text-zinc-500 text-sm">Nenhuma movimentação recente.</p>
                    )}
                </div>
            </CardContent>
         </Card>

      </div>
    </div>
  )
}