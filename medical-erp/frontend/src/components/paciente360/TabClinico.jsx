import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Search, Calendar, Stethoscope, Pill, FileText, Eye, ChevronDown, ChevronUp, Filter, Activity, Heart, Thermometer, Wind } from 'lucide-react';
import { consultasService } from '../../services/consultasService';
import { historiaClinicaService } from '../../services/historiaClinicaService';
import { getTreatmentLabel } from '../../config/attentionTypes';

const parseJson = (d) => {
  if (!d) return [];
  try { return typeof d === 'string' ? JSON.parse(d) : d; } catch { return []; }
};

const parseObj = (d) => {
  if (!d) return null;
  try { return typeof d === 'string' ? JSON.parse(d) : d; } catch { return null; }
};

function VitalBadge({ label, value, unit, icon: Icon, warning }) {
  const isWarning = warning && value != null;
  return (
    <div className={`vital-badge ${isWarning ? 'vital-badge--warning' : ''}`}>
      <Icon size={12} />
      <span className="vital-badge__label">{label}</span>
      <span className="vital-badge__value">{value ?? '—'}{value != null && unit && <span className="vital-badge__unit">{unit}</span>}</span>
    </div>
  );
}

export default function TabClinico({ pacienteId, historiaId }) {
  const navigate = useNavigate();
  const [consultas, setConsultas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const loadData = async () => {
    if (!pacienteId) return;
    try {
      let hId = historiaId;
      if (!hId) {
        const hRes = await historiaClinicaService.getByPaciente(pacienteId).catch(() => null);
        if (hRes?.success && hRes.data?.id) hId = hRes.data.id;
      }
      if (!hId) { setLoading(false); return; }

      const cRes = await consultasService.listByHistoria(hId, { size: 50, sort: 'fecha,desc' });
      if (cRes?.success && cRes.data?.content) {
        setConsultas(cRes.data.content);
      }
    } catch (err) {
      console.error('Error loading consultas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [pacienteId, historiaId]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const matchesSearch = (c) => {
    if (!searchText) return true;
    const search = searchText.toLowerCase();
    const motivo = (c.motivo || '').toLowerCase();
    const diags = parseJson(c.diagnosticoLista).map(d => (d.descripcion || d.texto || '').toLowerCase()).join(' ');
    const sintomas = (c.signosSintomas || '').toLowerCase();
    return motivo.includes(search) || diags.includes(search) || sintomas.includes(search);
  };

  const matchesDates = (c) => {
    if (!fechaDesde && !fechaHasta) return true;
    const fecha = c.fecha ? new Date(c.fecha) : null;
    if (!fecha) return true;
    if (fechaDesde && fecha < new Date(fechaDesde)) return false;
    if (fechaHasta && fecha > new Date(fechaHasta + 'T23:59:59')) return false;
    return true;
  };

  const filtered = consultas.filter(c => matchesSearch(c) && matchesDates(c));

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <div className="tab-clinico">
        <div className="loading">
          <Loader2 size={24} className="spinner" />
          <p>Cargando historial clínico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tab-clinico">
      <div className="tab-clinico__header">
        <h3>Historial de Consultas</h3>
        <div className="tab-clinico__filters">
          <button
            className={`btn btn--ghost btn--sm ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} /> Filtros
          </button>
          <div className="filter-input">
            <Search size={16} />
            <input
              type="text"
              placeholder="Buscar por motivo, diagnóstico..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="tab-clinico__date-filters">
          <div className="date-filter">
            <label>Desde:</label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
            />
          </div>
          <div className="date-filter">
            <label>Hasta:</label>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
            />
          </div>
          {(fechaDesde || fechaHasta) && (
            <button
              className="btn btn--ghost btn--sm"
              onClick={() => { setFechaDesde(''); setFechaHasta(''); }}
            >
              Limpiar fechas
            </button>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="empty-state">
          <Stethoscope size={40} strokeWidth={1.2} />
          <p>{consultas.length === 0 ? 'No hay consultas registradas' : 'No hay coincidencias con los filtros'}</p>
        </div>
      ) : (
        <div className="tab-clinico__list">
          {filtered.map((c) => {
            const diagnosticos = parseJson(c.diagnosticoLista);
            const diagText = diagnosticos.map(d => d.descripcion || d.texto).join('; ');
            const sv = parseObj(c.signosVitales) || {};
            const isExpanded = expandedId === c.id;

            const calcularIMC = () => {
              const peso = parseFloat(sv.peso);
              const talla = parseInt(sv.talla);
              if (!peso || !talla || talla <= 0) return null;
              const tallaM = talla / 100;
              return (peso / (tallaM * tallaM)).toFixed(1);
            };
            const imc = calcularIMC();

            return (
              <div key={c.id} className={`consulta-card ${isExpanded ? 'consulta-card--expanded' : ''}`}>
                <div className="consulta-card__header" onClick={() => toggleExpand(c.id)}>
                  <div className="consulta-card__date">
                    <Calendar size={14} />
                    <span>{formatDate(c.fecha)}</span>
                    <span className="consulta-card__time">{formatTime(c.fecha)}</span>
                  </div>
                  <div className="consulta-card__badges">
                    {c.firmado && (
                      <span className="consulta-badge consulta-badge--firmado">Firmada</span>
                    )}
                    {c.tipoTratamiento && (
                      <span className="consulta-badge consulta-badge--tratamiento">
                        <Pill size={12} /> {getTreatmentLabel(c.tipoTratamiento)}
                      </span>
                    )}
                  </div>
                  <button className="consulta-card__expand">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>

                <div className="consulta-card__motivo">
                  <Stethoscope size={14} />
                  <span>{c.motivo || 'Sin motivo registrado'}</span>
                </div>

                {diagText && (
                  <div className="consulta-card__diagnostico">
                    <strong>Diagnóstico:</strong> {diagText}
                  </div>
                )}

                {isExpanded && (
                  <div className="consulta-card__detail">
                    {/* Anamnesis */}
                    <div className="consulta-card__section">
                      <div className="consulta-card__section-label">
                        <Stethoscope size={12} /> Anamnesis
                      </div>
                      {c.tiempoEnfermedad && (
                        <div className="detail-field">
                          <span className="detail-label">Tiempo de enfermedad:</span>
                          <span>{c.tiempoEnfermedad}</span>
                        </div>
                      )}
                      {c.signosSintomas && (
                        <div className="detail-field">
                          <span className="detail-label">Signos/Síntomas:</span>
                          <span>{c.signosSintomas}</span>
                        </div>
                      )}
                      {c.relatoCronologico && (
                        <div className="detail-field">
                          <span className="detail-label">Relato cronológico:</span>
                          <span>{c.relatoCronologico}</span>
                        </div>
                      )}
                    </div>

                    {/* Exploración + Signos Vitales */}
                    <div className="consulta-card__section">
                      <div className="consulta-card__section-label">
                        <Activity size={12} /> Exploración
                      </div>
                      {c.examenClinicoGeneral && (
                        <div className="detail-field">
                          <span className="detail-label">Examen clínico:</span>
                          <span>{c.examenClinicoGeneral}</span>
                        </div>
                      )}
                      {c.funcionesBiologicas && (
                        <div className="detail-field">
                          <span className="detail-label">Funciones biológicas:</span>
                          <span>{c.funcionesBiologicas}</span>
                        </div>
                      )}
                      {Object.keys(sv).length > 0 && (
                        <div className="consulta-card__vitals">
                          <span className="detail-label">Signos vitales:</span>
                          <div className="consulta-card__vitals-grid">
                            <VitalBadge icon={Heart} label="PA" value={sv.presionArterial} unit="mmHg" warning={sv.presionArterial && (String(sv.presionArterial).includes('14') || String(sv.presionArterial).includes('15') || String(sv.presionArterial).includes('16') || String(sv.presionArterial).includes('17') || String(sv.presionArterial).includes('18'))} />
                            <VitalBadge icon={Activity} label="Pulso" value={sv.pulso} unit="lpm" warning={sv.pulso && (sv.pulso < 50 || sv.pulso > 100)} />
                            <VitalBadge icon={Thermometer} label="Temp" value={sv.temperatura} unit="°C" warning={sv.temperatura && (sv.temperatura < 36 || sv.temperatura > 37.5)} />
                            <VitalBadge icon={Activity} label="SpO2" value={sv.saturacion} unit="%" warning={sv.saturacion && sv.saturacion < 95} />
                            <VitalBadge icon={Wind} label="FR" value={sv.frecuenciaRespiratoria} unit="rpm" warning={sv.frecuenciaRespiratoria && (sv.frecuenciaRespiratoria < 12 || sv.frecuenciaRespiratoria > 20)} />
                            <VitalBadge icon={Activity} label="Peso" value={sv.peso} unit="kg" />
                            <VitalBadge icon={Activity} label="Talla" value={sv.talla} unit="cm" />
                            {imc && (
                              <VitalBadge icon={Activity} label="IMC" value={imc} unit="" />
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Evolución */}
                    {c.evolucionMejoria && (
                      <div className="consulta-card__section">
                        <div className="consulta-card__section-label">
                          <FileText size={12} /> Evolución
                        </div>
                        <div className="detail-field">
                          <span>{c.evolucionMejoria}</span>
                        </div>
                      </div>
                    )}

                    {/* Acciones */}
                    <div className="consulta-card__actions">
                      <button
                        className="btn btn--ghost btn--sm"
                        onClick={(e) => { e.stopPropagation(); navigate(`/consultas/${c.id}`); }}
                      >
                        <Eye size={14} /> Ver Detalle
                      </button>
                      <a
                        className="btn btn--ghost btn--sm"
                        href={`/api/v1/consultas/${c.id}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FileText size={14} /> PDF
                      </a>
                    </div>
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
