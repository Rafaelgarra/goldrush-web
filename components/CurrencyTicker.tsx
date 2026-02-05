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
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [baseCurrency, setBaseCurrency] = useState<"BRL" | "USD">("BRL");
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const url = getApiUrl(`/api/market-summary?currency=${baseCurrency}`);
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) setCurrencies(data);
    } catch (error) {
      console.error("Erro ticker:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [baseCurrency]);

  const formatPrice = (price: number, name: string) => {
    const isCrypto = name === "Bitcoin";
    const isCheap = name === "Iene" || name === "Yuan";
    
    // Formatação: Iene e Yuan precisam de mais casas decimais para não aparecer 0.00
    const digits = isCrypto ? 0 : (isCheap && baseCurrency === 'BRL') ? 4 : 2; 
    const prefix = baseCurrency === "BRL" ? "R$" : "$";
    
    // Se for Base USD e moedas asiáticas, o padrão financeiro é sem prefixo (ex: 150 JPY)
    if (baseCurrency === "USD" && (name === "Iene" || name === "Yuan" || name === "Real")) {
        return price.toFixed(digits);
    }

    return `${prefix} ${price.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
  };

  return (
    <div className="flex items-center gap-3 w-full h-10">
      
      {/* 1. Switch USD/BRL (Fixo na esquerda) */}
      <div className="flex items-center gap-2 bg-zinc-900/80 px-3 py-1.5 rounded-md border border-zinc-800 shrink-0 h-full">
        <span className={`text-xs font-bold ${baseCurrency === 'BRL' ? 'text-green-500' : 'text-zinc-600'}`}>BRL</span>
        <Switch 
          checked={baseCurrency === "USD"} 
          onCheckedChange={(v) => setBaseCurrency(v ? "USD" : "BRL")}
          className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-green-600 scale-75"
        />
        <span className={`text-xs font-bold ${baseCurrency === 'USD' ? 'text-blue-500' : 'text-zinc-600'}`}>USD</span>
      </div>

      {/* 2. Lista de Moedas + Botão (Área de Scroll) */}
      {/* Classes explicadas:
          flex-1: Ocupa o resto da largura disponível
          overflow-x-auto: Permite rolar para os lados
          pr-12: Padding no final para o botão + não ficar colado na borda direita
          [&::-webkit-scrollbar]:hidden: Esconde a barra de rolagem (Chrome/Safari)
      */}
      <div className="flex flex-1 gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] items-center h-full pr-12">
        
        {loading && currencies.length === 0 ? (
           <div className="text-zinc-500 text-xs flex items-center gap-2 animate-pulse pl-2">
             <RefreshCcw className="w-3 h-3 animate-spin"/> Carregando mercado...
           </div>
        ) : (
          currencies.map((curr) => (
            <div 
              key={curr.ticker} 
              className="flex flex-col justify-center px-3 py-0.5 bg-zinc-900 border border-zinc-800 rounded hover:border-zinc-700 transition-colors min-w-[90px] shrink-0"
            >
              <div className="flex justify-between items-center w-full">
                  <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold">{curr.name}</span>
              </div>
              <span className="text-xs font-bold text-zinc-200">
                {formatPrice(curr.price, curr.name)}
              </span>
            </div>
          ))
        )}

        {/* 3. Botão + (Dentro da área de scroll, no final da fila) */}
        <Button 
            variant="outline" 
            size="icon" 
            className="h-9 w-9 bg-zinc-900 border-zinc-800 hover:bg-zinc-800 hover:text-green-400 shrink-0 ml-1"
            onClick={() => alert("Funcionalidade de adicionar moeda vindo em breve!")}
        >
            <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}