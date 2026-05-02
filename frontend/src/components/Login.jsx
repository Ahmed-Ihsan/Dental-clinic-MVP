import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../AuthContext.jsx';

const Login = () => {
  const [form, setForm]       = useState({ username: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/login', form);
      login({ username: response.data.username, role: response.data.role, professional_ids: response.data.professional_ids ?? [] });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'بيانات الدخول غير صحيحة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🦷</div>
          <h2 className="login-title">تسجيل الدخول</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>نظام إدارة عيادة الأسنان</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="field-group">
            <label className="field-label">اسم المستخدم</label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              className="field-input"
              placeholder="أدخل اسم المستخدم"
              autoFocus
            />
          </div>
          <div className="field-group">
            <label className="field-label">كلمة المرور</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              className="field-input"
              placeholder="أدخل كلمة المرور"
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'جارٍ...' : 'تسجيل الدخول'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;