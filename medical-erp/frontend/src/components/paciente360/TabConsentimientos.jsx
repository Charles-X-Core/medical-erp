import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Shield, Check, Clock, FileText, ChevronDown, ChevronUp,
  Eye, Send, Loader2
} from 'lucide-react';
import { pacienteConsentimientoService } from '../../services/pacienteSubServices';
import { pacienteService } from '../../services/pacienteService';
import EnviarConsentimientoModal from './EnviarConsentimientoModal';

function formatFecha(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatFechaHora(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function TabConsentimientos({ pacienteId }) {
  const { t } = useTranslation('patients');
  const { t: tCommon } = useTranslation('common');
  const [consentimientos, setConsentimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [paciente, setPaciente] = useState(null);
  const [sendConsent, setSendConsent] = useState(null);

  useEffect(() => {
    loadData();
  }, [pacienteId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [consRes, pacRes] = await Promise.allSettled([
        pacienteConsentimientoService.list(pacienteId),
        pacienteService.getById(pacienteId),
      ]);
      if (consRes.status === 'fulfilled' && consRes.value?.success) {
        const data = consRes.value.data;
        setConsentimientos(Array.isArray(data) ? data : data?.content || []);
      }
      if (pacRes.status === 'fulfilled' && pacRes.value?.success) {
        setPaciente(pacRes.value.data);
      }
    } catch (err) {
      console.error('Error loading consentimientos:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="tab-loading">{tCommon('loading')}</div>;
  }

  const getEstadoConfig = (consent) => {
    if (consent.estadoDocumento === 'FIRMADO' || consent.aceptado) {
      return { label: t('firmado'), icon: Check, color: '#22C55E', bg: '#F0FDF4' };
    }
    if (consent.estadoDocumento === 'BORRADOR') {
      return { label: t('pendiente_firma'), icon: FileText, color: '#94A3B8', bg: '#F8FAFC' };
    }
    return { label: t('pendiente_firma'), icon: Clock, color: '#F59E0B', bg: '#FFFBEB' };
  };

  return (
    <div className="tab-consentimientos">
      <div className="tab-consentimientos__header">
        <div>
          <h3>{t('consentimientos')}</h3>
          <span className="tab-consentimientos__count">{t('registros_count', { count: consentimientos.length })}</span>
        </div>
      </div>

      {consentimientos.length === 0 ? (
        <div className="tab-empty">
          <Shield size={48} />
          <p>{t('sin_consentimientos_reg')}</p>
        </div>
      ) : (
        <div className="tab-consentimientos__list">
          {consentimientos.map((consent) => {
            const config = getEstadoConfig(consent);
            const Icon = config.icon;
            const isExpanded = expandedId === consent.id;

            return (
              <div key={consent.id} className={`consent-card ${isExpanded ? 'consent-card--expanded' : ''}`}>
                <div
                  className="consent-card__main"
                  onClick={() => setExpandedId(isExpanded ? null : consent.id)}
                >
                  <div className="consent-card__icon" style={{ background: config.bg }}>
                    <Icon size={20} style={{ color: config.color }} />
                  </div>
                  <div className="consent-card__info">
                    <h4 className="consent-card__nombre">{consent.tipo || consent.templateNombre || t('consentimientos')}</h4>
                    <span className="consent-card__fecha">{consent.fechaFirma ? `${t('fecha_firma')}: ${formatFechaHora(consent.fechaFirma)}` : formatFecha(consent.createdAt)}</span>
                  </div>
                  <div className="consent-card__right">
                    <span className="consent-card__estado" style={{ background: config.bg, color: config.color }}>
                      {config.label}
                    </span>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="consent-card__detail">
                    <div className="consent-card__detail-grid">
                      <div className="consent-card__detail-row">
                        <span className="consent-card__detail-label">{t('type', { ns: 'common' })}</span>
                        <span className="consent-card__detail-value">{consent.tipo || consent.templateNombre || '—'}</span>
                      </div>
                      <div className="consent-card__detail-row">
                        <span className="consent-card__detail-label">{t('documento_estado')}</span>
                        <span className="consent-card__detail-value">{consent.estadoDocumento || consent.estado || '—'}</span>
                      </div>
                      <div className="consent-card__detail-row">
                        <span className="consent-card__detail-label">{t('aceptado_label')}</span>
                        <span className="consent-card__detail-value">
                          {consent.aceptado
                            ? <span style={{ color: '#22C55E' }}>✓ {tCommon('yes')}</span>
                            : <span style={{ color: '#EF4444' }}>✗ {tCommon('no')}</span>
                          }
                        </span>
                      </div>
                      <div className="consent-card__detail-row">
                        <span className="consent-card__detail-label">{t('fecha_label')}</span>
                        <span className="consent-card__detail-value">{formatFecha(consent.fecha)}</span>
                      </div>
                      {consent.version && (
                        <div className="consent-card__detail-row">
                          <span className="consent-card__detail-label">{t('version')}</span>
                          <span className="consent-card__detail-value">{consent.version}</span>
                        </div>
                      )}
                      {consent.firmaFecha && (
                        <div className="consent-card__detail-row">
                          <span className="consent-card__detail-label">{t('fecha_firma')}</span>
                          <span className="consent-card__detail-value">{formatFechaHora(consent.firmaFecha)}</span>
                        </div>
                      )}
                    </div>

                    <div className="consent-card__actions">
                      {consent.pdfUrl && (
                        <button className="btn btn--ghost btn--sm" onClick={() => window.open(consent.pdfUrl, '_blank')}>
                          <Eye size={14} /> {t('ver_pdf')}
                        </button>
                      )}
                      <button className="btn btn--ghost btn--sm" onClick={() => setSendConsent(consent)}>
                        <Send size={14} /> {t('enviar_por_email')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {sendConsent && (
        <EnviarConsentimientoModal
          open={true}
          consentimiento={sendConsent}
          paciente={paciente}
          onClose={() => setSendConsent(null)}
        />
      )}
    </div>
  );
}
