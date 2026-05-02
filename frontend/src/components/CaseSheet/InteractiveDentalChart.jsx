import { useState, useCallback } from 'react';
import { FaTooth, FaCheckCircle, FaExclamationCircle, FaStar, FaTimesCircle } from 'react-icons/fa';

/* ── Status definitions ───────────────────────────────────────── */
const STATUSES = [
  { key: 'healthy',   label: 'سليم',        labelEn: 'Healthy',   color: '#d1fae5', stroke: '#10b981', glow: '#10b98140', HtmlIcon: FaCheckCircle,     iconColor: '#065f46' },
  { key: 'attention', label: 'يحتاج علاج',  labelEn: 'Treatment', color: '#fee2e2', stroke: '#f87171', glow: '#f8717140', HtmlIcon: FaExclamationCircle, iconColor: '#991b1b' },
  { key: 'completed', label: 'تم العلاج',   labelEn: 'Completed', color: '#dbeafe', stroke: '#3b82f6', glow: '#3b82f640', HtmlIcon: FaStar,             iconColor: '#1e3a8a' },
  { key: 'missing',   label: 'مفقود',       labelEn: 'Missing',   color: '#1e293b', stroke: '#475569', glow: '#47556940', HtmlIcon: FaTimesCircle,     iconColor: '#94a3b8' },
];
const STATUS_MAP = Object.fromEntries(STATUSES.map(s => [s.key, s]));

/* ── SVG Status Icon (renders INSIDE svg <g> element) ───────── */
function ToothStatusIcon({ status, cx, cy, color }) {
  const s = 4.5;
  if (status === 'healthy') {
    return (
      <path
        d={`M${cx - s},${cy + 0.5} L${cx - 1.2},${cy + s * 0.8} L${cx + s},${cy - s * 0.9}`}
        stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"
        style={{ pointerEvents: 'none' }}
      />
    );
  }
  if (status === 'attention') {
    return (
      <g style={{ pointerEvents: 'none' }}>
        <line x1={cx} y1={cy - s} x2={cx} y2={cy + 1.8} stroke={color} strokeWidth="2.2" strokeLinecap="round" />
        <circle cx={cx} cy={cy + s - 0.5} r="1.4" fill={color} />
      </g>
    );
  }
  if (status === 'completed') {
    return (
      <g style={{ pointerEvents: 'none' }}>
        <rect x={cx - 1.3} y={cy - s} width={2.6} height={s * 2} rx={1} fill={color} />
        <rect x={cx - s} y={cy - 1.3} width={s * 2} height={2.6} rx={1} fill={color} />
      </g>
    );
  }
  return null;
}

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
  const canines   = new Set([6,11,22,27]);
  if (molars.has(num))    return { w: 34, h: 40, roots: 3, type: 'molar' };
  if (premolars.has(num)) return { w: 28, h: 38, roots: 2, type: 'premolar' };
  if (canines.has(num))   return { w: 22, h: 38, roots: 1, type: 'canine' };
  return                         { w: 20, h: 34, roots: 1, type: 'incisor' };
}

/* ── Crown path (cusps at y=h, cervical at y=0; flip for lower teeth) ──── */
function getCrownPath(type, w, h) {
  const hw = w / 2;
  switch (type) {
    case 'molar': {
      const c = w / 5;
      return [
        `M${w * 0.14},0`,
        `C0,0 0,${h * 0.1} 0,${h * 0.18}`,
        `L0,${h * 0.65}`,
        `C0,${h * 0.8} ${c * 0.4},${h + 3} ${c * 1.0},${h - 4}`,
        `C${hw - 3},${h + 4} ${hw},${h - 3} ${hw},${h - 3}`,
        `C${hw},${h - 3} ${hw + 3},${h + 4} ${w - c * 1.0},${h - 4}`,
        `C${w - c * 0.4},${h + 3} ${w},${h * 0.8} ${w},${h * 0.65}`,
        `L${w},${h * 0.18}`,
        `C${w},${h * 0.1} ${w * 0.86},0 ${w * 0.86},0 Z`,
      ].join(' ');
    }
    case 'premolar': {
      return [
        `M${w * 0.14},0`,
        `C0,0 0,${h * 0.12} 0,${h * 0.2}`,
        `L0,${h * 0.62}`,
        `C0,${h * 0.82} ${w * 0.12},${h + 3} ${w * 0.32},${h - 5}`,
        `C${hw - 2},${h + 2} ${hw + 2},${h + 2} ${w * 0.68},${h - 5}`,
        `C${w * 0.88},${h + 3} ${w},${h * 0.82} ${w},${h * 0.62}`,
        `L${w},${h * 0.2}`,
        `C${w},${h * 0.12} ${w * 0.86},0 ${w * 0.86},0 Z`,
      ].join(' ');
    }
    case 'canine': {
      return [
        `M${w * 0.16},0`,
        `C0,0 0,${h * 0.13} 0,${h * 0.22}`,
        `L0,${h * 0.55}`,
        `C0,${h * 0.78} ${hw * 0.3},${h + 2} ${hw},${h}`,
        `C${hw * 1.7},${h + 2} ${w},${h * 0.78} ${w},${h * 0.55}`,
        `L${w},${h * 0.22}`,
        `C${w},${h * 0.13} ${w * 0.84},0 ${w * 0.84},0 Z`,
      ].join(' ');
    }
    default: { // incisor
      return [
        `M${w * 0.16},0`,
        `C0,0 0,${h * 0.14} 0,${h * 0.22}`,
        `L0,${h - 3}`,
        `C0,${h} ${w * 0.14},${h} ${w * 0.14},${h}`,
        `L${w * 0.86},${h}`,
        `C${w},${h} ${w},${h - 3} ${w},${h - 3}`,
        `L${w},${h * 0.22}`,
        `C${w},${h * 0.14} ${w * 0.84},0 ${w * 0.84},0 Z`,
      ].join(' ');
    }
  }
}

