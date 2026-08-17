export default function BadgesRow({ 
  tratamientos = 0, 
  recetas = 0, 
  pagosTotal = 0, 
  evidencias = 0,
  onClick 
}) {
  const badges = [];

  if (tratamientos > 0) {
    badges.push(
      <span key="tratamientos" className="badge badge--tratamientos" onClick={onClick}>
        🦷 {tratamientos} tratamiento{tratamientos > 1 ? 's' : ''}
      </span>
    );
  }
  if (recetas > 0) {
    badges.push(
      <span key="recetas" className="badge badge--recetas" onClick={onClick}>
        💊 {recetas} receta{recetas > 1 ? 's' : ''}
      </span>
    );
  }
  if (pagosTotal > 0) {
    badges.push(
      <span key="pagos" className="badge badge--pagos" onClick={onClick}>
        💰 S/ {pagosTotal.toLocaleString()}
      </span>
    );
  }
  if (evidencias > 0) {
    badges.push(
      <span key="evidencias" className="badge badge--evidencias" onClick={onClick}>
        🖼️ {evidencias} foto{evidencias > 1 ? 's' : ''}
      </span>
    );
  }

  if (!badges.length) return null;

  return (
    <div className="badges-row" onClick={onClick}>
      {badges}
    </div>
  );
}