import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (query) {
      performSearch(query);
    }
  }, []);

  const performSearch = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults(null);
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(`/search?q=${encodeURIComponent(searchQuery)}`);
      setResults(response.data);
      setSearchParams({ q: searchQuery });
    } catch (error) {
      console.error('Search error:', error);
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    performSearch(query);
  };

  const getEntityLabel = (type) => {
    const labels = {
      patient: 'المرضى',
      appointment: 'المواعيد',
      treatment: 'العلاجات',
      medical_history: 'التاريخ الطبي',
      bill: 'الفواتير',
      professional: 'المتخصصين'
    };
    return labels[type] || type;
  };

  const getEntityIcon = (type) => {
    const icons = {
      patient: '👤',
      appointment: '📅',
      treatment: '🦷',
      medical_history: '🩺',
      bill: '💰',
      professional: '👨‍⚕️'
    };
    return icons[type] || '📄';
  };

  const getEntityLink = (item) => {
    const links = {
      patient: `/patients`,
      appointment: `/appointments`,
      treatment: `/treatments`,
      medical_history: `/medical-histories`,
      bill: `/bills`,
      professional: `/staff`
    };
    return links[item.type] || '/';
  };

  const getEntityDisplayName = (item) => {
    switch (item.type) {
      case 'patient':
        return `${item.first_name} ${item.last_name}`;
      case 'professional':
        return `${item.first_name} ${item.last_name}`;
      case 'appointment':
        return `موعد في ${item.appointment_date} الساعة ${item.start_time}`;
      case 'treatment':
        return item.treatment_type;
      case 'medical_history':
        return item.condition;
      case 'bill':
        return `فاتورة رقم ${item.id}`;
      default:
        return `عنصر رقم ${item.id}`;
    }
  };

  const getEntityDetails = (item) => {
    switch (item.type) {
      case 'patient':
        return [
          item.email && `البريد: ${item.email}`,
          item.phone && `الهاتف: ${item.phone}`,
          item.date_of_birth && `تاريخ الميلاد: ${item.date_of_birth}`
        ].filter(Boolean);
      case 'appointment':
        return [
          `الحالة: ${item.status}`,
          item.notes && `الملاحظات: ${item.notes}`
        ].filter(Boolean);
      case 'treatment':
        return [
          `التكلفة: ${item.cost} ريال`,
          item.treatment_date && `تاريخ العلاج: ${item.treatment_date}`,
          item.notes && `الملاحظات: ${item.notes}`
        ].filter(Boolean);
      case 'medical_history':
        return [
          `تاريخ التشخيص: ${item.diagnosis_date}`,
          item.notes && `الملاحظات: ${item.notes}`
        ].filter(Boolean);
      case 'bill':
        return [
          `المبلغ الإجمالي: ${item.total_amount} ريال`,
          `المبلغ المدفوع: ${item.paid_amount} ريال`,
          `الحالة: ${item.status}`,
          item.due_date && `تاريخ الاستحقاق: ${item.due_date}`
        ].filter(Boolean);
      case 'professional':
        return [
          item.specialty && `التخصص: ${item.specialty}`,
          item.email && `البريد: ${item.email}`,
          item.phone && `الهاتف: ${item.phone}`,
          item.license_number && `رقم الترخيص: ${item.license_number}`
        ].filter(Boolean);
      default:
        return [];
    }
  };

  const tabs = [
    { key: 'all', label: 'الكل', icon: '🔍' },
    { key: 'patients', label: 'المرضى', icon: '👤' },
    { key: 'appointments', label: 'المواعيد', icon: '📅' },
    { key: 'treatments', label: 'العلاجات', icon: '🦷' },
    { key: 'medical_histories', label: 'التاريخ الطبي', icon: '🩺' },
    { key: 'bills', label: 'الفواتير', icon: '💰' },
    { key: 'professionals', label: 'المتخصصين', icon: '👨‍⚕️' }
  ];

  const getFilteredResults = () => {
    if (!results || activeTab === 'all') return results;
    return { [activeTab]: results[activeTab] || [] };
  };

  const filteredResults = getFilteredResults();
  const totalResults = results ? Object.values(results).reduce((sum, arr) => sum + arr.length, 0) : 0;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header animate-in">
        <h1 className="page-header-title">
          <span className="page-header-icon">🔍</span>
          البحث العام
        </h1>
        <p className="page-header-subtitle">البحث في جميع بيانات النظام</p>
      </div>

      {/* Search Form */}
      <div className="content-card animate-in animate-in-delay-1" style={{ marginBottom: '24px' }}>
        <div className="content-card-body">
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="اكتب كلمة البحث..."
              className="form-input"
              style={{ flex: 1, fontSize: '16px', padding: '12px 16px' }}
              disabled={loading}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !query.trim()}
              style={{ padding: '12px 24px', minWidth: '120px' }}
            >
              {loading ? 'جاري البحث...' : 'بحث'}
            </button>
          </form>
        </div>
      </div>

      {/* Results */}
      {results && (
        <>
          {/* Results Summary */}
          <div className="animate-in animate-in-delay-2" style={{ marginBottom: '16px' }}>
            <div className="stats-grid">
              <div className="stat-card" style={{ gridColumn: '1 / -1' }}>
                <div className="stat-card-header">
                  <span className="stat-card-label">نتائج البحث</span>
                  <div className="stat-card-icon">📊</div>
                </div>
                <div className="stat-card-value">{totalResults}</div>
                <div className="stat-card-change">نتيجة لـ "{query}"</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="animate-in animate-in-delay-3" style={{ marginBottom: '24px' }}>
            <div className="tabs">
              {tabs.map(tab => {
                const count = tab.key === 'all' ? totalResults : (results[tab.key]?.length || 0);
                return (
                  <button
                    key={tab.key}
                    className={`tab ${activeTab === tab.key ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    <span className="tab-icon">{tab.icon}</span>
                    {tab.label}
                    {count > 0 && <span className="tab-count">({count})</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Results Grid */}
          <div className="animate-in animate-in-delay-4">
            {Object.entries(filteredResults).map(([category, items]) => (
              items.length > 0 && (
                <div key={category} className="content-card" style={{ marginBottom: '24px' }}>
                  <div className="content-card-header">
                    <h3 className="content-card-title">
                      {getEntityIcon(category)} {getEntityLabel(category)} ({items.length})
                    </h3>
                  </div>
                  <div className="content-card-body">
                    <div className="data-grid">
                      {items.map(item => (
                        <Link
                          key={`${item.type}-${item.id}`}
                          to={getEntityLink(item)}
                          className="data-item"
                          style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                          <div className="data-item-header">
                            <div className="data-item-title">{getEntityDisplayName(item)}</div>
                            <div className="data-item-meta">#{item.id}</div>
                          </div>
                          <div className="data-item-details">
                            {getEntityDetails(item).map((detail, index) => (
                              <div key={index} className="data-item-detail">{detail}</div>
                            ))}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )
            ))}

            {totalResults === 0 && (
              <div className="content-card">
                <div className="content-card-body">
                  <div className="empty-state">
                    <div className="empty-state-icon">🔍</div>
                    <div className="empty-state-text">لا توجد نتائج للبحث</div>
                    <div className="empty-state-subtext">جرب كلمات بحث مختلفة أو تحقق من الإملاء</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {!results && !loading && (
        <div className="animate-in animate-in-delay-2">
          <div className="content-card">
            <div className="content-card-body">
              <div className="empty-state">
                <div className="empty-state-icon">🔍</div>
                <div className="empty-state-text">ابدأ البحث في جميع البيانات</div>
                <div className="empty-state-subtext">اكتب كلمة بحث في الحقل أعلاه لبدء البحث</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPage;