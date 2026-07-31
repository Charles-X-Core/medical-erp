import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Printer, Loader2 } from 'lucide-react';
import { consultasService } from '../services/consultasService';

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
      <div className="consulta-detail-page">
        <div className="consulta-detail-page__loading">
          <Loader2 size={32} className="spinner" />
          <p>Cargando consulta...</p>
        </div>
      </div>
    );
  }

  if (!consulta) {
    return (
      <div className="consulta-detail-page">
        <p className="consulta-detail-page__error">{error || 'Consulta no encontrada'}</p>
      </div>
    );
  }

  const sv = consulta.signosVitales || {};
  const plan = consulta.planTratamiento || {};
  const meds = plan.medicamentos || [];
  const diags = consulta.diagnosticoLista || [];

  return (
    <div className="consulta-detail-page">
      <div className="consulta-detail-page__header">
        <button className="btn btn--ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> Volver
        </button>
        <div className="consulta-detail-page__title-group">
          <h2 className="consulta-detail-page__title">Consulta</h2>
          <p className="consulta-detail-page__subtitle">{consulta.pacienteNombre} — {consulta.fecha?.substring(0, 16)}</p>
        </div>
        <div className="consulta-detail-page__actions">
          <button className="btn btn--secondary" onClick={() => navigate(`/consultas/${id}/editar`)}>
            <Pencil size={18} /> Editar
          </button>
          <button className="btn btn--primary" onClick={() => window.print()}>
            <Printer size={18} /> Imprimir
          </button>
        </div>
      </div>

      {error && <div className="consulta-detail-page__error">{error}</div>}

      {consulta.firmado && <div className="consulta-detail-page__firmado">✓ Consulta firmada</div>}

      <div className="detail-grid">
        <div className="detail-card">
          <h4>Motivo</h4>
          <p>{consulta.motivo}</p>
          <p><strong>Tiempo enfermedad:</strong> {consulta.tiempoEnfermedad || '-'}</p>
        </div>

        <div className="detail-card detail-card--full">
          <h4>Signos Vitales</h4>
          <div className="detail-grid detail-grid--4">
            <p><strong>PA:</strong> {sv.presionArterial || '-'}</p>
            <p><strong>Pulso:</strong> {sv.pulso || '-'}</p>
            <p><strong>Temperatura:</strong> {sv.temperatura || '-'}</p>
            <p><strong>Peso:</strong> {sv.peso || '-'}</p>
            <p><strong>Talla:</strong> {sv.talla || '-'}</p>
            <p><strong>SatO2:</strong> {sv.saturacion || '-'}</p>
            <p><strong>FR:</strong> {sv.frecuenciaRespiratoria || '-'}</p>
          </div>
        </div>

        <div className="detail-card detail-card--full">
          <h4>Signos y Síntomas</h4>
          <p>{consulta.signosSintomas || '-'}</p>
        </div>

        <div className="detail-card detail-card--full">
          <h4>Examen Clínico General</h4>
          <p>{consulta.examenClinicoGeneral || '-'}</p>
        </div>

        <div className="detail-card detail-card--full">
          <h4>Diagnósticos</h4>
          {diags.length === 0 ? (
            <p>-</p>
          ) : (
            <ul className="detail-list">
              {diags.map((d, i) => (
                <li key={i}>
                  <strong>{d.codigo}</strong> {d.descripcion} {d.principal && <span className="badge badge--primary">Principal</span>}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="detail-card detail-card--full">
          <h4>Plan de Tratamiento</h4>
          {meds.length === 0 ? (
            <p>-</p>
          ) : (
            <ul className="detail-list">
              {meds.map((m, i) => (
                <li key={i}>
                  <strong>{m.nombre}</strong> {m.dosis} — {m.frecuencia} — {m.duracion}
                </li>
              ))}
            </ul>
          )}
          <p><strong>Indicaciones:</strong> {plan.indicaciones || '-'}</p>
        </div>

        <div className="detail-card detail-card--full">
          <h4>Notas</h4>
          <p>{consulta.notas || '-'}</p>
        </div>
      </div>
    </div>
  );
}
