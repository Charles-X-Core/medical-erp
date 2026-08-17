import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Stethoscope } from 'lucide-react';
import TopBar from './TopBar';

export default function ClinicalLayout({ children, paciente, titulo }) {
  const navigate = useNavigate();

  return (
    <div className="clinical-layout">
      {/* Header */}
      <header className="clinical-layout__header">
        <button className="clinical-layout__back" onClick={() => navigate('/atencion')}>
          <ArrowLeft size={18} />
          <span>Atención Clínica</span>
        </button>

        <div className="clinical-layout__title-area">
          <Stethoscope size={20} className="clinical-layout__icon" />
          <div className="clinical-layout__title-text">
            {paciente && (
              <span className="clinical-layout__patient-name">
                {paciente.apellidoPaterno} {paciente.apellidoMaterno || ''}, {paciente.nombres}
              </span>
            )}
            {titulo && (
              <span className="clinical-layout__subtitle">{titulo}</span>
            )}
          </div>
        </div>

        <div className="clinical-layout__topbar-area">
          <TopBar />
        </div>
      </header>

      {/* Content */}
      <main className="clinical-layout__content">
        {children}
      </main>
    </div>
  );
}
