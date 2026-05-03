import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

/* ── helpers ─────────────────────────────────────────────────────────────── */
function fmtSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('ar-EG', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/* ── Card wrapper ─────────────────────────────────────────────────────────── */
function Card({ title, icon, children }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-default)',
      borderRadius: 16,
      padding: '24px 28px',
      marginBottom: 20,
    }}>
      <h3 style={{
        margin: '0 0 20px 0',
        fontSize: 16, fontWeight: 700,
        color: 'var(--text-primary)',
        display: 'flex', alignItems: 'center', gap: 10,
        borderBottom: '1px solid var(--border-default)',
        paddingBottom: 14,
      }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        {title}
      </h3>
      {children}
    </div>
  );
}

/* ── Toggle switch ────────────────────────────────────────────────────────── */
function Toggle({ value, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      style={{
        width: 52, height: 28,
        borderRadius: 99,
        border: 'none',
        cursor: 'pointer',
        background: value ? '#22c55e' : 'var(--border-hover)',
        position: 'relative',
        transition: 'background .2s',
        flexShrink: 0,
      }}
      aria-checked={value}
      role="switch"
    >
      <span style={{
        position: 'absolute',
        top: 3, left: value ? 27 : 3,
        width: 22, height: 22,
        borderRadius: '50%',
        background: '#fff',
        transition: 'left .2s',
        boxShadow: '0 1px 4px rgba(0,0,0,.25)',
      }} />
    </button>
  );
}

/* ── Field row ────────────────────────────────────────────────────────────── */
function FieldRow({ label, children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 16, padding: '10px 0',
      borderBottom: '1px dashed var(--border-default)',
    }}>
      <span style={{ fontSize: 14, color: 'var(--text-secondary)', flexShrink: 0 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{children}</div>
    </div>
  );
}

/* ── Select ───────────────────────────────────────────────────────────────── */
function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        background: 'var(--bg-elevated)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-default)',
        borderRadius: 8, padding: '6px 12px',
        fontSize: 13, cursor: 'pointer',
      }}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

