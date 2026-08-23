import { FileText, Calendar, TrendingUp, DollarSign, CheckCircle } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function PasoResumen({ formData, updateFormData }) {
  const { t } = useTranslation('clinical');
  const { t: tP } = useTranslation('patients');
  const { t: tCommon } = useTranslation('common');
  const { paciente, enfermedad, diagnostico, evidencias, recetas, tratamientos, resumen } = formData;

  const costoTotal = tratamientos.reduce((sum, tr) => sum + (parseFloat(tr.costoTotal) || 0), 0);

  // Auto-derive tipoTratamiento from treatment categories
  useEffect(() => {
    if (tratamientos.length > 0 && !resumen.tipoTratamiento) {
      const categorias = [...new Set(tratamientos.map((tr) => tr.categoria).filter(Boolean))];
      if (categorias.length > 0) {
        updateFormData('resumen', { tipoTratamiento: categorias.join(', ') });
      }
    }
  }, [tratamientos]);

  // Auto-set sesionesRealizadas to 1 if treatments exist and not yet set
  useEffect(() => {
    if (tratamientos.length > 0 && resumen.sesionesRealizadas === 0) {
      updateFormData('resumen', { sesionesRealizadas: 1 });
    }
  }, [tratamientos]);

  return (
    <div className="wizard-step">
      <h2 className="wizard-step__title">
        <CheckCircle size={20} />
        {tP('resumen_sesion')}
      </h2>

      {/* Patient Summary */}
      <div className="wizard-card">
        <h3 className="wizard-card__subtitle">
          <FileText size={16} />
          {t('datos_paciente')}
        </h3>
        <div className="wizard-grid wizard-grid--3">
          <div className="wizard-field">
            <label>{tP('nombre_completo')}</label>
            <span>{paciente?.apellidoPaterno} {paciente?.nombres}</span>
          </div>
          <div className="wizard-field">
            <label>{tP('id_number_placeholder')}</label>
            <span>{paciente?.licenciaConducir || '-'}</span>
          </div>
          <div className="wizard-field">
            <label>{tP('motivo')}</label>
            <span>{enfermedad.motivo || '-'}</span>
          </div>
        </div>
      </div>

      {/* Diagnosis Summary */}
      <div className="wizard-card">
        <h3 className="wizard-card__subtitle">{t('diagnostico')}</h3>
        {diagnostico.diagnosticoTexto ? (
          <div className="wizard-diagnostico-texto">
            {diagnostico.diagnosticoTexto.split('\n').map((line, i) => (
              <div key={i} className="wizard-list__item">
                <span>{line}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="wizard-text--muted">{t('sin_diagnosticos')}</p>
        )}
      </div>

      {/* Treatment Summary */}
      <div className="wizard-card">
        <h3 className="wizard-card__subtitle">{t('tratamientos')}</h3>
        {tratamientos.length > 0 ? (
          <div className="wizard-list">
            {tratamientos.map((tr, i) => (
              <div key={i} className="wizard-list__item">
                <span>{tr.procedimientoRealizado}</span>
                <span className="wizard-list__cost">${parseFloat(tr.costoTotal || 0).toFixed(2)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="wizard-text--muted">{tP('sin_tratamientos_registrados')}</p>
        )}
        {tratamientos.length > 0 && (
          <div className="wizard-total wizard-total--small">
            <span>{tP('total_costo')}</span>
            <span>${costoTotal.toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Recetas Summary */}
      <div className="wizard-card">
        <h3 className="wizard-card__subtitle">{tP('recetas')}</h3>
        {recetas.length > 0 ? (
          <div className="wizard-list">
            {recetas.map((r, i) => (
              <div key={i} className="wizard-list__item wizard-list__item--column">
                <span className="wizard-list__receta-title">{tP('receta')} {i + 1}</span>
                {r.medicamentos.map((med, j) => (
                  <span key={j} className="wizard-list__med">
                    {med.nombre} {med.dosis} — {med.frecuencia} × {med.duracion}
                  </span>
                ))}
                {r.indicaciones && (
                  <span className="wizard-list__indicaciones">{tP('indicaciones')}: {r.indicaciones}</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="wizard-text--muted">{tP('sin_recetas')}</p>
        )}
      </div>

      {/* Evidencias count */}
      <div className="wizard-card">
        <h3 className="wizard-card__subtitle">{tP('evidencias_fotograficas')}</h3>
        <p>{evidencias.length} {tP('fotos_adjuntas')}</p>
      </div>

      {/* Resumen fields */}
      <div className="wizard-card">
        <h3 className="wizard-card__subtitle">{tP('resumen_tratamiento')}</h3>
        <div className="wizard-grid wizard-grid--1">
          <div className="wizard-field">
            <label><TrendingUp size={14} /> {tP('tipo_tratamiento_label')}</label>
            <input
              className="wizard-input"
              value={resumen.tipoTratamiento}
              onChange={(e) => updateFormData('resumen', { tipoTratamiento: e.target.value })}
              placeholder={tP('tipo_tratamiento_placeholder')}
            />
          </div>
          <div className="wizard-grid wizard-grid--2">
            <div className="wizard-field">
              <label>{t('sesiones_realizadas')}</label>
              <input
                className="wizard-input"
                type="number"
                min="0"
                value={resumen.sesionesRealizadas}
                onChange={(e) => updateFormData('resumen', { sesionesRealizadas: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="wizard-field">
              <label><Calendar size={14} /> {tP('proxima_fecha')}</label>
              <input
                className="wizard-input"
                type="date"
                value={resumen.proximaFecha}
                onChange={(e) => updateFormData('resumen', { proximaFecha: e.target.value })}
              />
            </div>
          </div>
          <div className="wizard-field">
            <label>{tP('evolucion_mejoria')}</label>
            <textarea
              className="wizard-textarea"
              rows={3}
              value={resumen.evolucionMejoria}
              onChange={(e) => updateFormData('resumen', { evolucionMejoria: e.target.value })}
              placeholder={tP('evolucion_mejoria_placeholder')}
            />
          </div>
        </div>
      </div>

      {/* Total Cost */}
      <div className="wizard-total wizard-total--final">
        <DollarSign size={24} />
        <span>{tP('costo_total_consulta')}</span>
        <span className="wizard-total__amount">${costoTotal.toFixed(2)}</span>
      </div>
    </div>
  );
}
