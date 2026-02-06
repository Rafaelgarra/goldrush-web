"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle, Wallet, RefreshCw, ArrowUp, ArrowDown, Trash2, Pencil, X } from "lucide-react" // <--- Adicionei Pencil e X
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
  const [prices, setPrices] = useState<Record<string, number>>({}) 
  const [loading, setLoading] = useState(false)
  const [loadingPrices, setLoadingPrices] = useState(false)
  const [searchingTicker, setSearchingTicker] = useState(false)
  
  // --- NOVO ESTADO: ID DO ITEM SENDO EDITADO ---
  const [editingId, setEditingId] = useState<number | null>(null)

  const [newAsset, setNewAsset] = useState({
    symbol: "",
    quantity: "",
    price_paid: "",
    asset_type: "stock",
    currency: "BRL"
  })

  // --- BUSCAR PREÇO AO DIGITAR (TAB) ---
  const handleTickerBlur = async () => {
      const ticker = newAsset.symbol.trim();
      if (!ticker) return;

      setSearchingTicker(true);
      try {
          const res = await fetch(getApiUrl(`/api/price/${ticker}`));
          const data = await res.json();

          if (data.current_price) {
              setNewAsset(prev => ({
                  ...prev,
                  // Só preenche o preço se estiver criando, ou se o usuário quiser atualizar
                  price_paid: editingId ? prev.price_paid : data.current_price.toString(),
                  symbol: data.symbol 
              }));
          }
      } catch (error) {
          console.error("Erro ao buscar ticker", error);
      } finally {
          setSearchingTicker(false);
      }
  };

  const loadAssets = async () => {
      try {
          const res = await authFetch(getApiUrl("/api/portfolio"))
          if (res.ok) {
              const data = await res.json()
              if(Array.isArray(data)) {
                  setAssets(data)
                  updatePrices(data) 
              }
          }
      } catch (error) {
          console.error("Erro carteira:", error)
      }
  }

  const updatePrices = async (currentAssets: Asset[]) => {
      setLoadingPrices(true)
      const newPrices: Record<string, number> = {}
      
      const promises = currentAssets.map(async (asset) => {
          try {
            if (newPrices[asset.symbol]) return;
            const res = await fetch(getApiUrl(`/api/price/${asset.symbol}`))
            const data = await res.json()
            if (data.current_price) {
                newPrices[data.symbol] = data.current_price
                newPrices[asset.symbol] = data.current_price 
            }
          } catch (e) { console.error(e) }
      })

      await Promise.all(promises)
      setPrices(prev => ({ ...prev, ...newPrices }))
      setLoadingPrices(false)
  }

  useEffect(() => { loadAssets() }, [])

  // --- FUNÇÃO INTELIGENTE: SALVAR OU EDITAR ---
  const handleSaveAsset = async () => {
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

      let res;
      if (editingId) {
          // MODO EDIÇÃO (PUT)
          res = await authFetch(getApiUrl(`/api/portfolio/${editingId}`), {
              method: "PUT",
              body: JSON.stringify(payload)
          })
      } else {
          // MODO CRIAÇÃO (POST)
          res = await authFetch(getApiUrl("/api/portfolio"), {
              method: "POST",
              body: JSON.stringify(payload)
          })
      }

      if (!res.ok) throw new Error("Erro ao salvar")

      // Limpa tudo após sucesso
      resetForm();
      await loadAssets() 
      if (onUpdate) onUpdate() 
      
    } catch (error: any) {
        alert("Erro: " + error.message)
    } finally {
        setLoading(false)
    }
  }

  const handleDelete = async (id: number, symbol: string) => {
      if (!confirm(`Tem certeza que deseja excluir ${symbol}?`)) return;
      try {
          const res = await authFetch(getApiUrl(`/api/portfolio/${id}`), { method: "DELETE" });
          if (res.ok) {
              await loadAssets(); 
              if (onUpdate) onUpdate();
              // Se deletou o item que estava editando, limpa o form
              if (editingId === id) resetForm();
          }
      } catch (error) { console.error(error); }
  };

  // --- PREPARA O FORMULÁRIO PARA EDIÇÃO ---
  const handleEditClick = (asset: Asset) => {
      setEditingId(asset.id);
      setNewAsset({
          symbol: asset.symbol,
          quantity: asset.quantity.toString(),
          price_paid: asset.price_paid.toString(),
          asset_type: asset.asset_type,
          currency: asset.currency
      });
  };

  const resetForm = () => {
      setEditingId(null);
      setNewAsset({ symbol: "", quantity: "", price_paid: "", asset_type: "stock", currency: "BRL" });
  };

  return (
    <div className="grid gap-6 md:grid-cols-12">
      
      {/* --- FORMULÁRIO (ESQUERDA) --- */}
      <Card className={`md:col-span-4 border-zinc-800 h-fit transition-colors ${editingId ? 'bg-zinc-900 border-amber-500/50' : 'bg-zinc-900'}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-400">
             {editingId ? <Pencil className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
             {editingId ? "Editar Ativo" : "Adicionar Ativo"}
          </CardTitle>
          <CardDescription className="text-zinc-500">
             {editingId ? `Alterando dados de ${newAsset.symbol}` : "Registre suas compras ou edite ao lado."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <div className="space-y-2">
            <Label className="text-zinc-300">Ticker / Símbolo</Label>
            <div className="relative">
                <Input 
                    placeholder="Ex: MXRF11, PETR4" 
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 uppercase pr-8"
                    value={newAsset.symbol}
                    onChange={e => setNewAsset({...newAsset, symbol: e.target.value.toUpperCase()})}
                    onBlur={handleTickerBlur} 
                />
                {searchingTicker && (
                    <div className="absolute right-3 top-3">
                        <RefreshCw className="w-4 h-4 text-amber-500 animate-spin" />
                    </div>
                )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label className="text-zinc-300">Quantidade</Label>
                <Input 
                    type="number" 
                    placeholder="0.00" 
                    className="bg-zinc-800 border-zinc-700 text-white"
                    value={newAsset.quantity}
                    onChange={e => setNewAsset({...newAsset, quantity: e.target.value})}
                />
             </div>
             <div className="space-y-2">
                <Label className="text-zinc-300">Preço Pago</Label>
                <Input 
                    type="number" 
                    placeholder="0.00" 
                    className="bg-zinc-800 border-zinc-700 text-white"
                    value={newAsset.price_paid}
                    onChange={e => setNewAsset({...newAsset, price_paid: e.target.value})}
                />
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label className="text-zinc-300">Tipo</Label>
                <Select value={newAsset.asset_type} onValueChange={v => setNewAsset({...newAsset, asset_type: v})}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white"><SelectValue /></SelectTrigger>
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
                <Select value={newAsset.currency} onValueChange={v => setNewAsset({...newAsset, currency: v})}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                        <SelectItem value="BRL">Real (R$)</SelectItem>
                        <SelectItem value="USD">Dólar ($)</SelectItem>
                    </SelectContent>
                </Select>
             </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            {editingId && (
                <Button 
                    variant="outline" 
                    className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    onClick={resetForm}
                >
                    <X className="w-4 h-4 mr-2" /> Cancelar
                </Button>
            )}
            <Button 
                className={`flex-1 font-bold text-black ${editingId ? 'bg-blue-500 hover:bg-blue-600' : 'bg-amber-500 hover:bg-amber-600'}`} 
                onClick={handleSaveAsset} 
                disabled={loading}
            >
                {loading ? "Salvando..." : (editingId ? "Salvar Alterações" : "Registrar Compra")}
            </Button>
          </div>

        </CardContent>
      </Card>

      {/* --- LISTA (DIREITA) --- */}
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
                <div className="text-center py-10 text-zinc-500">Nenhum ativo registrado.</div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow className="border-zinc-800 hover:bg-transparent">
                            <TableHead className="text-zinc-400">Ativo</TableHead>
                            <TableHead className="text-zinc-400">Qtd</TableHead>
                            <TableHead className="text-zinc-400">Médio</TableHead>
                            <TableHead className="text-zinc-400">Atual</TableHead>
                            <TableHead className="text-zinc-400">Total</TableHead>
                            <TableHead className="text-zinc-400">Var %</TableHead>
                            <TableHead className="text-zinc-400 text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {assets.map((asset) => {
                            const currentPrice = prices[asset.symbol] || prices[asset.symbol + ".SA"] || 0
                            const totalValue = currentPrice * asset.quantity
                            const variation = currentPrice > 0 ? ((currentPrice - asset.price_paid) / asset.price_paid) * 100 : 0
                            const isPositive = variation >= 0

                            return (
                                <TableRow key={asset.id} className="border-zinc-800 hover:bg-zinc-800/50">
                                    <TableCell className="font-bold text-zinc-200">
                                        {asset.symbol}
                                        <span className="block text-xs text-zinc-500 font-normal uppercase">{asset.asset_type}</span>
                                    </TableCell>
                                    <TableCell className="text-zinc-300">{asset.quantity}</TableCell>
                                    <TableCell className="text-zinc-400">
                                        {asset.currency === "USD" ? "$ " : "R$ "}{asset.price_paid.toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-zinc-200 font-medium">
                                        {currentPrice > 0 ? (asset.currency === "USD" ? "$ " : "R$ ") + currentPrice.toFixed(2) : "..."}
                                    </TableCell>
                                    <TableCell className="text-amber-400 font-bold">
                                        {currentPrice > 0 ? (asset.currency === "USD" ? "$ " : "R$ ") + totalValue.toFixed(2) : "..."}
                                    </TableCell>
                                    <TableCell>
                                        {currentPrice > 0 && (
                                            <div className={`flex items-center gap-1 text-xs font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                                {isPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                                {Math.abs(variation).toFixed(1)}%
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            {/* BOTÃO EDITAR */}
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10"
                                                onClick={() => handleEditClick(asset)}
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>

                                            {/* BOTÃO DELETAR */}
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 text-zinc-500 hover:text-red-500 hover:bg-red-500/10"
                                                onClick={() => handleDelete(asset.id, asset.symbol)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
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