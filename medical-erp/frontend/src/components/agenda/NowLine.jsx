import { useState, useEffect } from 'react';

export default function NowLine({ horaInicio = 8, pxPerMin = 2 }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const minutesFromStart = (now.getHours() - horaInicio) * 60 + now.getMinutes();
  const topPx = minutesFromStart * pxPerMin;

  if (topPx < 0) return null;

  return (
    <div className="agenda-week__now-line" style={{ top: `${topPx}px` }}>
      <div className="agenda-week__now-dot" />
      <div className="agenda-week__now-stroke" />
    </div>
  );
}
