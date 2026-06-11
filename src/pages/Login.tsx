"use client";

import React, { useState } from "react";
import { SignIn } from "@clerk/clerk-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showSuccess, showError } from "@/utils/toast";
import { isClerkConfigured, useSignIn } from "@/lib/auth";
import { Loader2, LogIn } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const { signIn, isMock } = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleMockLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      showError("Por favor, insira seu e-mail.");
      return;
    }
    setLoading(true);
    try {
      // No modo mock, o signIn.create simula o login
      await signIn.create({ identifier: email.trim() });
      showSuccess("Login simulado realizado com sucesso!");
      navigate("/");
    } catch (err: any) {
      showError("Erro ao realizar login simulado.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      showError("Por favor, insira seu e‑mail para receber o código.");
      return;
    }
    setLoading(true);
    try {
      if (!isMock) {
        await SignIn.forgotPassword({ identifier: email.trim() });
        showSuccess("Código de redefinição enviado para seu e‑mail.");
      } else {
        showSuccess("Simulação: Código de redefinição enviado para seu e‑mail.");
      }
    } catch (err: any) {
      showError(err.errors?.[0]?.message || "Erro ao enviar código.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#1C3A2B] px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <p className="font-label-category text-[10px] text-[#4A7A5C] mb-2">Acesso ao sistema</p>
          <h1 className="font-heading text-3xl text-[#1C3A2B]">Entrar</h1>
          <p className="font-body text-sm text-[#4A7A5C] mt-2">Faça login para continuar.</p>
        </div>

        {isClerkConfigured ? (
          <SignIn
            appearance={{
              elements: {
                formButtonPrimary: "btn-elha-primary w-full h-12 gap-2",
                cardBox: "shadow-none w-full",
                card: "border border-[#D4C9B5] bg-[#E8DECE] rounded-3xl shadow-sm w-full overflow-hidden",
                headerTitle: "font-heading text-xl text-[#1C3A2B]",
                headerSubtitle: "text-[#4A7A5C]",
                socialButtonsBlockButton: "btn-elha-outline flex-1 h-12 gap-2",
              },
            }}
            routing="hash"
            signUpUrl="/register"
            forceRedirectUrl="/"
          />
        ) : (
          <form onSubmit={handleMockLogin} className="space-y-5 bg-[#E8DECE] p-6 rounded-3xl shadow-sm border border-[#D4C9B5]">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-label-category text-[10px] text-[#1C3A2B]">E-mail</Label>
              <Input 
                id="email" 
                type="email"
                placeholder="Ex: especialista@elha.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="bg-[#F5F0E8] border-[#D4C9B5] text-[#1C3A2B] placeholder-[#4A7A5C]/70 h-11 rounded-xl text-sm focus-visible:ring-[#1C3A2B]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-label-category text-[10px] text-[#1C3A2B]">Senha</Label>
              <Input 
                id="password" 
                type="password"
                placeholder="Sua senha" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="bg-[#F5F0E8] border-[#D4C9B5] text-[#1C3A2B] placeholder-[#4A7A5C]/70 h-11 rounded-xl text-sm focus-visible:ring-[#1C3A2B]"
              />
            </div>

            <Button type="submit" className="btn-elha-primary w-full gap-2 h-12" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : <><LogIn size={14} /> Entrar (Modo Preview)</>}
            </Button>
          </form>
        )}

        <div className="mt-4 text-center">
          <Button type="button" onClick={handleForgotPassword} disabled={loading} className="btn-elha-outline">
            {loading ? "Enviando..." : "Esqueci minha senha"}
          </Button>
        </div>

        <div className="text-center pt-2">
          <p className="text-xs text-[#4A7A5C]">
            Não tem uma conta? <Link to="/register" className="text-[#1C3A2B] font-medium underline">Criar conta</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;