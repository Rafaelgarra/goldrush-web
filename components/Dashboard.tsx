"use client"

import { useMemo, useState, useEffect } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { authFetch, getApiUrl } from "@/lib/api"
// Removido: import CurrencyTicker (ele vai para o layout agora)

const COLORS: Record<string, string> = { "FII": "#fbbf24", "Ação": "#3b82f6", "ETF": "#8b5cf6", "Cripto": "#10b981", "Caixa": "#22c55e", "Outros": "#71717a" }

interface DashboardProps { assets: any[] }

export function Dashboard({ assets }: DashboardProps) {
  const [usdPrice, setUsdPrice] = useState<number>(0)
  const [marketPrices, setMarketPrices] = useState<Record<string, number>>({})

  useEffect(() => {
    fetchDollar()
    if (assets.length > 0) updateMarketPrices()
  }, [assets])

  async function fetchDollar() {
    try {
      const res = await authFetch(getApiUrl('/api/price/BRL=X'))
      const data = await res.json()
      if (data.current_price) setUsdPrice(data.current_price)
    } catch (e) { setUsdPrice(5.80) }
  }

  const updateMarketPrices = async () => {
    const symbols = [...new Set(assets.map(a => a.symbol))]
    const newPrices: Record<string, number> = {}
    
    for (const sym of symbols) {
      if (sym === 'BRL' || sym === 'USD' || assets.find(a => a.symbol === sym)?.asset_type === 'Caixa') {
        newPrices[sym] = 1; continue
      }
      try {
        const res = await authFetch(getApiUrl(`/api/price/${sym}`))
        const data = await res.json()
        if (data.current_price) newPrices[sym] = data.current_price
      } catch (e) { }
    }
    setMarketPrices(prev => ({ ...prev, ...newPrices }))
  }

  const stats = useMemo(() => {
    const rate = usdPrice || 0
    let totalInvested = 0
    let totalCurrent = 0

    const distribution = assets.reduce((acc: any, item) => {
      const type = item.asset_type || "Outros"
      const currencyMultiplier = item.currency === "USD" ? rate : 1
      
      const itemInvested = (item.quantity * item.price_paid) * currencyMultiplier
      totalInvested += itemInvested

      const currentPrice = marketPrices[item.symbol] || item.price_paid
      const itemCurrent = (item.quantity * currentPrice) * currencyMultiplier
      totalCurrent += itemCurrent

      if (!acc[type]) acc[type] = { name: type, value: 0, invested: 0, profit: 0 }
      acc[type].value += itemCurrent
      acc[type].invested += itemInvested
      acc[type].profit += (itemCurrent - itemInvested)

      return acc
    }, {})

    const chartData = Object.values(distribution)
    return { totalInvested, totalCurrent, chartData }
  }, [assets, usdPrice, marketPrices])

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const profit = data.profit
      
      let colorClass = "text-zinc-400"
      let label = "Neutro"
      let sign = ""

      if (profit > 0.01) {
          colorClass = "text-green-600"
          label = "Lucro"
          sign = "+"
      } else if (profit < -0.01) {
          colorClass = "text-red-600"
          label = "Preju"
      }

      return (
        <div className="bg-white border border-zinc-200 p-3 rounded-lg shadow-lg">
          <p className="font-bold text-zinc-900 mb-1">{data.name}</p>
          <div className="text-sm text-zinc-600">
            Total: <span className="font-bold">R$ {data.value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="text-xs text-zinc-500 mt-1 pt-1 border-t border-zinc-100">
            Investido: R$ {data.invested.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
          </div>
          <div className={`text-xs font-bold ${colorClass}`}>
            {label}: {sign} R$ {profit.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6 pt-4"> 
      {/* Removido o Header daqui. O pt-4 dá um respiro se necessário */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-zinc-900 border-zinc-800 md:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-zinc-400 text-sm flex items-center gap-2">Patrimônio Real (Mercado) {usdPrice === 0 && <span className="text-xs text-amber-500 animate-pulse">Calculando...</span>}</CardTitle></CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-white">R$ {stats.totalCurrent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <p className="text-zinc-500 text-sm mt-1">
              Investido: R$ {stats.totalInvested.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} 
              
              {(() => {
                  const profit = stats.totalCurrent - stats.totalInvested;
                  let color = "text-white";
                  let sign = "";
                  
                  if (profit > 0.01) { color = "text-green-500"; sign = "+"; }
                  else if (profit < -0.01) { color = "text-red-500"; }
                  
                  return (
                      <span className={`ml-2 font-bold ${color}`}>
                        ({sign} R$ {profit.toLocaleString('pt-BR', { maximumFractionDigits: 2 })})
                      </span>
                  )
              })()}

            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2"><CardTitle className="text-zinc-400 text-sm">Total de Ativos</CardTitle></CardHeader>
          <CardContent><div className="text-4xl font-bold text-amber-400">{assets.length}</div><p className="text-zinc-500 text-sm mt-1">posições abertas</p></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-zinc-900 border-zinc-800 h-[400px]">
          <CardHeader><CardTitle className="text-white">Alocação Atual (Valor de Mercado)</CardTitle></CardHeader>
          <CardContent className="h-[320px]">
            {stats.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none">
                    {stats.chartData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name] || COLORS["Outros"]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                </PieChart>
              </ResponsiveContainer>
            ) : ( <div className="flex h-full items-center justify-center text-zinc-500">Carteira vazia</div> )}
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 h-[400px] overflow-auto">
          <CardHeader><CardTitle className="text-white">Últimas Movimentações</CardTitle></CardHeader>
          <CardContent>
             <div className="space-y-4">
                {assets.slice().reverse().slice(0, 5).map((asset, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <div><div className="font-bold text-white">{asset.symbol}</div><div className="text-xs text-zinc-500">{new Date(asset.purchase_date).toLocaleDateString()}</div></div>
                    <div className="text-right">
                      <div className="font-bold text-amber-400">{asset.currency === 'USD' ? '$' : 'R$'} {(asset.quantity * asset.price_paid).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                      <div className="text-xs text-zinc-400">{asset.asset_type}</div>
                    </div>
                  </div>
                ))}
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}