/* ── BackupRow ────────────────────────────────────────────────────────────── */
function BackupRow({ backup, onDelete, onDownload }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(`هل أنت متأكد من حذف النسخة: ${backup.filename}؟`)) return;
    setDeleting(true);
    try {
      await api.delete(`/backup/${backup.filename}`);
      toast.success('تم حذف النسخة الاحتياطية');
      onDelete(backup.filename);
    } catch {
      toast.error('فشل حذف النسخة الاحتياطية');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 16px',
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-default)',
      borderRadius: 10, marginBottom: 8,
    }}>
      <span style={{ fontSize: 24, flexShrink: 0 }}>💾</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-all' }}>
          {backup.filename}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, display: 'flex', gap: 16 }}>
          <span>📅 {fmtDate(backup.created_at)}</span>
          <span>📦 {fmtSize(backup.size)}</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button
          onClick={() => onDownload(backup.filename)}
          style={{
            background: 'var(--primary)',
            color: '#fff', border: 'none',
            borderRadius: 8, padding: '6px 14px',
            fontSize: 12, cursor: 'pointer', fontWeight: 600,
          }}
        >
          ⬇️ تنزيل
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          style={{
            background: '#ef4444',
            color: '#fff', border: 'none',
            borderRadius: 8, padding: '6px 14px',
            fontSize: 12, cursor: 'pointer', fontWeight: 600,
            opacity: deleting ? 0.6 : 1,
          }}
        >
          {deleting ? '...' : '🗑️ حذف'}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [backups, setBackups]   = useState([]);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [loadingBackups, setLoadingBackups] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await api.get('/settings');
      setSettings(res.data);
    } catch {
      toast.error('تعذّر تحميل الإعدادات');
    }
  }, []);

  const fetchBackups = useCallback(async () => {
    setLoadingBackups(true);
    try {
      const res = await api.get('/backup/list');
      setBackups(res.data);
    } catch {
      toast.error('تعذّر تحميل قائمة النسخ الاحتياطية');
    } finally {
      setLoadingBackups(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchBackups();
  }, [fetchSettings, fetchBackups]);

  const handleManualBackup = async () => {
    setCreating(true);
    try {
      const res = await api.post('/backup/create');
      toast.success(res.data.message || 'تم إنشاء النسخة الاحتياطية');
      fetchBackups();
      fetchSettings();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'فشل إنشاء النسخة الاحتياطية');
    } finally {
      setCreating(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await api.post('/settings', { auto_backup: settings.auto_backup });
      toast.success(res.data.message || 'تم حفظ الإعدادات');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'فشل حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const patchAuto = (key, val) => {
    setSettings(prev => ({
      ...prev,
      auto_backup: { ...prev.auto_backup, [key]: val },
    }));
  };

  const handleDownload = (filename) => {
    window.open(`http://localhost:5000/api/backup/download/${filename}`, '_blank');
  };

  const handleDeleted = (filename) => {
    setBackups(prev => prev.filter(b => b.filename !== filename));
  };

  const auto = settings?.auto_backup ?? {};

  const intervalOptions = [
    { value: 'daily',   label: 'يومياً' },
    { value: 'weekly',  label: 'أسبوعياً' },
    { value: 'monthly', label: 'شهرياً' },
  ];

  const hourOptions = Array.from({ length: 24 }, (_, i) => ({
    value: i, label: `${String(i).padStart(2, '0')}:00`,
  }));

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '8px 0 40px' }}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10 }}>
          ⚙️ الإعدادات
        </h2>
        <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--text-muted)' }}>
          إدارة النسخ الاحتياطية وإعدادات النظام
        </p>
      </div>

      {/* ── Manual Backup ──────────────────────────────────────────── */}
      <Card title="النسخ الاحتياطي اليدوي" icon="💾">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              إنشاء نسخة احتياطية فورية من قاعدة البيانات الآن.
              {auto.last_backup && (
                <span style={{ display: 'block', marginTop: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                  آخر نسخة: {fmtDate(auto.last_backup)}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={handleManualBackup}
            disabled={creating}
            style={{
              background: 'var(--primary)',
              color: '#fff', border: 'none',
              borderRadius: 10, padding: '10px 24px',
              fontSize: 14, fontWeight: 700,
              cursor: creating ? 'not-allowed' : 'pointer',
              opacity: creating ? 0.7 : 1,
              display: 'flex', alignItems: 'center', gap: 8,
              flexShrink: 0,
            }}
          >
            {creating ? (
              <>
                <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                جاري الإنشاء...
              </>
            ) : (
              <>💾 إنشاء نسخة احتياطية الآن</>
            )}
          </button>
        </div>
      </Card>

      {/* ── Auto Backup ────────────────────────────────────────────── */}
      <Card title="النسخ الاحتياطي التلقائي" icon="🔄">
        {!settings ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)' }}>جاري التحميل…</div>
        ) : (
          <>
            <FieldRow label="تفعيل النسخ الاحتياطي التلقائي">
              <Toggle value={!!auto.enabled} onChange={v => patchAuto('enabled', v)} />
              <span style={{ fontSize: 13, color: auto.enabled ? '#22c55e' : 'var(--text-muted)', fontWeight: 600 }}>
                {auto.enabled ? 'مفعّل' : 'معطّل'}
              </span>
            </FieldRow>

            <FieldRow label="تكرار النسخ الاحتياطي">
              <Select
                value={auto.interval || 'daily'}
                onChange={v => patchAuto('interval', v)}
                options={intervalOptions}
              />
            </FieldRow>

            <FieldRow label="وقت تنفيذ النسخ الاحتياطي">
              <Select
                value={auto.hour ?? 2}
                onChange={v => patchAuto('hour', parseInt(v))}
                options={hourOptions}
              />
            </FieldRow>

            <FieldRow label="الحد الأقصى لعدد النسخ المحفوظة">
              <input
                type="number"
                min={1} max={50}
                value={auto.max_backups ?? 10}
                onChange={e => patchAuto('max_backups', parseInt(e.target.value) || 1)}
                style={{
                  width: 70,
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 8, padding: '6px 10px',
                  fontSize: 13, textAlign: 'center',
                }}
              />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>نسخة</span>
            </FieldRow>

            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-start' }}>
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                style={{
                  background: '#22c55e',
                  color: '#fff', border: 'none',
                  borderRadius: 10, padding: '10px 28px',
                  fontSize: 14, fontWeight: 700,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                {saving ? 'جاري الحفظ...' : '✅ حفظ الإعدادات'}
              </button>
            </div>
          </>
        )}
      </Card>

      {/* ── Backup List ─────────────────────────────────────────────── */}
      <Card title={`النسخ الاحتياطية المحفوظة (${backups.length})`} icon="📂">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            النسخ مرتبة من الأحدث إلى الأقدم
          </span>
          <button
            onClick={fetchBackups}
            disabled={loadingBackups}
            style={{
              background: 'var(--bg-elevated)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-default)',
              borderRadius: 8, padding: '5px 14px',
              fontSize: 12, cursor: 'pointer',
            }}
          >
            🔄 تحديث
          </button>
        </div>

        {loadingBackups ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
            جاري التحميل…
          </div>
        ) : backups.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '40px 20px',
            color: 'var(--text-muted)', fontSize: 14,
            border: '2px dashed var(--border-default)',
            borderRadius: 12,
          }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
            لا توجد نسخ احتياطية بعد
          </div>
        ) : (
          <div>
            {backups.map(b => (
              <BackupRow
                key={b.filename}
                backup={b}
                onDelete={handleDeleted}
                onDownload={handleDownload}
              />
            ))}
          </div>
        )}
      </Card>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
