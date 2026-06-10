"use client";

import React, { useState } from "react";
import { SignIn } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showSuccess, showError } from "@/utils/toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      showError("Por favor, insira seu e‑mail para receber o código.");
      return;
    }
    setLoading(true);
    try {
      await SignIn.forgotPassword({ identifier: email.trim() });
      showSuccess("Código de redefinição enviado para seu e‑mail.");
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
