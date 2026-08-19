import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { FileText, Maximize2, Minimize2, CheckCircle } from 'lucide-react';

function extractBodyHtml(fullHtml) {
  if (!fullHtml) return '';
  const bodyMatch = fullHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  return bodyMatch ? bodyMatch[1] : fullHtml;
}

const HtmlDocViewer = forwardRef(function HtmlDocViewer({
  htmlContent = '',
  title = 'Documento',
  badge = null,
  maxHeight = '100%',
  enableSignature = false,
  onSignatureReady = null,
  onSignatureChange = null,
  actions = null,
  footer = null,
  overlay = null,
  fullscreen = false,
  onToggleFullscreen = null,
  className = '',
}, ref) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const hasSignatureRef = useRef(false);
  const htmlRenderedRef = useRef(false);
  const onSignatureChangeRef = useRef(onSignatureChange);
  const [minimized, setMinimized] = useState(false);

  // Keep callback ref fresh
  useEffect(() => {
    onSignatureChangeRef.current = onSignatureChange;
  }, [onSignatureChange]);

  const bodyHtml = extractBodyHtml(htmlContent);

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    getContainer: () => containerRef.current,
    getCanvas: () => canvasRef.current,
    hasSignature: () => hasSignatureRef.current,
    getSignatureDataUrl: () => canvasRef.current?.toDataURL('image/png'),
    clearSignature: () => {
      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      hasSignatureRef.current = false;
      if (onSignatureChangeRef.current) onSignatureChangeRef.current(false);
    },
    scrollToSignature: () => {
      const el = containerRef.current?.querySelector('.sig-value');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
    resetHtmlRendered: () => {
      htmlRenderedRef.current = false;
    },
  }));

  // Render HTML + inject canvas (PWA signature mode)
  useEffect(() => {
    if (!enableSignature || !bodyHtml || !containerRef.current) return;
    if (htmlRenderedRef.current) return;
    htmlRenderedRef.current = true;

    const container = containerRef.current;
    container.innerHTML = bodyHtml;

    // Find the signature placeholder
    const sigPlaceholders = container.querySelectorAll('.sig-value');
    const sigPlaceholder = sigPlaceholders.length > 1 ? sigPlaceholders[1] : sigPlaceholders[0];
    if (!sigPlaceholder) return;

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.className = 'sig-canvas';
    sigPlaceholder.innerHTML = '';
    sigPlaceholder.classList.add('sig-value--canvas');
    sigPlaceholder.appendChild(canvas);

    const label = document.createElement('span');
    label.className = 'sig-label';
    label.textContent = 'Firme aqui';
    sigPlaceholder.appendChild(label);

    canvasRef.current = canvas;
    const ctx = canvas.getContext('2d');

    // HiDPI setup
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    ctx.strokeStyle = '#1A2332';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Drawing handlers
    const getPos = (e) => {
      const r = canvas.getBoundingClientRect();
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      const cy = e.touches ? e.touches[0].clientY : e.clientY;
      return { x: cx - r.left, y: cy - r.top };
    };

    let drawing = false;
    const onDown = (e) => { e.preventDefault(); const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); drawing = true; };
    const onMove = (e) => {
      if (!drawing) return;
      e.preventDefault();
      const p = getPos(e);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      if (!hasSignatureRef.current) {
        hasSignatureRef.current = true;
        if (onSignatureChangeRef.current) onSignatureChangeRef.current(true);
      }
    };
    const onUp = () => { drawing = false; };

    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseup', onUp);
    canvas.addEventListener('mouseleave', onUp);
    canvas.addEventListener('touchstart', onDown, { passive: false });
    canvas.addEventListener('touchmove', onMove, { passive: false });
    canvas.addEventListener('touchend', onUp);

    // Notify parent canvas is ready
    if (onSignatureReady) onSignatureReady(canvasRef);

    return () => {
      canvas.removeEventListener('mousedown', onDown);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseup', onUp);
      canvas.removeEventListener('mouseleave', onUp);
      canvas.removeEventListener('touchstart', onDown);
      canvas.removeEventListener('touchmove', onMove);
      canvas.removeEventListener('touchend', onUp);
    };
  }, [bodyHtml, enableSignature, onSignatureReady]);

  // Reset rendered guard when htmlContent changes
  useEffect(() => {
    if (!enableSignature) return;
    htmlRenderedRef.current = false;
    hasSignatureRef.current = false;
    if (onSignatureChangeRef.current) onSignatureChangeRef.current(false);
  }, [htmlContent, enableSignature]);

  // --- PWA fullscreen mode ---
  if (fullscreen) {
    return (
      <div className={`html-doc-viewer html-doc-viewer--fullscreen ${className}`}>
        <div className="html-doc-viewer__header">
          <div className="html-doc-viewer__header-left">
            <FileText size={18} className="html-doc-viewer__header-icon" />
            <span className="html-doc-viewer__title">{title}</span>
            {badge && (
              <span className="html-doc-viewer__badge">
                <CheckCircle size={12} /> {badge}
              </span>
            )}
          </div>
          <div className="html-doc-viewer__header-actions">
            {onToggleFullscreen && (
              <button className="html-doc-viewer__btn-icon" onClick={onToggleFullscreen}>
                {minimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
              </button>
            )}
          </div>
        </div>

        {!minimized ? (
          <>
            <div className="html-doc-viewer__body">
              <div className="html-doc-viewer__sheet" ref={containerRef} />
              {overlay && (
                <div className="html-doc-viewer__overlay">
                  {overlay}
                </div>
              )}
            </div>

            {actions && (
              <div className="html-doc-viewer__sig-bar">
                <div className="html-doc-viewer__sig-bar-actions">
                  {actions}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="html-doc-viewer__minimized">
            <span>Contrato minimizado</span>
            <button className="html-doc-viewer__btn-icon html-doc-viewer__btn-icon--accent" onClick={() => setMinimized(false)}>
              <Maximize2 size={16} /> Expandir
            </button>
          </div>
        )}
      </div>
    );
  }

  // --- ERP compact mode ---
  return (
    <div className={`html-doc-viewer ${className}`}>
      <div className="html-doc-viewer__header">
        <div className="html-doc-viewer__header-left">
          <FileText size={18} className="html-doc-viewer__header-icon" />
          <span className="html-doc-viewer__title">{title}</span>
          {badge && (
            <span className="html-doc-viewer__badge">
              <CheckCircle size={12} /> {badge}
            </span>
          )}
        </div>
        <div className="html-doc-viewer__header-actions">
          {actions}
        </div>
      </div>

      <div className="html-doc-viewer__body" style={{ maxHeight }}>
        <div className="html-doc-viewer__content">
          <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
        </div>
        {overlay && (
          <div className="html-doc-viewer__overlay">
            {overlay}
          </div>
        )}
      </div>

      {footer && (
        <div className="html-doc-viewer__footer">
          {footer}
        </div>
      )}
    </div>
  );
});

export default HtmlDocViewer;
