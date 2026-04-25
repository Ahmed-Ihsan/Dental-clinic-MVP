export default function Step4Review({ visitData }) {
  const {
    patient_id, first_name, last_name, phone, gender, isNew,
    treatment_type, treatment_date, doctor_name, notes,
    total_amount, paid_amount, balance, due_date, payment_method,
  } = visitData;

  const genderLabel   = { male: 'ذكر', female: 'أنثى' }[gender] || '—';
  const statusLabel   = balance <= 0 ? '✅ مدفوع بالكامل' : paid_amount > 0 ? '⚠️ مدفوع جزئياً' : '🔴 غير مدفوع';
  const statusClass   = balance <= 0 ? 'badge-success' : paid_amount > 0 ? 'badge-warning' : 'badge-danger';
  const methodLabel   = { cash: 'نقداً', card: 'بطاقة', transfer: 'تحويل', installments: 'أقساط' }[payment_method] || '—';

  const Row = ({ icon, label, value, highlight }) => (
    <div className="qvw-review-row">
      <span className="qvw-review-icon">{icon}</span>
      <span className="qvw-review-label">{label}</span>
      <span className={`qvw-review-value ${highlight ? 'highlight' : ''}`}>{value || '—'}</span>
    </div>
  );

  return (
    <div className="qvw-step-content">
      {/* Patient Card */}
      <div className="qvw-review-section">
        <div className="qvw-review-section-title">
          <span className="qvw-review-section-icon" style={{ background: 'var(--primary-light)' }}>👤</span>
          بيانات المريض
          <span className={`badge ${isNew ? 'badge-warning' : 'badge-success'} qvw-review-badge`}>
            {isNew ? 'مريض جديد' : 'مريض موجود'}
          </span>
        </div>
        <div className="qvw-review-rows">
          <Row icon="🪪" label="الاسم الكامل"   value={`${first_name} ${last_name}`} highlight />
          <Row icon="📞" label="رقم الهاتف"     value={phone} />
          <Row icon="⚧"  label="الجنس"          value={genderLabel} />
          {patient_id && <Row icon="🔑" label="رقم المريض" value={`#${patient_id}`} />}
        </div>
      </div>

      {/* Treatment Card */}
      <div className="qvw-review-section">
        <div className="qvw-review-section-title">
          <span className="qvw-review-section-icon" style={{ background: 'var(--accent-light)' }}>🦷</span>
          الإجراء الطبي
        </div>
        <div className="qvw-review-rows">
          <Row icon="🩺" label="نوع العلاج"       value={treatment_type} highlight />
          <Row icon="📅" label="تاريخ العلاج"      value={treatment_date} />
          {doctor_name && <Row icon="👨‍⚕️" label="الطبيب"  value={doctor_name} />}
          {notes        && <Row icon="📝" label="الملاحظات" value={notes} />}
        </div>
      </div>

      {/* Billing Card */}
      <div className="qvw-review-section">
        <div className="qvw-review-section-title">
          <span className="qvw-review-section-icon" style={{ background: 'var(--success-bg)' }}>💰</span>
          الفاتورة والدفع
        </div>
        <div className="qvw-review-rows">
          <Row icon="🧾" label="التكلفة الإجمالية" value={`${(total_amount || 0).toLocaleString()} د.ع`} highlight />
          <Row icon="💳" label="المبلغ المدفوع"      value={`${(paid_amount || 0).toLocaleString()} د.ع`} />
          <Row icon="⚖️" label="الرصيد المتبقي"     value={`${(balance || 0).toLocaleString()} د.ع`} />
          {due_date        && <Row icon="📆" label="تاريخ الاستحقاق" value={due_date} />}
          {payment_method  && <Row icon="💵" label="طريقة الدفع"     value={methodLabel} />}
          <div className="qvw-review-row">
            <span className="qvw-review-icon">🔖</span>
            <span className="qvw-review-label">حالة الدفع</span>
            <span className={`badge ${statusClass}`}>{statusLabel}</span>
          </div>
        </div>
      </div>

      {/* Summary Banner */}
      <div className="qvw-review-confirm-banner">
        <span>🚀</span>
        <span>جاهز للحفظ — انقر على <strong>"تأكيد وحفظ الزيارة"</strong> لمتابعة العملية</span>
      </div>
    </div>
  );
}
