"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ResultsChart } from "./ResultsChart"
import { Loader2 } from "lucide-react"
import { authFetch, getApiUrl } from "@/lib/api"

export function Simulator() {
  const [symbol, setSymbol] = useState("JEPQ")
  const [initial, setInitial] = useState("10000")
  const [monthly, setMonthly] = useState("500")
  const [startDate, setStartDate] = useState("2023-01-01")
  const [currency, setCurrency] = useState("USD")
  
  const [currentPriceInfo, setCurrentPriceInfo] = useState<number | null>(null)
  const [fetchingPrice, setFetchingPrice] = useState(false)

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleSymbolBlur = async () => {
    if(!symbol) return
    setFetchingPrice(true)
    try {
        const res = await authFetch(getApiUrl(`/api/price/${symbol}`))
        const data = await res.json()
        if (data.current_price) setCurrentPriceInfo(data.current_price)
    } catch(e) { setCurrentPriceInfo(null) } 
    finally { setFetchingPrice(false) }
  }

  const handleSimulate = async () => {
    setLoading(true)
    try {
      const response = await authFetch(getApiUrl('/api/simulation'), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: symbol,
          initial_investment: Number(initial),
          monthly_contribution: Number(monthly),
          start_date: startDate,
          reinvest_dividends: true,
          currency: currency
        }),
      })
      const data = await response.json()
      setResult(data)
    } catch (error) { console.error(error); alert("Erro ao conectar.") } finally { setLoading(false) }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="bg-zinc-900 border-zinc-800 h-fit">
        <CardHeader><CardTitle className="text-zinc-100">Parâmetros</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
             <div className="w-2/3 space-y-2">
                <Label className="text-zinc-200">Ativo</Label>
                <div className="relative">
                    <Input 
                        value={symbol} 
                        onChange={(e) => setSymbol(e.target.value)} 
                        onBlur={handleSymbolBlur}
                        className="bg-zinc-950 border-zinc-800 text-zinc-100 uppercase" 
                    />
                    {fetchingPrice && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-zinc-500" />}
                </div>
                {/* Mostra preço atual abaixo do input */}
                {currentPriceInfo && !fetchingPrice && (
                    <p className="text-xs text-green-400 mt-1">
                        Preço Atual: {currency === 'USD' ? '$' : 'R$'} {currentPriceInfo.toFixed(2)}
                    </p>
                )}
             </div>
             <div className="w-1/3 space-y-2">
                <Label className="text-zinc-200">Moeda</Label>
                <Select onValueChange={setCurrency} defaultValue={currency}>
                    <SelectTrigger className="bg-zinc-950 border-zinc-800 text-zinc-100"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                        <SelectItem value="BRL">R$</SelectItem><SelectItem value="USD">$</SelectItem>
                    </SelectContent>
                </Select>
             </div>
          </div>
          <div className="space-y-2"><Label className="text-zinc-200">Aporte Inicial</Label><Input type="number" value={initial} onChange={(e) => setInitial(e.target.value)} className="bg-zinc-950 border-zinc-800 text-zinc-100" /></div>
          <div className="space-y-2"><Label className="text-zinc-200">Aporte Mensal</Label><Input type="number" value={monthly} onChange={(e) => setMonthly(e.target.value)} className="bg-zinc-950 border-zinc-800 text-zinc-100" /></div>
          <div className="space-y-2"><Label className="text-zinc-200">Data de Início</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-zinc-950 border-zinc-800 text-zinc-100 [color-scheme:dark]" /></div>
          <Button onClick={handleSimulate} disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold mt-4">{loading ? "..." : "Simular 🚀"}</Button>
        </CardContent>
      </Card>

      <div className="lg:col-span-2 space-y-6">
        {result ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-2"><CardTitle className="text-xs text-zinc-400">Investido</CardTitle></CardHeader>
                <CardContent><div className="text-xl font-bold text-zinc-100">{currency === 'USD' ? '$' : 'R$'} {result.total_invested.toLocaleString('pt-BR')}</div></CardContent>
              </Card>
              
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-2"><CardTitle className="text-xs text-zinc-400">Patrimônio</CardTitle></CardHeader>
                <CardContent><div className="text-xl font-bold text-amber-400">{currency === 'USD' ? '$' : 'R$'} {result.final_portfolio_value.toLocaleString('pt-BR')}</div></CardContent>
              </Card>

              {/* CARD NOVO: PREÇO DA COTA */}
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-2"><CardTitle className="text-xs text-zinc-400">Valor da Cota</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-white">
                    {currency === 'USD' ? '$' : 'R$'} {result.final_unit_price.toLocaleString('pt-BR')}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-2"><CardTitle className="text-xs text-zinc-400">Qtd Cotas</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-blue-400">
                    {result.final_accumulated_shares.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                  </div>
                </CardContent>
              </Card>
            </div>
            <ResultsChart data={result.history} currency={currency} />
          </>
        ) : ( <div className="h-full flex items-center justify-center text-zinc-500 border-2 border-dashed border-zinc-800 rounded-xl p-12">Simule seus ganhos em Dólar ou Real!</div> )}
      </div>
    </div>
  )
}