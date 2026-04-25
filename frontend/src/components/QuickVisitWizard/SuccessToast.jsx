import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * SuccessToast — animated slide-up notification rendered at body level.
 * Props: message (string), onClose (fn), duration (ms, default 4000)
 */
export default function SuccessToast({ message, onClose, duration = 4000 }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    /* Trigger entrance animation */
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 400);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return createPortal(
    <div className={`qvw-toast ${visible ? 'qvw-toast-show' : ''}`} role="alert">
      <div className="qvw-toast-icon">🎉</div>
      <div className="qvw-toast-body">
        <div className="qvw-toast-title">تمت العملية بنجاح!</div>
        <div className="qvw-toast-msg">{message}</div>
      </div>
      <button className="qvw-toast-close" onClick={() => { setVisible(false); setTimeout(onClose, 400); }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
      <div className="qvw-toast-progress" style={{ animationDuration: `${duration}ms` }} />
    </div>,
    document.body
  );
}
