import { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ImageViewer({ images, onClose }) {
  const [index, setIndex] = useState(0);

  if (!images?.length) return null;

  const current = images[index];

  return (
    <div className="image-viewer-overlay" onClick={onClose}>
      <div className="image-viewer" onClick={(e) => e.stopPropagation()}>
        <div className="image-viewer__toolbar">
          <div className="image-viewer__counter">
            {index + 1} / {images.length}
          </div>
          <button className="image-viewer__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="image-viewer__canvas">
          <img
            src={`/api/v1/evidencias/file/${current.fileName}`}
            alt={current.descripcion || current.originalFileName || ''}
            style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
          />
        </div>
        {images.length > 1 && (
          <>
            <button 
              className="image-viewer__nav image-viewer__nav--prev" 
              onClick={() => setIndex(i => Math.max(0, i - 1))} 
              disabled={index === 0}
            >
              <ChevronLeft size={24} />
            </button>
            <button 
              className="image-viewer__nav image-viewer__nav--next" 
              onClick={() => setIndex(i => Math.min(images.length - 1, i + 1))} 
              disabled={index === images.length - 1}
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}