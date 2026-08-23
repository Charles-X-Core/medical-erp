import { Send, ExternalLink, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function PasoFirma({ pacienteId, pacienteNombre, onSendFirma }) {
  const { t } = useTranslation('patients');
  const { t: tContract } = useTranslation('contracts');
  const [sent, setSent] = useState(false);
  const [link, setLink] = useState('');

  const handleSend = () => {
    const token = btoa(`admision:${pacienteId}:${Date.now()}`);
    const firmaLink = `${window.location.origin}/firma?token=${token}&pacienteId=${pacienteId}`;
    setLink(firmaLink);
    setSent(true);
    if (onSendFirma) onSendFirma(firmaLink);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(link);
  };

  return (
    <div className="wizard-step">
      <div className="wizard-step__header">
        <Send size={24} />
        <h3>{t('firma_cliente')}</h3>
        <p>{t('cliente_debe_firmar')}</p>
      </div>

      <div className="wizard-step__firma-content">
        {!sent ? (
          <>
            <div className="wizard-step__firma-info">
              <p>{t('completar_registro_firma')}</p>
              <p>{t('click_enviar_enlace_firma')}</p>
            </div>
            <button className="wizard-step__btn-firma" onClick={handleSend}>
              <Send size={18} /> {tContract('enviar_enlace_firma')}
            </button>
          </>
        ) : (
          <div className="wizard-step__firma-sent">
            <CheckCircle size={48} className="wizard-step__firma-check" />
            <h4>{tContract('enlace_generado')}</h4>
            <p>{tContract('compartir_enlace_cliente')}</p>
            <div className="wizard-step__firma-link-box">
              <input readOnly value={link} className="wizard-step__firma-link" />
              <button className="wizard-step__btn-copy" onClick={handleCopyLink}>
                <ExternalLink size={16} /> {tContract('copiar')}
              </button>
            </div>
            <p className="wizard-step__firma-note">
              {tContract('cliente_abrira_pagina')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
