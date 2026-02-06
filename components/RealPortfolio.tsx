"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle, Wallet, RefreshCw, ArrowUp, ArrowDown } from "lucide-react"
import { getApiUrl, authFetch } from "@/lib/api"

interface Asset {
  id: number
  symbol: string
  quantity: number
  price_paid: number
  asset_type: string
  currency: string
}

interface RealPortfolioProps {
    onUpdate?: () => void;
}

export function RealPortfolio({ onUpdate }: RealPortfolioProps) {
  const [assets, setAssets] = useState<Asset[]>([])
  const [prices, setPrices] = useState<Record<string, number>>({}) // Guarda preços atuais
  const [loading, setLoading] = useState(false)
  const [loadingPrices, setLoadingPrices] = useState(false)
  
  // Estado do Formulário
  const [newAsset, setNewAsset] = useState({
    symbol: "",
    quantity: "",
    price_paid: "",
    asset_type: "stock",
    currency: "BRL"
  })

  // 1. Carrega os ativos do Banco de Dados
  const loadAssets = async () => {
      try {
          const res = await authFetch(getApiUrl("/api/portfolio"))
          if (res.ok) {
              const data = await res.json()
              if(Array.isArray(data)) {
                  setAssets(data)
                  // Assim que carregar os ativos, busca os preços atuais
                  updatePrices(data) 
              }
          }
      } catch (error) {
          console.error("Erro ao carregar carteira:", error)
      }
  }

  // 2. Busca o preço atual de cada ativo na API (/api/price)
  const updatePrices = async (currentAssets: Asset[]) => {
      setLoadingPrices(true)
      const newPrices: Record<string, number> = {}
      
      // Cria uma lista de promessas para buscar tudo em paralelo
      const promises = currentAssets.map(async (asset) => {
          try {
            // Se já pegamos o preço desse ticker nessa rodada, pula
            if (newPrices[asset.symbol]) return;

            const res = await fetch(getApiUrl(`/api/price/${asset.symbol}`))
            const data = await res.json()
            if (data.current_price) {
                newPrices[asset.symbol] = data.current_price
            }
          } catch (e) {
              console.error(`Erro preço ${asset.symbol}`, e)
          }
      })

      await Promise.all(promises)
      setPrices(prev => ({ ...prev, ...newPrices }))
      setLoadingPrices(false)
  }

  useEffect(() => { loadAssets() }, [])

  const handleAddAsset = async () => {
    if (!newAsset.symbol || !newAsset.quantity || !newAsset.price_paid) {
        alert("Preencha todos os campos!")
        return
    }

    setLoading(true)
    try {
      const payload = {
          symbol: newAsset.symbol.toUpperCase(),
          quantity: parseFloat(newAsset.quantity),
          price_paid: parseFloat(newAsset.price_paid),
          asset_type: newAsset.asset_type,
          currency: newAsset.currency
      }

      const res = await authFetch(getApiUrl("/api/portfolio"), {
          method: "POST",
          body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error("Erro ao salvar")

      setNewAsset({ ...newAsset, symbol: "", quantity: "", price_paid: "" })
      await loadAssets() 
      if (onUpdate) onUpdate() 
      
    } catch (error: any) {
        alert("Erro: " + error.message)
    } finally {
        setLoading(false)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-12">
      
      {/* --- FORMULÁRIO (ESQUERDA) --- */}
      <Card className="md:col-span-4 bg-zinc-900 border-zinc-800 h-fit">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-400">
             <PlusCircle className="w-5 h-5" /> Adicionar Ativo
          </CardTitle>
          <CardDescription className="text-zinc-500">
            Registre suas compras.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <div className="space-y-2">
            <Label className="text-zinc-300">Ticker / Símbolo</Label>
            {/* CORREÇÃO VISUAL: text-white e placeholder mais claro */}
            <Input 
                placeholder="Ex: PETR4, BTC-USD" 
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 uppercase"
                value={newAsset.symbol}
                onChange={e => setNewAsset({...newAsset, symbol: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label className="text-zinc-300">Quantidade</Label>
                <Input 
                    type="number" 
                    placeholder="0.00" 
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                    value={newAsset.quantity}
                    onChange={e => setNewAsset({...newAsset, quantity: e.target.value})}
                />
             </div>
             <div className="space-y-2">
                <Label className="text-zinc-300">Preço Pago</Label>
                <Input 
                    type="number" 
                    placeholder="0.00" 
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                    value={newAsset.price_paid}
                    onChange={e => setNewAsset({...newAsset, price_paid: e.target.value})}
                />
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label className="text-zinc-300">Tipo</Label>
                <Select 
                    value={newAsset.asset_type} 
                    onValueChange={v => setNewAsset({...newAsset, asset_type: v})}
                >
                    {/* CORREÇÃO VISUAL: SelectTrigger com texto branco */}
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                        <SelectItem value="stock">Ação (BR)</SelectItem>
                        <SelectItem value="reit">FII</SelectItem>
                        <SelectItem value="stock_us">Ação (EUA)</SelectItem>
                        <SelectItem value="crypto">Cripto</SelectItem>
                        <SelectItem value="etf">ETF</SelectItem>
                    </SelectContent>
                </Select>
             </div>
             <div className="space-y-2">
                <Label className="text-zinc-300">Moeda</Label>
                <Select 
                    value={newAsset.currency} 
                    onValueChange={v => setNewAsset({...newAsset, currency: v})}
                >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                        <SelectItem value="BRL">Real (R$)</SelectItem>
                        <SelectItem value="USD">Dólar ($)</SelectItem>
                    </SelectContent>
                </Select>
             </div>
          </div>

          <Button 
            className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold mt-4"
            onClick={handleAddAsset}
            disabled={loading}
          >
            {loading ? "Salvando..." : "Registrar Compra"}
          </Button>

        </CardContent>
      </Card>

      {/* --- TABELA (DIREITA) --- */}
      <Card className="md:col-span-8 bg-zinc-900 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-zinc-100">
                <Wallet className="w-5 h-5 text-amber-500" /> Sua Carteira
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => updatePrices(assets)} disabled={loadingPrices}>
                <RefreshCw className={`w-4 h-4 text-zinc-400 ${loadingPrices ? 'animate-spin' : ''}`} />
            </Button>
        </CardHeader>
        <CardContent>
            {assets.length === 0 ? (
                <div className="text-center py-10 text-zinc-500">
                    Nenhum ativo registrado. Adicione o primeiro ao lado!
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow className="border-zinc-800 hover:bg-transparent">
                            <TableHead className="text-zinc-400">Ativo</TableHead>
                            <TableHead className="text-zinc-400">Qtd</TableHead>
                            <TableHead className="text-zinc-400">Médio</TableHead>
                            <TableHead className="text-zinc-400">Preço Atual</TableHead>
                            <TableHead className="text-zinc-400">Saldo Total</TableHead>
                            <TableHead className="text-zinc-400">Var %</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {assets.map((asset) => {
                            const currentPrice = prices[asset.symbol] || 0
                            const totalValue = currentPrice * asset.quantity
                            const totalInvested = asset.price_paid * asset.quantity
                            
                            // Calcula variação percentual
                            const variation = currentPrice > 0 
                                ? ((currentPrice - asset.price_paid) / asset.price_paid) * 100 
                                : 0
                            
                            const isPositive = variation >= 0

                            return (
                                <TableRow key={asset.id} className="border-zinc-800 hover:bg-zinc-800/50">
                                    <TableCell className="font-bold text-zinc-200">
                                        {asset.symbol}
                                        <span className="block text-xs text-zinc-500 font-normal uppercase">{asset.asset_type}</span>
                                    </TableCell>
                                    <TableCell className="text-zinc-300">{asset.quantity}</TableCell>
                                    
                                    {/* Preço Médio */}
                                    <TableCell className="text-zinc-400">
                                        {asset.currency === "USD" ? "$ " : "R$ "} 
                                        {asset.price_paid.toFixed(2)}
                                    </TableCell>

                                    {/* Preço Atual (Live) */}
                                    <TableCell className="text-zinc-200 font-medium">
                                        {currentPrice > 0 ? (
                                           <span>
                                             {asset.currency === "USD" ? "$ " : "R$ "}
                                             {currentPrice.toFixed(2)}
                                           </span>
                                        ) : (
                                            <span className="text-zinc-600 text-xs">Carregando...</span>
                                        )}
                                    </TableCell>

                                    {/* Saldo Total */}
                                    <TableCell className="text-amber-400 font-bold">
                                        {currentPrice > 0 
                                            ? (asset.currency === "USD" ? "$ " : "R$ ") + totalValue.toFixed(2)
                                            : "..."
                                        }
                                    </TableCell>

                                    {/* Variação % */}
                                    <TableCell>
                                        {currentPrice > 0 && (
                                            <div className={`flex items-center gap-1 text-xs font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                                {isPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                                {Math.abs(variation).toFixed(1)}%
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            )}
        </CardContent>
      </Card>
    </div>
  )
}