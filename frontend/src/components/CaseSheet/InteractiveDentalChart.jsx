import { useState, useCallback } from 'react';

/* ── Status definitions ───────────────────────────────────────── */
const STATUSES = [
  { key: 'healthy',   label: 'سليم',        labelEn: 'Healthy',   color: '#d1fae5', stroke: '#10b981', glow: '#10b98140', icon: '✓', iconColor: '#065f46' },
  { key: 'attention', label: 'يحتاج علاج',  labelEn: 'Treatment', color: '#fee2e2', stroke: '#f87171', glow: '#f8717140', icon: '!', iconColor: '#7f1d1d' },
  { key: 'completed', label: 'تم العلاج',   labelEn: 'Completed', color: '#dbeafe', stroke: '#3b82f6', glow: '#3b82f640', icon: '★', iconColor: '#1e3a8a' },
  { key: 'missing',   label: 'مفقود',       labelEn: 'Missing',   color: '#1e293b', stroke: '#475569', glow: '#47556940', icon: '✕', iconColor: '#94a3b8' },
];
const STATUS_MAP = Object.fromEntries(STATUSES.map(s => [s.key, s]));

/* ── Universal Numbering ──────────────────────────────────────── */
const UPPER = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16];
const LOWER = [32,31,30,29,28,27,26,25,24,23,22,21,20,19,18,17];

function buildDefault() {
  const s = {};
  [...UPPER, ...LOWER].forEach(n => { s[n] = 'healthy'; });
  return s;
}

/* ── Tooth geometry helper ───────────────────────────────────── */
function getToothGeom(num) {
  const molars    = new Set([1,2,3,14,15,16,17,18,19,30,31,32]);
  const premolars = new Set([4,5,12,13,20,21,28,29]);
  if (molars.has(num))    return { w: 34, h: 38, rx: 8,  roots: 3 };
  if (premolars.has(num)) return { w: 27, h: 36, rx: 7,  roots: 2 };
  return                         { w: 22, h: 34, rx: 10, roots: 1 };
}

/* ── Individual Tooth ────────────────────────────────────────── */
function Tooth({ number, status, onClick, isSelected }) {
  const s         = STATUS_MAP[status] || STATUS_MAP.healthy;
  const { w, h, rx, roots } = getToothGeom(number);
  const isUpper   = UPPER.includes(number);
  const isMissing = status === 'missing';
  const rootLen   = isUpper ? -16 : 16;
  const ROOT_Y    = isUpper ? -1 : h + 1;
  const rootSpread = roots === 3 ? [-8, 0, 8] : roots === 2 ? [-5, 5] : [0];

  return (
    <g
      className={`odc-tooth odc-tooth-clickable${isMissing ? ' odc-tooth-missing' : ''}${isSelected ? ' odc-tooth-selected' : ''}`}
      onClick={() => onClick(number)}
      role="button"
      tabIndex={0}
      aria-label={`Tooth ${number} – ${s.labelEn}`}
      onKeyDown={e => e.key === 'Enter' && onClick(number)}
    >
      {/* Roots */}
      {!isMissing && rootSpread.map((offset, i) => (
        <line key={i}
          x1={w / 2 + offset} y1={ROOT_Y}
          x2={w / 2 + offset} y2={ROOT_Y + rootLen}
          stroke={s.stroke} strokeWidth="2" strokeLinecap="round" opacity="0.45"
        />
      ))}

      {/* Selection glow ring */}
      {isSelected && (
        <rect x={-4} y={-4} width={w + 8} height={h + 8} rx={rx + 4}
          fill="none" stroke={s.stroke} strokeWidth="2.5"
          opacity="0.7" strokeDasharray="5 3"
        />
      )}

      {/* Tooth body */}
      <rect x={0} y={0} width={w} height={h} rx={rx}
        fill={s.color} stroke={s.stroke} strokeWidth={isSelected ? 2.5 : 1.8}
        className="odc-tooth-rect"
        style={{ filter: isSelected ? `drop-shadow(0 0 8px ${s.stroke})` : `drop-shadow(0 2px 3px ${s.glow})` }}
      />

      {/* Gloss highlight */}
      {!isMissing && (
        <rect x={3} y={3} width={w - 6} height={h * 0.38} rx={rx - 2}
          fill="rgba(255,255,255,0.52)"
        />
      )}

      {/* Fissure lines */}
      {!isMissing && roots >= 2 && (
        <line x1={w / 2} y1={7} x2={w / 2} y2={h - 7}
          stroke={s.stroke} strokeWidth="0.7" opacity="0.3"
        />
      )}
      {!isMissing && roots === 3 && (
        <line x1={7} y1={h / 2} x2={w - 7} y2={h / 2}
          stroke={s.stroke} strokeWidth="0.7" opacity="0.3"
        />
      )}

      {/* X for missing */}
      {isMissing && (
        <>
          <line x1={5} y1={5} x2={w - 5} y2={h - 5} stroke={s.stroke} strokeWidth="2" strokeLinecap="round" />
          <line x1={w - 5} y1={5} x2={5} y2={h - 5} stroke={s.stroke} strokeWidth="2" strokeLinecap="round" />
        </>
      )}

      {/* Status icon */}
      <text x={w / 2} y={h / 2 + 5} textAnchor="middle"
        fontSize={isMissing ? '12' : '10'} fontWeight="800"
        fill={s.iconColor} style={{ userSelect: 'none', pointerEvents: 'none' }}
      >{s.icon}</text>

      {/* Tooth number */}
      <text x={w / 2} y={isUpper ? -6 : h + 13} textAnchor="middle"
        fontSize="8.5" fontWeight="700"
        fill="var(--text-muted,#64748b)" style={{ userSelect: 'none', pointerEvents: 'none' }}
      >{number}</text>
    </g>
  );
}

