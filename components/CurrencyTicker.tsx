"use client";

import { useEffect, useState } from "react";
import { Plus, RefreshCcw } from "lucide-react"; 
import { Switch } from "@/components/ui/switch"; 
import { Button } from "@/components/ui/button"; 
import { getApiUrl } from "@/lib/api"; 

interface Currency {
  name: string;
  ticker: string;
  price: number;
}

export default function CurrencyTicker() {
  // Estado inicial com array vazio
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [baseCurrency, setBaseCurrency] = useState<"BRL" | "USD">("BRL");
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Chama a rota que criamos no passo anterior
      const url = getApiUrl(`/api/market-summary?currency=${baseCurrency}`);
      const res = await fetch(url);
      const data = await res.json();
      
      if (Array.isArray(data)) {
          setCurrencies(data);
      }
    } catch (error) {
      console.error("Erro ticker:", error);
    } finally {
      setLoading(false);
    }
  };

  // Recarrega sempre que mudar o Switch (BRL <-> USD)
  useEffect(() => {
    fetchData();
    
    // Atualiza a cada 60 segundos automaticamente
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [baseCurrency]);

  const formatPrice = (price: number, name: string) => {
    const isCrypto = name === "Bitcoin";
    // Iene e Yuan valem muito pouco em BRL, precisam de mais casas
    const isCheap = name === "Iene" || name === "Yuan" || name === "Iene (JPY)";
    
    const digits = isCrypto ? 0 : (isCheap && baseCurrency === 'BRL') ? 4 : 2; 
    const prefix = baseCurrency === "BRL" ? "R$" : "$";
    
    return `${prefix} ${price.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
  };

  return (
    <div className="flex items-center gap-3 w-full h-12 border-b border-zinc-800 bg-black/20 px-4">
      
      {/* 1. Switch USD/BRL (Fixo na esquerda) */}
      <div className="flex items-center gap-2 bg-zinc-900 px-3 py-1.5 rounded-md border border-zinc-800 shrink-0">
        <span className={`text-xs font-bold ${baseCurrency === 'BRL' ? 'text-green-500' : 'text-zinc-600'}`}>BRL</span>
        <Switch 
          checked={baseCurrency === "USD"} 
          onCheckedChange={(v) => setBaseCurrency(v ? "USD" : "BRL")}
          className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-green-600 scale-75"
        />
        <span className={`text-xs font-bold ${baseCurrency === 'USD' ? 'text-blue-500' : 'text-zinc-600'}`}>USD</span>
      </div>

      {/* 2. Lista de Moedas (Scroll Horizontal) */}
      <div className="flex flex-1 gap-3 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] items-center h-full pr-4">
        
        {loading && currencies.length === 0 ? (
           <div className="text-zinc-500 text-xs flex items-center gap-2 animate-pulse pl-2">
             <RefreshCcw className="w-3 h-3 animate-spin"/> Atualizando cotações...
           </div>
        ) : (
          currencies.map((curr) => (
            <div 
              key={curr.ticker} 
              className="flex flex-col justify-center px-4 py-1 bg-zinc-900 border border-zinc-800 rounded hover:border-zinc-700 transition-colors min-w-[100px] shrink-0 h-9"
            >
              <div className="flex justify-between items-center w-full gap-2">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold">{curr.name}</span>
                  <span className="text-xs font-bold text-zinc-200">
                    {formatPrice(curr.price, curr.name)}
                  </span>
              </div>
            </div>
          ))
        )}

        {/* 3. Botão + */}
        <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8 bg-zinc-900 border-zinc-800 hover:bg-zinc-800 hover:text-green-400 shrink-0"
            onClick={() => alert("Em breve: Adicionar novas moedas ao monitor!")}
        >
            <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}