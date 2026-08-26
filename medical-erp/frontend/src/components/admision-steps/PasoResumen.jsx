import { CheckCircle, User, Ruler, CreditCard, Send, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function PasoResumen({ formData, mediciones, membresias, firmaSent }) {
  const { t } = useTranslation('patients');
  const peso = parseFloat(mediciones.peso) || 0;
  const estatura = parseFloat(mediciones.estatura) || 0;
  const imc = peso && estatura ? (peso / ((estatura / 100) ** 2)).toFixed(1) : '--';

  const sections = [
    { icon: User, label: t('identificacion'), done: !!formData.licenciaConducir && !!formData.apellidoPaterno && !!formData.nombres },
    { icon: FileText, label: t('datos_personales'), done: !!formData.fechaNacimiento || !!formData.sexo },
    { icon: FileText, label: t('contacto'), done: !!formData.telefono || !!formData.email },
    { icon: Ruler, label: t('mediciones'), done: peso > 0 && estatura > 0 },
    { icon: CreditCard, label: t('membresia'), done: membresias.length > 0 },
    { icon: Send, label: t('firma'), done: firmaSent },
  ];

  return (
    <div className="wizard-step">
      <div className="wizard-step__header">
        <CheckCircle size={24} />
        <h3>{t('resumen_admision')}</h3>
        <p>{t('revise_datos_confirmar')}</p>
      </div>

      <div className="wizard-step__resumen">
        <div className="wizard-step__resumen-section">
          <h4><User size={16} /> {t('identificacion')}</h4>
          <div className="wizard-step__resumen-grid">
            <span><strong>{t('id')}:</strong> {formData.licenciaConducir || '-'}</span>
            <span><strong>{t('apellido_paterno')}:</strong> {formData.apellidoPaterno || '-'}</span>
            <span><strong>{t('nombres')}:</strong> {formData.nombres || '-'}</span>
          </div>
        </div>

        <div className="wizard-step__resumen-section">
          <h4><FileText size={16} /> {t('datos_personales')}</h4>
          <div className="wizard-step__resumen-grid">
            <span><strong>{t('fecha_nac')}:</strong> {formData.fechaNacimiento || '-'}</span>
            <span><strong>{t('sexo')}:</strong> {formData.sexo || '-'}</span>
            <span><strong>{t('estado_civil')}:</strong> {formData.estadoCivil || '-'}</span>
            <span><strong>{t('ocupacion')}:</strong> {formData.ocupacion || '-'}</span>
          </div>
        </div>

        <div className="wizard-step__resumen-section">
          <h4><Ruler size={16} /> {t('mediciones')}</h4>
          <div className="wizard-step__resumen-grid">
            <span><strong>{t('peso')}:</strong> {peso ? `${peso} kg` : '-'}</span>
            <span><strong>{t('estatura')}:</strong> {estatura ? `${estatura} cm` : '-'}</span>
            <span><strong>{t('imc')}:</strong> {imc}</span>
          </div>
        </div>

        <div className="wizard-step__resumen-section">
          <h4><CreditCard size={16} /> {t('membresia')}</h4>
          {membresias.length > 0 ? (
            <div className="wizard-step__resumen-grid">
              {membresias.map(m => (
                <span key={m.id}><strong>{m.tipo}:</strong> {m.fechaInicio} — {m.fechaFin && m.fechaFin !== '2099-12-31' ? m.fechaFin : t('por_vida')} ({m.vigente ? t('vigente') : m.estado})</span>
              ))}
            </div>
          ) : (
            <span className="wizard-step__resumen-empty">{t('sin_membresia_registrada')}</span>
          )}
        </div>

        <div className="wizard-step__resumen-section">
          <h4><Send size={16} /> {t('firma')}</h4>
          {firmaSent ? (
            <span className="wizard-step__resumen-ok"><CheckCircle size={16} /> {t('enlace_firma_enviado')}</span>
          ) : (
            <span className="wizard-step__resumen-pending">{t('pendiente_envio_firma')}</span>
          )}
        </div>
      </div>
    </div>
  );
}
