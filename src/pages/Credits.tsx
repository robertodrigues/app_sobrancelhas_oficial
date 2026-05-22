import React from 'react';
import { useLocation } from 'react-router-dom';
import { showSuccess, showError } from '@/utils/toast';

const Credits = () => {
  const location = useLocation();
  
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <h1 className="text-xl font-bold text-center text-slate-900">
        Gerenciamento de Créditos
      </h1>
      {/* Additional content can be added here */}
    </div>
  );
};

export default Credits;