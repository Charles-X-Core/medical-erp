export function formatNombre(p) {
  if (!p) return '';
  const apellido = [p.apellidoPaterno, p.apellidoMaterno].filter(Boolean).join(' ');
  return [apellido, p.nombres].filter(Boolean).join(', ').trim();
}
