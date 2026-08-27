import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Folder, FolderOpen, Image, Download, Mail, Eye, ChevronDown, ChevronRight, Calendar, Stethoscope } from 'lucide-react';
import { evidenciaService } from '../../services/evidenciaService';
import { pacienteService } from '../../services/pacienteService';
import EnviarEvidenciaModal from './EnviarEvidenciaModal';

export default function TabArchivos({ pacienteId }) {
  const { t } = useTranslation('patients');
  const { t: tCommon } = useTranslation('common');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedTratamiento, setExpandedTratamiento] = useState(null);
  const [expandedSesion, setExpandedSesion] = useState(null);
  const [viewerImage, setViewerImage] = useState(null);
  const [sendImage, setSendImage] = useState(null);
  const [paciente, setPaciente] = useState(null);

  useEffect(() => {
    loadData();
  }, [pacienteId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [evRes, pacRes] = await Promise.allSettled([
        evidenciaService.listByPaciente(pacienteId),
        pacienteService.getById(pacienteId),
      ]);
      if (evRes.status === 'fulfilled' && evRes.value?.success) {
        setData(Array.isArray(evRes.value.data) ? evRes.value.data : []);
      }
      if (pacRes.status === 'fulfilled' && pacRes.value?.success) {
        setPaciente(pacRes.value.data);
      }
    } catch (err) {
      console.error('Error loading clinical files:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalFotos = data.reduce((sum, t) =>
    sum + t.sesiones.reduce((s, ses) => s + (ses.evidencias?.length || 0), 0), 0
  );

  if (loading) {
    return <div className="tab-loading">{tCommon('loading')}</div>;
  }

  return (
    <div className="tab-archivos">
      <div className="tab-archivos__header">
        <h3>{t('archivos_clinicos')}</h3>
        <span className="tab-archivos__count">
          {totalFotos} {t('fotos_en_total')}
        </span>
      </div>

      {data.length === 0 ? (
        <div className="tab-empty">
          <Image size={48} />
          <p>{t('sin_archivos')}</p>
          <span>{t('sin_archivos_hint')}</span>
        </div>
      ) : (
        <div className="tab-archivos__folders">
          {data.map((tratamiento) => {
            const isExpanded = expandedTratamiento === tratamiento.tratamientoId;
            const totalFotosTratamiento = tratamiento.sesiones.reduce((s, ses) => s + (ses.evidencias?.length || 0), 0);

            return (
              <div key={tratamiento.tratamientoId} className="folder-tratamiento">
                <button
                  className="folder-tratamiento__header"
                  onClick={() => setExpandedTratamiento(isExpanded ? null : tratamiento.tratamientoId)}
                >
                  <div className="folder-tratamiento__icon">
                    {isExpanded ? <FolderOpen size={20} /> : <Folder size={20} />}
                  </div>
                  <div className="folder-tratamiento__info">
                    <span className="folder-tratamiento__name">{tratamiento.tipoTratamiento}</span>
                    <span className="folder-tratamiento__count">
                      {tratamiento.sesiones.length} {t('sesiones')} · {totalFotosTratamiento} {t('fotos')}
                    </span>
                  </div>
                  <span className={`folder-tratamiento__badge folder-tratamiento__badge--${tratamiento.estado?.toLowerCase()}`}>
                    {tratamiento.estado}
                  </span>
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>

                {isExpanded && (
                  <div className="folder-tratamiento__sesiones">
                    {tratamiento.sesiones.map((sesion) => {
                      const isSesionExpanded = expandedSesion === sesion.sesionId;
                      return (
                        <div key={sesion.sesionId} className="folder-sesion">
                          <button
                            className="folder-sesion__header"
                            onClick={() => setExpandedSesion(isSesionExpanded ? null : sesion.sesionId)}
                          >
                            <div className="folder-sesion__icon">
                              {isSesionExpanded ? <FolderOpen size={16} /> : <Folder size={16} />}
                            </div>
                            <span className="folder-sesion__name">
                              {t('sesion_numero', { number: sesion.numeroSesion })} — {sesion.fecha}
                            </span>
                            <span className="folder-sesion__count">
                              {sesion.evidencias?.length || 0} {t('fotos')}
                            </span>
                            {isSesionExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </button>

                          {isSesionExpanded && sesion.evidencias?.length > 0 && (
                            <div className="folder-sesion__fotos">
                              {sesion.evidencias.map((ev) => (
                                <div key={ev.id} className="archivo-card">
                                  <div className="archivo-card__preview" onClick={() => setViewerImage(ev)}>
                                    {ev.archivoRuta ? (
                                      <img src={evidenciaService.getFileUrl(ev.archivoRuta)} alt={ev.descripcion || ''} />
                                    ) : (
                                      <Image size={32} />
                                    )}
                                    <div className="archivo-card__overlay">
                                      <Eye size={16} />
                                    </div>
                                  </div>
                                  <div className="archivo-card__info">
                                    <span className="archivo-card__tipo">{ev.tipo || t('otro')}</span>
                                    <span className="archivo-card__desc">{ev.descripcion || t('sin_descripcion')}</span>
                                    <span className="archivo-card__date">{ev.createdAt?.split('T')[0]}</span>
                                  </div>
                                  <div className="archivo-card__actions">
                                    <button
                                      className="btn btn--ghost btn--sm"
                                      onClick={() => window.open(evidenciaService.getDownloadUrl(ev.archivoRuta), '_blank')}
                                      title={tCommon('descargar')}
                                    >
                                      <Download size={14} />
                                    </button>
                                    <button
                                      className="btn btn--ghost btn--sm"
                                      onClick={() => setSendImage(ev)}
                                      title={t('enviar_al_paciente')}
                                    >
                                      <Mail size={14} />
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

      {/* Image Viewer */}
      {viewerImage && (
        <div className="modal-overlay" onClick={() => setViewerImage(null)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{viewerImage.descripcion || t('evidencia')}</h3>
              <button className="btn-close" onClick={() => setViewerImage(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <img
                src={evidenciaService.getFileUrl(viewerImage.archivoRuta)}
                alt={viewerImage.descripcion || ''}
                style={{ width: '100%', borderRadius: '8px' }}
              />
              <div className="image-info">
                <span><strong>{t('tipo')}:</strong> {viewerImage.tipo}</span>
                <span><strong>{t('fecha')}:</strong> {viewerImage.createdAt}</span>
                <span><strong>{t('archivo')}:</strong> {viewerImage.archivoNombre}</span>
                {viewerImage.archivoTamano && (
                  <span><strong>{t('tamano')}:</strong> {(viewerImage.archivoTamano / 1024).toFixed(1)} KB</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send to Patient Modal */}
      {sendImage && (
        <EnviarEvidenciaModal
          open={true}
          evidencia={sendImage}
          paciente={paciente}
          onClose={() => setSendImage(null)}
        />
      )}
    </div>
  );
}
