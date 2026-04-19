import { useState, useEffect } from 'react';
import api from '../services/api';

const SalaryForm = ({ onSave, editSalary = null }) => {
  const [formData, setFormData] = useState({
    professional_id: '',
    base_salary: '',
    currency: 'SAR',
    salary_type: 'monthly',
    effective_date: '',
    end_date: '',
    is_active: true,
    notes: ''
  });
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [components, setComponents] = useState([]);

  useEffect(() => {
    fetchProfessionals();
    if (editSalary) {
      setFormData({
        professional_id: editSalary.professional_id,
        base_salary: editSalary.base_salary,
        currency: editSalary.currency,
        salary_type: editSalary.salary_type,
        effective_date: editSalary.effective_date,
        end_date: editSalary.end_date || '',
        is_active: editSalary.is_active,
        notes: editSalary.notes || ''
      });
      setComponents(editSalary.components || []);
    }
  }, [editSalary]);

  const fetchProfessionals = async () => {
    try {
      const response = await api.get('/professionals');
      setProfessionals(response.data);
    } catch (error) {
      console.error('Error fetching professionals:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleComponentChange = (index, field, value) => {
    const updatedComponents = [...components];
    updatedComponents[index] = { ...updatedComponents[index], [field]: value };
    setComponents(updatedComponents);
  };

  const addComponent = () => {
    setComponents([...components, {
      component_type: 'allowance',
      name: '',
      amount: '',
      is_taxable: true,
      is_fixed: true,
      description: '',
      effective_date: formData.effective_date
    }]);
  };

  const removeComponent = (index) => {
    setComponents(components.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let salaryResponse;
      if (editSalary) {
        salaryResponse = await api.put(`/salaries/${editSalary.id}`, formData);
      } else {
        salaryResponse = await api.post('/salaries', formData);
      }

      // Save components if any
      if (components.length > 0) {
        for (const component of components) {
          if (component.name && component.amount) {
            await api.post(`/salaries/${salaryResponse.data.id}/components`, {
              ...component,
              effective_date: component.effective_date || formData.effective_date
            });
          }
        }
      }

      onSave();
      if (!editSalary) {
        setFormData({
          professional_id: '',
          base_salary: '',
          currency: 'SAR',
          salary_type: 'monthly',
          effective_date: '',
          end_date: '',
          is_active: true,
          notes: ''
        });
        setComponents([]);
      }
    } catch (error) {
      console.error('Error saving salary:', error);
      alert('حدث خطأ في حفظ الراتب');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalSalary = () => {
    const base = parseFloat(formData.base_salary) || 0;
    const allowances = components
      .filter(c => c.component_type === 'allowance')
      .reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
    const deductions = components
      .filter(c => c.component_type === 'deduction')
      .reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);

    return {
      base,
      allowances,
      deductions,
      total: base + allowances - deductions
    };
  };

  const totals = calculateTotalSalary();

  return (
    <div className="form-card">
      <div className="form-card-header">
        <h3 className="form-card-title">
          <span className="form-card-title-icon">💰</span>
          {editSalary ? 'تعديل الراتب' : 'إضافة راتب جديد'}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="form-grid">
        <div className="field-group">
          <label className="field-label">الموظف *</label>
          <select
            name="professional_id"
            value={formData.professional_id}
            onChange={handleInputChange}
            className="form-input"
            required
          >
            <option value="">اختر الموظف</option>
            {professionals.map(prof => (
              <option key={prof.id} value={prof.id}>
                {prof.first_name} {prof.last_name} - {prof.specialty}
              </option>
            ))}
          </select>
        </div>

        <div className="field-group">
          <label className="field-label">الراتب الأساسي *</label>
          <input
            type="number"
            name="base_salary"
            value={formData.base_salary}
            onChange={handleInputChange}
            className="form-input"
            placeholder="أدخل الراتب الأساسي"
            step="0.01"
            required
          />
        </div>

        <div className="field-group">
          <label className="field-label">العملة</label>
          <select
            name="currency"
            value={formData.currency}
            onChange={handleInputChange}
            className="form-input"
          >
            <option value="SAR">ريال سعودي (SAR)</option>
            <option value="USD">دولار أمريكي (USD)</option>
            <option value="EUR">يورو (EUR)</option>
          </select>
        </div>

        <div className="field-group">
          <label className="field-label">نوع الراتب</label>
          <select
            name="salary_type"
            value={formData.salary_type}
            onChange={handleInputChange}
            className="form-input"
          >
            <option value="monthly">شهري</option>
            <option value="hourly">بالساعة</option>
            <option value="daily">يومي</option>
          </select>
        </div>

        <div className="field-group">
          <label className="field-label">تاريخ السريان *</label>
          <input
            type="date"
            name="effective_date"
            value={formData.effective_date}
            onChange={handleInputChange}
            className="form-input"
            required
          />
        </div>

        <div className="field-group">
          <label className="field-label">تاريخ الانتهاء</label>
          <input
            type="date"
            name="end_date"
            value={formData.end_date}
            onChange={handleInputChange}
            className="form-input"
          />
        </div>

        <div className="field-group form-grid-full">
          <label className="field-label">ملاحظات</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            className="form-input"
            rows="3"
            placeholder="أي ملاحظات إضافية"
          />
        </div>

        <div className="field-group form-grid-full">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="field-label">مكونات الراتب الإضافية</label>
            <button type="button" onClick={addComponent} className="btn btn-primary btn-sm">
              إضافة مكون
            </button>
          </div>

          {components.map((component, index) => (
            <div key={index} style={{
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '12px',
              background: 'var(--bg-elevated)'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', marginBottom: '12px' }}>
                <select
                  value={component.component_type}
                  onChange={(e) => handleComponentChange(index, 'component_type', e.target.value)}
                  className="form-input"
                >
                  <option value="allowance">بدل</option>
                  <option value="deduction">خصم</option>
                  <option value="bonus">مكافأة</option>
                </select>

                <input
                  type="text"
                  placeholder="اسم المكون"
                  value={component.name}
                  onChange={(e) => handleComponentChange(index, 'name', e.target.value)}
                  className="form-input"
                />

                <button
                  type="button"
                  onClick={() => removeComponent(index)}
                  className="btn btn-danger btn-sm"
                >
                  حذف
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <input
                  type="number"
                  placeholder="المبلغ"
                  value={component.amount}
                  onChange={(e) => handleComponentChange(index, 'amount', e.target.value)}
                  className="form-input"
                  step="0.01"
                />

                <input
                  type="date"
                  value={component.effective_date}
                  onChange={(e) => handleComponentChange(index, 'effective_date', e.target.value)}
                  className="form-input"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Salary Summary */}
        <div className="field-group form-grid-full">
          <div style={{
            background: 'var(--bg-elevated)',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid var(--border)'
          }}>
            <h4 style={{ marginBottom: '12px', color: 'var(--text-primary)' }}>ملخص الراتب</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
              <div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>الراتب الأساسي:</span>
                <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--primary)' }}>
                  {totals.base.toLocaleString()} {formData.currency}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>البدلات:</span>
                <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--success)' }}>
                  +{totals.allowances.toLocaleString()} {formData.currency}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>الخصومات:</span>
                <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--danger)' }}>
                  -{totals.deductions.toLocaleString()} {formData.currency}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>صافي الراتب:</span>
                <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {totals.total.toLocaleString()} {formData.currency}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="field-group form-grid-full">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '12px' }}
          >
            {loading ? 'جاري الحفظ...' : (editSalary ? 'تحديث الراتب' : 'حفظ الراتب')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SalaryForm;