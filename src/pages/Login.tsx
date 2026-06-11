"use client";

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showSuccess, showError } from "@/utils/toast";
import { isClerkConfigured, useSignIn } from "@/lib/auth";
import { Loader2, LogIn } from "lucide-react";
import Logo from "@/components/ui/Logo";

const Login = () => {
  const navigate = useNavigate();
  const { signIn, setActive, isLoaded } = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      showError("Por favor, preencha todos os campos.");
      return;
    }
    
    if (!isLoaded) return;

    setLoading(true);
    try {
      if (isClerkConfigured) {
        // Autenticação real com Clerk usando nosso formulário customizado
        const result = await signIn.create({
          identifier: email.trim(),
          password: password,
        });

        if (result.status === "complete") {
          await setActive({ session: result.createdSessionId });
          showSuccess("Login realizado com sucesso!");
          navigate("/");
        } else {
          showError("Não foi possível concluir o login. Verifique seus dados.");
        }
      } else {
        // Modo de simulação (Preview)
        await signIn.create({ identifier: email.trim() });
        showSuccess("Login simulado realizado com sucesso!");
        navigate("/");
      }
    } catch (err: any) {
      console.error("Erro de login:", err);
      showError(err.errors?.[0]?.message || err.message || "Erro ao realizar login.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      showError("Por favor, insira seu e‑mail para receber o código de redefinição.");
      return;
    }
    setLoading(true);
    try {
      if (isClerkConfigured) {
        // Inicia o fluxo de recuperação de senha do Clerk
        await signIn.create({
          strategy: "reset_password_email_code",
          identifier: email.trim(),
        });
        showSuccess("Código de redefinição enviado para seu e‑mail.");
      } else {
        showSuccess("Simulação: Código de redefinição enviado para seu e‑mail.");
      }
    } catch (err: any) {
      showError(err.errors?.[0]?.message || "Erro ao enviar código de redefinição.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#1C3A2B] px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center">
        
        {/* Logo ELHA */}
        <div className="mb-6 flex justify-center">
          <Logo className="w-36 h-36 drop-shadow-md" />
        </div>

        <div className="text-center mb-6">
          <h1 className="font-heading text-3xl text-[#1C3A2B]">Entrar</h1>
          <p className="font-body<dyad-write path="src/pages/Login.tsx" description="Completando o formulário de login customizado com os campos de e-mail, senha e o link 'Esqueci minha senha' posicionado corretamente.">
"use client";

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showSuccess, showError } from "@/utils/toast";
import { isClerkConfigured, useSignIn } from "@/lib/auth";
import { Loader2, LogIn } from "lucide-react";
import Logo from "@/components/ui/Logo";

const Login = () => {
  const navigate = useNavigate();
  const { signIn, setActive, isLoaded } = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      showError("Por favor, preencha todos os campos.");
      return;
    }
    
    if (!isLoaded) return;

    setLoading(true);
    try {
      if (isClerkConfigured) {
        // Autenticação real com Clerk usando nosso formulário customizado
        const result = await signIn.create({
          identifier: email.trim(),
          password: password,
        });

        if (result.status === "complete") {
          await setActive({ session: result.createdSessionId });
          showSuccess("Login realizado com sucesso!");
          navigate("/");
        } else {
          showError("Não foi possível concluir o login. Verifique seus dados.");
        }
      } else {
        // Modo de simulação (Preview)
        await signIn.create({ identifier: email.trim() });
        showSuccess("Login simulado realizado com sucesso!");
        navigate("/");
      }
    } catch (err: any) {
      console.error("Erro de login:", err);
      showError(err.errors?.[0]?.message || err.message || "Erro ao realizar login.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      showError("Por favor, insira seu e‑mail para receber o código de redefinição.");
      return;
    }
    setLoading(true);
    try {
      if (isClerkConfigured) {
        // Inicia o fluxo de recuperação de senha do Clerk
        await signIn.create({
          strategy: "reset_password_email_code",
          identifier: email.trim(),
        });
        showSuccess("Código de redefinição enviado para seu e‑mail.");
      } else {
        showSuccess("Simulação: Código de redefinição enviado para seu e‑mail.");
      }
    } catch (err: any) {
      showError(err.errors?.[0]?.message || "Erro ao enviar código de redefinição.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#1C3A2B] px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center">
        
        {/* Logo ELHA */}
        <div className="mb-6 flex justify-center">
          <Logo className="w-36 h-36 drop-shadow-md" />
        </div>

        <div className="text-center mb-6">
          <h1 className="font-heading text-3xl text-[#1C3A2B]">Entrar</h1>
          <p className="font-body text-sm text-[#4A7A5C] mt-2">Faça login para continuar.</p>
        </div>

        <form onSubmit={handleLogin} className="w-full space-y-5 bg-[#E8DECE] p-6 rounded-3xl shadow-sm border border-[#D4C9B5]">
          <div className="space-y-2">
            <Label htmlFor="email" className="font-label-category text-[10px] text-[#1C3A2B]">Seu e-mail</Label>
            <Input 
              id="email" 
              type="email"
              placeholder="Digite o endereço de e-mail" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="bg-[#F5F0E8] border-[#D4C9B5] text-[#1C3A2B] placeholder-[#4A7A5C]/70 h-11 rounded-xl text-sm focus-visible:ring-[#1C3A2B]"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={loading}
                className="text-[11px] text-[#4A7A5C] hover:text-[#1C3A2B] hover:underline transition-colors font-medium"
              >
                {loading ? "Enviando..." : "Esqueci minha senha"}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="font-label-category text-[10px] text-[#1C3A2B]">Senha</Label>
            <Input 
              id="password" 
              type="password"
              placeholder="Digite sua senha" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="bg-[#F5F0E8] border-[#D4C9B5] text-[#1C3A2B] placeholder-[#4A7A5C]/70 h-11 rounded-xl text-sm focus-visible:ring-[#1C3A2B]"
            />
          </div>

          <Button type="submit" className="btn-elha-primary w-full gap-2 h-12" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : <><LogIn size={14} /> Entrar</>}
          </Button>
        </form>

        <div className="text-center pt-6 w-full">
          <p className="text-xs text-[#4A7A5C]">
            Não tem uma conta? <Link to="/register" className="text-[#1C3A2B] font-medium underline">Criar conta</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;