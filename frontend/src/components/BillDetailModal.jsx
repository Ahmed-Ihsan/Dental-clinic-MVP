import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';

/* ── helpers ── */
const fmt     = n => Number(n || 0).toLocaleString('ar-SA') + ' IQD';
const fmtDate = d => d ? new Date(d).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';

const STATUS_MAP   = { pending: 'معلق', paid: 'مدفوع', overdue: 'متأخر', partial: 'جزئي', unpaid: 'غير مدفوع' };
const STATUS_BADGE = { pending: 'badge-warning', paid: 'badge-info', overdue: 'badge-danger', partial: 'badge-ghost', unpaid: 'badge-ghost' };

/* ── Print-only styles injected as a <style> element ── */
const PRINT_CSS = `
@media print {
  body > *                    { display: none !important; }
  #bdm-print-root             { display: block !important; position: fixed; inset: 0; z-index: 99999; background: #fff; overflow: auto; }
  .bdm-no-print               { display: none !important; }
  .bdm-invoice-body           { max-height: none !important; background: #fff !important; color: #111 !important; padding: 10mm 14mm !important; }
  .bdm-clinic-name            { color: #111 !important; }
  .bdm-section-label          { color: #555 !important; }
  .bdm-inv-table thead tr     { background: #f0f0f0 !important; }
  .bdm-inv-table th,
  .bdm-inv-table td           { border: 1px solid #ccc !important; color: #111 !important; }
  .bdm-summary-box            { border: 1px solid #ccc !important; background: #fafafa !important; color: #111 !important; }
  .bdm-footer-text            { color: #777 !important; border-color: #ccc !important; }
}
@page { size: A4 portrait; margin: 0; }
`;

