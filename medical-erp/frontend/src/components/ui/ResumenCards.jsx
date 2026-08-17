export default function ResumenCards({ 
  resumen, 
  onTab 
}) {
  if (!resumen) return null;

  return (
    <div className="resumen-cards">
      <div className="resumen-card" onClick={() => onTab?.('clinico')}>
        <span className="resumen-card__num">{resumen.totalConsultas || 0}</span>
        <span className="resumen-card__label">Consultas</span>
      </div>
      <div className="resumen-card" onClick={() => onTab?.('clinico')}>
        <span className="resumen-card__num">
          {resumen.tratamientosPendientes || 0} / {resumen.totalTratamientos || 0}
        </span>
        <span className="resumen-card__label">Tratamientos</span>
      </div>
      <div className="resumen-card" onClick={() => onTab?.('financiero')}>
        <span className="resumen-card__num">S/ {(resumen.costoTotalTratamientos || 0).toLocaleString()}</span>
        <span className="resumen-card__label">Total Tratamientos</span>
      </div>
      <div className="resumen-card" onClick={() => onTab?.('clinico')}>
        <span className="resumen-card__num">{resumen.totalRecetas || 0}</span>
        <span className="resumen-card__label">Recetas</span>
      </div>
    </div>
  );
}