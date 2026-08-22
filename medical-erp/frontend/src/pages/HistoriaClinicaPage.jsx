import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, FileText, Loader2, Pencil } from 'lucide-react';
import { historiaClinicaService } from '../services/historiaClinicaService';
import { consultasService } from '../services/consultasService';
import { pacienteService } from '../services/pacienteService';

export default function HistoriaClinicaPage() {
  const { pacienteId } = useParams();
  const navigate = useNavigate();

  const [paciente, setPaciente] = useState(null);
  const [historia, setHistoria] = useState(null);
  const [consultas, setConsultas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    alergiaMedicamentos: '',
    cardiopatiasPersonales: '',
    cardiopatiasFamiliares: '',
    diabetesPersonal: '',
    diabetesFamiliar: '',
    hepatitis: '',
    otrasEnfermedades: '',
    observaciones: '',
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [pRes, hRes, cRes] = await Promise.all([
        pacienteService.getById(pacienteId),
        historiaClinicaService.getByPaciente(pacienteId).catch(() => ({ success: false })),
        historiaClinicaService.getByPaciente(pacienteId).then((h) => {
          if (h.success && h.data?.id) {
            return consultasService.listByHistoria(h.data.id, { size: 5 });
          }
          return { success: true, data: { content: [] } };
        }),
      ]);

      if (pRes.success) setPaciente(pRes.data);

      if (hRes.success) {
        setHistoria(hRes.data);
        setForm({
          alergiaMedicamentos: hRes.data.alergiaMedicamentos || '',
          cardiopatiasPersonales: hRes.data.cardiopatiasPersonales || '',
          cardiopatiasFamiliares: hRes.data.cardiopatiasFamiliares || '',
          diabetesPersonal: hRes.data.diabetesPersonal || '',
          diabetesFamiliar: hRes.data.diabetesFamiliar || '',
          hepatitis: hRes.data.hepatitis || '',
          otrasEnfermedades: hRes.data.otrasEnfermedades || '',
          observaciones: hRes.data.observaciones || '',
        });
      } else {
        // No historia exists, will create on save
      }

      if (cRes.success) {
        setConsultas(cRes.data?.content || []);
      }
    } catch (err) {
      setError(err.message || 'Error al cargar historia clínica');
    } finally {
      setLoading(false);
    }
  }, [pacienteId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleChange = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { pacienteId: parseInt(pacienteId, 10), ...form };
      const res = historia
        ? await historiaClinicaService.update(historia.id, payload)
        : await historiaClinicaService.create(payload);

      if (res.success) {
        setHistoria(res.data);
      } else {
        setError(res.message || 'Error al guardar');
      }
    } catch (err) {
      setError(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleNuevaConsulta = () => {
    navigate(`/historia/${historia?.id}/consulta/nueva`);
  };

  if (loading) {
    return (
      <div className="historia-clinica-page">
        <div className="historia-clinica-page__loading">
          <Loader2 size={32} className="spinner" />
          <p>Cargando historia clínica...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="historia-clinica-page">
      <div className="historia-clinica-page__header">
        <button className="btn btn--ghost" onClick={() => navigate(`/pacientes/${pacienteId}/workspace`)}>
          <ArrowLeft size={18} /> Volver al cliente
        </button>
        <div>
          <h2 className="historia-clinica-page__title">Historia Clínica</h2>
          <p className="historia-clinica-page__subtitle">
            {paciente ? `${paciente.apellidoPaterno} ${paciente.apellidoMaterno || ''}, ${paciente.nombres}` : ''}
          </p>
        </div>
      </div>

      {error && <div className="historia-clinica-page__error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-card">
          <h3 className="form-section__title">Antecedentes</h3>
          <div className="form-grid form-grid--2">
            <div className="form-field">
              <label className="form-label">Alergia a Medicamentos</label>
              <textarea className="form-textarea" rows={3} value={form.alergiaMedicamentos} onChange={(e) => handleChange('alergiaMedicamentos', e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">Cardiopatías Personales</label>
              <textarea className="form-textarea" rows={3} value={form.cardiopatiasPersonales} onChange={(e) => handleChange('cardiopatiasPersonales', e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">Cardiopatías Familiares</label>
              <textarea className="form-textarea" rows={3} value={form.cardiopatiasFamiliares} onChange={(e) => handleChange('cardiopatiasFamiliares', e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">Diabetes Personal</label>
              <textarea className="form-textarea" rows={3} value={form.diabetesPersonal} onChange={(e) => handleChange('diabetesPersonal', e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">Diabetes Familiar</label>
              <textarea className="form-textarea" rows={3} value={form.diabetesFamiliar} onChange={(e) => handleChange('diabetesFamiliar', e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">Hepatitis</label>
              <textarea className="form-textarea" rows={3} value={form.hepatitis} onChange={(e) => handleChange('hepatitis', e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">Otras Enfermedades</label>
              <textarea className="form-textarea" rows={3} value={form.otrasEnfermedades} onChange={(e) => handleChange('otrasEnfermedades', e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">Observaciones</label>
              <textarea className="form-textarea" rows={3} value={form.observaciones} onChange={(e) => handleChange('observaciones', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="historia-clinica-page__actions">
          <button type="button" className="btn btn--secondary" onClick={() => navigate(`/pacientes/${pacienteId}/workspace`)} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? <Loader2 size={18} className="spinner" /> : <Pencil size={18} />}
            {saving ? 'Guardando...' : 'Guardar Historia'}
          </button>
        </div>
      </form>

      <div className="form-card">
        <div className="form-section__header">
          <h3 className="form-section__title">Consultas Recientes</h3>
          <button type="button" className="btn btn--primary btn--sm" onClick={handleNuevaConsulta} disabled={!historia}>
            <Plus size={16} /> Nueva Consulta
          </button>
        </div>

        {consultas.length === 0 ? (
          <p className="form-section__empty">No hay consultas registradas</p>
        ) : (
          <ul className="detail-list">
            {consultas.map((c) => (
              <li key={c.id}>
                <div className="detail-list__row">
                  <span><strong>{c.fecha?.substring(0, 10)}</strong> — {c.motivo}</span>
                  <button className="btn btn--ghost btn--sm" onClick={() => navigate(`/consultas/${c.id}`)}>
                    <FileText size={14} /> Ver
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