const BillDetailModal = ({ bill, onClose, onUpdate }) => {
  const [patient,      setPatient]      = useState(null);
  const [treatments,   setTreatments]   = useState([]);
  const [loadingData,  setLoadingData]  = useState(true);
  const [isEditing,    setIsEditing]    = useState(false);
  const [formData,     setFormData]     = useState({});
  const [saving,       setSaving]       = useState(false);

  useEffect(() => {
    if (!bill) return;
    setFormData({ ...bill });
    setIsEditing(false);
    setLoadingData(true);

    const tasks = [
      api.get(`/patients/${bill.patient_id}`).catch(() => ({ data: null })),
      bill.appointment_id
        ? api.get('/treatments').then(r => ({ data: r.data.filter(t => String(t.appointment_id) === String(bill.appointment_id)) })).catch(() => ({ data: [] }))
        : Promise.resolve({ data: [] }),
    ];

    Promise.all(tasks).then(([pRes, tRes]) => {
      setPatient(pRes.data);
      setTreatments(tRes.data);
    }).finally(() => setLoadingData(false));
  }, [bill]);

  if (!bill) return null;

  const total    = parseFloat(bill.total_amount)    || 0;
  const paid     = parseFloat(bill.paid_amount)     || 0;
  const balance  = parseFloat(bill.balance)         || 0;
  const discount = parseFloat(bill.discount_amount) || 0;
  const paidPct  = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;

  const handleSave = async () => {
    setSaving(true);
    try {
      const t = parseFloat(formData.total_amount) || 0;
      const p = parseFloat(formData.paid_amount)  || 0;
      await api.put(`/bills/${bill.id}`, { ...formData, total_amount: t, paid_amount: p, balance: t - p });
      onUpdate();
      setIsEditing(false);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const td = (label, val) => ({ key: label, label, val });
  const summaryRows = [
    td('المجموع',     fmt(total)),
    ...(discount > 0 ? [td('الخصم', `- ${fmt(discount)}`)] : []),
    td('المدفوع',     fmt(paid)),
  ];

  return createPortal(
    <>
      <style>{PRINT_CSS}</style>
      <div
        id="bdm-print-root"
        className="modal-overlay"
        onClick={e => { if (e.target === e.currentTarget && !isEditing) onClose(); }}
      >
        <div className="modal-box" style={{ maxWidth: 760, width: '95vw', padding: 0, overflow: 'hidden' }}>

          {/* ── Action bar (no-print) ── */}
          <div className="bdm-no-print" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 20px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>💰</span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 16 }}>
                فاتورة #{String(bill.id).padStart(5, '0')}
              </span>
              <span className={`badge ${STATUS_BADGE[bill.status] || 'badge-ghost'}`}>
                {STATUS_MAP[bill.status] || bill.status}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {!isEditing ? (
                <>
                  <button className="btn btn-ghost btn-sm" onClick={() => window.print()}>🖨️ طباعة / PDF</button>
                  <button className="btn btn-primary btn-sm" onClick={() => setIsEditing(true)}>✏️ تعديل</button>
                </>
              ) : (
                <>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setIsEditing(false); setFormData({ ...bill }); }}>إلغاء</button>
                  <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                    {saving ? '⏳...' : '💾 حفظ'}
                  </button>
                </>
              )}
              <button className="btn btn-ghost btn-sm" style={{ padding: '5px 10px' }} onClick={onClose}>✕</button>
            </div>
          </div>

          {/* ── Invoice / Edit body ── */}
          <div className="bdm-invoice-body" style={{
            padding: '28px 32px', background: 'var(--bg-card)', maxHeight: '80vh', overflowY: 'auto',
          }}>
            {isEditing ? (
              /* ── Edit mode ── */
              <div className="form-grid">
                {[
                  { name: 'total_amount', label: 'المبلغ الإجمالي', type: 'number' },
                  { name: 'paid_amount',  label: 'المبلغ المدفوع',  type: 'number' },
                  { name: 'due_date',     label: 'تاريخ الاستحقاق', type: 'date'   },
                ].map(f => (
                  <div className="field-group" key={f.name}>
                    <label className="field-label">{f.label}</label>
                    <input type={f.type} step="0.01" className="field-input" value={formData[f.name] || ''}
                      onChange={e => setFormData(d => ({ ...d, [f.name]: e.target.value }))} />
                  </div>
                ))}
                <div className="field-group">
                  <label className="field-label">حالة الدفع</label>
                  <select className="field-input" value={formData.status || ''} onChange={e => setFormData(d => ({ ...d, status: e.target.value }))}>
                    {['pending','paid','overdue','partial'].map(s => <option key={s} value={s}>{STATUS_MAP[s]}</option>)}
                  </select>
                </div>
              </div>
            ) : (
              /* ── Invoice view ── */
              <>
                {/* Clinic letterhead */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 20, marginBottom: 20, borderBottom: '2px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 60, height: 60, borderRadius: 12, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30 }}>🦷</div>
                    <div>
                      <div className="bdm-clinic-name" style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>عيادة الأسنان المتميزة</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.9, marginTop: 2 }}>
                        <div>📍 شارع الرئيسي، المدينة</div>
                        <div>📞 +964 770 000 0000 &nbsp;✉️ clinic@dental.com</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.5px' }}>
                      فاتورة #{String(bill.id).padStart(5, '0')}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.9 }}>
                      <div>تاريخ الإصدار: {fmtDate(bill.created_at)}</div>
                      <div>تاريخ الاستحقاق: {fmtDate(bill.due_date)}</div>
                    </div>
                    <span className={`badge ${STATUS_BADGE[bill.status] || 'badge-ghost'}`} style={{ marginTop: 6, display: 'inline-block' }}>
                      {STATUS_MAP[bill.status] || bill.status}
                    </span>
                  </div>
                </div>

                {/* Patient + appointment info */}
                <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                  <div>
                    <div className="bdm-section-label" style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>بيانات المريض</div>
                    {loadingData
                      ? <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>جاري التحميل...</div>
                      : patient
                        ? <>
                            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{patient.first_name} {patient.last_name}</div>
                            {patient.phone && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>📞 {patient.phone}</div>}
                            {patient.email && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>✉️ {patient.email}</div>}
                          </>
                        : <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>مريض #{bill.patient_id}</div>
                    }
                  </div>
                  {bill.appointment_id && (
                    <div>
                      <div className="bdm-section-label" style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>رقم الموعد</div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>#{bill.appointment_id}</div>
                    </div>
                  )}
                </div>

                {/* Treatments table */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    {treatments.length > 0 ? 'العلاجات المنفذة' : 'تفاصيل الخدمة'}
                  </div>
                  <table className="bdm-inv-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-elevated)', borderBottom: '2px solid var(--border)' }}>
                        <th style={TH}>#</th>
                        <th style={TH}>البيان</th>
                        <th style={TH}>التاريخ</th>
                        <th style={{ ...TH, textAlign: 'left' }}>المبلغ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {treatments.length > 0
                        ? treatments.map((t, i) => (
                            <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={TD}>{i + 1}</td>
                              <td style={{ ...TD, fontWeight: 600, color: 'var(--text-primary)' }}>{t.treatment_type}</td>
                              <td style={{ ...TD, color: 'var(--text-secondary)' }}>{fmtDate(t.treatment_date)}</td>
                              <td style={{ ...TD, textAlign: 'left', color: 'var(--success)', fontWeight: 700 }}>{fmt(t.cost)}</td>
                            </tr>
                          ))
                        : (
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={TD}>1</td>
                              <td style={{ ...TD, color: 'var(--text-primary)' }}>خدمات طب الأسنان</td>
                              <td style={{ ...TD, color: 'var(--text-secondary)' }}>{fmtDate(bill.created_at)}</td>
                              <td style={{ ...TD, textAlign: 'left', color: 'var(--success)', fontWeight: 700 }}>{fmt(total)}</td>
                            </tr>
                          )
                      }
                    </tbody>
                  </table>
                </div>

                {/* Payment summary + progress bar */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
                  <div className="bdm-summary-box" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px 20px', minWidth: 280 }}>
                    {summaryRows.map(r => (
                      <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                        <span style={{ color: 'var(--text-muted)' }}>{r.label}</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{r.val}</span>
                      </div>
                    ))}
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 4, display: 'flex', justifyContent: 'space-between', fontSize: 16 }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>المتبقي</span>
                      <span style={{ fontWeight: 800, color: balance > 0 ? 'var(--danger)' : 'var(--success)' }}>{fmt(balance)}</span>
                    </div>
                    <div style={{ marginTop: 14 }}>
                      <div style={{ height: 6, background: 'var(--bg-surface)', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${paidPct}%`, background: paidPct === 100 ? 'var(--success)' : 'var(--primary)', borderRadius: 999, transition: 'width .4s' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                        <span>مدفوع {paidPct}%</span>
                        <span>من {fmt(total)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="bdm-footer-text" style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                  شكراً لثقتكم بعيادتنا • يُرجى الاحتفاظ بهذه الفاتورة للمراجعة
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

/* ── shared cell styles ── */
const TH = { padding: '9px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--text-muted)', fontSize: 12 };
const TD = { padding: '10px 12px', color: 'var(--text-secondary)' };

export default BillDetailModal;