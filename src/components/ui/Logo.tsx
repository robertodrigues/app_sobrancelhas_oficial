import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "w-32 h-32" }) => {
  return (
    <svg 
      viewBox="0 0 200 200" 
      className={className}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Círculo de Fundo Verde Escuro */}
      <circle cx="100" cy="100" r="95" fill="#1C3A2B" />
      
      {/* Arco Principal (Sobrancelha) Creme */}
      <path 
        d="M 52 98 C 75 65, 115 65, 148 85" 
        stroke="#E8DECE" 
        strokeWidth="4" 
        strokeLinecap="round" 
      />
      
      {/* Linha Fina de Apoio Verde Sage */}
      <path 
        d="M 54 101 C 76 69, 114 69, 146 88" 
        stroke="#4A7A5C" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
      />
      
      {/* Ponto de Marcação Técnico */}
      <circle cx="122" cy="74" r="7" stroke="#8FAF8A" strokeWidth="1" opacity="0.6" />
      <circle cx="122" cy="74" r="3.5" fill="#8FAF8A" />
      
      {/* Linha Divisória Fina */}
      <line x1="72" y1="112" x2="128" y2="112" stroke="#4A7A5C" strokeWidth="0.75" opacity="0.5" />
      
      {/* Texto ELHA */}
      <text 
        x="104" 
        y="138" 
        fill="#E8DECE" 
        fontSize="22" 
        fontFamily="Georgia, serif" 
        letterSpacing="8" 
        textAnchor="middle"
      >
        ELHA
      </text>
    </svg>
  );
};

export default Logo;