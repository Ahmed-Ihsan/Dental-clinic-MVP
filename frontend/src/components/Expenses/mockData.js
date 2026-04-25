/* ─── Mock Data: Expenses Management Dashboard ─── */

export const MOCK_DOCTORS = [
  { id: 1, name: 'د. أحمد المنصوري' },
  { id: 2, name: 'د. سارة الخالدي' },
  { id: 3, name: 'د. محمد العتيبي' },
];

export const MOCK_PATIENTS = [
  { id: 101, name: 'فيصل العمري' },
  { id: 102, name: 'نورة الشمري' },
  { id: 103, name: 'خالد الرشيدي' },
  { id: 104, name: 'مريم الحربي' },
];

/* ── Schema: { id, amount, paid_amount, balance, category, description, status, date, doctor_id?, patient_id?, payment_method?, receipt_id? } */
export const MOCK_EXPENSES = [
  // ── Clinic Operating ──────────────────────────────────────────────────────
  {
    id: 'EXP-001', amount: 8500, paid_amount: 8500, balance: 0,
    category: 'clinic', description: 'إيجار العيادة - أبريل 2026',
    status: 'paid', date: '2026-04-01', payment_method: 'تحويل بنكي', receipt_id: 'RCP-2026-041',
  },
  {
    id: 'EXP-002', amount: 1200, paid_amount: 1200, balance: 0,
    category: 'clinic', description: 'فاتورة الكهرباء - مارس 2026',
    status: 'paid', date: '2026-03-28', payment_method: 'كاش', receipt_id: 'RCP-2026-039',
  },
  {
    id: 'EXP-003', amount: 3400, paid_amount: 0, balance: 3400,
    category: 'clinic', description: 'صيانة وحدة المياه والهواء',
    status: 'debt', date: '2026-04-10',
  },
  {
    id: 'EXP-004', amount: 950, paid_amount: 950, balance: 0,
    category: 'clinic', description: 'مواد تنظيف ومعقمات شهرية',
    status: 'paid', date: '2026-04-05', payment_method: 'كاش', receipt_id: 'RCP-2026-042',
  },
  {
    id: 'EXP-005', amount: 2200, paid_amount: 1000, balance: 1200,
    category: 'clinic', description: 'مستلزمات طبية عامة (قفازات، كمامات، أقنعة)',
    status: 'debt', date: '2026-04-15',
  },

  // ── Doctor Expenses ────────────────────────────────────────────────────────
  {
    id: 'EXP-006', amount: 4500, paid_amount: 4500, balance: 0,
    category: 'doctor', description: 'طقم زراعة أسنان - Nobel Biocare',
    status: 'paid', date: '2026-04-03', doctor_id: 1,
    payment_method: 'تحويل بنكي', receipt_id: 'RCP-2026-040',
  },
  {
    id: 'EXP-007', amount: 2800, paid_amount: 0, balance: 2800,
    category: 'doctor', description: 'مواد حشوات زيركون - شحنة خاصة',
    status: 'debt', date: '2026-04-12', doctor_id: 2,
  },
  {
    id: 'EXP-008', amount: 1600, paid_amount: 1600, balance: 0,
    category: 'doctor', description: 'أدوات تنظيف تخصصية - Dentsply',
    status: 'paid', date: '2026-03-20', doctor_id: 3,
    payment_method: 'بطاقة ائتمان', receipt_id: 'RCP-2026-035',
  },
  {
    id: 'EXP-009', amount: 3200, paid_amount: 1600, balance: 1600,
    category: 'doctor', description: 'حقن موضعية ومخدرات طبية',
    status: 'debt', date: '2026-04-18', doctor_id: 1,
  },

  // ── Patient-Specific Expenses ─────────────────────────────────────────────
  {
    id: 'EXP-010', amount: 650, paid_amount: 650, balance: 0,
    category: 'patient', description: 'أشعة بانورامية خارجية - مركز الإشعاع الطبي',
    status: 'paid', date: '2026-04-07', patient_id: 101,
    payment_method: 'كاش', receipt_id: 'RCP-2026-043',
  },
  {
    id: 'EXP-011', amount: 1800, paid_amount: 0, balance: 1800,
    category: 'patient', description: 'تركيبة بورسلان زيركون - مختبر ألفا',
    status: 'debt', date: '2026-04-14', patient_id: 102,
  },
  {
    id: 'EXP-012', amount: 2200, paid_amount: 2200, balance: 0,
    category: 'patient', description: 'جسر زيركون ثلاثي الوحدات - مختبر النخبة',
    status: 'paid', date: '2026-03-25', patient_id: 103,
    payment_method: 'تحويل بنكي', receipt_id: 'RCP-2026-037',
  },
  {
    id: 'EXP-013', amount: 480, paid_amount: 0, balance: 480,
    category: 'patient', description: 'تحاليل طبية مخبرية - مختبر الرعاية',
    status: 'debt', date: '2026-04-20', patient_id: 104,
  },
  {
    id: 'EXP-014', amount: 900, paid_amount: 900, balance: 0,
    category: 'patient', description: 'جبيرة الفك وتصوير CBCT',
    status: 'paid', date: '2026-04-02', patient_id: 101,
    payment_method: 'كاش', receipt_id: 'RCP-2026-038',
  },

  // ── Lab Expenses (treated as sub-category of patient) ─────────────────────
  {
    id: 'EXP-015', amount: 3500, paid_amount: 3500, balance: 0,
    category: 'lab', description: 'طلب مختبر مجمع - أطقم أسنان متعددة (أبريل)',
    status: 'paid', date: '2026-04-16',
    payment_method: 'تحويل بنكي', receipt_id: 'RCP-2026-044',
  },
  {
    id: 'EXP-016', amount: 1200, paid_amount: 0, balance: 1200,
    category: 'lab', description: 'طقم أسنان كامل - مختبر المتميز',
    status: 'debt', date: '2026-04-22',
  },
];
