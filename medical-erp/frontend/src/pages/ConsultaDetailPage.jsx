import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Printer, Loader2, Stethoscope, Activity, FileText, ClipboardCheck, Heart, Thermometer, Wind, Eye } from 'lucide-react';
import { formatLADate, parseLADateTime } from '../utils/laTimezone';
import { zonaIANA, horaMostrar } from '../utils/zonaHoraria';
import { useTranslation } from 'react-i18next';
import { consultasService } from '../services/consultasService';
import { getTreatmentLabel } from '../config/attentionTypes';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = parseLADateTime(dateStr);
  if (d) return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: zonaIANA() });
  return formatLADate(dateStr);
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = parseLADateTime(dateStr);
  if (d) return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: zonaIANA() });
  return horaMostrar(String(dateStr).substring(11, 19), String(dateStr)).substring(0, 5);
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
  const { t } = useTranslation('clinical');
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
      else setError(res.message || t('error_loading', { ns: 'common' }));
    } catch (err) {
      setError(err.message || t('error_loading', { ns: 'common' }));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="consulta-detail">
        <div className="consulta-detail__loading">
          <Loader2 size={32} className="spinner" />
          <p>{t('loading_session')}</p>
        </div>
      </div>
    );
  }

  if (!consulta) {
    return (
      <div className="consulta-detail">
        <div className="consulta-detail__error">{error || t('consulta_not_found')}</div>
      </div>
    );
  }

  const sv = consulta.signosVitales || {};
  const plan = consulta.planTratamiento || {};
  const meds = plan.medicamentos || [];
  const diags = consulta.diagnosticoLista || [];

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
      <div className="consulta-detail__header">
        <button className="btn btn--ghost btn--sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={14} /> {t('back', { ns: 'common' })}
        </button>
        <div className="consulta-detail__header-info">
          <h1 className="consulta-detail__title">
            {t('consulta_detail_title')}
            {consulta.firmado && <span className="consulta-detail__badge consulta-detail__badge--firmado"><ClipboardCheck size={12} /> {t('consulta_signed')}</span>}
          </h1>
          <p className="consulta-detail__subtitle">
            {consulta.pacienteNombre || t('client', { ns: 'patients' })} — {formatDate(consulta.fecha)}
          </p>
        </div>
        <div className="consulta-detail__header-actions">
          <button className="btn btn--secondary btn--sm" onClick={() => navigate(`/consultas/${id}/editar`)}>
            <Pencil size={14} /> {t('edit', { ns: 'common' })}
          </button>
          <button className="btn btn--ghost btn--sm" onClick={() => window.print()}>
            <Printer size={14} /> {t('print', { ns: 'common' })}
          </button>
        </div>
      </div>

      {error && <div className="consulta-detail__error">{error}</div>}

      <div className="consulta-detail__body">
        <div className="consulta-detail__main">
          <div className="consulta-detail__section">
            <div className="consulta-detail__section-header">
              <Stethoscope size={16} />
              <h3>{t('anamnesis')}</h3>
            </div>
            <div className="consulta-detail__cards">
              <div className="consulta-detail__card">
                <span className="consulta-detail__card-label">{t('motivo_consulta')}</span>
                <p className="consulta-detail__card-value">{consulta.motivo || '—'}</p>
              </div>
              {consulta.tiempoEnfermedad && (
                <div className="consulta-detail__card">
                  <span className="consulta-detail__card-label">{t('tiempo_enfermedad')}</span>
                  <p className="consulta-detail__card-value">{consulta.tiempoEnfermedad}</p>
                </div>
              )}
              {consulta.signosSintomas && (
                <div className="consulta-detail__card consulta-detail__card--full">
                  <span className="consulta-detail__card-label">{t('signos_sintomas')}</span>
                  <p className="consulta-detail__card-value">{consulta.signosSintomas}</p>
                </div>
              )}
              {consulta.relatCronologico && (
                <div className="consulta-detail__card consulta-detail__card--full">
                  <span className="consulta-detail__card-label">{t('relato_cronologico')}</span>
                  <p className="consulta-detail__card-value">{consulta.relatCronologico}</p>
                </div>
              )}
            </div>
          </div>

          <div className="consulta-detail__section">
            <div className="consulta-detail__section-header">
              <Eye size={16} />
              <h3>{t('exploration')}</h3>
            </div>
            <div className="consulta-detail__cards">
              <div className="consulta-detail__vitals">
                <VitalSign icon={Activity} label="PA" value={sv.presionArterial} unit="mmHg" warning={sv.presionArterial && (sv.presionArterial.includes('14') || sv.presionArterial.includes('15') || sv.presionArterial.includes('16') || sv.presionArterial.includes('17') || sv.presionArterial.includes('18') || sv.presionArterial.includes('19') || sv.presionArterial.includes('20'))} />
                <VitalSign icon={Heart} label={t('vital_pulse')} value={sv.pulso} unit={t('pulse_unit')} warning={sv.pulso && (sv.pulso < 50 || sv.pulso > 100)} />
                <VitalSign icon={Thermometer} label={t('vital_temperature')} value={sv.temperatura} unit={t('temp_unit')} warning={sv.temperatura && (sv.temperatura < 36 || sv.temperatura > 37.5)} />
                <VitalSign icon={Activity} label="SpO2" value={sv.saturacion} unit={t('spo2_unit')} warning={sv.saturacion && sv.saturacion < 95} />
                <VitalSign icon={Wind} label={t('vital_resp_rate')} value={sv.frecuenciaRespiratoria} unit={t('resp_rate_unit')} warning={sv.frecuenciaRespiratoria && (sv.frecuenciaRespiratoria < 12 || sv.frecuenciaRespiratoria > 20)} />
                <VitalSign icon={Activity} label={t('vital_weight')} value={sv.peso} unit={t('weight_unit')} />
                <VitalSign icon={Activity} label={t('vital_height')} value={sv.talla} unit={t('height_unit')} />
                {imc && (
                  <div className={`vital-sign vital-sign--imc vital-sign--${imcClass}`}>
                    <div className="vital-sign__icon"><Activity size={16} /></div>
                    <div className="vital-sign__info">
                      <span className="vital-sign__label">{t('imc')}</span>
                      <span className="vital-sign__value">
                        {imc}
                        <span className={`vital-sign__badge vital-sign__badge--${imcClass}`}>
                          {imcClass === 'bajo' ? t('bajo_peso') : imcClass === 'normal' ? t('peso_normal') : imcClass === 'sobrepeso' ? t('sobrepeso') : t('obesidad')}
                        </span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
              {consulta.examenClinicoGeneral && (
                <div className="consulta-detail__card consulta-detail__card--full">
                  <span className="consulta-detail__card-label">{t('examen_fisico')}</span>
                  <p className="consulta-detail__card-value">{consulta.examenClinicoGeneral}</p>
                </div>
              )}
            </div>
          </div>

          <div className="consulta-detail__section">
            <div className="consulta-detail__section-header">
              <FileText size={16} />
              <h3>{t('diagnostico_y_plan')}</h3>
            </div>
            <div className="consulta-detail__cards">
              <div className="consulta-detail__card consulta-detail__card--full">
                <span className="consulta-detail__card-label">{t('diagnostico')}</span>
                {diags.length === 0 ? (
                  <p className="consulta-detail__card-value">—</p>
                ) : (
                  <div className="consulta-detail__diag-list">
                    {diags.map((d, i) => (
                      <div key={i} className={`consulta-detail__diag-item ${d.principal ? 'consulta-detail__diag-item--principal' : ''}`}>
                        <span className="consulta-detail__diag-code">{d.codigo}</span>
                        <span className="consulta-detail__diag-desc">{d.descripcion}</span>
                        {d.principal && <span className="consulta-detail__diag-badge">{t('principal', { ns: 'patients' })}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {meds.length > 0 && (
                <div className="consulta-detail__card consulta-detail__card--full">
                  <span className="consulta-detail__card-label">{t('medicamentos_actuales')}</span>
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
                  <span className="consulta-detail__card-label">{t('indicaciones')}</span>
                  <p className="consulta-detail__card-value">{plan.indicaciones}</p>
                </div>
              )}

              {consulta.notas && (
                <div className="consulta-detail__card consulta-detail__card--full">
                  <span className="consulta-detail__card-label">{t('notes', { ns: 'common' })}</span>
                  <p className="consulta-detail__card-value">{consulta.notas}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="consulta-detail__sidebar">
          <div className="consulta-detail__sidebar-card">
            <span className="consulta-detail__sidebar-label">{t('date', { ns: 'common' })}</span>
            <span className="consulta-detail__sidebar-value">{formatDate(consulta.fecha)}</span>
            <span className="consulta-detail__sidebar-sub">{formatTime(consulta.fecha)}</span>
          </div>
          <div className="consulta-detail__sidebar-card">
            <span className="consulta-detail__sidebar-label">{t('status', { ns: 'common' })}</span>
            <span className={`consulta-detail__sidebar-badge ${consulta.firmado ? 'consulta-detail__sidebar-badge--success' : 'consulta-detail__sidebar-badge--pending'}`}>
              {consulta.firmado ? t('consulta_signed') : t('pendiente_firma', { ns: 'patients' })}
            </span>
          </div>
          {consulta.tipoTratamiento && (
            <div className="consulta-detail__sidebar-card">
              <span className="consulta-detail__sidebar-label">{t('treatment', { ns: 'common' })}</span>
              <span className="consulta-detail__sidebar-value">{getTreatmentLabel(consulta.tipoTratamiento)}</span>
            </div>
          )}
          <div className="consulta-detail__sidebar-card">
            <span className="consulta-detail__sidebar-label">{t('actions', { ns: 'common' })}</span>
            <div className="consulta-detail__sidebar-actions">
              <button className="btn btn--secondary btn--sm" onClick={() => navigate(`/consultas/${id}/editar`)}>
                <Pencil size={14} /> {t('edit', { ns: 'common' })}
              </button>
              <button className="btn btn--primary btn--sm" onClick={() => window.print()}>
                <Printer size={14} /> {t('print', { ns: 'common' })}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
