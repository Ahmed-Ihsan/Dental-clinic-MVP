import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * GlobalModal — portal-based modal that renders at document.body level.
 * Supports Escape-to-close, click-outside-to-close, and animated entrance.
 *
 * Props:
 *   isOpen    {boolean}   — controls visibility
 *   onClose   {function}  — called when user dismisses
 *   title     {string}    — modal title
 *   icon      {string}    — emoji / icon character
 *   size      {string}    — 'sm' | 'md' | 'lg' | 'xl'  (default 'md')
 *   children  {ReactNode} — modal body content
 */
export default function GlobalModal({
  isOpen,
  onClose,
  title,
  icon,
  size = 'md',
  children,
}) {
  const overlayRef = useRef();

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handle = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handle);
    // Prevent body scroll while open
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handle);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  if (!isOpen) return null;

  const sizeMap = {
    sm: '420px',
    md: '560px',
    lg: '760px',
    xl: '960px',
  };

  return createPortal(
    <div
      className="gm-overlay"
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        className={`gm-dialog gm-dialog-${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gm-title"
        style={{ maxWidth: sizeMap[size] || sizeMap.md }}
      >
        {/* Header */}
        <div className="gm-header">
          <div className="gm-title" id="gm-title">
            {icon && <span className="gm-icon">{icon}</span>}
            {title}
          </div>
          <button
            className="gm-close"
            onClick={onClose}
            aria-label="إغلاق"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="gm-body">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
