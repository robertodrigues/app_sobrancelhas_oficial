"use client";

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, Loader2, KeyRound, ArrowLeft, CheckCircle } from "lucide-react";
import { useSignIn } from "@/lib/auth";
import { showError, showSuccess } from "@/utils/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginStep = "login" | "forgot-email" | "forgot-code";

const Login = () => {
  const { isLoaded, signIn, setActive, isMock } = useSignIn();
  const navigate = useNavigate();
  
  // Estados do formulário
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Estados do fluxo "Esqueci minha senha"
  const [step, setStep] = useState<LoginStep>("login");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
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
        if (setActive) {
          await setActive({ session: result.createdSessionId });
        }
        showSuccess("Login realizado com sucesso!");
        navigate("/");
      } else {
        showError("Não foi possível concluir o login. Verifique seus dados.");
      }
    } catch (err: any) {
      showError(err.errors?.[0]?.message || "Erro ao realizar login. Verifique suas credenciais.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isLoaded) return;

    if (!email.trim()) {
      showError("Digite seu e-mail para receber o código.");
      return;
    }

    setLoading(true);

    try {
      if (isMock) {
        showSuccess("Código de teste enviado com sucesso!");
        setStep("forgot-code");
      } else {
        await signIn.create({
          strategy: "reset_password_email_code",
          identifier: email.trim(),
        });
        showSuccess("Código de redefinição enviado para o seu e-mail!");
        setStep("forgot-code");
      }
    } catch (err: any) {
      showError(err.errors?.[0]?.message || "Erro ao enviar código de redefinição.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isLoaded) return;

    if (!resetCode.trim() || !newPassword.trim()) {
      showError("Preencha o código e a nova senha.");
      return;
    }

    if (newPassword.length < 8) {
      showError("A nova senha precisa ter pelo menos 8 caracteres.");
      return;
    }

    setLoading(true);

    try {
      if (isMock) {
        showSuccess("Senha redefinida com sucesso (Modo de Teste)!");
        setStep("login");
      } else {
        const result = await signIn.attemptFirstFactor({
          strategy: "reset_password_email_code",
          code: resetCode.trim(),
          password: newPassword,
        });

        if (result.status === "complete") {
          if (setActive) {
            await setActive({ session: result.createdSessionId });
          }
          showSuccess("Senha redefinida e login realizado com sucesso!");
          navigate("/");
        } else {
          showError("Não foi possível redefinir a senha. Verifique o código.");
        }
      }
    } catch (err: any) {
      showError(err.errors?.[0]?.message || "Código inválido ou expirado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#1C3A2B] px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <p className="font-label-category text-[10px] text-[#4A7A5C] mb-2">Acesso ao sistema</p>
          <h1 className="font-heading text-3xl text-[#1C3A2B]">
            {step === "login" ? "Entrar" : "Recuperar Senha"}
          </h1>
          <p className="font-body text-sm text-[#4A7A5C] mt-2">
            {step === "login" 
              ? "Faça login para continuar." 
              : "Siga as etapas para redefinir sua senha."}
          </p>
        </div>

        <Card className="border border-[#D4C9B5] bg-[#E8DECE] rounded-3xl shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="font-heading text-xl text-[#1C3A2B]">
              {step === "login" && "Bem-vinda"}
              {step === "forgot-email" && "Esqueci minha senha"}
              {step === "forgot-code" && "Nova Senha"}
            </CardTitle>
            <CardDescription className="text-[#4A7A5C]">
              {step === "login" && "Entre com seu e-mail e senha cadastrados."}
              {step === "forgot-email" && "Insira seu e-mail para receber o código de verificação."}
              {step === "forgot-code" && "Insira o código recebido e defina sua nova senha."}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {step === "login" && (
              <form onSubmit={handleLogin} className="space-y-5">
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
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password" className="font-label-category text-[10px] text-[#1C3A2B]">
                      Senha
                    </Label>
                    <button
                      type="button"
                      onClick={() => setStep("forgot-email")}
                      className="text-xs text-[#4A7A5C] hover:text-[#1C3A2B] underline"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
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
            )}

            {step === "forgot-email" && (
              <form onSubmit={handleSendResetCode} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="reset-email" className="font-label-category text-[10px] text-[#1C3A2B]">
                    E-mail Cadastrado
                  </Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="voce@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-[#F5F0E8] border-[#D4C9B5] text-[#1C3A2B] placeholder:text-[#4A7A5C]/60 h-11 rounded-xl text-sm focus-visible:ring-[#1C3A2B]"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep("login")}
                    className="btn-elha-outline flex-1 h-12 gap-2"
                    disabled={loading}
                  >
                    <ArrowLeft size={14} />
                    Voltar
                  </Button>
                  <Button type="submit" className="btn-elha-primary flex-1 h-12 gap-2" disabled={loading}>
                    {loading ? <Loader2 className="animate-spin" size={16} /> : <KeyRound size={16} />}
                    Enviar Código
                  </Button>
                </div>
              </form>
            )}

            {step === "forgot-code" && (
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="reset-code" className="font-label-category text-[10px] text-[#1C3A2B]">
                    Código de Verificação
                  </Label>
                  <Input
                    id="reset-code"
                    placeholder="Digite o código de 6 dígitos"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    className="bg-[#F5F0E8] border-[#D4C9B5] text-[#1C3A2B] placeholder:text-[#4A7A5C]/60 h-11 rounded-xl text-sm text-center font-mono tracking-widest focus-visible:ring-[#1C3A2B]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password" className="font-label-category text-[10px] text-[#1C3A2B]">
                    Nova Senha
                  </Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-[#F5F0E8] border-[#D4C9B5] text-[#1C3A2B] placeholder:text-[#4A7A5C]/60 h-11 rounded-xl text-sm focus-visible:ring-[#1C3A2B]"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep("forgot-email")}
                    className="btn-elha-outline flex-1 h-12 gap-2"
                    disabled={loading}
                  >
                    <ArrowLeft size={14} />
                    Voltar
                  </Button>
                  <Button type="submit" className="btn-elha-primary flex-1 h-12 gap-2" disabled={loading}>
                    {loading ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                    Alterar Senha
                  </Button>
                </div>
              </form>
            )}

            {step === "login" && (
              <div className="mt-6 text-center">
                <p className="text-sm text-[#4A7A5C]">
                  Ainda não tem conta?{" "}
                  <Link to="/register" className="font-medium text-[#1C3A2B] underline underline-offset-4">
                    Criar agora
                  </Link>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;