import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Printer, Loader2, Stethoscope, Activity, FileText, ClipboardCheck, Heart, Thermometer, Wind, Eye } from 'lucide-react';
import { consultasService } from '../services/consultasService';
import { getTreatmentLabel } from '../config/attentionTypes';

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function VitalSign({ label, value, unit, icon: Icon, normal, warning }) {
  const isWarning = warning && value != null;
  return (
    <div className={`vital-sign ${isWarning ? 'vital-sign--warning' : ''}`}>
      <div className="vital-sign__icon">
        <Icon size={16} />
      </div>
      <div className="vital-sign__info">
        <span className="vital-sign__label">{label}</span>
        <span className="vital-sign__value">
          {value != null ? value : '—'}
          {value != null && unit && <span className="vital-sign__unit">{unit}</span>}
        </span>
      </div>
    </div>
  );
}

export default function ConsultaDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [consulta, setConsulta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await consultasService.getById(id);
      if (res.success) setConsulta(res.data);
      else setError(res.message || 'Error al cargar');
    } catch (err) {
      setError(err.message || 'Error al cargar');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="consulta-detail">
        <div className="consulta-detail__loading">
          <Loader2 size={32} className="spinner" />
          <p>Cargando consulta...</p>
        </div>
      </div>
    );
  }

  if (!consulta) {
    return (
      <div className="consulta-detail">
        <div className="consulta-detail__error">{error || 'Consulta no encontrada'}</div>
      </div>
    );
  }

  const sv = consulta.signosVitales || {};
  const plan = consulta.planTratamiento || {};
  const meds = plan.medicamentos || [];
  const diags = consulta.diagnosticoLista || [];

  // IMC calculation
  const calcularIMC = () => {
    const peso = parseFloat(sv.peso);
    const talla = parseInt(sv.talla);
    if (!peso || !talla || talla <= 0) return null;
    const tallaM = talla / 100;
    return (peso / (tallaM * tallaM)).toFixed(1);
  };

  const imc = calcularIMC();
  const imcClass = imc ? (
    parseFloat(imc) < 18.5 ? 'bajo' :
    parseFloat(imc) < 25 ? 'normal' :
    parseFloat(imc) < 30 ? 'sobrepeso' : 'obesidad'
  ) : null;

  return (
    <div className="consulta-detail">
      {/* Header */}
      <div className="consulta-detail__header">
        <button className="btn btn--ghost btn--sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={14} /> Volver
        </button>
        <div className="consulta-detail__header-info">
          <h1 className="consulta-detail__title">
            Consulta
            {consulta.firmado && <span className="consulta-detail__badge consulta-detail__badge--firmado"><ClipboardCheck size={12} /> Firmada</span>}
          </h1>
          <p className="consulta-detail__subtitle">
            {consulta.pacienteNombre || 'Paciente'} — {formatDate(consulta.fecha)}
          </p>
        </div>
        <div className="consulta-detail__header-actions">
          <button className="btn btn--secondary btn--sm" onClick={() => navigate(`/consultas/${id}/editar`)}>
            <Pencil size={14} /> Editar
          </button>
          <button className="btn btn--ghost btn--sm" onClick={() => window.print()}>
            <Printer size={14} /> Imprimir
          </button>
        </div>
      </div>

      {error && <div className="consulta-detail__error">{error}</div>}

      <div className="consulta-detail__body">
        {/* Main content */}
        <div className="consulta-detail__main">
          {/* SECTION 1: Anamnesis */}
          <div className="consulta-detail__section">
            <div className="consulta-detail__section-header">
              <Stethoscope size={16} />
              <h3>Anamnesis</h3>
            </div>
            <div className="consulta-detail__cards">
              <div className="consulta-detail__card">
                <span className="consulta-detail__card-label">Motivo de consulta</span>
                <p className="consulta-detail__card-value">{consulta.motivo || '—'}</p>
              </div>
              {consulta.tiempoEnfermedad && (
                <div className="consulta-detail__card">
                  <span className="consulta-detail__card-label">Tiempo de enfermedad</span>
                  <p className="consulta-detail__card-value">{consulta.tiempoEnfermedad}</p>
                </div>
              )}
              {consulta.signosSintomas && (
                <div className="consulta-detail__card consulta-detail__card--full">
                  <span className="consulta-detail__card-label">Signos y Síntomas</span>
                  <p className="consulta-detail__card-value">{consulta.signosSintomas}</p>
                </div>
              )}
              {consulta.relatCronologico && (
                <div className="consulta-detail__card consulta-detail__card--full">
                  <span className="consulta-detail__card-label">Relato Cronológico</span>
                  <p className="consulta-detail__card-value">{consulta.relatCronologico}</p>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2: Exploración */}
          <div className="consulta-detail__section">
            <div className="consulta-detail__section-header">
              <Eye size={16} />
              <h3>Exploración</h3>
            </div>
            <div className="consulta-detail__cards">
              {/* Vital Signs Grid */}
              <div className="consulta-detail__vitals">
                <VitalSign icon={Activity} label="PA" value={sv.presionArterial} unit="mmHg" warning={sv.presionArterial && (sv.presionArterial.includes('14') || sv.presionArterial.includes('15') || sv.presionArterial.includes('16') || sv.presionArterial.includes('17') || sv.presionArterial.includes('18') || sv.presionArterial.includes('19') || sv.presionArterial.includes('20'))} />
                <VitalSign icon={Heart} label="Pulso" value={sv.pulso} unit="lpm" warning={sv.pulso && (sv.pulso < 50 || sv.pulso > 100)} />
                <VitalSign icon={Thermometer} label="Temp" value={sv.temperatura} unit="°C" warning={sv.temperatura && (sv.temperatura < 36 || sv.temperatura > 37.5)} />
                <VitalSign icon={Activity} label="SpO2" value={sv.saturacion} unit="%" warning={sv.saturacion && sv.saturacion < 95} />
                <VitalSign icon={Wind} label="FR" value={sv.frecuenciaRespiratoria} unit="rpm" warning={sv.frecuenciaRespiratoria && (sv.frecuenciaRespiratoria < 12 || sv.frecuenciaRespiratoria > 20)} />
                <VitalSign icon={Activity} label="Peso" value={sv.peso} unit="kg" />
                <VitalSign icon={Activity} label="Talla" value={sv.talla} unit="cm" />
                {imc && (
                  <div className={`vital-sign vital-sign--imc vital-sign--${imcClass}`}>
                    <div className="vital-sign__icon"><Activity size={16} /></div>
                    <div className="vital-sign__info">
                      <span className="vital-sign__label">IMC</span>
                      <span className="vital-sign__value">
                        {imc}
                        <span className={`vital-sign__badge vital-sign__badge--${imcClass}`}>
                          {imcClass === 'bajo' ? 'Bajo peso' : imcClass === 'normal' ? 'Normal' : imcClass === 'sobrepeso' ? 'Sobrepeso' : 'Obesidad'}
                        </span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
              {consulta.examenClinicoGeneral && (
                <div className="consulta-detail__card consulta-detail__card--full">
                  <span className="consulta-detail__card-label">Examen Clínico General</span>
                  <p className="consulta-detail__card-value">{consulta.examenClinicoGeneral}</p>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3: Diagnóstico y Plan */}
          <div className="consulta-detail__section">
            <div className="consulta-detail__section-header">
              <FileText size={16} />
              <h3>Diagnóstico y Plan</h3>
            </div>
            <div className="consulta-detail__cards">
              {/* Diagnósticos */}
              <div className="consulta-detail__card consulta-detail__card--full">
                <span className="consulta-detail__card-label">Diagnósticos</span>
                {diags.length === 0 ? (
                  <p className="consulta-detail__card-value">—</p>
                ) : (
                  <div className="consulta-detail__diag-list">
                    {diags.map((d, i) => (
                      <div key={i} className={`consulta-detail__diag-item ${d.principal ? 'consulta-detail__diag-item--principal' : ''}`}>
                        <span className="consulta-detail__diag-code">{d.codigo}</span>
                        <span className="consulta-detail__diag-desc">{d.descripcion}</span>
                        {d.principal && <span className="consulta-detail__diag-badge">Principal</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Plan de Tratamiento */}
              {meds.length > 0 && (
                <div className="consulta-detail__card consulta-detail__card--full">
                  <span className="consulta-detail__card-label">Medicamentos</span>
                  <div className="consulta-detail__med-list">
                    {meds.map((m, i) => (
                      <div key={i} className="consulta-detail__med-item">
                        <span className="consulta-detail__med-name">{m.nombre}</span>
                        <span className="consulta-detail__med-detail">{m.dosis} — {m.frecuencia} — {m.duracion}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {plan.indicaciones && (
                <div className="consulta-detail__card consulta-detail__card--full">
                  <span className="consulta-detail__card-label">Indicaciones</span>
                  <p className="consulta-detail__card-value">{plan.indicaciones}</p>
                </div>
              )}

              {consulta.notas && (
                <div className="consulta-detail__card consulta-detail__card--full">
                  <span className="consulta-detail__card-label">Notas</span>
                  <p className="consulta-detail__card-value">{consulta.notas}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="consulta-detail__sidebar">
          <div className="consulta-detail__sidebar-card">
            <span className="consulta-detail__sidebar-label">Fecha</span>
            <span className="consulta-detail__sidebar-value">{formatDate(consulta.fecha)}</span>
            <span className="consulta-detail__sidebar-sub">{formatTime(consulta.fecha)}</span>
          </div>
          <div className="consulta-detail__sidebar-card">
            <span className="consulta-detail__sidebar-label">Estado</span>
            <span className={`consulta-detail__sidebar-badge ${consulta.firmado ? 'consulta-detail__sidebar-badge--success' : 'consulta-detail__sidebar-badge--pending'}`}>
              {consulta.firmado ? 'Firmada' : 'Pendiente de firma'}
            </span>
          </div>
          {consulta.tipoTratamiento && (
            <div className="consulta-detail__sidebar-card">
              <span className="consulta-detail__sidebar-label">Tratamiento</span>
              <span className="consulta-detail__sidebar-value">{getTreatmentLabel(consulta.tipoTratamiento)}</span>
            </div>
          )}
          <div className="consulta-detail__sidebar-card">
            <span className="consulta-detail__sidebar-label">Acciones</span>
            <div className="consulta-detail__sidebar-actions">
              <button className="btn btn--secondary btn--sm" onClick={() => navigate(`/consultas/${id}/editar`)}>
                <Pencil size={14} /> Editar
              </button>
              <button className="btn btn--primary btn--sm" onClick={() => window.print()}>
                <Printer size={14} /> Imprimir
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
