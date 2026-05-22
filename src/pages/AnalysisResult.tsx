import React from 'react';
import { useLocation } from 'react-router-dom';
import { showSuccess, showError } from '@/utils/toast';

const AnalysisResult = () => {
const location = useLocation();
  const { analysis, image, allImages } = location.state || {};

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <h1 className="text-xl font-bold text-center text-slate-900">
        {analysis.isComparativo ? 'Relatório de Evolução' : 'Relatório Técnico'}
      </h1>
      {/* Additional content can be added here based on the analysis data */}
    </div>
  );
};

export default AnalysisResult;