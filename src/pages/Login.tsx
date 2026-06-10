"use client";

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, Loader2 } from "lucide-react";
import { useSignIn } from "@/lib/auth";
import { showError, showSuccess } from "@/utils/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Login = () => {
  const { isLoaded, signIn, setActive } = useSignIn();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isLoaded) return;

    if (!email.trim() || !password.trim()) {
      showError("Preencha e-mail e senha.");
      return;
    }

    setLoading(true);

    try {
      const result = await signIn.create({
        identifier: email.trim(),
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        showSuccess("Login realizado com sucesso!");
        navigate("/");
      } else {
        console.log(result);
        showError("Não foi possível concluir o login. Verifique seus dados.");
      }
    } catch (err: any) {
      showError(err.errors?.[0]?.message || "Erro ao realizar login.");
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

        <Card className="border border-[#D4C9B5] bg-[#E8DECE] rounded-3xl shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="font-heading text-xl text-[#1C3A2B]">Bem-vinda</CardTitle>
            <CardDescription className="text-[#4A7A5C]">
              Entre com seu e-mail e senha cadastrados.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-label-category text-[10px] text-[#1C3A2B]">
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="voce@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-[#F5F0E8] border-[#D4C9B5] text-[#1C3A2B] placeholder:text-[#4A7A5C]/60 h-11 rounded-xl text-sm focus-visible:ring-[#1C3A2B]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="font-label-category text-[10px] text-[#1C3A2B]">
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-[#F5F0E8] border-[#D4C9B5] text-[#1C3A2B] placeholder:text-[#4A7A5C]/60 h-11 rounded-xl text-sm focus-visible:ring-[#1C3A2B]"
                />
              </div>

              <Button type="submit" className="btn-elha-primary w-full h-12 gap-2" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" size={16} /> : <LogIn size={16} />}
                Entrar
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-[#4A7A5C]">
                Ainda não tem conta?{" "}
                <Link to="/register" className="font-medium text-[#1C3A2B] underline underline-offset-4">
                  Criar agora
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;