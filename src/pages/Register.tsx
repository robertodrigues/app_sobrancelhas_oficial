"use client";

import React, { useState } from "react";
import { SignUp } from "@clerk/clerk-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showSuccess, showError } from "@/utils/toast";
import { isClerkConfigured, useSignUp } from "@/lib/auth";
import { Loader2, UserPlus } from "lucide-react";

const Register = () => {
  const navigate = useNavigate();
  const { signUp } = useSignUp();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleMockRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !firstName.trim()) {
      showError("Por favor, preencha os campos obrigatórios.");
      return;
    }
    setLoading(true);
    try {
      await signUp.create({
        emailAddress: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      showSuccess("Conta simulada criada com sucesso!");
      navigate("/");
    } catch (err: any) {
      showError("Erro ao criar conta simulada.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#1C3A2B] px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <p className="font-label-category text-[10px] text-[#4A7A5C] mb-2">Novo acesso</p>
          <h1 className="font-heading text-3xl text-[#1C3A2B]">Criar conta</h1>
          <p className="font-body text-sm text-[#4A7A5C] mt-2">Cadastre-se para acessar o sistema.</p>
        </div>

        {isClerkConfigured ? (
          <SignUp
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
            path="/register"
            signInUrl="/login"
            afterSignInUrl="/"
            afterSignUpUrl="/"
          />
        ) : (
          <form onSubmit={handleMockRegister} className="space-y-4 bg-[#E8DECE] p-6 rounded-3xl shadow-sm border border-[#D4C9B5]">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="font-label-category text-[10px] text-[#1C3A2B]">Nome *</Label>
                <Input 
                  id="firstName" 
                  placeholder="Ex: Maria" 
                  required 
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={loading}
                  className="bg-[#F5F0E8] border-[#D4C9B5] text-[#1C3A2B] placeholder-[#4A7A5C]/70 h-11 rounded-xl text-sm focus-visible:ring-[#1C3A2B]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="font-label-category text-[10px] text-[#1C3A2B]">Sobrenome</Label>
                <Input 
                  id="lastName" 
                  placeholder="Ex: Silva" 
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={loading}
                  className="bg-[#F5F0E8] border-[#D4C9B5] text-[#1C3A2B] placeholder-[#4A7A5C]/70 h-11 rounded-xl text-sm focus-visible:ring-[#1C3A2B]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="font-label-category text-[10px] text-[#1C3A2B]">E-mail *</Label>
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
              <Label htmlFor="password" className="font-label-category text-[10px] text-[#1C3A2B]">Senha *</Label>
              <Input 
                id="password" 
                type="password"
                placeholder="Crie uma senha" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="bg-[#F5F0E8] border-[#D4C9B5] text-[#1C3A2B] placeholder-[#4A7A5C]/70 h-11 rounded-xl text-sm focus-visible:ring-[#1C3A2B]"
              />
            </div>

            <Button type="submit" className="btn-elha-primary w-full gap-2 h-12" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : <><UserPlus size={14} /> Criar Conta (Modo Preview)</>}
            </Button>
          </form>
        )}

        <div className="text-center pt-4">
          <p className="text-xs text-[#4A7A5C]">
            Já tem uma conta? <Link to="/login" className="text-[#1C3A2B] font-medium underline">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;