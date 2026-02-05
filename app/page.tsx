"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RealPortfolio } from "@/components/RealPortfolio"
import { Simulator } from "@/components/Simulator"
import { Dashboard } from "@/components/Dashboard"

export default function Home() {
  const [portfolioData, setPortfolioData] = useState([])

  const refreshData = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/portfolio")
      const data = await res.json()
      setPortfolioData(data)
    } catch (e) { console.error(e) }
  }

  useEffect(() => { refreshData() }, [])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-amber-400 tracking-tighter">
            GoldRush <span className="text-zinc-600 text-lg font-normal">| Manager</span>
          </h1>
        </div>

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
            {/* Passamos refreshData para atualizar o Dashboard assim que adicionar algo novo */}
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