/* ── Status Picker Panel (DOM-level, outside SVG) ─────────────── */
function StatusPickerPanel({ toothNumber, currentStatus, onSelect, onClose }) {
  const s = STATUS_MAP[currentStatus] || STATUS_MAP.healthy;
  const isUpper = UPPER.includes(toothNumber);

  return (
    <div className="odc-picker-panel" role="dialog" aria-label={`Set status for tooth ${toothNumber}`}>
      <div className="odc-picker-header">
        <div className="odc-picker-tooth-badge" style={{ background: s.color, borderColor: s.stroke }}>
          <span style={{ color: s.iconColor, fontWeight: 800 }}>{s.icon}</span>
          <span className="odc-picker-tooth-num">سن رقم {toothNumber}</span>
          <span className="odc-picker-tooth-arch">{isUpper ? 'علوي' : 'سفلي'}</span>
        </div>
        <div className="odc-picker-title">اختر الحالة</div>
        <button className="odc-picker-close-btn" onClick={onClose} aria-label="Close">✕</button>
      </div>

      <div className="odc-picker-options">
        {STATUSES.map(st => (
          <button
            key={st.key}
            className={`odc-picker-option${currentStatus === st.key ? ' odc-picker-option-active' : ''}`}
            onClick={() => onSelect(st.key)}
            style={{ '--opt-color': st.color, '--opt-stroke': st.stroke, '--opt-glow': st.glow }}
          >
            <span className="odc-picker-opt-swatch" style={{ background: st.color, borderColor: st.stroke }} />
            <span className="odc-picker-opt-icon" style={{ color: st.iconColor }}>{st.icon}</span>
            <span className="odc-picker-opt-labels">
              <span className="odc-picker-opt-ar">{st.label}</span>
              <span className="odc-picker-opt-en">{st.labelEn}</span>
            </span>
            {currentStatus === st.key && <span className="odc-picker-opt-check">✓</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────────── */
export default function InteractiveDentalChart({ initialTeethState = {}, onChange, readOnly = false }) {
  const [teeth, setTeeth]     = useState(() => ({ ...buildDefault(), ...initialTeethState }));
  const [selected, setSelected] = useState(null);

  const counts = STATUSES.reduce((a, s) => {
    a[s.key] = Object.values(teeth).filter(v => v === s.key).length;
    return a;
  }, {});

  const handleToothClick = useCallback((num) => {
    if (readOnly) return;
    setSelected(prev => (prev === num ? null : num));
  }, [readOnly]);

  const handleStatusSelect = useCallback((status) => {
    if (!selected) return;
    const updated = { ...teeth, [selected]: status };
    setTeeth(updated);
    onChange?.(updated);
    setSelected(null);
  }, [selected, teeth, onChange]);

  const handleReset = () => {
    const fresh = buildDefault();
    setTeeth(fresh);
    onChange?.(fresh);
    setSelected(null);
  };

  /* ── SVG layout constants ── */
  const GAP    = 5;
  const ARCH_H = 75;   // tooth(38) + roots(16) + label(16) + padding(5)
  const MID_H  = 32;
  const SVG_W  = UPPER.reduce((acc, n) => acc + getToothGeom(n).w + GAP, 0) - GAP;
  const SVG_H  = ARCH_H * 2 + MID_H;

  /* ── Build upper arch ── */
  let ux = 0;
  const upperElements = UPPER.map(num => {
    const { w } = getToothGeom(num);
    const tx = ux; ux += w + GAP;
    return (
      <g key={num} transform={`translate(${tx}, 0)`}>
        <g transform="translate(0, 16)">
          <Tooth number={num} status={teeth[num]} onClick={handleToothClick} isSelected={selected === num} />
        </g>
      </g>
    );
  });

  /* ── Build lower arch ── */
  let lx = 0;
  const lowerElements = LOWER.map(num => {
    const { w } = getToothGeom(num);
    const tx = lx; lx += w + GAP;
    return (
      <g key={num} transform={`translate(${tx}, 0)`}>
        <Tooth number={num} status={teeth[num]} onClick={handleToothClick} isSelected={selected === num} />
      </g>
    );
  });

  return (
    <div className="odc-root" onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}>

      {/* ── Header ── */}
      <div className="odc-head">
        <div className="odc-head-left">
          <div className="odc-head-icon">🦷</div>
          <div>
            <div className="odc-head-title">خريطة الأسنان التفاعلية</div>
            <div className="odc-head-sub">Odontogram — Universal Numbering System (UNS)</div>
          </div>
        </div>
        {!readOnly && (
          <button className="odc-btn-reset" onClick={handleReset}>↺ إعادة تعيين</button>
        )}
      </div>

      {/* ── Stats bar ── */}
      <div className="odc-statsbar">
        {STATUSES.map(s => (
          <div key={s.key} className="odc-stat" style={{ '--accent': s.stroke }}>
            <span className="odc-stat-ring" style={{ background: s.color, borderColor: s.stroke }}>
              <span style={{ color: s.iconColor, fontWeight: 800, fontSize: 11 }}>{s.icon}</span>
            </span>
            <div>
              <div className="odc-stat-num" style={{ color: s.stroke }}>{counts[s.key]}</div>
              <div className="odc-stat-lbl">{s.label}</div>
            </div>
          </div>
        ))}
        <div className="odc-stat odc-stat-total">
          <span className="odc-stat-ring" style={{ background: 'var(--tooth-missing-fill)', borderColor: 'var(--chart-separator-stroke)' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 800, fontSize: 10 }}>32</span>
          </span>
          <div>
            <div className="odc-stat-num" style={{ color: 'var(--text-muted)' }}>32</div>
            <div className="odc-stat-lbl">إجمالي</div>
          </div>
        </div>
      </div>

      {/* ── Quadrant labels top ── */}
      <div className="odc-quadrants">
        <span className="odc-quad odc-quad-ur">UR — الربع العلوي الأيمن</span>
        <span className="odc-quad-mid">⬆ علوي | سفلي ⬇</span>
        <span className="odc-quad odc-quad-ul">UL — الربع العلوي الأيسر</span>
      </div>

      {/* ── SVG Chart ── */}
      <div className="odc-chart-wrap">
        <svg
          viewBox={`-8 -22 ${SVG_W + 16} ${SVG_H + 44}`}
          className="odc-svg"
          aria-label="Interactive Dental Chart"
          onClick={e => { if (e.target.tagName === 'svg') setSelected(null); }}
        >
          <defs>
            <linearGradient id="gumGradUpper" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f9a8d4" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#f9a8d4" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="gumGradLower" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#f9a8d4" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#f9a8d4" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Upper gum band */}
          <rect x={0} y={14} width={SVG_W} height={20} rx={4} fill="url(#gumGradUpper)" />
          <path d={`M0 ${14 + 18} Q${SVG_W / 2} ${14 + 28} ${SVG_W} ${14 + 18}`}
            fill="none" stroke="#f9a8d4" strokeWidth="1" opacity="0.5" />

          {/* Upper arch */}
          <g transform="translate(0, 0)">{upperElements}</g>

          {/* Midline separator */}
          <g transform={`translate(0, ${ARCH_H})`}>
            <rect x={0} y={0} width={SVG_W} height={MID_H} fill="var(--chart-midline-fill)" rx={4} />
            <line x1={SVG_W / 2} y1={4} x2={SVG_W / 2} y2={MID_H - 4}
              stroke="var(--chart-separator-stroke)" strokeWidth="1.5" strokeDasharray="4 3" />
            <text x={SVG_W / 4} y={MID_H / 2 + 4.5} textAnchor="middle"
              fontSize="9" fontWeight="700" fill="var(--chart-label-fill)" letterSpacing="1.5">
              UPPER ARCH ↑
            </text>
            <text x={SVG_W * 3 / 4} y={MID_H / 2 + 4.5} textAnchor="middle"
              fontSize="9" fontWeight="700" fill="var(--chart-label-fill)" letterSpacing="1.5">
              ↓ LOWER ARCH
            </text>
            <line x1={0} y1={MID_H / 2} x2={SVG_W} y2={MID_H / 2}
              stroke="var(--chart-separator-stroke)" strokeWidth="1" strokeDasharray="3 5" opacity="0.6" />
          </g>

          {/* Lower arch */}
          <g transform={`translate(0, ${ARCH_H + MID_H + 18})`}>{lowerElements}</g>

          {/* Lower gum band */}
          <rect x={0} y={ARCH_H + MID_H + 14} width={SVG_W} height={20} rx={4} fill="url(#gumGradLower)" />
          <path d={`M0 ${ARCH_H + MID_H + 14 + 2} Q${SVG_W / 2} ${ARCH_H + MID_H + 14 - 8} ${SVG_W} ${ARCH_H + MID_H + 14 + 2}`}
            fill="none" stroke="#f9a8d4" strokeWidth="1" opacity="0.5" />
        </svg>
      </div>

      {/* ── Quadrant labels bottom ── */}
      <div className="odc-quadrants odc-quadrants-bot">
        <span className="odc-quad odc-quad-lr">LR — الربع السفلي الأيمن</span>
        <span className="odc-quad-mid" />
        <span className="odc-quad odc-quad-ll">LL — الربع السفلي الأيسر</span>
      </div>

      {/* ── Status Picker Panel (DOM level — always properly visible) ── */}
      {selected !== null && !readOnly && (
        <StatusPickerPanel
          toothNumber={selected}
          currentStatus={teeth[selected]}
          onSelect={handleStatusSelect}
          onClose={() => setSelected(null)}
        />
      )}

      {/* ── Legend ── */}
      <div className="odc-legend">
        <span className="odc-legend-hd">دليل الألوان</span>
        {STATUSES.map(s => (
          <div key={s.key} className="odc-legend-item">
            <span className="odc-legend-sw" style={{ background: s.color, borderColor: s.stroke, boxShadow: `0 0 5px ${s.glow}` }} />
            <span className="odc-legend-txt">{s.label}</span>
          </div>
        ))}
        {!readOnly && (
          <span className="odc-legend-hint">💡 انقر على أي سن لتغيير حالته</span>
        )}
      </div>
    </div>
  );
}
