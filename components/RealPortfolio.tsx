"use client"

import { useState, useEffect, useMemo } from "react"
import { Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { TrendingUp, TrendingDown } from "lucide-react"
import { getApiUrl } from "@/lib/api"

interface Asset { id: number; symbol: string; quantity: number; price_paid: number; purchase_date: string; asset_type: string; currency: string; }
interface RealPortfolioProps { onUpdate?: () => void }


export function RealPortfolio({ onUpdate }: RealPortfolioProps) {
  const [assets, setAssets] = useState<Asset[]>([])
  const [marketPrices, setMarketPrices] = useState<Record<string, number>>({})
  const [usdPrice, setUsdPrice] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [fetchingPrice, setFetchingPrice] = useState(false)
  
  // Form States
  const [newSymbol, setNewSymbol] = useState("")
  const [newQty, setNewQty] = useState("")
  const [newPrice, setNewPrice] = useState("")
  const [newDate, setNewDate] = useState("")
  const [newType, setNewType] = useState("Ação")
  const [newCurrency, setNewCurrency] = useState("BRL")
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => { 
    fetchPortfolio()
    fetchDollarRate()
  }, [])

  useEffect(() => {
    if (assets.length > 0) {
      updateMarketPrices()
    }
  }, [assets])

  const fetchDollarRate = async () => {
    try {
      const res = await fetch(getApiUrl('/api/price/BRL=X'))
      const data = await res.json()
      if (data.current_price) setUsdPrice(data.current_price)
    } catch (e) { }
  }

  const fetchPortfolio = async () => {
    try {
      const res = await fetch(getApiUrl('/api/portfolio'))
      const data = await res.json()
      setAssets(data)
    } catch (error) { }
  }

  const updateMarketPrices = async () => {
    const symbols = [...new Set(assets.map(a => a.symbol))]
    const newPrices: Record<string, number> = {}

    for (const sym of symbols) {
      if (sym === 'BRL' || sym === 'USD' || assets.find(a => a.symbol === sym)?.asset_type === 'Caixa') {
        newPrices[sym] = 1
        continue
      }
      try {
        const res = await fetch(getApiUrl(`/api/price/${sym}`))
        const data = await res.json()
        if (data.current_price) newPrices[sym] = data.current_price
      } catch (e) { console.error(`Erro preço ${sym}`) }
    }
    setMarketPrices(prev => ({ ...prev, ...newPrices }))
  }

  const handleSymbolBlur = async () => {
    if (!newSymbol || newSymbol.length < 3) return
    setFetchingPrice(true)
    try {
      let ticker = newSymbol.toUpperCase()
      const res = await fetch(getApiUrl(`/api/price/${ticker}`))
      const data = await res.json()
      if (data.current_price) setNewPrice(data.current_price.toFixed(2))
    } catch (e) { } finally { setFetchingPrice(false) }
  }

  const handleDelete = async (id: number) => {
    try { await fetch(getApiUrl(`/api/portfolio/${id}`), { method: "DELETE" }); fetchPortfolio(); if(onUpdate) onUpdate() } catch (e) { alert("Erro") }
  }

  const handleSave = async () => {
    if (!newSymbol || !newQty || !newPrice || !newDate) { alert("Preencha tudo!"); return }
    setLoading(true)
    try {
      await fetch(getApiUrl('/api/portfolio/add'), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: newSymbol.toUpperCase(), quantity: Number(newQty), price_paid: Number(newPrice), purchase_date: newDate, asset_type: newType, currency: newCurrency }),
      })
      setIsOpen(false); setNewSymbol(""); setNewQty(""); setNewPrice(""); setNewDate(""); fetchPortfolio(); if (onUpdate) onUpdate()
    } catch (e) { alert("Erro") } finally { setLoading(false) }
  }

  const totals = useMemo(() => {
    const rate = usdPrice || 5.80
    
    let invested = 0
    let current = 0

    assets.forEach(item => {
        const currencyMultiplier = item.currency === "USD" ? rate : 1
        invested += (item.quantity * item.price_paid) * currencyMultiplier
        const marketPrice = marketPrices[item.symbol] || item.price_paid
        current += (item.quantity * marketPrice) * currencyMultiplier
    })

    const profit = current - invested
    
    // Lógica Tri-State para o Card Principal
    let profitColor = "text-white"
    if (profit > 0.01) profitColor = "text-green-500"
    else if (profit < -0.01) profitColor = "text-red-500"

    return { invested, current, profit, profitColor }
  }, [assets, usdPrice, marketPrices])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end gap-4">
        
        <Card className="bg-zinc-900 border-zinc-800 min-w-[200px]">
          <CardHeader className="pb-2"><CardTitle className="text-zinc-400 text-xs font-medium">Valor Investido</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-zinc-300">R$ {totals.invested.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div></CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 min-w-[200px]">
          <CardHeader className="pb-2"><CardTitle className="text-zinc-400 text-xs font-medium">Valor Atual de Mercado</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">R$ {totals.current.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className={`text-sm mt-1 flex items-center gap-1 ${totals.profitColor}`}>
                {totals.profit > 0.01 && <TrendingUp className="h-3 w-3"/>}
                {totals.profit < -0.01 && <TrendingDown className="h-3 w-3"/>}
                {totals.profit > 0.01 ? '+' : ''} R$ {totals.profit.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild><Button className="bg-green-600 hover:bg-green-700 font-bold text-white h-12 px-6 mb-[1px]">+ Nova Compra</Button></DialogTrigger>
          <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
             <DialogHeader><DialogTitle>Registrar Ativo</DialogTitle></DialogHeader>
             <div className="space-y-4 py-4">
               <div className="flex gap-4">
                 <div className="w-2/3 space-y-2"><Label>Tipo</Label><Select onValueChange={setNewType} defaultValue={newType}><SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-100"><SelectValue/></SelectTrigger><SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100"><SelectItem value="Ação">Ação</SelectItem><SelectItem value="FII">FII</SelectItem><SelectItem value="ETF">ETF</SelectItem><SelectItem value="Cripto">Cripto</SelectItem><SelectItem value="Caixa">Caixa</SelectItem></SelectContent></Select></div>
                 <div className="w-1/3 space-y-2"><Label>Moeda</Label><Select onValueChange={setNewCurrency} defaultValue={newCurrency}><SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-100"><SelectValue/></SelectTrigger><SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100"><SelectItem value="BRL">R$</SelectItem><SelectItem value="USD">$</SelectItem></SelectContent></Select></div>
               </div>
               <div className="space-y-2">
                 <Label>Símbolo</Label>
                 <div className="relative">
                    <Input value={newSymbol} onChange={e => setNewSymbol(e.target.value)} onBlur={handleSymbolBlur} className="bg-zinc-900 border-zinc-700 text-zinc-100 uppercase" placeholder="EX: PETR4.SA" />
                    {fetchingPrice && <Loader2 className="absolute right-3 top-2.5 h-5 w-5 animate-spin text-zinc-500" />}
                 </div>
               </div>
               <div className="flex gap-4">
                 <div className="w-1/2 space-y-2"><Label>Qtd</Label><Input type="number" value={newQty} onChange={e => setNewQty(e.target.value)} className="bg-zinc-900 border-zinc-700 text-zinc-100" /></div>
                 <div className="w-1/2 space-y-2"><Label>Preço Pago</Label><Input type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} className="bg-zinc-900 border-zinc-700 text-zinc-100" /></div>
               </div>
               <div className="space-y-2"><Label>Data</Label><Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="bg-zinc-900 border-zinc-700 text-zinc-100 [color-scheme:dark]" /></div>
               <Button onClick={handleSave} disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold mt-2">{loading ? "Salvando..." : "Salvar"}</Button>
             </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-zinc-900">
              <TableHead className="text-zinc-400">Ativo</TableHead>
              <TableHead className="text-zinc-400">Qtd</TableHead>
              <TableHead className="text-zinc-400">Preço Médio</TableHead>
              <TableHead className="text-zinc-400">Preço Atual</TableHead>
              <TableHead className="text-zinc-400">Lucro/Prej</TableHead>
              <TableHead className="text-zinc-400 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets.map((asset) => {
                const currentPrice = marketPrices[asset.symbol] || asset.price_paid
                const totalPaid = asset.quantity * asset.price_paid
                const totalCurrent = asset.quantity * currentPrice
                const profit = totalCurrent - totalPaid
                
                // LÓGICA DE COR TRI-STATE (Verde, Vermelho ou Branco)
                let profitColor = "text-white"
                let profitSign = ""
                
                if (profit > 0.01) {
                    profitColor = "text-green-500"
                    profitSign = "+"
                } else if (profit < -0.01) {
                    profitColor = "text-red-500"
                }

                const symbolSign = asset.currency === 'USD' ? '$' : 'R$'

                return (
                  <TableRow key={asset.id} className="border-zinc-800 hover:bg-zinc-800/50">
                    <TableCell>
                        <div className="font-bold text-zinc-100">{asset.symbol}</div>
                        <div className="text-xs text-zinc-500 uppercase">{asset.asset_type}</div>
                    </TableCell>
                    <TableCell className="text-zinc-300">{asset.quantity}</TableCell>
                    <TableCell className="text-zinc-300">{symbolSign} {asset.price_paid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-zinc-300">{symbolSign} {currentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className={`font-bold ${profitColor}`}>{profitSign} {symbolSign} {profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right"><AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="hover:bg-red-900/20 hover:text-red-500 text-zinc-500"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger><AlertDialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100"><AlertDialogHeader><AlertDialogTitle>Excluir?</AlertDialogTitle><AlertDialogDescription className="text-zinc-400">Irreversível.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="bg-zinc-900 border-zinc-700 text-white">Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(asset.id)} className="bg-red-600 hover:bg-red-700 text-white">Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></TableCell>
                  </TableRow>
                )
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}