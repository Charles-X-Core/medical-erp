import { FileText, Calendar, TrendingUp, DollarSign, CheckCircle } from 'lucide-react';
import { useEffect } from 'react';

export default function PasoResumen({ formData, updateFormData }) {
  const { paciente, enfermedad, diagnostico, evidencias, recetas, tratamientos, resumen } = formData;

  const costoTotal = tratamientos.reduce((sum, t) => sum + (parseFloat(t.costoTotal) || 0), 0);

  // Auto-derive tipoTratamiento from treatment categories
  useEffect(() => {
    if (tratamientos.length > 0 && !resumen.tipoTratamiento) {
      const categorias = [...new Set(tratamientos.map((t) => t.categoria).filter(Boolean))];
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
        Resumen de la Sesión
      </h2>

      {/* Patient Summary */}
      <div className="wizard-card">
        <h3 className="wizard-card__subtitle">
          <FileText size={16} />
          Datos del Paciente
        </h3>
        <div className="wizard-grid wizard-grid--3">
          <div className="wizard-field">
            <label>Nombre</label>
            <span>{paciente?.apellidoPaterno} {paciente?.nombres}</span>
          </div>
          <div className="wizard-field">
            <label>ID</label>
            <span>{paciente?.licenciaConducir || '-'}</span>
          </div>
          <div className="wizard-field">
            <label>Motivo</label>
            <span>{enfermedad.motivo || '-'}</span>
          </div>
        </div>
      </div>

      {/* Diagnosis Summary */}
      <div className="wizard-card">
        <h3 className="wizard-card__subtitle">Diagnóstico</h3>
        {diagnostico.diagnosticoTexto ? (
          <div className="wizard-diagnostico-texto">
            {diagnostico.diagnosticoTexto.split('\n').map((line, i) => (
              <div key={i} className="wizard-list__item">
                <span>{line}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="wizard-text--muted">Sin diagnósticos registrados</p>
        )}
      </div>

      {/* Treatment Summary */}
      <div className="wizard-card">
        <h3 className="wizard-card__subtitle">Tratamientos</h3>
        {tratamientos.length > 0 ? (
          <div className="wizard-list">
            {tratamientos.map((t, i) => (
              <div key={i} className="wizard-list__item">
                <span>{t.procedimientoRealizado}</span>
                <span className="wizard-list__cost">${parseFloat(t.costoTotal || 0).toFixed(2)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="wizard-text--muted">Sin tratamientos registrados</p>
        )}
        {tratamientos.length > 0 && (
          <div className="wizard-total wizard-total--small">
            <span>Total:</span>
            <span>${costoTotal.toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Recetas Summary */}
      <div className="wizard-card">
        <h3 className="wizard-card__subtitle">Recetas</h3>
        {recetas.length > 0 ? (
          <div className="wizard-list">
            {recetas.map((r, i) => (
              <div key={i} className="wizard-list__item wizard-list__item--column">
                <span className="wizard-list__receta-title">Receta {i + 1}</span>
                {r.medicamentos.map((med, j) => (
                  <span key={j} className="wizard-list__med">
                    {med.nombre} {med.dosis} — {med.frecuencia} × {med.duracion}
                  </span>
                ))}
                {r.indicaciones && (
                  <span className="wizard-list__indicaciones">Indicaciones: {r.indicaciones}</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="wizard-text--muted">Sin recetas creadas</p>
        )}
      </div>

      {/* Evidencias count */}
      <div className="wizard-card">
        <h3 className="wizard-card__subtitle">Evidencias</h3>
        <p>{evidencias.length} foto(s) adjunta(s)</p>
      </div>

      {/* Resumen fields */}
      <div className="wizard-card">
        <h3 className="wizard-card__subtitle">Resumen del Tratamiento</h3>
        <div className="wizard-grid wizard-grid--1">
          <div className="wizard-field">
            <label><TrendingUp size={14} /> Tipo de Tratamiento</label>
            <input
              className="wizard-input"
              value={resumen.tipoTratamiento}
              onChange={(e) => updateFormData('resumen', { tipoTratamiento: e.target.value })}
              placeholder="Ej: Regenerativo, Estético, Hormonal..."
            />
          </div>
          <div className="wizard-grid wizard-grid--2">
            <div className="wizard-field">
              <label>Sesiones Realizadas</label>
              <input
                className="wizard-input"
                type="number"
                min="0"
                value={resumen.sesionesRealizadas}
                onChange={(e) => updateFormData('resumen', { sesionesRealizadas: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="wizard-field">
              <label><Calendar size={14} /> Próxima Fecha</label>
              <input
                className="wizard-input"
                type="date"
                value={resumen.proximaFecha}
                onChange={(e) => updateFormData('resumen', { proximaFecha: e.target.value })}
              />
            </div>
          </div>
          <div className="wizard-field">
            <label>Evolución / Mejoría Observada</label>
            <textarea
              className="wizard-textarea"
              rows={3}
              value={resumen.evolucionMejoria}
              onChange={(e) => updateFormData('resumen', { evolucionMejoria: e.target.value })}
              placeholder="Describa la evolución y mejoría observada durante el tratamiento"
            />
          </div>
        </div>
      </div>

      {/* Total Cost */}
      <div className="wizard-total wizard-total--final">
        <DollarSign size={24} />
        <span>Costo Total de la Consulta:</span>
        <span className="wizard-total__amount">${costoTotal.toFixed(2)}</span>
      </div>
    </div>
  );
}
