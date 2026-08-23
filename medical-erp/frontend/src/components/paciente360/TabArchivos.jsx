import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Filter } from 'lucide-react';
import { evidenciaService } from '../../services/evidenciaService';

export default function TabArchivos({ pacienteId }) {
  const { t } = useTranslation('patients');
  const [evidencias, setEvidencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [viewerImage, setViewerImage] = useState(null);

  useEffect(() => {
    loadEvidencias();
  }, [pacienteId]);

  const loadEvidencias = async () => {
    try {
      setLoading(true);
      const res = await evidenciaService.listByPaciente(pacienteId);
      if (res.success) {
        const data = res.data;
        setEvidencias(Array.isArray(data) ? data : data?.content || []);
      }
    } catch (err) {
      console.error('Error loading evidencias:', err);
    } finally {
      setLoading(false);
    }
  };

  const TYPE_FILTERS = [
    { id: '', label: t('all_filter', { ns: 'patients' }) },
    { id: 'antes', label: t('antes', { ns: 'patients' }) },
    { id: 'despues', label: t('despues', { ns: 'patients' }) },
    { id: 'otro', label: t('otro') },
  ];

  const filtered = evidencias.filter((e) => {
    if (!filtro) return true;
    return e.tipo === filtro;
  });

  if (loading) {
    return <div className="tab-loading">{t('loading', { ns: 'common' })}</div>;
  }

  return (
    <div className="tab-archivos">
      <div className="tab-archivos__header">
        <h3>{t('archivos_clinicos')}</h3>
        <div className="tab-archivos__actions">
          <div className="tab-archivos__filters">
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.id}
                className={`tab-archivos__filter ${filtro === f.id ? 'tab-archivos__filter--active' : ''}`}
                onClick={() => setFiltro(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="tab-empty">
          <Image size={48} />
          <p>{t('sin_archivos')}</p>
        </div>
      ) : (
        <div className="tab-archivos__grid">
          {filtered.map((ev) => (
            <div
              key={ev.id}
              className="archivo-card"
              onClick={() => setViewerImage(ev)}
            >
              <div className="archivo-card__preview">
                {ev.fileName ? (
                  <img src={`/api/v1/evidencias/file/${ev.fileName}`} alt={ev.descripcion || ''} />
                ) : (
                  <Image size={32} />
                )}
              </div>
              <div className="archivo-card__info">
                <span className="archivo-card__tipo">{ev.tipo || t('otro')}</span>
                <span className="archivo-card__desc">{ev.descripcion || t('sin_evidencias')}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewerImage && (
        <div className="modal-overlay" onClick={() => setViewerImage(null)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{viewerImage.descripcion || t('evidencias_fotograficas')}</h3>
              <button className="btn-close" onClick={() => setViewerImage(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <img
                src={`/api/v1/evidencias/file/${viewerImage.fileName}`}
                alt={viewerImage.descripcion || ''}
                style={{ width: '100%', borderRadius: '8px' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