/* ── Root paths for each tooth type (all going downward; caller flips for upper) */
function getRootPaths(type, w, roots) {
  // Returns array of { d, cx } path strings, pointing downward (positive y)
  const rl = 22;  // root length
  const hw = w / 2;
  switch (type) {
    case 'molar':
      // 3 roots: distal, middle, mesial
      return [
        `M${hw - 9},0 C${hw - 12},-2 ${hw - 12},${rl * 0.6} ${hw - 10},${rl} C${hw - 8},${rl + 2} ${hw - 6},${rl} ${hw - 5},${rl * 0.7} C${hw - 4},${rl * 0.4} ${hw - 4},0 ${hw - 6},0 Z`,
        `M${hw - 3},0 C${hw - 4},-1 ${hw - 4},${rl * 0.7} ${hw},${rl + 4} C${hw + 4},${rl * 0.7} ${hw + 4},-1 ${hw + 3},0 Z`,
        `M${hw + 5},0 C${hw + 4},0 ${hw + 4},${rl * 0.4} ${hw + 5},${rl * 0.7} C${hw + 6},${rl} ${hw + 8},${rl + 2} ${hw + 10},${rl} C${hw + 12},${rl * 0.6} ${hw + 12},-2 ${hw + 9},0 Z`,
      ];
    case 'premolar':
      return [
        `M${hw - 7},0 C${hw - 9},-1 ${hw - 10},${rl * 0.5} ${hw - 8},${rl + 2} C${hw - 6},${rl * 0.7} ${hw - 4},${rl * 0.5} ${hw - 4},0 Z`,
        `M${hw + 4},0 C${hw + 4},${rl * 0.5} ${hw + 6},${rl * 0.7} ${hw + 8},${rl + 2} C${hw + 10},${rl * 0.5} ${hw + 9},-1 ${hw + 7},0 Z`,
      ];
    case 'canine':
      return [
        `M${hw - 4},0 C${hw - 5},-2 ${hw - 6},${rl} ${hw},${rl + 6} C${hw + 6},${rl} ${hw + 5},-2 ${hw + 4},0 Z`,
      ];
    default: // incisor
      return [
        `M${hw - 4},0 C${hw - 5},-1 ${hw - 4},${rl - 2} ${hw},${rl} C${hw + 4},${rl - 2} ${hw + 5},-1 ${hw + 4},0 Z`,
      ];
  }
}

