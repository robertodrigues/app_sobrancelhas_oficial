"use client";

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, Loader2, CheckCircle } from "lucide-react";
import { useSignUp } from "@/lib/auth";
import { showError, showSuccess } from "@/utils/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Register = () => {
  const { isLoaded, signUp, setActive, isMock } = useSignUp();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Estados para a etapa de verificação de e-mail
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isLoaded) return;

    if (!firstName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      showError("Preencha todos os campos obrigatórios.");
      return;
    }

    if (password !== confirmPassword) {
      showError("As senhas não conferem.");
      return;
    }

    if (password.length < 8) {
      showError("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }

    setLoading(true);

    try {
      const result = await signUp.create({
        emailAddress: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
      });

      // Se for mock ou se já completou direto
      if (isMock || result.status === "complete") {
        if (setActive) {
          await setActive({ session: result.createdSessionId });
        }
        showSuccess("Cadastro realizado com sucesso!");
        navigate("/");
      } else {
        // Se o Clerk exigir verificação de e-mail (padrão)
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        setPendingVerification(true);
        showSuccess("Código de verificação enviado para o seu e-mail!");
      }
    } catch (err: any) {
      showError(err.errors?.[0]?.message || "Erro ao realizar cadastro.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isLoaded) return;

    if (!code.trim()) {
      showError("Digite o código de verificação.");
      return;
    }

    setLoading(true);

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: code.trim(),
      });

      if (completeSignUp.status === "complete") {
        if (setActive) {
          await setActive({ session: completeSignUp.createdSessionId });
        }
        showSuccess("E-mail verificado e conta criada com sucesso!");
        navigate("/");
      } else {
        showError("Não foi possível concluir o cadastro. Verifique o código.");
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
          <p className="font-label-category text-[10px] text-[#4A7A5C] mb-2">Novo acesso</p>
          <h1 className="font-heading text-3xl text-[#1C3A2B]">Criar conta</h1>
          <p className="font-body text-sm text-[#4A7A5C] mt-2">Cadastre-se para acessar o sistema.</p>
        </div>

        <Card className="border border-[#D4C9B5] bg-[#E8DECE] rounded-3xl shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="font-heading text-xl text-[#1C3A2B]">
              {pendingVerification ? "Verifique seu E-mail" : "Cadastro"}
            </CardTitle>
            <CardDescription className="text-[#4A7A5C]">
              {pendingVerification 
                ? "Insira o código de 6 dígitos enviado para o seu e-mail." 
                : "Use um e-mail válido para criar sua conta."}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {!pendingVerification ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="font-label-category text-[10px] text-[#1C3A2B]">
                      Nome *
                    </Label>
                    <Input
                      id="firstName"
                      placeholder="Maria"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="bg-[#F5F0E8] border-[#D4C9B5] text-[#1C3A2B] placeholder:text-[#4A7A5C]/60 h-11 rounded-xl text-sm focus-visible:ring-[#1C3A2B]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="font-label-category text-[10px] text-[#1C3A2B]">
                      Sobrenome
                    </Label>
                    <Input
                      id="lastName"
                      placeholder="Silva"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="bg-[#F5F0E8] border-[#D4C9B5] text-[#1C3A2B] placeholder:text-[#4A7A5C]/60 h-11 rounded-xl text-sm focus-visible:ring-[#1C3A2B]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="font-label-category text-[10px] text-[#1C3A2B]">
                    E-mail *
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
                    Senha *
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-[#F5F0E8] border-[#D4C9B5] text-[#1C3A2B] placeholder:text-[#4A7A5C]/60 h-11 rounded-xl text-sm focus-visible:ring-[#1C3A2B]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="font-label-category text-[10px] text-[#1C3A2B]">
                    Confirmar senha *
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Repita a senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-[#F5F0E8] border-[#D4C9B5] text-[#1C3A2B] placeholder:text-[#4A7A5C]/60 h-11 rounded-xl text-sm focus-visible:ring-[#1C3A2B]"
                  />
                </div>

                <Button type="submit" className="btn-elha-primary w-full h-12 gap-2 mt-2" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" size={16} /> : <UserPlus size={16} />}
                  Criar conta
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code" className="font-label-category text-[10px] text-[#1C3A2B]">
                    Código de Verificação
                  </Label>
                  <Input
                    id="code"
                    placeholder="Digite o código de 6 dígitos"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="bg-[#F5F0E8] border-[#D4C9B5] text-[#1C3A2B] placeholder:text-[#4A7A5C]/60 h-11 rounded-xl text-sm text-center font-mono tracking-widest focus-visible:ring-[#1C3A2B]"
                  />
                </div>

                <Button type="submit" className="btn-elha-primary w-full h-12 gap-2 mt-2" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                  Confirmar Código
                </Button>
              </form>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-[#4A7A5C]">
                Já tem conta?{" "}
                <Link to="/login" className="font-medium text-[#1C3A2B] underline underline-offset-4">
                  Entrar
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;