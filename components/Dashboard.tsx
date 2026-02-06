"use client"

import { useMemo, useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, Wallet, PieChart, BarChart3 } from "lucide-react"
import { getApiUrl } from "@/lib/api"
import { Separator } from "@/components/ui/separator"

interface DashboardProps {
  assets: any[]
}

export function Dashboard({ assets }: DashboardProps) {
  const safeAssets = Array.isArray(assets) ? assets : []
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [usdPrice, setUsdPrice] = useState(5.80) // Valor padrão caso API falhe

  // 1. Busca cotação do Dólar e Preços dos Ativos
  useEffect(() => {
    const fetchData = async () => {
        // Dólar
        try {
            const res = await fetch(getApiUrl("/api/price/BRL=X"))
            const data = await res.json()
            if (data.current_price) setUsdPrice(data.current_price)
        } catch(e) {}

        // Preços dos Ativos (Para os Cards funcionarem)
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

  // 2. Cálculos Poderosos
  const stats = useMemo(() => {
    let totalInvested = 0
    let totalCurrent = 0
    
    const distribution: Record<string, number> = {}

    safeAssets.forEach(item => {
      // Pega preço atual (ou usa o preço pago se a API falhar, pra não zerar tudo)
      const currentPrice = prices[item.symbol] || item.price_paid
      const rate = item.currency === "USD" ? usdPrice : 1

      // Total Investido (Custo)
      totalInvested += (item.quantity * item.price_paid) * rate
      
      // Total Atual (Valor de Mercado)
      const marketValue = (item.quantity * currentPrice) * rate
      totalCurrent += marketValue

      // Distribuição por Tipo
      const type = item.asset_type || "Outros"
      distribution[type] = (distribution[type] || 0) + marketValue
    })

    const profit = totalCurrent - totalInvested
    const profitPercent = totalInvested > 0 ? (profit / totalInvested) * 100 : 0

    return { totalInvested, totalCurrent, profit, profitPercent, distribution }
  }, [safeAssets, prices, usdPrice])

  return (
    <div className="space-y-6">
      {/* CARDS DE RESUMO */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Total Investido</CardTitle>
            <Wallet className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">R$ {stats.totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-zinc-500">Custo de aquisição</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Patrimônio Atual</CardTitle>
            <DollarSign className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400">R$ {stats.totalCurrent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-zinc-500">Valor de mercado hoje</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
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

      {/* DETALHES VISUAIS */}
      <div className="grid gap-4 md:grid-cols-2">
         <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle className="flex gap-2 items-center text-zinc-100"><PieChart className="w-4 h-4"/> Alocação</CardTitle></CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {Object.entries(stats.distribution).map(([type, value]) => (
                        <div key={type} className="flex items-center justify-between">
                            <span className="text-sm uppercase text-zinc-400 font-bold">{type}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-white">R$ {value.toLocaleString('pt-BR', {maximumFractionDigits: 0})}</span>
                                <div className="h-2 w-20 bg-zinc-800 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-amber-500" 
                                        style={{ width: `${(value / stats.totalCurrent) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                    {Object.keys(stats.distribution).length === 0 && <p className="text-zinc-500 text-sm">Sem dados.</p>}
                </div>
            </CardContent>
         </Card>
      </div>
    </div>
  )
}