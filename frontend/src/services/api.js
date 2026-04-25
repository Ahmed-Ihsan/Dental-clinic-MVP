import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true,
});

// Salary Management APIs
export const salaryAPI = {
  // Salaries
  getSalaries: (params = {}) => api.get('/salaries', { params }),
  getSalary: (id) => api.get(`/salaries/${id}`),
  createSalary: (data) => api.post('/salaries', data),
  updateSalary: (id, data) => api.put(`/salaries/${id}`, data),
  deleteSalary: (id) => api.delete(`/salaries/${id}`),

  // Salary Components
  getSalaryComponents: (salaryId) => api.get(`/salaries/${salaryId}/components`),
  createSalaryComponent: (salaryId, data) => api.post(`/salaries/${salaryId}/components`, data),
  updateSalaryComponent: (id, data) => api.put(`/salary-components/${id}`, data),
  deleteSalaryComponent: (id) => api.delete(`/salary-components/${id}`),

  // Payroll
  getPayrolls: (params = {}) => api.get('/payrolls', { params }),
  getPayroll: (id) => api.get(`/payrolls/${id}`),
  generatePayroll: (data) => api.post('/payrolls/generate', data),
  processPayroll: (id) => api.post(`/payrolls/${id}/process`),
  payPayroll: (id, data) => api.post(`/payrolls/${id}/pay`, data),
  deletePayroll: (id) => api.delete(`/payrolls/${id}`),

  // Salary Payments
  getSalaryPayments: (params = {}) => api.get('/salary-payments', { params }),
  getSalaryPayment: (id) => api.get(`/salary-payments/${id}`),

// Analytics
getPayrollAnalytics: (params = {}) => api.get('/payrolls/analytics', { params }),

// Payment Installments
getInstallments: (params = {}) => api.get('/installments', { params }),
getInstallment: (id) => api.get(`/installments/${id}`),
createInstallment: (data) => api.post('/installments', data),
updateInstallment: (id, data) => api.put(`/installments/${id}`, data),
deleteInstallment: (id) => api.delete(`/installments/${id}`),
createInstallmentPayment: (installmentId, data) => api.post(`/installments/${installmentId}/payments`, data),
getInstallmentPayments: (installmentId) => api.get(`/installments/${installmentId}/payments`),
updateInstallmentPayment: (id, data) => api.put(`/installment-payments/${id}`, data),
deleteInstallmentPayment: (id) => api.delete(`/installment-payments/${id}`),
getInstallmentAnalytics: (params = {}) => api.get('/installments/analytics', { params }),
getOverdueInstallments: () => api.get('/installments/overdue'),
processAutoInstallments: () => api.post('/installments/process-auto'),

  // Expenses
  getExpenses: (params = {}) => api.get('/expenses', { params }),
  getExpense: (id) => api.get(`/expenses/${id}`),
  createExpense: (data) => api.post('/expenses', data),
  updateExpense: (id, data) => api.put(`/expenses/${id}`, data),
  deleteExpense: (id) => api.delete(`/expenses/${id}`),
  getExpensesSummary: (params = {}) => api.get('/expenses/summary', { params }),
};

export default api;