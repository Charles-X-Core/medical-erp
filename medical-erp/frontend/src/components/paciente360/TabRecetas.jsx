import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Folder, FolderOpen, Pill, Download, Mail, FileText, ChevronDown, ChevronRight, Clock } from 'lucide-react';
import { recetaService } from '../../services/recetaService';
import { pacienteService } from '../../services/pacienteService';
import { formatLADate } from '../../utils/laTimezone';

function formatFecha(dateStr) {
  if (!dateStr) return '';
  return formatLADate(dateStr, 'en-US');
}

export default function TabRecetas({ pacienteId }) {
  const { t } = useTranslation('patients');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedTratamiento, setExpandedTratamiento] = useState(null);
  const [expandedSesion, setExpandedSesion] = useState(null);
  const [sendingEmail, setSendingEmail] = useState(null);
  const [paciente, setPaciente] = useState(null);

  useEffect(() => { loadData(); }, [pacienteId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [recRes, pacRes] = await Promise.allSettled([
        recetaService.getByPaciente(pacienteId),
        pacienteService.getById(pacienteId),
      ]);
      if (recRes.status === 'fulfilled' && recRes.value?.success) {
        const recetas = Array.isArray(recRes.value.data) ? recRes.value.data : [];
        // Group by tratamientoId → sesionId
        const grouped = {};
        recetas.forEach((r) => {
          const tKey = r.tratamientoId || 'general';
          if (!grouped[tKey]) grouped[tKey] = { tratamientoId: r.tratamientoId, sesiones: {} };
          const sKey = r.sesionId || 'general';
          if (!grouped[tKey].sesiones[sKey]) grouped[tKey].sesiones[sKey] = { sesionId: r.sesionId, recetas: [] };
          grouped[tKey].sesiones[sKey].recetas.push(r);
        });
        setData(Object.values(grouped));
      }
      if (pacRes.status === 'fulfilled' && pacRes.value?.success) {
        setPaciente(pacRes.value.data);
      }
    } catch (err) {
      console.error('Error loading recetas:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalRecetas = data.reduce((sum, t) =>
    sum + Object.values(t.sesiones).reduce((s, ses) => s + ses.recetas.length, 0), 0);

  const handleSendEmail = async (recetaId) => {
    setSendingEmail(recetaId);
    try {
      await recetaService.enviarPorEmail(
        recetaId,
        `Medical Prescription - ${paciente?.nombres || ''} ${paciente?.apellidoPaterno || ''}`,
        ''
      );
      setTimeout(() => setSendingEmail(null), 2000);
    } catch (err) {
      console.error('Error sending email:', err);
      setSendingEmail(null);
    }
  };

  if (loading) return <div className="tab-loading">{t('loading', { ns: 'common' })}</div>;

  return (
    <div className="tab-recetas">
      <div className="tab-recetas__header">
        <h3>{t('recetario')}</h3>
        <span className="tab-recetas__count">{totalRecetas} {t('recetas_total')}</span>
      </div>

      {data.length === 0 ? (
        <div className="tab-empty">
          <Pill size={48} />
          <p>{t('sin_recetas')}</p>
        </div>
      ) : (
        <div className="tab-recetas__folders">
          {data.map((group) => {
            const isExpanded = expandedTratamiento === group.tratamientoId;
            const sesionesArr = Object.values(group.sesiones);
            const totalInGroup = sesionesArr.reduce((s, ses) => s + ses.recetas.length, 0);

            return (
              <div key={group.tratamientoId || 'general'} className="folder-tratamiento">
                <button className="folder-tratamiento__header" onClick={() => setExpandedTratamiento(isExpanded ? null : group.tratamientoId)}>
                  <div className="folder-tratamiento__icon">
                    {isExpanded ? <FolderOpen size={20} /> : <Folder size={20} />}
                  </div>
                  <div className="folder-tratamiento__info">
                    <span className="folder-tratamiento__name">{t('tratamiento')} {group.tratamientoId || ''}</span>
                    <span className="folder-tratamiento__count">{sesionesArr.length} {t('sesiones')} · {totalInGroup} {t('recetas')}</span>
                  </div>
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>

                {isExpanded && (
                  <div className="folder-tratamiento__sesiones">
                    {sesionesArr.map((sesion) => {
                      const isSesExpanded = expandedSesion === sesion.sesionId;
                      return (
                        <div key={sesion.sesionId || 'general'} className="folder-sesion">
                          <button className="folder-sesion__header" onClick={() => setExpandedSesion(isSesExpanded ? null : sesion.sesionId)}>
                            <div className="folder-sesion__icon">
                              {isSesExpanded ? <FolderOpen size={16} /> : <Folder size={16} />}
                            </div>
                            <span className="folder-sesion__name">
                              {sesion.sesionId ? `${t('sesion')} ${sesion.sesionId}` : t('general')}
                            </span>
                            <span className="folder-sesion__count">{sesion.recetas.length} {t('recetas')}</span>
                            {isSesExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </button>

                          {isSesExpanded && (
                            <div className="folder-sesion__fotos">
                              {sesion.recetas.map((receta) => (
                                <div key={receta.id} className="receta-card">
                                  <div className="receta-card__header">
                                    <Pill size={16} />
                                    <div className="receta-card__info">
                                      <span className="receta-card__name">{receta.medicamento}</span>
                                      <span className="receta-card__dosis">{receta.dosis} {receta.frecuencia ? `- ${receta.frecuencia}` : ''}</span>
                                    </div>
                                  </div>
                                  {receta.duracion && (
                                    <span className="receta-card__detail"><Clock size={12} /> {t('duracion')}: {receta.duracion}</span>
                                  )}
                                  {receta.indicaciones && (
                                    <span className="receta-card__detail">{receta.indicaciones}</span>
                                  )}
                                  <span className="receta-card__date">{formatFecha(receta.fecha)}</span>
                                  <div className="receta-card__actions">
                                    <a className="btn btn--ghost btn--sm" href={recetaService.getPdfUrl(receta.id)} target="_blank" rel="noopener noreferrer">
                                      <FileText size={14} /> PDF
                                    </a>
                                    <button className="btn btn--ghost btn--sm" onClick={() => handleSendEmail(receta.id)} disabled={sendingEmail === receta.id}>
                                      <Mail size={14} /> {t('enviar_al_paciente')}
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
