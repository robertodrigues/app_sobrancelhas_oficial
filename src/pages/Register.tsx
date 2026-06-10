"use client";

import React, { useState } from "react";
import { SignUp } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { showSuccess } from "@/utils/toast";

const Register = () => {
  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#1C3A2B] px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <p className="font-label-category text-[10px] text-[#4A7A5C] mb-2">Novo acesso</p>
          <h1 className="font-heading text-3xl text-[#1C3A2B]">Criar conta</h1>
          <p className="font-body text-sm text-[#4A7A5C] mt-2">Cadastre-se para acessar o sistema.</p>
        </div>

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

        <div className="text-center pt-2">
          <p className="text-xs text-[#4A7A5C]">
            Já tem uma conta? <Link to="/login" className="text-[#1C3A2B] font-medium underline">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;