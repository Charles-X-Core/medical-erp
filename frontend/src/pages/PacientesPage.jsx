import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { pacienteService } from '../services/pacienteService';
import {
  Users,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Trash2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export default function PacientesPage() {
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const loadPacientes = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      let res;
      if (searchQuery.trim()) {
        res = await pacienteService.search(searchQuery.trim());
      } else {
        res = await pacienteService.list({ page, size: 10, sort: 'id,desc' });
      }

      if (res.success) {
        const content = res.data?.content || res.data || [];
        setPacientes(content);
        setTotalPages(res.data?.totalPages || 1);
        setTotalElements(res.data?.totalElements || content.length);
      } else {
        setError(res.message || 'Error al cargar pacientes');
      }
    } catch (err) {
      setError(err.message || 'Error al cargar pacientes');
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery]);

  useEffect(() => {
    loadPacientes();
  }, [loadPacientes]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    loadPacientes();
  };

  const handleDelete = async (id, nombre) => {
    if (!confirm(`¿Eliminar paciente ${nombre}?`)) return;
    try {
      await pacienteService.delete(id);
      loadPacientes();
    } catch (err) {
      setError(err.message || 'Error al eliminar paciente');
    }
  };

  const getEstadoClass = (estado) => {
    switch (estado?.toLowerCase()) {
      case 'activo':
        return 'paciente-estado--activo';
      case 'inactivo':
        return 'paciente-estado--inactivo';
      default:
        return 'paciente-estado--default';
    }
  };

  return (
    <div className="pacientes-page">
      {/* Header */}
      <div className="pacientes-page__header">
        <div className="pacientes-page__title-group">
          <Users size={28} className="pacientes-page__icon" />
          <div>
            <h2 className="pacientes-page__title">Pacientes</h2>
            <p className="pacientes-page__subtitle">
              {totalElements} {totalElements === 1 ? 'paciente registrado' : 'pacientes registrados'}
            </p>
          </div>
        </div>
        <button
          className="btn btn--primary"
          onClick={() => navigate('/pacientes/nuevo')}
        >
          <Plus size={18} />
          Nuevo Paciente
        </button>
      </div>

      {/* Search */}
      <form className="pacientes-page__search" onSubmit={handleSearch}>
        <div className="search-input">
          <Search size={18} className="search-input__icon" />
          <input
            type="text"
            className="search-input__field"
            placeholder="Buscar por nombre, DNI, email o teléfono..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn--secondary">
          Buscar
        </button>
        {searchQuery && (
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => { setSearchQuery(''); setPage(0); }}
          >
            Limpiar
          </button>
        )}
      </form>

      {/* Error */}
      {error && (
        <div className="pacientes-page__error">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Table */}
      <div className="pacientes-page__table-wrapper">
        {loading ? (
          <div className="pacientes-page__loading">
            <Loader2 size={32} className="spinner" />
            <p>Cargando pacientes...</p>
          </div>
        ) : pacientes.length === 0 ? (
          <div className="pacientes-page__empty">
            <Users size={48} />
            <p>No hay pacientes registrados</p>
            <button className="btn btn--primary" onClick={() => navigate('/pacientes/nuevo')}>
              <Plus size={18} />
              Registrar primer paciente
            </button>
          </div>
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>DNI</th>
                  <th>Teléfono</th>
                  <th>Email</th>
                  <th>Estado</th>
                  <th className="data-table__actions">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pacientes.map((p) => (
                  <tr key={p.id}>
                    <td className="data-table__id">#{p.id}</td>
                    <td>
                      <div className="data-table__name">
                        <span className="data-table__name-main">
                          {p.nombres} {p.apellidoPaterno}
                        </span>
                        {p.apellidoMaterno && (
                          <span className="data-table__name-sub">{p.apellidoMaterno}</span>
                        )}
                      </div>
                    </td>
                    <td>{p.dni || '-'}</td>
                    <td>{p.telefono || '-'}</td>
                    <td>{p.email || '-'}</td>
                    <td>
                      <span className={`paciente-estado ${getEstadoClass(p.estado)}`}>
                        {p.estado || 'activo'}
                      </span>
                    </td>
                    <td className="data-table__actions">
                      <button
                        className="btn btn--icon btn--sm"
                        title="Ver detalle"
                        onClick={() => navigate(`/pacientes/${p.id}`)}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="btn btn--icon btn--sm"
                        title="Editar"
                        onClick={() => navigate(`/pacientes/${p.id}/editar`)}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="btn btn--icon btn--sm btn--danger"
                        title="Eliminar"
                        onClick={() => handleDelete(p.id, `${p.nombres} ${p.apellidoPaterno}`)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="pagination__btn"
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="pagination__info">
                  Página {page + 1} de {totalPages}
                </span>
                <button
                  className="pagination__btn"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(page + 1)}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
