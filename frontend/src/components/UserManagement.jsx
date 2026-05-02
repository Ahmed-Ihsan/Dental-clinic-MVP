import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../AuthContext';

/* ── Constants ──────────────────────────────────────────────────── */
const ROLES = [
  { key: 'admin',     label: 'مدير النظام', icon: '👑', color: '#dc2626', bg: '#fef2f2', border: '#fecaca',
    perms: 'وصول كامل — جميع الصفحات والإعدادات وإدارة المستخدمين' },
  { key: 'doctor',    label: 'طبيب',        icon: '👨‍⚕️', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe',
    perms: 'المرضى • المواعيد • العلاجات • الفواتير' },
  { key: 'secretary', label: 'سكرتير',      icon: '📋', color: '#059669', bg: '#f0fdf4', border: '#bbf7d0',
    perms: 'المرضى • المواعيد • الفواتير' },
];
const ROLE_MAP = Object.fromEntries(ROLES.map(r => [r.key, r]));
const EMPTY_FORM = { username: '', password: '', role: 'doctor' };

/* ── Avatar initials ────────────────────────────────────────────── */
function Avatar({ username, role }) {
  const r = ROLE_MAP[role] || ROLE_MAP.doctor;
  return (
    <div style={{
      width: 40, height: 40, borderRadius: 12, flexShrink: 0,
      background: r.bg, border: `1.5px solid ${r.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 20, userSelect: 'none',
    }}>
      {r.icon}
    </div>
  );
}

/* ── Role badge ─────────────────────────────────────────────────── */
function RoleBadge({ role }) {
  const r = ROLE_MAP[role] || ROLE_MAP.doctor;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 11px', borderRadius: 99, fontSize: 12, fontWeight: 600,
      background: r.bg, color: r.color, border: `1px solid ${r.border}`,
      letterSpacing: 0.2,
    }}>
      {r.icon} {r.label}
    </span>
  );
}

/* ── Modal ──────────────────────────────────────────────────────── */
function Modal({ title, onClose, children }) {
  const ref = useRef();
  useEffect(() => {
    const handle = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div ref={ref} style={{
        background: 'var(--bg-card)', borderRadius: 18,
        boxShadow: '0 25px 60px rgba(0,0,0,0.25)', width: '100%', maxWidth: 420,
        border: '1px solid var(--border)', overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 22px', borderBottom: '1px solid var(--border)',
        }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>{title}</span>
          <button onClick={onClose} style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            borderRadius: 8, width: 30, height: 30, cursor: 'pointer',
            fontSize: 16, color: 'var(--text-muted)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>
        <div style={{ padding: '22px 22px 20px' }}>{children}</div>
      </div>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────────── */
export default function UserManagement() {
  const { user: me } = useAuth();
  const [users,         setUsers]         = useState([]);
  const [professionals, setProfessionals]  = useState([]);
  const [loading,       setLoading]        = useState(true);
  const [search,        setSearch]         = useState('');
  const [modal,         setModal]          = useState(null); // 'create' | { edit: user, profId } | { del: user }
  const [form,          setForm]           = useState(EMPTY_FORM);
  const [linkProfIds,   setLinkProfIds]    = useState([]);  // multi-select
  const [saving,        setSaving]         = useState(false);

  useEffect(() => { fetchUsers(); fetchProfessionals(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try { setUsers((await api.get('/users')).data); }
    catch { toast.error('فشل في تحميل المستخدمين'); }
    finally { setLoading(false); }
  };

  const fetchProfessionals = async () => {
    try { setProfessionals((await api.get('/professionals')).data); }
    catch {}
  };

  /* Create */
  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/register', form);
      toast.success('تم إنشاء الحساب بنجاح');
      setModal(null); setForm(EMPTY_FORM); fetchUsers();
    } catch (err) { toast.error(err.response?.data?.message || 'فشل في إنشاء الحساب'); }
    finally { setSaving(false); }
  };

  /* Edit */
  const handleEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { role: form.role };
      if (form.password) payload.password = form.password;
      await api.put(`/users/${modal.edit.id}`, payload);
      await api.put(`/users/${modal.edit.id}/link-professional`, { professional_ids: linkProfIds });
      toast.success('تم التحديث بنجاح');
      setModal(null); fetchUsers(); fetchProfessionals();
    } catch (err) { toast.error(err.response?.data?.message || 'فشل في التحديث'); }
    finally { setSaving(false); }
  };

  /* Delete */
  const handleDelete = async () => {
    setSaving(true);
    try {
      await api.delete(`/users/${modal.del.id}`);
      toast.success('تم حذف المستخدم');
      setModal(null); fetchUsers();
    } catch (err) { toast.error(err.response?.data?.message || 'فشل في الحذف'); }
    finally { setSaving(false); }
  };

  const openEdit = (u) => {
    const linked = professionals.filter(p => p.user_id === u.id).map(p => p.id);
    setForm({ username: u.username, password: '', role: u.role });
    setLinkProfIds(linked);
    setModal({ edit: u });
  };

  const toggleProf = (id) => setLinkProfIds(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  );
  const openCreate = () => { setForm(EMPTY_FORM); setModal('create'); };

  const filtered = users.filter(u => u.username.toLowerCase().includes(search.toLowerCase()));

  /* Stats */
  const stats = ROLES.map(r => ({ ...r, count: users.filter(u => u.role === r.key).length }));

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>

      {/* ══ Page header ══════════════════════════════════════════════ */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>إدارة المستخدمين</h1>
          <p style={{ margin: '5px 0 0', color: 'var(--text-muted)', fontSize: 13.5 }}>
            إنشاء وإدارة صلاحيات حسابات الفريق الطبي
          </p>
        </div>
        <button onClick={openCreate} style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '9px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
          background: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: 13.5,
          fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(var(--primary-rgb),0.35)',
          whiteSpace: 'nowrap',
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          مستخدم جديد
        </button>
      </div>

      {/* ══ Stats cards ═══════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
        {stats.map(r => (
          <div key={r.key} style={{
            background: 'var(--bg-card)', border: `1px solid var(--border)`,
            borderRadius: 14, padding: '16px 18px',
            display: 'flex', alignItems: 'center', gap: 14,
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          }}>
            <div style={{
              width: 46, height: 46, borderRadius: 12, flexShrink: 0,
              background: r.bg, border: `1.5px solid ${r.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
            }}>{r.icon}</div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1, color: r.color }}>{r.count}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 3, fontWeight: 500 }}>{r.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ══ Table card ════════════════════════════════════════════════ */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
      }}>

        {/* toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 18px', borderBottom: '1px solid var(--border)',
          background: 'var(--bg-elevated)',
        }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <svg style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              placeholder="بحث باسم المستخدم..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '8px 34px 8px 12px', borderRadius: 9,
                border: '1px solid var(--border)', background: 'var(--bg-card)',
                fontSize: 13, color: 'var(--text-primary)', fontFamily: 'inherit',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {filtered.length} من {users.length} مستخدم
          </span>
        </div>

        {/* table */}
        {loading ? (
          <div style={{ padding: 48 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 18 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--bg-elevated)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: 13, borderRadius: 6, background: 'var(--bg-elevated)', width: `${55 + i * 15}%`, marginBottom: 7 }} />
                  <div style={{ height: 10, borderRadius: 6, background: 'var(--bg-elevated)', width: '30%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '56px 24px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>👤</div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>لا يوجد مستخدمون</div>
            <div style={{ fontSize: 13, marginTop: 5 }}>أنشئ حساباً جديداً للبدء</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {[
                  { label: 'المستخدم',       w: '34%' },
                  { label: 'الصلاحية',       w: '24%' },
                  { label: 'تاريخ الإنشاء',  w: '20%' },
                  { label: 'الإجراءات',      w: '22%' },
                ].map(h => (
                  <th key={h.label} style={{
                    padding: '11px 18px', textAlign: 'right', width: h.w,
                    fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)',
                    textTransform: 'uppercase', letterSpacing: 1,
                    background: 'var(--bg-elevated)',
                  }}>{h.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const isMe = u.username === me?.username;
                return (
                  <tr key={u.id} style={{
                    borderBottom: '1px solid var(--border)',
                    transition: 'background 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* User */}
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Avatar username={u.username} role={u.role} />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{u.username}</div>
                          {isMe
                            ? <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--primary)',
                                background: 'rgba(var(--primary-rgb),0.1)', padding: '1px 7px',
                                borderRadius: 99, display: 'inline-block', marginTop: 2 }}>حسابك</span>
                            : (() => {
                                const linked = professionals.filter(p => p.user_id === u.id);
                                return linked.length > 0
                                  ? <span style={{ fontSize: 11.5, color: '#059669' }}>🔗 {linked.map(p => `${p.first_name} ${p.last_name}`).join(' · ')}</span>
                                  : <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>غير مرتبط بملف طبي</span>;
                              })()
                          }
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td style={{ padding: '14px 18px' }}>
                      <RoleBadge role={u.role} />
                    </td>

                    {/* Date */}
                    <td style={{ padding: '14px 18px', color: 'var(--text-muted)', fontSize: 13 }}>
                      {u.created_at
                        ? new Date(u.created_at).toLocaleDateString('ar-SA', { year:'numeric', month:'short', day:'numeric' })
                        : '—'}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => openEdit(u)} style={{
                          padding: '6px 13px', borderRadius: 8, fontSize: 12.5, fontWeight: 600,
                          border: '1px solid var(--border)', background: 'var(--bg-card)',
                          color: 'var(--text-primary)', cursor: 'pointer', fontFamily: 'inherit',
                          display: 'flex', alignItems: 'center', gap: 5,
                        }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          تعديل
                        </button>
                        {!isMe && (
                          <button onClick={() => setModal({ del: u })} style={{
                            padding: '6px 13px', borderRadius: 8, fontSize: 12.5, fontWeight: 600,
                            border: '1px solid #fecaca', background: '#fef2f2',
                            color: '#dc2626', cursor: 'pointer', fontFamily: 'inherit',
                            display: 'flex', alignItems: 'center', gap: 5,
                          }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                            حذف
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ══ Permissions reference ═════════════════════════════════════ */}
      <div style={{
        marginTop: 20, padding: '14px 18px', borderRadius: 12,
        border: '1px solid var(--border)', background: 'var(--bg-elevated)',
        display: 'flex', gap: 24, flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)', alignSelf: 'center' }}>الصلاحيات:</span>
        {ROLES.map(r => (
          <div key={r.key} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <RoleBadge role={r.key} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.perms}</span>
          </div>
        ))}
      </div>

      {/* ══ Modals ════════════════════════════════════════════════════ */}

      {/* Create */}
      {modal === 'create' && (
        <Modal title="إنشاء مستخدم جديد" onClose={() => setModal(null)}>
          <form onSubmit={handleCreate}>
            <UserFormFields form={form} setForm={setForm} showPassword />
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button type="submit" disabled={saving} style={primaryBtn}>
                {saving ? 'جارٍ الإنشاء...' : 'إنشاء الحساب'}
              </button>
              <button type="button" onClick={() => setModal(null)} style={ghostBtn}>إلغاء</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit */}
      {modal?.edit && (
        <Modal title={`تعديل — ${modal.edit.username}`} onClose={() => setModal(null)}>
          <form onSubmit={handleEdit}>
            <UserFormFields form={form} setForm={setForm} showPassword editMode />

            {/* Professional link — shown for doctor role */}
            {form.role === 'doctor' && (
              <div style={{ marginTop: 14 }}>
                <label style={labelStyle}>ربط بملفات طبية (يمكن اختيار أكثر من ملف)</label>
                <div style={{
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                  padding: '10px 12px', maxHeight: 220, overflowY: 'auto',
                  background: 'var(--bg-card)', display: 'flex', flexDirection: 'column', gap: 6
                }}>
                  {professionals
                    .filter(p => !p.user_id || p.user_id === modal.edit.id)
                    .length === 0
                    ? <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>لا توجد ملفات طبية متاحة</p>
                    : professionals
                        .filter(p => !p.user_id || p.user_id === modal.edit.id)
                        .map(p => {
                          const checked = linkProfIds.includes(p.id);
                          return (
                            <label key={p.id} style={{
                              display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                              padding: '7px 10px', borderRadius: 'var(--radius-sm)',
                              background: checked ? 'rgba(var(--primary-rgb),0.08)' : 'transparent',
                              border: `1px solid ${checked ? 'var(--primary)' : 'transparent'}`,
                              transition: 'all 0.15s'
                            }}>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleProf(p.id)}
                                style={{ accentColor: 'var(--primary)', width: 15, height: 15 }}
                              />
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 13 }}>{p.first_name} {p.last_name}</div>
                                {p.specialty && <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{p.specialty}</div>}
                              </div>
                              {checked && <span style={{ marginRight: 'auto', color: 'var(--primary)', fontWeight: 700, fontSize: 12 }}>✓ مرتبط</span>}
                            </label>
                          );
                        })
                  }
                </div>
                <p style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: '5px 0 0' }}>
                  الملفات المحددة تحدد أي المواعيد والمرضى والفواتير تظهر للطبيب.
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button type="submit" disabled={saving} style={primaryBtn}>
                {saving ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
              </button>
              <button type="button" onClick={() => setModal(null)} style={ghostBtn}>إلغاء</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete confirm */}
      {modal?.del && (
        <Modal title="تأكيد الحذف" onClose={() => setModal(null)}>
          <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
            <div style={{ fontSize: 46, marginBottom: 12 }}>🗑️</div>
            <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: 16 }}>
              هل تريد حذف حساب "{modal.del.username}"؟
            </p>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
              هذا الإجراء لا يمكن التراجع عنه.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleDelete} disabled={saving} style={{ ...primaryBtn, background: '#dc2626', boxShadow: '0 2px 8px rgba(220,38,38,0.3)' }}>
              {saving ? 'جارٍ الحذف...' : 'نعم، احذف الحساب'}
            </button>
            <button onClick={() => setModal(null)} style={ghostBtn}>إلغاء</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ── Shared form fields ─────────────────────────────────────────── */
function UserFormFields({ form, setForm, showPassword, editMode }) {
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {!editMode && (
        <div>
          <label style={labelStyle}>اسم المستخدم</label>
          <input required value={form.username} onChange={set('username')}
            placeholder="مثال: dr.ahmed" autoFocus style={inputStyle} />
        </div>
      )}
      <div>
        <label style={labelStyle}>الصلاحية</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 4 }}>
          {ROLES.map(r => (
            <label key={r.key} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              padding: '10px 6px', borderRadius: 10, cursor: 'pointer',
              border: form.role === r.key ? `2px solid ${r.color}` : '2px solid var(--border)',
              background: form.role === r.key ? r.bg : 'var(--bg-elevated)',
              transition: 'all 0.15s',
            }}>
              <input type="radio" name="role" value={r.key} checked={form.role === r.key}
                onChange={set('role')} style={{ display: 'none' }} />
              <span style={{ fontSize: 22 }}>{r.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: form.role === r.key ? r.color : 'var(--text-muted)' }}>
                {r.label}
              </span>
            </label>
          ))}
        </div>
      </div>
      {showPassword && (
        <div>
          <label style={labelStyle}>{editMode ? 'كلمة مرور جديدة (اتركها فارغة لعدم التغيير)' : 'كلمة المرور'}</label>
          <input type="password" value={form.password} onChange={set('password')}
            placeholder={editMode ? '••••••  (اختياري)' : '••••••'}
            required={!editMode} style={inputStyle} />
        </div>
      )}
    </div>
  );
}

/* ── Shared styles ──────────────────────────────────────────────── */
const labelStyle = { display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: 0.3 };
const inputStyle = {
  width: '100%', padding: '9px 12px', borderRadius: 9, boxSizing: 'border-box',
  border: '1.5px solid var(--border)', background: 'var(--bg-card)',
  fontSize: 14, color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none',
};
const primaryBtn = {
  flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
  background: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: 14,
  fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(var(--primary-rgb),0.3)',
};
const ghostBtn = {
  flex: 1, padding: '10px 0', borderRadius: 10, cursor: 'pointer',
  border: '1.5px solid var(--border)', background: 'var(--bg-elevated)',
  color: 'var(--text-primary)', fontWeight: 600, fontSize: 14, fontFamily: 'inherit',
};
