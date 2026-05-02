/**
 * DentalChartTab
 * ──────────────
 * Wraps InteractiveDentalChart for the Case Sheet.
 * Manages local save/load state and sends updates to the parent
 * via the `onSave` callback (which can persist to the backend).
 */
import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import InteractiveDentalChart from './InteractiveDentalChart';
import api from '../../services/api';

export default function DentalChartTab({ patientId, initialTeethState = {}, onSaved }) {
  const [pendingState, setPendingState] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleChange = useCallback((updatedMap) => {
    setPendingState(updatedMap);
    setSaved(false);
  }, []);

  const handleSave = async () => {
    if (!pendingState) return;
    setSaving(true);
    try {
      await api.patch(`/patients/${patientId}/dental-chart`, { teeth: pendingState });
      setSaved(true);
      onSaved?.(pendingState);
      setPendingState(null);
      toast.success('تم حفظ خريطة الأسنان بنجاح');
    } catch (err) {
      console.error('Error saving dental chart:', err);
      toast.error('فشل حفظ خريطة الأسنان');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cs-dental-chart-tab">
      {/* Save toolbar */}
      <div className="cs-tab-toolbar">
        <div className="cs-tab-toolbar-info">
          <span className="odc-chart-tab-hint">
            🦷 خريطة الأسنان التفاعلية — انقر على أي سن لتحديد حالته
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {saved && (
            <span className="odc-save-badge">
              ✓ تم الحفظ
            </span>
          )}
          <button
            className="cs-btn-primary"
            onClick={handleSave}
            disabled={!pendingState || saving}
            id="save-dental-chart-btn"
          >
            {saving ? (
              <><span className="cs-spinner" /> جاري الحفظ…</>
            ) : (
              '💾 حفظ الخريطة'
            )}
          </button>
        </div>
      </div>

      {/* Chart */}
      <InteractiveDentalChart
        initialTeethState={initialTeethState}
        onChange={handleChange}
      />
    </div>
  );
}
