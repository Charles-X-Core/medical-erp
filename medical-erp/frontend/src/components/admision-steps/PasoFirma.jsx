import { Send, ExternalLink, CheckCircle } from 'lucide-react';
import { useState } from 'react';

export default function PasoFirma({ pacienteId, pacienteNombre, onSendFirma }) {
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
        <h3>Firma del Paciente</h3>
        <p>El paciente debe firmar el documento de admision</p>
      </div>

      <div className="wizard-step__firma-content">
        {!sent ? (
          <>
            <div className="wizard-step__firma-info">
              <p>Para completar el registro, el paciente debe firmar el documento de admision y membresia.</p>
              <p>Haga click en "Enviar enlace de firma" para generar un link que el paciente podra abrir en la laptop para firmar.</p>
            </div>
            <button className="wizard-step__btn-firma" onClick={handleSend}>
              <Send size={18} /> Enviar enlace de firma
            </button>
          </>
        ) : (
          <div className="wizard-step__firma-sent">
            <CheckCircle size={48} className="wizard-step__firma-check" />
            <h4>Enlace generado</h4>
            <p>Comparta este enlace con el paciente para que firme en la laptop:</p>
            <div className="wizard-step__firma-link-box">
              <input readOnly value={link} className="wizard-step__firma-link" />
              <button className="wizard-step__btn-copy" onClick={handleCopyLink}>
                <ExternalLink size={16} /> Copiar
              </button>
            </div>
            <p className="wizard-step__firma-note">
              El paciente abrira una pagina con el documento y podra firmar con el mouse o pantalla tactil.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
