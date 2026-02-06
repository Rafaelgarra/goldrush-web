"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle, Trash2, Wallet, TrendingUp, DollarSign } from "lucide-react"
import { getApiUrl, authFetch } from "@/lib/api" // <--- Importante: authFetch

// Interface que espelha o Backend
interface Asset {
  id: number
  symbol: string
  quantity: number
  price_paid: number
  asset_type: string
  currency: string
  current_price?: number // Opcional, pois vem de outra API depois
}

interface RealPortfolioProps {
    onUpdate?: () => void; // Avisa a página pai para recarregar o gráfico
}

export function RealPortfolio({ onUpdate }: RealPortfolioProps) {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(false)
  
  // Estado do Formulário
  const [newAsset, setNewAsset] = useState({
    symbol: "",
    quantity: "",
    price_paid: "",
    asset_type: "stock", // Valor padrão
    currency: "BRL"
  })

  // Carrega os ativos ao abrir
  const loadAssets = async () => {
      try {
          const res = await authFetch(getApiUrl("/api/portfolio"))
          if (res.ok) {
              const data = await res.json()
              if(Array.isArray(data)) setAssets(data)
          }
      } catch (error) {
          console.error("Erro ao carregar carteira:", error)
      }
  }

  // Chama o loadAssets na montagem do componente
  useState(() => { loadAssets() })

  // --- FUNÇÃO DE ADICIONAR (CORRIGIDA) ---
  const handleAddAsset = async () => {
    if (!newAsset.symbol || !newAsset.quantity || !newAsset.price_paid) {
        alert("Preencha todos os campos!")
        return
    }

    setLoading(true)
    try {
      // 1. Monta o objeto para enviar
      const payload = {
          symbol: newAsset.symbol.toUpperCase(), // Garante letra maiúscula
          quantity: parseFloat(newAsset.quantity),
          price_paid: parseFloat(newAsset.price_paid),
          asset_type: newAsset.asset_type,
          currency: newAsset.currency
      }

      // 2. Envia para a ROTA CERTA com authFetch
      const res = await authFetch(getApiUrl("/api/portfolio"), {
          method: "POST",
          body: JSON.stringify(payload)
      })

      if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.detail || "Erro ao salvar")
      }

      // 3. Limpa o formulário e recarrega
      setNewAsset({ ...newAsset, symbol: "", quantity: "", price_paid: "" })
      await loadAssets() 
      if (onUpdate) onUpdate() // Atualiza o Dashboard geral
      
    } catch (error: any) {
        alert("Erro: " + error.message)
    } finally {
        setLoading(false)
    }
  }

  // --- FUNÇÃO DE DELETAR (Bônus) ---
  /* Se quiser implementar deletar no futuro, a rota seria DELETE /api/portfolio/{id} 
     (precisaria criar no backend primeiro) */

  return (
    <div className="grid gap-6 md:grid-cols-12">
      
      {/* COLUNA DA ESQUERDA: Formulário de Adição */}
      <Card className="md:col-span-4 bg-zinc-900 border-zinc-800 h-fit">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-400">
             <PlusCircle className="w-5 h-5" /> Adicionar Ativo
          </CardTitle>
          <CardDescription className="text-zinc-500">
            Registre suas compras para acompanhar o desempenho.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <div className="space-y-2">
            <Label>Ticker / Símbolo</Label>
            <Input 
                placeholder="Ex: PETR4, AAPL, BTC-USD" 
                className="bg-zinc-800 border-zinc-700 uppercase"
                value={newAsset.symbol}
                onChange={e => setNewAsset({...newAsset, symbol: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label>Quantidade</Label>
                <Input 
                    type="number" 
                    placeholder="0.00" 
                    className="bg-zinc-800 border-zinc-700"
                    value={newAsset.quantity}
                    onChange={e => setNewAsset({...newAsset, quantity: e.target.value})}
                />
             </div>
             <div className="space-y-2">
                <Label>Preço Pago</Label>
                <Input 
                    type="number" 
                    placeholder="0.00" 
                    className="bg-zinc-800 border-zinc-700"
                    value={newAsset.price_paid}
                    onChange={e => setNewAsset({...newAsset, price_paid: e.target.value})}
                />
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label>Tipo</Label>
                <Select 
                    value={newAsset.asset_type} 
                    onValueChange={v => setNewAsset({...newAsset, asset_type: v})}
                >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                        <SelectItem value="stock">Ação (BR)</SelectItem>
                        <SelectItem value="reit">FII</SelectItem>
                        <SelectItem value="stock_us">Ação (EUA)</SelectItem>
                        <SelectItem value="crypto">Cripto</SelectItem>
                        <SelectItem value="etf">ETF</SelectItem>
                    </SelectContent>
                </Select>
             </div>
             <div className="space-y-2">
                <Label>Moeda</Label>
                <Select 
                    value={newAsset.currency} 
                    onValueChange={v => setNewAsset({...newAsset, currency: v})}
                >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
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

      {/* COLUNA DA DIREITA: Lista de Ativos */}
      <Card className="md:col-span-8 bg-zinc-900 border-zinc-800">
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-zinc-100">
                <Wallet className="w-5 h-5 text-amber-500" /> Sua Carteira
            </CardTitle>
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
                            <TableHead className="text-zinc-400">Preço Médio</TableHead>
                            <TableHead className="text-zinc-400">Total Investido</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {assets.map((asset) => (
                            <TableRow key={asset.id} className="border-zinc-800 hover:bg-zinc-800/50">
                                <TableCell className="font-bold text-zinc-200">
                                    {asset.symbol}
                                    <span className="block text-xs text-zinc-500 font-normal uppercase">{asset.asset_type}</span>
                                </TableCell>
                                <TableCell className="text-zinc-300">{asset.quantity}</TableCell>
                                <TableCell className="text-zinc-300">
                                    {asset.currency === "USD" ? "$ " : "R$ "} 
                                    {asset.price_paid.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-amber-400 font-medium">
                                    {asset.currency === "USD" ? "$ " : "R$ "}
                                    {(asset.quantity * asset.price_paid).toFixed(2)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </CardContent>
      </Card>

    </div>
  )
}