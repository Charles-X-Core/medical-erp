import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { consultasService } from '../services/consultasService';
import { historiaClinicaService } from '../services/historiaClinicaService';
import SignosVitalesForm from '../components/consulta/SignosVitalesForm';
import DiagnosticoForm from '../components/consulta/DiagnosticoForm';
import PlanTratamientoForm from '../components/consulta/PlanTratamientoForm';

export default function ConsultaFormPage() {
  const { t } = useTranslation('clinical');
  const { id } = useParams();
  const { historiaId } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const parentHistoriaId = historiaId || null;

  const [form, setForm] = useState({
    historiaId: parentHistoriaId ? parseInt(parentHistoriaId, 10) : 0,
    fecha: new Date().toISOString().slice(0, 16),
    motivo: '',
    tiempoEnfermedad: '',
    signosSintomas: '',
    relatoCronologico: '',
    signosVitales: {},
    examenClinicoGeneral: '',
    diagnosticoLista: [],
    planTratamiento: { medicamentos: [], indicaciones: '' },
    notas: '',
  });
  const [paciente, setPaciente] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!id) {
      if (parentHistoriaId) {
        try {
          const hRes = await historiaClinicaService.getById(parentHistoriaId);
          if (hRes.success) {
            const pRes = await historiaClinicaService.getByPaciente(hRes.data.pacienteId);
          }
        } catch (ignored) {}
      }
      return;
    }
    try {
      setLoading(true);
      const res = await consultasService.getById(id);
      if (res.success) {
        const c = res.data;
        setForm({
          historiaId: c.historiaId,
          fecha: c.fecha ? c.fecha.slice(0, 16) : '',
          motivo: c.motivo || '',
          tiempoEnfermedad: c.tiempoEnfermedad || '',
          signosSintomas: c.signosSintomas || '',
          relatoCronologico: c.relatoCronologico || '',
          signosVitales: c.signosVitales || {},
          examenClinicoGeneral: c.examenClinicoGeneral || '',
          diagnosticoLista: c.diagnosticoLista || [],
          planTratamiento: c.planTratamiento || { medicamentos: [], indicaciones: '' },
          notas: c.notas || '',
        });
      } else {
        setError(res.message || t('error_loading_consulta'));
      }
    } catch (err) {
      setError(err.message || t('error_loading_consulta'));
    } finally {
      setLoading(false);
    }
  }, [id, parentHistoriaId, t]);

  useEffect(() => {
    load();
  }, [load]);

  const handleChange = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = isEdit
        ? await consultasService.update(id, form)
        : await consultasService.create(form);
      if (res.success) {
        navigate(`/consultas/${res.data.id}`);
      } else {
        setError(res.message || t('error_guardar'));
      }
    } catch (err) {
      setError(err.message || t('error_guardar'));
    } finally {
      setSaving(false);
    }
  };

  const handleFirmar = async () => {
    if (!id) return;
    try {
      const res = await consultasService.firmar(id);
      if (res.success) {
        navigate(`/consultas/${res.data.id}`);
      } else {
        setError(res.message || t('error_firmar'));
      }
    } catch (err) {
      setError(err.message || t('error_firmar'));
    }
  };

  if (loading) {
    return (
      <div className="consulta-form-page">
        <div className="consulta-form-page__loading">
          <Loader2 size={32} className="spinner" />
          <p>{t('loading_session')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="consulta-form-page">
      <div className="consulta-form-page__header">
        <button type="button" className="btn btn--ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> {t('back', { ns: 'common' })}
        </button>
        <h2 className="consulta-form-page__title">{isEdit ? t('consulta_form_title') : t('consulta_form_new')}</h2>
      </div>

      {error && <div className="consulta-form-page__error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-card">
          <h3 className="form-section__title">{t('datos_generales', { ns: 'clinical' })}</h3>
          <div className="form-grid form-grid--2">
            <div className="form-field">
              <label className="form-label">{t('fecha_requerida')}</label>
              <input
                type="datetime-local"
                className="form-input"
                value={form.fecha}
                onChange={(e) => handleChange('fecha', e.target.value)}
                required
              />
            </div>
            <div className="form-field">
              <label className="form-label">{t('motivo_requerido')}</label>
              <input
                className="form-input"
                value={form.motivo}
                onChange={(e) => handleChange('motivo', e.target.value)}
                required
              />
            </div>
            <div className="form-field">
              <label className="form-label">{t('tiempo_enfermedad')}</label>
              <input
                className="form-input"
                value={form.tiempoEnfermedad}
                onChange={(e) => handleChange('tiempoEnfermedad', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="form-card">
          <h3 className="form-section__title">{t('anamnesis')}</h3>
          <div className="form-grid form-grid--1">
            <div className="form-field">
              <label className="form-label">{t('signos_sintomas')}</label>
              <textarea className="form-textarea" rows={4} value={form.signosSintomas} onChange={(e) => handleChange('signosSintomas', e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">{t('relato_cronologico')}</label>
              <textarea className="form-textarea" rows={4} value={form.relatoCronologico} onChange={(e) => handleChange('relatoCronologico', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="form-card">
          <SignosVitalesForm value={form.signosVitales} onChange={(v) => handleChange('signosVitales', v)} />
        </div>

        <div className="form-card">
          <h3 className="form-section__title">{t('examen_fisico')}</h3>
          <textarea className="form-textarea" rows={4} value={form.examenClinicoGeneral} onChange={(e) => handleChange('examenClinicoGeneral', e.target.value)} />
        </div>

        <div className="form-card">
          <DiagnosticoForm diagnosticos={form.diagnosticoLista} onChange={(v) => handleChange('diagnosticoLista', v)} />
        </div>

        <div className="form-card">
          <PlanTratamientoForm value={form.planTratamiento} onChange={(v) => handleChange('planTratamiento', v)} />
        </div>

        <div className="form-card">
          <h3 className="form-section__title">{t('notas', { ns: 'common' })}</h3>
          <textarea className="form-textarea" rows={4} value={form.notas} onChange={(e) => handleChange('notas', e.target.value)} />
        </div>

        <div className="consulta-form-page__actions">
          <button type="button" className="btn btn--secondary" onClick={() => navigate(-1)} disabled={saving}>
            {t('cancel', { ns: 'common' })}
          </button>
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? <Loader2 size={18} className="spinner" /> : <Save size={18} />}
            {saving ? t('guardando') : t('guardar_consulta')}
          </button>
          {isEdit && (
            <button type="button" className="btn btn--success" onClick={handleFirmar} disabled={saving}>
              <CheckCircle size={18} /> {t('firmar', { ns: 'contracts' })}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
