"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RealPortfolio } from "@/components/RealPortfolio"
import { Simulator } from "@/components/Simulator"
import { Dashboard } from "@/components/Dashboard"
import { getApiUrl, authFetch } from "@/lib/api"
import CurrencyTicker from "@/components/CurrencyTicker";
import { useRouter } from "next/navigation"

export default function Home() {
  // CORREÇÃO AQUI: Adicionado <any[]> para evitar o erro "never[]"
  const [portfolioData, setPortfolioData] = useState<any[]>([])
  const router = useRouter()

  const refreshData = async () => {
    try {
      // Usa authFetch para enviar o token junto
      const res = await authFetch(getApiUrl('/api/portfolio'))
      
      // Se o token for inválido (401), redireciona pro login
      if (res.status === 401) {
         router.push("/login")
         return
      }

      const data = await res.json()

      // Proteção: Só salva se for realmente uma lista (Array)
      if (Array.isArray(data)) {
          setPortfolioData(data)
      } else {
          console.error("Erro: API não retornou uma lista", data)
          setPortfolioData([]) 
      }
    } catch (e) { 
        console.error("Erro ao buscar dados:", e)
        setPortfolioData([]) 
    }
  }

  // Verifica login ao carregar a página
  useEffect(() => { 
      const token = localStorage.getItem("goldrush_token")
      if (!token) {
          router.push("/login")
      } else {
          refreshData() 
      }
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* --- CABEÇALHO --- */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-start gap-6 mb-8 w-full">
          
          <h1 className="text-3xl font-bold text-amber-400 tracking-tighter whitespace-nowrap shrink-0">
            GoldRush <span className="text-zinc-600 text-lg font-normal">| Manager</span>
          </h1>

          <div className="flex-1 min-w-0 w-full overflow-hidden">
            <CurrencyTicker />
          </div>

        </div>

        {/* --- MENU PRINCIPAL (Abas) --- */}
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-zinc-900 border border-zinc-800 h-12">
            <TabsTrigger 
              value="dashboard" 
              className="text-zinc-400 data-[state=active]:bg-zinc-800 data-[state=active]:text-amber-400 font-bold"
            >
              📊 Dashboard Geral
            </TabsTrigger>
            
            <TabsTrigger 
              value="portfolio" 
              className="text-zinc-400 data-[state=active]:bg-zinc-800 data-[state=active]:text-amber-400 font-bold"
            >
              💼 Minha Carteira
            </TabsTrigger>
            
            <TabsTrigger 
              value="simulator" 
              className="text-zinc-400 data-[state=active]:bg-zinc-800 data-[state=active]:text-amber-400 font-bold"
            >
              🔮 Simulador de Futuro
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6 animate-in fade-in slide-in-from-bottom-4">
             <Dashboard assets={portfolioData} />
          </TabsContent>

          <TabsContent value="portfolio" className="mt-6 animate-in fade-in slide-in-from-bottom-4">
            <RealPortfolio onUpdate={refreshData} />
          </TabsContent>

          <TabsContent value="simulator" className="mt-6 animate-in fade-in slide-in-from-bottom-4">
             <Simulator />
          </TabsContent>
        </Tabs>

      </div>
    </div>
  )
}