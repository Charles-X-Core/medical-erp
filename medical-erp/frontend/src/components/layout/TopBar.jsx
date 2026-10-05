import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, X, FileText, Phone, Bell, Calendar } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { pacienteService } from '../../services/pacienteService';
import { formatNombre } from '../../utils/fullName';

function extractList(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.content && Array.isArray(data.content)) return data.content;
  if (data.data) return extractList(data.data);
  return [];
}

function getInitials(nombre) {
  if (!nombre) return '?';
  const parts = nombre.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
}

export default function TopBar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation('patients');
  const { t: tS } = useTranslation('sidebar');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const searchPatients = useCallback(async (q) => {
    if (!q || q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const data = await pacienteService.search(q);
      setResults(extractList(data).slice(0, 8));
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchPatients(query), 300);
    return () => clearTimeout(timer);
  }, [query, searchPatients]);

  const handleSelect = (paciente) => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    navigate(`/pacientes/${paciente.id}/workspace`);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div className="topbar">
      <div className="topbar__search">
        <Search className="topbar__search-icon" size={18} />
        <input
          type="text"
          className="topbar__search-input"
          placeholder={t('buscar_nombre_documento')}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        {loading && <div className="topbar__spinner" />}
        {query && !loading && (
          <button className="topbar__clear" onClick={handleClear}>
            <X size={16} />
          </button>
        )}
      </div>

      <div className="topbar__actions">
        <button className="topbar__icon-btn" title={tS('notifications')}>
          <Bell size={20} />
          <span className="topbar__badge">3</span>
        </button>
        <button className="topbar__icon-btn" title={t('date', { ns: 'common' })}>
          <Calendar size={20} />
        </button>

        <div className="topbar__profile">
          <div className="topbar__profile-avatar">
            {getInitials(user?.nombre)}
          </div>
        </div>
      </div>

      {isOpen && query.length >= 2 && (
        <div className="topbar__dropdown">
          {results.length > 0 ? (
            <div className="topbar__results">
              {results.map((p) => {
                const fullName = formatNombre(p);
                const initials = `${(p.apellidoPaterno || '?')[0]}${(p.nombres || '?')[0]}`;
                return (
                  <button
                    key={p.id}
                    className="topbar__result-item"
                    onClick={() => handleSelect(p)}
                  >
                    <div className="topbar__result-avatar">{initials.toUpperCase()}</div>
                    <div className="topbar__result-info">
                      <span className="topbar__result-name">{fullName}</span>
                      <span className="topbar__result-doc">
                        <FileText size={12} />
                        {p.licenciaConducir || '-'}
                      </span>
                      {p.telefono && (
                        <span className="topbar__result-detail">
                          <Phone size={12} /> {p.telefono}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="topbar__empty">
              <p>{t('no_results', { ns: 'common' })} "{query}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
