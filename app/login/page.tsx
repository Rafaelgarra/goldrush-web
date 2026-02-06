"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { getApiUrl } from "@/lib/api";
import { Separator } from "@/components/ui/separator";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true); // Controla se é Login ou Cadastro
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!email || !password) {
        alert("Preencha todos os campos");
        return;
    }

    setLoading(true);
    try {
        if (isLogin) {
            // --- FLUXO DE LOGIN ---
            const formData = new URLSearchParams();
            formData.append('username', email);
            formData.append('password', password);

            const res = await fetch(getApiUrl("/api/token"), {
                method: "POST",
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData
            });

            if (!res.ok) throw new Error("Credenciais inválidas");

            const data = await res.json();
            localStorage.setItem("goldrush_token", data.access_token);
            router.push("/");
        } else {
            // --- FLUXO DE CADASTRO ---
            const res = await fetch(getApiUrl("/api/register"), {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();
            
            if (!res.ok) throw new Error(data.detail || "Erro ao cadastrar");

            // Se cadastrou com sucesso, já salva o token e entra
            localStorage.setItem("goldrush_token", data.access_token);
            router.push("/");
        }
    } catch (error: any) {
        alert(error.message || "Ocorreu um erro. Tente novamente.");
    } finally {
        setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = getApiUrl("/auth/google"); 
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-amber-400 text-3xl font-bold tracking-tighter">
            GoldRush
          </CardTitle>
          <CardDescription className="text-zinc-400">
            {isLogin 
                ? "Entre para gerenciar seu patrimônio" 
                : "Crie sua conta e comece a investir"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Botão Google com Ícone Original */}
          <Button 
            onClick={handleGoogleLogin}
            className="w-full bg-white text-zinc-800 hover:bg-zinc-100 font-bold flex items-center gap-3 py-6"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {isLogin ? "Entrar com Google" : "Cadastrar com Google"}
          </Button>

          <div className="flex items-center gap-4">
            <Separator className="flex-1 bg-zinc-800" />
            <span className="text-xs text-zinc-500 uppercase">ou via email</span>
            <Separator className="flex-1 bg-zinc-800" />
          </div>

          <div className="space-y-4">
            <Input 
                placeholder="Seu melhor email" 
                className="bg-zinc-800 border-zinc-700 text-white h-11 placeholder:text-zinc-500 focus-visible:ring-amber-500" 
                value={email}
                onChange={e => setEmail(e.target.value)}
            />
            <Input 
                type="password" 
                placeholder="Sua senha secreta" 
                className="bg-zinc-800 border-zinc-700 text-white h-11 placeholder:text-zinc-500 focus-visible:ring-amber-500" 
                value={password}
                onChange={e => setPassword(e.target.value)}
            />
            
            <Button 
                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold h-11" 
                onClick={handleSubmit}
                disabled={loading}
            >
                {loading ? "Processando..." : (isLogin ? "Acessar Plataforma" : "Criar Nova Conta")}
            </Button>
          </div>

          {/* Toggle Login/Cadastro */}
          <div className="text-center pt-2">
            <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-zinc-400 hover:text-amber-400 underline transition-colors"
            >
                {isLogin 
                    ? "Não tem uma conta? Cadastre-se gratuitamente." 
                    : "Já tem conta? Faça login."}
            </button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}