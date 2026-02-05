"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RealPortfolio } from "@/components/RealPortfolio"
import { Simulator } from "@/components/Simulator"
import { Dashboard } from "@/components/Dashboard"
import { getApiUrl } from "@/lib/api"
import CurrencyTicker from "@/components/CurrencyTicker";

export default function Home() {
  const [portfolioData, setPortfolioData] = useState([])

  const refreshData = async () => {
    try {
      const res = await fetch(getApiUrl('/api/portfolio'))
      const data = await res.json()
      setPortfolioData(data)
    } catch (e) { console.error(e) }
  }

  useEffect(() => { refreshData() }, [])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* --- CABEÇALHO (Título + Ticker) --- */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-start gap-6 mb-8 w-full">
          
          {/* Título: Fixo, não encolhe (shrink-0) */}
          <h1 className="text-3xl font-bold text-amber-400 tracking-tighter whitespace-nowrap shrink-0">
            GoldRush <span className="text-zinc-600 text-lg font-normal">| Manager</span>
          </h1>

          {/* Ticker: Ocupa todo o espaço restante (flex-1) e permite scroll (min-w-0) */}
          <div className="flex-1 min-w-0 w-full overflow-hidden">
            <CurrencyTicker />
          </div>

        </div>
        {/* ----------------------------------- */}

        {/* MENU PRINCIPAL (Abas) */}
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