"use client";

import React, { useState } from "react";
import { SignIn } from "@clerk/clerk-react";
import { useNavigate, Link } from "react-router-dom";
import { useSignIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showSuccess, showError } from "@/utils/toast";

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "";
const isClerkConfigured = !!CLERK_KEY;

const Login = () => {
  const navigate = useNavigate();
  const { signIn, isMock } = useSignIn();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleMockLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      showError("Por favor, insira seu e-mail.");
      return;
    }

    setLoading(true);
    try {
      await signIn.create({ identifier: email });
      showSuccess("Login realizado com sucesso (Modo de Demonstração)!");
      navigate("/");
    } catch (err: any) {
      showError("Erro ao realizar login.");
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
          <p className="font-body text-sm text-[#4A7A5C] mt-2">
            {isClerkConfigured ? "Faça login para continuar." : "Modo de Demonstração Local"}
          </p>
        </div>

        {isClerkConfigured ? (
          <SignIn
            appearance={{
              elements: {
                formButtonPrimary: "btn-elha-primary w-full h-12 gap-2",
                card: "border border-[#D4C9B5] bg-[#E8DECE] rounded-3xl shadow-sm",
                headerTitle: "font-heading text-xl text-[#1C3A2B]",
                headerSubtitle: "text-[#4A7A5C]",
                socialButtonsBlockButton: "btn-elha-outline flex-1 h-12 gap-2",
              },
            }}
            routing="path"
            path="/login"
            signUpUrl="/register"
            afterSignInUrl="/"
            afterSignUpUrl="/"
          />
        ) : (
          <form onSubmit={handleMockLogin} className="space-y-6 bg-[#E8DECE] p-6 rounded-3xl shadow-sm border border-[#D4C9B5]">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-label-category text-[10px] text-[#1C3A2B]">E-mail de Acesso</Label>
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

            <Button type="submit" className="btn-elha-primary w-full h-12" disabled={loading}>
              {loading ? "Entrando..." : "Entrar no Sistema"}
            </Button>

            <div className="text-center pt-2">
              <p className="text-xs text-[#4A7A5C]">
                Não tem uma conta?{" "}
                <Link to="/register" className="text-[#1C3A2B] font-medium underline">
                  Criar conta
                </Link>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;