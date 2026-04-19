import { useState, useEffect } from 'react';
import { salaryAPI } from '../services/api';

const PayrollProcessing = ({ onPayrollGenerated }) => {
  const [professionals, setProfessionals] = useState([]);
  const [selectedProfessionals, setSelectedProfessionals] = useState([]);
  const [payrollPeriod, setPayrollPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  useEffect(() => {
    fetchProfessionals();
  }, []);

  const fetchProfessionals = async () => {
    try {
      const response = await salaryAPI.getSalaries({ is_active: 'true' });
      // Get unique professionals with active salaries
      const uniqueProfessionals = [];
      const seen = new Set();

      response.data.forEach(salary => {
        if (!seen.has(salary.professional_id)) {
          seen.add(salary.professional_id);
          uniqueProfessionals.push({
            id: salary.professional.id,
            name: `${salary.professional.first_name} ${salary.professional.last_name}`,
            specialty: salary.professional.specialty,
            salary: salary
          });
        }
      });

      setProfessionals(uniqueProfessionals);
    } catch (error) {
      console.error('Error fetching professionals:', error);
    }
  };

  const handleProfessionalToggle = (professionalId) => {
    setSelectedProfessionals(prev =>
      prev.includes(professionalId)
        ? prev.filter(id => id !== professionalId)
        : [...prev, professionalId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProfessionals.length === professionals.length) {
      setSelectedProfessionals([]);
    } else {
      setSelectedProfessionals(professionals.map(p => p.id));
    }
  };

  const generatePreview = async () => {
    if (selectedProfessionals.length === 0) return;

    setLoading(true);
    try {
      // Generate preview without creating actual payrolls
      const response = await salaryAPI.generatePayroll({
        professional_ids: selectedProfessionals,
        payroll_period: payrollPeriod,
        preview_only: true
      });

      // Calculate totals for preview
      const totals = response.data.reduce((acc, payroll) => ({
        total_gross: acc.total_gross + payroll.gross_salary,
        total_net: acc.total_net + payroll.net_salary,
        total_allowances: acc.total_allowances + payroll.total_allowances,
        total_deductions: acc.total_deductions + payroll.total_deductions,
        count: acc.count + 1
      }), { total_gross: 0, total_net: 0, total_allowances: 0, total_deductions: 0, count: 0 });

      setPreviewData({
        payrolls: response.data,
        totals,
        period: payrollPeriod
      });
    } catch (error) {
      console.error('Error generating preview:', error);
      alert('حدث خطأ في إنشاء معاينة الرواتب');
    } finally {
      setLoading(false);
    }
  };

  const confirmGeneration = async () => {
    if (!previewData) return;

    setLoading(true);
    try {
      // Actually create the payrolls now
      await salaryAPI.generatePayroll({
        professional_ids: selectedProfessionals,
        payroll_period: payrollPeriod,
        preview_only: false
      });

      onPayrollGenerated();
      setPreviewData(null);
      setSelectedProfessionals([]);

      alert(`تم إنشاء ${previewData.totals.count} راتب بنجاح`);
    } catch (error) {
      console.error('Error confirming payroll generation:', error);
      alert('حدث خطأ في تأكيد إنشاء الرواتب');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'var(--warning)',
      processed: 'var(--info)',
      paid: 'var(--success)',
      cancelled: 'var(--danger)'
    };
    return colors[status] || 'var(--text-secondary)';
  };

  return (
    <div className="form-card">
      <div className="form-card-header">
        <h3 className="form-card-title">
          <span className="form-card-title-icon">⚙️</span>
          معالجة الرواتب الشهرية
        </h3>
      </div>

      <div style={{ padding: '24px', display: 'grid', gap: '24px' }}>
        {/* Period Selection */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'end' }}>
          <div className="field-group">
            <label className="field-label">فترة الراتب</label>
            <input
              type="month"
              value={payrollPeriod}
              onChange={(e) => setPayrollPeriod(e.target.value)}
              className="form-input"
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleSelectAll}
              className="btn btn-secondary btn-sm"
              style={{ flex: 1 }}
            >
              {selectedProfessionals.length === professionals.length ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
            </button>
            <button
              onClick={generatePreview}
              disabled={selectedProfessionals.length === 0 || loading}
              className="btn btn-primary btn-sm"
              style={{ flex: 1 }}
            >
              {loading ? 'جاري المعالجة...' : 'معاينة الرواتب'}
            </button>
          </div>
        </div>

        {/* Professional Selection */}
        <div>
          <h4 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>
            اختر الموظفين ({selectedProfessionals.length} من {professionals.length})
          </h4>

          <div style={{
            maxHeight: '300px',
            overflowY: 'auto',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '16px'
          }}>
            {professionals.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <div className="empty-state-icon">👥</div>
                <div className="empty-state-text">لا يوجد موظفين برواتب نشطة</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {professionals.map(professional => (
                  <label
                    key={professional.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      background: selectedProfessionals.includes(professional.id)
                        ? 'var(--primary-light)'
                        : 'transparent'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedProfessionals.includes(professional.id)}
                      onChange={() => handleProfessionalToggle(professional.id)}
                      style={{ transform: 'scale(1.2)' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {professional.name}
                      </div>
                      <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                        {professional.specialty}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--primary)' }}>
                        الراتب: {professional.salary.net_salary.toLocaleString()} {professional.salary.currency}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Preview Section */}
        {previewData && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4 style={{ color: 'var(--text-primary)' }}>
                معاينة الرواتب - {previewData.period}
              </h4>
              <button
                onClick={confirmGeneration}
                className="btn btn-success"
                disabled={loading}
              >
                تأكيد إنشاء الرواتب
              </button>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{
                background: 'var(--bg-elevated)',
                padding: '16px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--primary)' }}>
                  {previewData.totals.count}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  عدد الرواتب
                </div>
              </div>

              <div style={{
                background: 'var(--bg-elevated)',
                padding: '16px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--success)' }}>
                  {previewData.totals.total_net.toLocaleString()} ريال
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  إجمالي صافي الرواتب
                </div>
              </div>

              <div style={{
                background: 'var(--bg-elevated)',
                padding: '16px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--warning)' }}>
                  {previewData.totals.total_allowances.toLocaleString()} ريال
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  إجمالي البدلات
                </div>
              </div>

              <div style={{
                background: 'var(--bg-elevated)',
                padding: '16px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--danger)' }}>
                  {previewData.totals.total_deductions.toLocaleString()} ريال
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  إجمالي الخصومات
                </div>
              </div>
            </div>

            {/* Payroll Details Table */}
            <div style={{
              background: 'var(--bg-elevated)',
              borderRadius: '8px',
              overflow: 'hidden',
              border: '1px solid var(--border)'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-card)' }}>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: 'var(--text-primary)' }}>
                      الموظف
                    </th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: 'var(--text-primary)' }}>
                      الراتب الأساسي
                    </th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: 'var(--text-primary)' }}>
                      البدلات
                    </th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: 'var(--text-primary)' }}>
                      الخصومات
                    </th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: 'var(--text-primary)' }}>
                      صافي الراتب
                    </th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: 'var(--text-primary)' }}>
                      الحالة
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.payrolls.map(payroll => (
                    <tr key={payroll.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {payroll.professional.first_name} {payroll.professional.last_name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {payroll.professional.specialty}
                        </div>
                      </td>
                      <td style={{ padding: '12px', color: 'var(--text-primary)' }}>
                        {payroll.base_salary.toLocaleString()} ريال
                      </td>
                      <td style={{ padding: '12px', color: 'var(--success)' }}>
                        +{payroll.total_allowances.toLocaleString()} ريال
                      </td>
                      <td style={{ padding: '12px', color: 'var(--danger)' }}>
                        -{payroll.total_deductions.toLocaleString()} ريال
                      </td>
                      <td style={{ padding: '12px', fontWeight: '700', color: 'var(--primary)' }}>
                        {payroll.net_salary.toLocaleString()} ريال
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          background: getStatusColor(payroll.status),
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {payroll.status === 'draft' ? 'مسودة' :
                           payroll.status === 'processed' ? 'معالج' :
                           payroll.status === 'paid' ? 'مدفوع' : 'ملغي'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PayrollProcessing;