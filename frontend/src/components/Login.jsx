import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../AuthContext.jsx';

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const endpoint = isRegister ? '/register' : '/login';
      const response = await api.post(endpoint, form);
      if (response.status === 200 || response.status === 201) {
        if (isRegister) {
          setError('User registered. Please login.');
          setIsRegister(false);
        } else {
          login();
          navigate('/');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || (isRegister ? 'Register failed' : 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2 className="login-title">{isRegister ? 'تسجيل حساب جديد' : 'تسجيل الدخول'}</h2>
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
            {loading ? 'جارٍ...' : (isRegister ? 'تسجيل' : 'تسجيل الدخول')}
          </button>
        </form>
        <button onClick={() => setIsRegister(!isRegister)} className="btn btn-ghost" style={{ marginTop: 10 }}>
          {isRegister ? 'لديك حساب؟ تسجيل الدخول' : 'لا تملك حساب؟ تسجيل جديد'}
        </button>
      </div>
    </div>
  );
};

export default Login;