const API_URL = 'https://vyaparai-fkhz.onrender.com';

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('vyaparai-token');
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.detail || 'Unable to complete the request.');
  return body as T;
}

export type SessionResponse = {
  access_token: string;
  user: { id: number; full_name: string; email: string };
};

export type BusinessResponse = {
  id: number;
  user_id: number;
  name: string;
  business_type: string;
  industry: string;
  city: string;
  monthly_revenue: number;
  monthly_expenses: number;
  current_cash: number;
  receivables: number;
  payables: number;
  debt: number;
  employees: number;
};

export type FinancialRecordResponse = {
  id: number;
  user_id: number;
  month: string;
  revenue: number;
  expenses: number;
  cash_balance: number;
  receivables: number;
  payables: number;
  debt: number;
  inventory: number;
  payroll: number;
  operating_expenses: number;
  other_income: number;
  other_expenses: number;
};

export type FinancialRecordPayload = Omit<FinancialRecordResponse, 'id' | 'user_id'>;

export const authApi = {
  login: (payload: { email: string; password: string }) => api<SessionResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  register: (payload: { full_name: string; business_name: string; email: string; phone: string; password: string; business_type: string }) => api<SessionResponse>('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  me: () => api<{ user: SessionResponse['user']; business: BusinessResponse }>('/api/auth/me'),
  logout: () => api<{ message: string }>('/api/auth/logout', { method: 'POST' }),
};

export const businessApi = {
  get: () => api<BusinessResponse>('/api/business'),
  update: (payload: Omit<BusinessResponse, 'id' | 'user_id'>) => api<BusinessResponse>('/api/business', { method: 'PUT', body: JSON.stringify(payload) }),
};

export const recordsApi = {
  list: () => api<FinancialRecordResponse[]>('/api/financial-records'),
  create: (payload: FinancialRecordPayload) => api<FinancialRecordResponse>('/api/financial-records', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: number, payload: FinancialRecordPayload) => api<FinancialRecordResponse>(`/api/financial-records/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  remove: (id: number) => api<{ message: string }>(`/api/financial-records/${id}`, { method: 'DELETE' }),
};
