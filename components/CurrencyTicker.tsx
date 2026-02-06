"use client";

import { useEffect, useState } from "react";
import { getApiUrl } from "@/lib/api";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

interface TickerItem {
  name: string;
  ticker: string;
  price: number;
  currency: string;
}

export default function CurrencyTicker() {
  const [data, setData] = useState<TickerItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // CORREÇÃO: Garante que o caminho inclui /api/
        const res = await fetch(getApiUrl("/api/market-summary?currency=BRL"));
        if (res.ok) {
            const json = await res.json();
            setData(json);
        }
      } catch (error) {
        console.error("Erro ticker:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Atualiza a cada 60 segundos
    const interval = setInterval(fetchData, 60000); 
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="h-10 animate-pulse bg-zinc-900 rounded w-full"></div>;

  return (
    <div className="w-full overflow-hidden bg-zinc-900 border-y border-zinc-800">
      <div className="flex animate-marquee whitespace-nowrap py-2">
        {data.concat(data).map((item, index) => ( // Duplica pra efeito infinito
          <div key={index} className="flex items-center mx-6 gap-2">
            <span className="text-xs font-bold text-zinc-400 uppercase">{item.name}</span>
            <span className="text-sm font-bold text-zinc-200">
               {item.currency === "BRL" ? "R$" : "$"} {item.price.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}