/* ── Individual Tooth ────────────────────────────────────────── */
function Tooth({ number, status, onClick, isSelected }) {
  const s            = STATUS_MAP[status] || STATUS_MAP.healthy;
  const { w, h, roots, type } = getToothGeom(number);
  const isUpper      = UPPER.includes(number);
  const isMissing    = status === 'missing';

  /* Crown: cusps at y=h; flip vertically for lower teeth so cusps face up */
  const crownPath   = getCrownPath(type, w, h);
  const crownFlip   = isUpper ? undefined : `translate(0,${h}) scale(1,-1)`;

  /* Roots: anatomical paths go downward; flip+anchor at y=0 for upper teeth */
  const rootPaths      = getRootPaths(type, w, roots);
  const rootTransform  = isUpper ? 'scale(1,-1)' : `translate(0,${h + 2})`;

  return (
    <g
      className={`odc-tooth odc-tooth-clickable${isMissing ? ' odc-tooth-missing' : ''}${isSelected ? ' odc-tooth-selected' : ''}`}
      onClick={() => onClick(number)}
      role="button"
      tabIndex={0}
      aria-label={`Tooth ${number} – ${s.labelEn}`}
      onKeyDown={e => e.key === 'Enter' && onClick(number)}
    >
      {/* Anatomical roots */}
      {!isMissing && (
        <g transform={rootTransform}>
          {rootPaths.map((d, i) => (
            <path key={i} d={d}
              fill={s.color} stroke={s.stroke} strokeWidth="1"
              opacity="0.75"
            />
          ))}
        </g>
      )}

      {/* Selection glow ring */}
      {isSelected && (
        <rect x={-4} y={-4} width={w + 8} height={h + 8} rx={14}
          fill="none" stroke={s.stroke} strokeWidth="2.5"
          opacity="0.7" strokeDasharray="5 3"
        />
      )}

      {/* Crown group — flip vertically for lower teeth so cusps face up */}
      <g transform={crownFlip}>
        {/* Crown body */}
        <path
          d={crownPath}
          fill={s.color} stroke={s.stroke} strokeWidth={isSelected ? 2.5 : 1.8}
          className="odc-tooth-rect"
          style={{ filter: isSelected ? `drop-shadow(0 0 8px ${s.stroke})` : `drop-shadow(0 2px 3px ${s.glow})` }}
        />

        {/* Gloss highlight — cervical third */}
        {!isMissing && (
          <path
            d={`M3,2 Q0,2 0,7 L0,${h * 0.32} Q${w * 0.5},${h * 0.38} ${w},${h * 0.32} L${w},7 Q${w},2 ${w - 3},2 Z`}
            fill="rgba(255,255,255,0.45)" style={{ pointerEvents: 'none' }}
          />
        )}

        {/* Occlusal fissure lines */}
        {!isMissing && (type === 'molar' || type === 'premolar') && (
          <line x1={w / 2} y1={h * 0.55} x2={w / 2} y2={h - 3}
            stroke={s.stroke} strokeWidth="0.8" opacity="0.28" />
        )}
        {!isMissing && type === 'molar' && (
          <line x1={w * 0.25} y1={h * 0.72} x2={w * 0.75} y2={h * 0.72}
            stroke={s.stroke} strokeWidth="0.8" opacity="0.28" />
        )}

        {/* Missing X */}
        {isMissing && (
          <>
            <line x1={4} y1={4} x2={w - 4} y2={h - 4} stroke={s.stroke} strokeWidth="2" strokeLinecap="round" />
            <line x1={w - 4} y1={4} x2={4} y2={h - 4} stroke={s.stroke} strokeWidth="2" strokeLinecap="round" />
          </>
        )}
      </g>

      {/* Status icon — stays in original (unflipped) coordinates at crown center */}
      {!isMissing && <ToothStatusIcon status={status} cx={w / 2} cy={h / 2} color={s.iconColor} />}

      {/* Tooth number */}
      <text x={w / 2} y={isUpper ? -6 : h + 14} textAnchor="middle"
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
          <span style={{ color: s.iconColor, fontSize: 16, display: 'flex' }}><s.HtmlIcon /></span>
          <span className="odc-picker-tooth-num">سن رقم {toothNumber}</span>
          <span className="odc-picker-tooth-arch">{isUpper ? 'علوي' : 'سفلي'}</span>
        </div>
        <div className="odc-picker-title">اختر الحالة</div>
        <button className="odc-picker-close-btn" onClick={onClose} aria-label="Close">×</button>
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
            <span className="odc-picker-opt-icon" style={{ color: st.iconColor, display: 'flex', fontSize: 15 }}><st.HtmlIcon /></span>
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
  const ARCH_H = 90;   // tooth(40) + roots(22) + label(14) + padding(14)
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
        <g transform="translate(0, 18)">
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
          <div className="odc-head-icon" style={{ display: 'flex', alignItems: 'center', fontSize: 22, color: 'var(--primary)' }}><FaTooth /></div>
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
              <span style={{ color: s.iconColor, fontSize: 14, display: 'flex', alignItems: 'center' }}><s.HtmlIcon /></span>
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
          <g transform={`translate(0, ${ARCH_H + MID_H + 16})`}>{lowerElements}</g>

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
