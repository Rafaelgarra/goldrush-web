"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      // 1. Pega o token da URL
      // 2. Salva no navegador
      localStorage.setItem("goldrush_token", token);
      // 3. Manda pro Dashboard
      router.push("/");
    } else {
      // Se deu erro, volta pro login
      router.push("/login");
    }
  }, [searchParams, router]);

  return (
    <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p>Autenticando...</p>
    </div>
  );
}

// O Suspense é necessário no Next.js quando usamos useSearchParams
export default function AuthCallback() {
    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-amber-400">
            <Suspense fallback={<div>Carregando...</div>}>
                <CallbackContent />
            </Suspense>
        </div>
    )
}