import { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

export default function ImageViewer({ images, currentIndex = 0, onClose }) {
  const [index, setIndex] = useState(currentIndex);
  const [scale, setScale] = useState(1);
  const [transform, setTransform] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [start, setStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setIndex(currentIndex);
    setScale(1);
    setTransform({ x: 0, y: 0 });
  }, [currentIndex]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const current = images?.[index];

  const next = () => setIndex((i) => Math.min(i + 1, (images?.length || 1) - 1));
  const prev = () => setIndex((i) => Math.max(i - 1, 0));

  const resetView = () => { setScale(1); setTransform({ x: 0, y: 0 }); };

  const onWheel = (e) => {
    e.preventDefault();
    setScale((s) => Math.min(6, Math.max(0.5, s + (e.deltaY < 0 ? 0.2 : -0.2))));
  };

  const onMouseDown = (e) => {
    setDragging(true);
    setStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  };
  const onMouseMove = (e) => {
    if (!dragging) return;
    setTransform({ x: e.clientX - start.x, y: e.clientY - start.y });
  };
  const onMouseUp = () => setDragging(false);

  if (!current) return null;

  return (
    <div
      className="image-viewer"
      onClick={onClose}
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
    >
      <div className="image-viewer__toolbar" onClick={(e) => e.stopPropagation()}>
        <span className="image-viewer__counter">{index + 1} / {images?.length}</span>
        {current.descripcion && <span className="image-viewer__desc">{current.descripcion}</span>}
        <div className="image-viewer__actions">
          <button onClick={() => setScale((s) => Math.min(6, s + 0.2))} title="Acercar"><ZoomIn size={18} /></button>
          <button onClick={() => setScale((s) => Math.max(0.5, s - 0.2))} title="Alejar"><ZoomOut size={18} /></button>
          <button onClick={resetView} title="Reset"><span className="image-viewer__reset">1:1</span></button>
          <button onClick={onClose} title="Cerrar"><X size={20} /></button>
        </div>
      </div>

      <div className="image-viewer__stage" onClick={(e) => e.stopPropagation()}>
        <img
          src={current.url}
          alt={current.descripcion || `Imagen ${index + 1}`}
          style={{ transform: `scale(${scale}) translate(${transform.x}px, ${transform.y}px)`, cursor: dragging ? 'grabbing' : 'grab' }}
        />
      </div>

      {images?.length > 1 && (
        <>
          <button className="image-viewer__nav image-viewer__nav--left" onClick={(e) => { e.stopPropagation(); prev(); }} disabled={index === 0}><ChevronLeft size={28} /></button>
          <button className="image-viewer__nav image-viewer__nav--right" onClick={(e) => { e.stopPropagation(); next(); }} disabled={index === images.length - 1}><ChevronRight size={28} /></button>
        </>
      )}
    </div>
  );
}
