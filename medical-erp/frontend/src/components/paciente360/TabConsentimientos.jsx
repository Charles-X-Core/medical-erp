import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Shield, Check, Clock, FileText, ChevronDown, ChevronUp,
  Eye, Send
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
  const { tCommon } = useTranslation('common');
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
    return <div style={{ padding: 20, textAlign: 'center', color: '#94A3B8' }}>{tCommon('loading')}</div>;
  }

  const getEstadoConfig = (consent) => {
    if (consent.estadoDocumento === 'FIRMADO' || consent.aceptado) {
      return { label: t('firmado'), color: '#22C55E', bg: '#F0FDF4' };
    }
    return { label: t('pendiente_firma'), color: '#F59E0B', bg: '#FFFBEB' };
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1a2332' }}>{t('consentimientos')}</h3>
          <span style={{ fontSize: 12, color: '#94A3B8' }}>{t('registros_count', { count: consentimientos.length })}</span>
        </div>
      </div>

      {consentimientos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>
          <Shield size={48} />
          <p style={{ marginTop: 12 }}>{t('sin_consentimientos_reg')}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {consentimientos.map((consent) => {
            const config = getEstadoConfig(consent);
            const isExpanded = expandedId === consent.id;

            return (
              <div key={consent.id} style={{
                border: '1px solid #E2E8F0',
                borderRadius: 8,
                overflow: 'hidden',
                background: '#fff'
              }}>
                <div
                  onClick={() => setExpandedId(isExpanded ? null : consent.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    cursor: 'pointer',
                    borderBottom: isExpanded ? '1px solid #E2E8F0' : 'none'
                  }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: config.bg, flexShrink: 0
                  }}>
                    {consent.aceptado ? <Check size={20} style={{ color: config.color }} /> : <FileText size={20} style={{ color: config.color }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2332' }}>
                      {consent.tipo || consent.templateNombre || t('consentimientos')}
                    </div>
                    <div style={{ fontSize: 12, color: '#94A3B8' }}>
                      {consent.fechaFirma ? `${t('fecha_firma')}: ${formatFechaHora(consent.fechaFirma)}` : formatFecha(consent.createdAt)}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 12, padding: '2px 10px', borderRadius: 6,
                    background: config.bg, color: config.color, fontWeight: 500, whiteSpace: 'nowrap'
                  }}>
                    {config.label}
                  </span>
                  {isExpanded ? <ChevronUp size={16} color="#94A3B8" /> : <ChevronDown size={16} color="#94A3B8" />}
                </div>

                {isExpanded && (
                  <div style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: '#94A3B8' }}>{t('type', { ns: 'common' })}</span>
                        <span style={{ fontWeight: 500, color: '#1a2332' }}>{consent.tipo || consent.templateNombre || '—'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: '#94A3B8' }}>{t('documento_estado')}</span>
                        <span style={{ fontWeight: 500, color: '#1a2332' }}>{consent.estadoDocumento || consent.estado || '—'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: '#94A3B8' }}>{t('aceptado_label')}</span>
                        <span style={{ fontWeight: 500, color: consent.aceptado ? '#22C55E' : '#EF4444' }}>
                          {consent.aceptado ? `✓ ${tCommon('yes')}` : `✗ ${tCommon('no')}`}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: '#94A3B8' }}>{t('fecha_label')}</span>
                        <span style={{ fontWeight: 500, color: '#1a2332' }}>{formatFecha(consent.fecha)}</span>
                      </div>
                      {consent.version && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                          <span style={{ color: '#94A3B8' }}>{t('version')}</span>
                          <span style={{ fontWeight: 500, color: '#1a2332' }}>{consent.version}</span>
                        </div>
                      )}
                      {consent.firmaFecha && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                          <span style={{ color: '#94A3B8' }}>{t('fecha_firma')}</span>
                          <span style={{ fontWeight: 500, color: '#1a2332' }}>{formatFechaHora(consent.firmaFecha)}</span>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 8, borderTop: '1px solid #E2E8F0', paddingTop: 12 }}>
                      {consent.pdfUrl && (
                        <button
                          onClick={() => window.open(consent.pdfUrl, '_blank')}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '6px 12px', border: '1px solid #E2E8F0', borderRadius: 6,
                            background: '#fff', cursor: 'pointer', fontSize: 13, color: '#374151'
                          }}
                        >
                          <Eye size={14} /> {t('ver_pdf')}
                        </button>
                      )}
                      <button
                        onClick={() => setSendConsent(consent)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '6px 12px', border: '1px solid #E2E8F0', borderRadius: 6,
                          background: '#fff', cursor: 'pointer', fontSize: 13, color: '#374151'
                        }}
                      >
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
