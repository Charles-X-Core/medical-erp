import { useState, useEffect } from 'react';
import { Clock, Calendar } from 'lucide-react';

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function RelojWidget() {
  const [hora, setHora] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setHora(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = hora.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const parts = timeStr.split(':');

  return (
    <div className="reloj-widget">
      <div className="reloj-widget__icon"><Clock size={24} /></div>
      <div className="reloj-widget__time">
        <span className="reloj-widget__hours">{parts[0]}:{parts[1]}</span>
        <span className="reloj-widget__seconds">:{parts[2]}</span>
      </div>
      <div className="reloj-widget__date">
        <Calendar size={14} />
        <span>{DIAS[hora.getDay()]} {hora.getDate()} de {MESES[hora.getMonth()]}</span>
      </div>
    </div>
  );
}
