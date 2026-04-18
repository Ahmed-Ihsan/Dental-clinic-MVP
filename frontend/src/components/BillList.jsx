import { useState } from 'react';
import DataList from './DataList.jsx';
import BillDetailModal from './BillDetailModal.jsx';

const statusOptions = [
  { value: 'all', label: 'جميع الحالات' },
  { value: 'pending', label: 'معلق' },
  { value: 'paid', label: 'مدفوع' },
  { value: 'overdue', label: 'متأخر' }
];

const statusRender = s => {
  const map = { pending: 'معلق', paid: 'مدفوع', overdue: 'متأخر' };
  const badges = { pending: 'badge-warning', paid: 'badge-info', overdue: 'badge-danger' };
  return <span className={`badge ${badges[s] || 'badge-ghost'}`}>{map[s] || s}</span>;
};

const amountRender = amt => `${amt?.toFixed(2)} IQD`;

const BillList = ({ refreshTrigger }) => {
  const [selectedBill, setSelectedBill] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const filters = [
    { name: 'status', type: 'select', options: statusOptions, defaultValue: 'all', placeholder: 'جميع الحالات' }
  ];

  const columns = [
    { key: 'patient_id', label: 'المريض', render: id => `مريض #${id}` },
    { key: 'total_amount', label: 'المبلغ الإجمالي', render: amountRender },
    { key: 'paid_amount', label: 'المدفوع', render: amountRender },
    { key: 'balance', label: 'المتبقي', render: amountRender },
    { key: 'due_date', label: 'تاريخ الاستحقاق' },
    { key: 'status', label: 'الحالة', render: statusRender }
  ];

  const actions = [
    { key: 'view', label: '👁 عرض', variant: 'ghost', onClick: setSelectedBill },
    { key: 'edit', label: '✏️ تعديل', variant: 'primary', onClick: setSelectedBill },
    { key: 'delete', label: '🗑 حذف', variant: 'danger' }
  ];

  const handleRefresh = () => {
    setRefreshKey(k => k + 1);
  };

  return (
    <>
      <DataList
        endpoint="/bills"
        title="قائمة الفواتير"
        icon="💰"
        filters={filters}
        columns={columns}
        actions={actions}
        refreshTrigger={refreshTrigger + refreshKey}
      />
      {selectedBill && (
        <BillDetailModal
          bill={selectedBill}
          onClose={() => setSelectedBill(null)}
          onUpdate={handleRefresh}
        />
      )}
    </>
  );
};

export default BillList;