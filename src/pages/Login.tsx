"use client";

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showSuccess, showError } from "@/utils/toast";
import { isClerkConfigured, useSignIn } from "@/lib/auth";
import { Loader2, LogIn, ShieldCheck, Mail } from "lucide-react";
import Logo from "@/components/ui/Logo";

type LoginStep = "credentials" | "verify-email" | "reset-password";

const Login = () => {
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();
  const { signIn, setActive, isLoaded } = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [step, setStep] = useState<LoginStep>("credentials");

  useEffect(() => {
    if (isSignedIn) {
      window.location.href = "/";
    }
  }, [isSignedIn]);

  const startEmailVerification = async () => {
    if (!email.trim()) {
      showError("Por favor, informe seu e-mail.");
      return;
    }

    if (!isLoaded) return;

    setVerificationLoading(true);

    try {
      if (isClerkConfigured) {
        const signInAttempt = await signIn.create({
          identifier: email.trim(),
        });

        if (signInAttempt.status === "complete") {
          await setActive({ session: signInAttempt.createdSessionId });
          await new Promise(resolve => setTimeout(resolve, 300));
          showSuccess("Login realizado com sucesso!");
          window.location.href = "/";
          return;
        }

        const emailFactor = signInAttempt.supportedFirstFactors?.find(
          (factor: any) => factor.strategy === "email_code",
        );

        const emailAddressId = emailFactor?.emailAddressId;

        if (!emailAddressId) {
          throw new Error("Não foi possível iniciar o login por código.");
        }

        await signIn.prepareFirstFactor({
          strategy: "email_code",
          emailAddressId,
        });
      }

      setStep("verify-email");
      showSuccess("Enviamos um código de confirmação para seu e-mail.");
    } catch (err: any) {
      console.error("Erro ao iniciar verificação por e-mail:", err);
      showError(
        err?.errors?.[0]?.longMessage ||
          err?.errors?.[0]?.message ||
          err?.message ||
          "Não foi possível enviar o código.",
      );
    } finally {
      setVerificationLoading(false);
    }
  };

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
        const signInAttempt = await signIn.create({
          identifier: email.trim(),
          password,
        });

        if (signInAttempt.status === "complete") {
          await setActive({ session: signInAttempt.createdSessionId });
          await new Promise(resolve => setTimeout(resolve, 300));
          showSuccess("Login realizado com sucesso!");
          window.location.href = "/";
          return;
        }

        throw new Error("Não foi possível completar o login. Verifique suas credenciais.");
      }

      showSuccess("Login simulado realizado com sucesso!");
      window.location.href = "/";
    } catch (err: any) {
      console.error("Erro de login:", err);

      const message =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        err?.message ||
        "Erro ao realizar login.";

      showError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!verificationCode.trim()) {
      showError("Digite o código enviado por e-mail.");
      return;
    }

    if (!isLoaded) return;

    setVerificationLoading(true);

    try {
      const verificationAttempt = await signIn.attemptFirstFactor({
        strategy: "email_code",
        code: verificationCode.trim(),
      });

      if (verificationAttempt.status === "complete") {
        await setActive({ session: verificationAttempt.createdSessionId });
        await new Promise(resolve => setTimeout(resolve, 300));
        showSuccess("Login confirmado com sucesso!");
        window.location.href = "/";
        return;
      }

      showError("Não foi possível confirmar o acesso. Tente novamente.");
    } catch (err: any) {
      console.error("Erro ao verificar código:", err);
      showError(
        err?.errors?.[0]?.longMessage ||
          err?.errors?.[0]?.message ||
          err?.message ||
          "Código inválido ou expirado.",
      );
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email.trim()) {
      showError("Digite seu e-mail antes de reenviar o código.");
      return;
    }

    if (!isLoaded) return;

    setVerificationLoading(true);

    try {
      if (isClerkConfigured) {
        const signInAttempt = await signIn.create({
          identifier: email.trim(),
        });

        const emailFactor = signInAttempt.supportedFirstFactors?.find(
          (factor: any) => factor.strategy === "email_code",
        );

        const emailAddressId = emailFactor?.emailAddressId;

        if (!emailAddressId) {
          throw new Error("Não foi possível reenviar o código.");
        }

        await signIn.prepareFirstFactor({
          strategy: "email_code",
          emailAddressId,
        });
      }

      setStep("verify-email");
      showSuccess("Código reenviado para seu e-mail.");
    } catch (err: any) {
      console.error("Erro ao reenviar código:", err);
      showError(
        err?.errors?.[0]?.longMessage ||
          err?.errors?.[0]?.message ||
          err?.message ||
          "Não foi possível reenviar o código.",
      );
    } finally {
      setVerificationLoading(false);
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
        await signIn.create({
          strategy: "reset_password_email_code",
          identifier: email.trim(),
        });
      }
      setStep("reset-password");
      showSuccess("Código de redefinição enviado para seu e‑mail.");
    } catch (err: any) {
      showError(err.errors?.[0]?.message || "Erro ao enviar código de redefinição.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetCode.trim() || !newPassword.trim()) {
      showError("Por favor, preencha o código e a nova senha.");
      return;
    }
    setLoading(true);
    try {
      if (isClerkConfigured) {
        const result = await signIn.attemptFirstFactor({
          strategy: "reset_password_email_code",
          code: resetCode.trim(),
          password: newPassword.trim(),
        });
        if (result.status === "complete") {
          await setActive({ session: result.createdSessionId });
          await new Promise(resolve => setTimeout(resolve, 300));
          showSuccess("Senha redefinida e login realizado com sucesso!");
          window.location.href = "/";
          return;
        }
      } else {
        showSuccess("Simulação: Senha redefinida com sucesso!");
        setStep("credentials");
      }
    } catch (err: any) {
      showError(err.errors?.[0]?.message || "Erro ao redefinir senha. Verifique o código.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#1C3A2B] px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center -translate-y-[4%]">
        <div className="mb-6 mt-4 flex justify-center">
          <Logo className="w-28 h-28 drop-shadow-md" />
        </div>

        <div className="text-center mb-6">
          <h1 className="font-heading text-3xl text-[#1C3A2B]">Entrar</h1>
          <p className="font-body text-sm text-[#4A7A5C] mt-2">
            Faça login para continuar.
          </p>
        </div>

        {step === "credentials" ? (
          <form
            onSubmit={handleLogin}
            className="w-full space-y-5 bg-[#E8DECE] p-6 rounded-3xl shadow-sm border border-[#D4C9B5]"
          >
            <div className="space-y-2">
              <Label htmlFor="email" className="font-label-category text-[10px] text-[#1C3A2B]">
                Seu e-mail
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Digite o endereço de e-mail"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || verificationLoading}
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
              <Label htmlFor="password" className="font-label-category text-[10px] text-[#1C3A2B]">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || verificationLoading}
                className="bg-[#F5F0E8] border-[#D4C9B5] text-[#1C3A2B] placeholder-[#4A7A5C]/70 h-11 rounded-xl text-sm focus-visible:ring-[#1C3A2B]"
              />
            </div>

            <Button type="submit" className="btn-elha-primary w-full gap-2 h-12" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : <><LogIn size={14} /> Entrar</>}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={startEmailVerification}
              disabled={verificationLoading || loading}
              className="btn-elha-outline w-full h-12 gap-2"
            >
              {verificationLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <Mail size={14} />
                  Entrar com código
                </>
              )}
            </Button>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#4A7A5C]/70 pt-2 border-t border-[#D4C9B5]/40">
              <ShieldCheck size={14} className="text-[#4A7A5C]" />
              <span className="font-label-category text-[8px] tracking-[2px] uppercase">
                Secured by Clerk
              </span>
            </div>
          </form>
        ) : step === "reset-password" ? (
          <form
            onSubmit={handleResetPassword}
            className="w-full space-y-5 bg-[#E8DECE] p-6 rounded-3xl shadow-sm border border-[#D4C9B5]"
          >
            <div className="rounded-2xl border border-[#D4C9B5] bg-[#F5F0E8] p-4 text-center">
              <Mail className="mx-auto mb-2 text-[#4A7A5C]" size={18} />
              <p className="font-heading text-sm text-[#1C3A2B]">Redefinir Senha</p>
              <p className="mt-1 text-xs text-[#4A7A5C]">
                Enviamos um código de redefinição para <span className="font-medium">{email}</span>.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resetCode" className="font-label-category text-[10px] text-[#1C3A2B]">
                Código de verificação
              </Label>
              <Input
                id="resetCode"
                type="text"
                inputMode="numeric"
                placeholder="Digite o código de 6 dígitos"
                required
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                disabled={loading}
                className="bg-[#F5F0E8] border-[#D4C9B5] text-[#1C3A2B] placeholder-[#4A7A5C]/70 h-11 rounded-xl text-sm focus-visible:ring-[#1C3A2B]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="font-label-category text-[10px] text-[#1C3A2B]">
                Nova Senha
              </Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Digite sua nova senha"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
                className="bg-[#F5F0E8] border-[#D4C9B5] text-[#1C3A2B] placeholder-[#4A7A5C]/70 h-11 rounded-xl text-sm focus-visible:ring-[#1C3A2B]"
              />
            </div>

            <Button
              type="submit"
              className="btn-elha-primary w-full gap-2 h-12"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>Redefinir e Entrar</>
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep("credentials")}
              disabled={loading}
              className="w-full h-11 text-[#4A7A5C] hover:text-[#1C3A2B] hover:bg-[#F5F0E8]"
            >
              Voltar para o Login
            </Button>
          </form>
        ) : (
          <form
            onSubmit={handleVerifyCode}
            className="w-full space-y-5 bg-[#E8DECE] p-6 rounded-3xl shadow-sm border border-[#D4C9B5]"
          >
            <div className="rounded-2xl border border-[#D4C9B5] bg-[#F5F0E8] p-4 text-center">
              <Mail className="mx-auto mb-2 text-[#4A7A5C]" size={18} />
              <p className="font-heading text-sm text-[#1C3A2B]">Confirme o acesso</p>
              <p className="mt-1 text-xs text-[#4A7A5C]">
                Enviamos um código para <span className="font-medium">{email}</span>.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="verificationCode" className="font-label-category text-[10px] text-[#1C3A2B]">
                Código de verificação
              </Label>
              <Input
                id="verificationCode"
                type="text"
                inputMode="numeric"
                placeholder="Digite o código"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                disabled={verificationLoading}
                className="bg-[#F5F0E8] border-[#D4C9B5] text-[#1C3A2B] placeholder-[#4A7A5C]/70 h-11 rounded-xl text-sm focus-visible:ring-[#1C3A2B]"
              />
            </div>

            <Button
              type="submit"
              className="btn-elha-primary w-full gap-2 h-12"
              disabled={verificationLoading}
            >
              {verificationLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>Confirmar acesso</>
              )}
            </Button>

            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleResendCode}
                disabled={verificationLoading}
                className="btn-elha-outline w-full h-11"
              >
                Reenviar código
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep("credentials")}
                disabled={verificationLoading}
                className="w-full h-11 text-[#4A7A5C] hover:text-[#1C3A2B] hover:bg-[#F5F0E8]"
              >
                Voltar
              </Button>
            </div>
          </form>
        )}

        <div className="text-center pt-6 w-full">
          <p className="text-xs text-[#4A7A5C]">
            Não tem uma conta?{" "}
            <Link to="/register" className="text-[#1C3A2B] font-medium underline">
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;